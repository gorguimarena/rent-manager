import { NextResponse } from "next/server"
import { jsonServer } from "@/lib/json-server"

// Récupérer tous les paiements
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period")
    const status = searchParams.get("status")
    const tenant_id = searchParams.get("tenant_id")

    let params: any = {}

    if (period) {
      params.period = period
    }

    if (status) {
      params.status = status
    }

    if (tenant_id) {
      params.tenant_id = tenant_id
    }

    const payments = await jsonServer.get('payments', params)

    // Pour chaque paiement, récupérer les informations du locataire, de l'unité et de la propriété
    for (const payment of payments) {
      try {
        const tenant = await jsonServer.get(`tenants/${payment.tenant_id}`)
        if (tenant) {
          payment.tenant_name = tenant.name

          const unit = await jsonServer.get(`units/${tenant.unit_id}`)
          if (unit) {
            payment.unit_name = unit.name

            const property = await jsonServer.get(`properties/${unit.property_id}`)
            if (property) {
              payment.property_name = property.name
            }
          }
        }
      } catch (error) {
        console.error(`Erreur lors de la récupération des relations pour le paiement ${payment.id}:`, error)
        payment.tenant_name = 'Locataire inconnu'
        payment.unit_name = 'Unité inconnue'
        payment.property_name = 'Propriété inconnue'
      }
    }

    // Trier par date décroissante
    payments.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return NextResponse.json(payments)
  } catch (error: any) {
    console.error("Erreur lors de la récupération des paiements:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// Créer un nouveau paiement
export async function POST(request: Request) {
  try {
    const { tenant_id, amount, date, type, period } = await request.json()

    if (!tenant_id || !amount || !date || !type || !period) {
      return NextResponse.json({ error: "Tous les champs obligatoires doivent être remplis" }, { status: 400 })
    }

    // Vérifier si le locataire existe
    try {
      await jsonServer.get(`tenants/${tenant_id}`)
    } catch (error) {
      return NextResponse.json({ error: "Locataire non trouvé" }, { status: 404 })
    }

    // Vérifier si un paiement existe déjà pour cette période et ce locataire
    const existingPayments = await jsonServer.get('payments', {
      tenant_id,
      period,
      type,
    })

    if (existingPayments.length > 0) {
      // Mettre à jour le paiement existant
      const updatedPayment = await jsonServer.put(`payments/${existingPayments[0].id}`, {
        amount: Number(amount),
        date,
        status: "paid",
        updated_at: new Date().toISOString(),
      })

      // Mettre à jour le statut du locataire
      await jsonServer.patch(`tenants/${tenant_id}`, { payment_status: "up-to-date" })

      // Récupérer les informations complètes
      const tenant = await jsonServer.get(`tenants/${tenant_id}`)
      const unit = await jsonServer.get(`units/${tenant.unit_id}`)
      const property = await jsonServer.get(`properties/${unit.property_id}`)

      return NextResponse.json({
        ...updatedPayment,
        tenant_name: tenant.name,
        unit_name: unit.name,
        property_name: property.name,
      })
    } else {
      // Créer un nouveau paiement
      const newPayment = {
        tenant_id: Number(tenant_id),
        amount: Number(amount),
        date,
        type,
        status: "paid",
        period,
        created_at: new Date().toISOString(),
      }

      const result = await jsonServer.post('payments', newPayment)

      // Mettre à jour le statut du locataire
      await jsonServer.patch(`tenants/${tenant_id}`, { payment_status: "up-to-date" })

      // Récupérer les informations complètes
      const tenant = await jsonServer.get(`tenants/${tenant_id}`)
      const unit = await jsonServer.get(`units/${tenant.unit_id}`)
      const property = await jsonServer.get(`properties/${unit.property_id}`)

      return NextResponse.json({
        ...result,
        tenant_name: tenant.name,
        unit_name: unit.name,
        property_name: property.name,
      }, { status: 201 })
    }
  } catch (error: any) {
    console.error("Erreur lors de la création du paiement:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// Générer les paiements pour un mois
export async function PUT(request: Request) {
  try {
    const { period } = await request.json()

    if (!period) {
      return NextResponse.json({ error: "La période est requise" }, { status: 400 })
    }

    // Récupérer tous les locataires actifs
    const tenants = await jsonServer.get('tenants')
    const activeTenants = []

    for (const tenant of tenants) {
      try {
        const unit = await jsonServer.get(`units/${tenant.unit_id}`)
        if (unit && unit.status === 'occupied') {
          activeTenants.push({
            ...tenant,
            rent_amount: unit.rent,
          })
        }
      } catch (error) {
        console.error(`Erreur lors de la vérification de l'unité pour le locataire ${tenant.id}:`, error)
      }
    }

    if (activeTenants.length === 0) {
      return NextResponse.json({ message: "Aucun locataire actif trouvé" }, { status: 200 })
    }

    const results = []

    // Pour chaque locataire, créer un paiement en attente
    for (const tenant of activeTenants) {
      // Vérifier si un paiement existe déjà pour cette période et ce locataire
      const existingPayments = await jsonServer.get('payments', {
        tenant_id: tenant.id,
        period,
        type: "rent",
      })

      if (existingPayments.length > 0) {
        // Le paiement existe déjà, ne rien faire
        results.push({
          tenant_id: tenant.id,
          tenant_name: tenant.name,
          status: "exists",
          payment_id: existingPayments[0].id,
        })
      } else {
        // Créer un nouveau paiement en attente
        const newPayment = {
          tenant_id: tenant.id,
          amount: tenant.rent_amount,
          date: null,
          type: "rent",
          status: "unpaid",
          period,
          created_at: new Date().toISOString(),
        }

        const result = await jsonServer.post('payments', newPayment)

        // Mettre à jour le statut du locataire
        await jsonServer.patch(`tenants/${tenant.id}`, { payment_status: "late" })

        results.push({
          tenant_id: tenant.id,
          tenant_name: tenant.name,
          status: "created",
          payment_id: result.id,
        })
      }
    }

    return NextResponse.json({
      message: `Paiements générés pour la période ${period}`,
      results,
    })
  } catch (error: any) {
    console.error("Erreur lors de la génération des paiements:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}