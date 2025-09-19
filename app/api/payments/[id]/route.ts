import { NextResponse } from "next/server"
import { jsonServer } from "@/lib/json-server"

// Récupérer un paiement spécifique
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Récupérer le paiement
    const payment = await jsonServer.get(`payments/${id}`)

    if (!payment) {
      return NextResponse.json({ error: "Paiement non trouvé" }, { status: 404 })
    }

    // Récupérer les informations du locataire, de l'unité et de la propriété
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
      console.error('Erreur lors de la récupération des relations:', error)
    }

    return NextResponse.json(payment)
  } catch (error: any) {
    console.error("Erreur lors de la récupération du paiement:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// Mettre à jour un paiement
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const { amount, date, type, status, period } = await request.json()

    if (!amount || !type || !status || !period) {
      return NextResponse.json({ error: "Tous les champs obligatoires doivent être remplis" }, { status: 400 })
    }

    // Récupérer le paiement actuel
    const currentPayment = await jsonServer.get(`payments/${id}`)
    if (!currentPayment) {
      return NextResponse.json({ error: "Paiement non trouvé" }, { status: 404 })
    }

    const tenant_id = currentPayment.tenant_id

    // Mettre à jour le paiement
    const updatedPayment = await jsonServer.put(`payments/${id}`, {
      amount: Number(amount),
      date: date || null,
      type,
      status,
      period,
      updated_at: new Date().toISOString(),
    })

    // Mettre à jour le statut du locataire si nécessaire
    if (status === "paid") {
      await jsonServer.patch(`tenants/${tenant_id}`, { payment_status: "up-to-date" })
    } else if (status === "unpaid") {
      await jsonServer.patch(`tenants/${tenant_id}`, { payment_status: "late" })
    }

    // Récupérer les informations complètes
    try {
      const tenant = await jsonServer.get(`tenants/${tenant_id}`)
      const unit = await jsonServer.get(`units/${tenant.unit_id}`)
      const property = await jsonServer.get(`properties/${unit.property_id}`)
      
      updatedPayment.tenant_name = tenant.name
      updatedPayment.unit_name = unit.name
      updatedPayment.property_name = property.name
    } catch (error) {
      console.error('Erreur lors de la récupération des relations:', error)
    }

    return NextResponse.json(updatedPayment)
  } catch (error: any) {
    console.error("Erreur lors de la mise à jour du paiement:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// Supprimer un paiement
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Vérifier que le paiement existe
    try {
      await jsonServer.get(`payments/${id}`)
    } catch (error) {
      return NextResponse.json({ error: "Paiement non trouvé" }, { status: 404 })
    }

    // Supprimer le paiement
    await jsonServer.delete(`payments/${id}`)

    return NextResponse.json({ message: "Paiement supprimé avec succès" })
  } catch (error: any) {
    console.error("Erreur lors de la suppression du paiement:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}