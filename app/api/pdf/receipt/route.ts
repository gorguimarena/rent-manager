import { NextResponse } from "next/server"
import pool from "@/lib/db"
import type { RowDataPacket } from "mysql2"
import PDFDocument from "pdfkit"

// Interface pour représenter un paiement
interface Payment extends RowDataPacket {
  id: number
  tenant_id: number
  tenant_name: string
  unit_name: string
  property_name: string
  amount: number
  date: string
  type: string
  status: string
  period: string
}

export async function POST(request: Request) {
  try {
    const { payment_id } = await request.json()

    if (!payment_id) {
      return NextResponse.json({ error: "ID du paiement requis" }, { status: 400 })
    }

    // Récupérer les informations du paiement
    const [payments] = await pool.query<Payment[]>(
      `
      SELECT p.*, t.name as tenant_name, u.name as unit_name, pr.name as property_name, u.rent as rent_amount
      FROM payments p
      LEFT JOIN tenants t ON p.tenant_id = t.id
      LEFT JOIN units u ON t.unit_id = u.id
      LEFT JOIN properties pr ON u.property_id = pr.id
      WHERE p.id = ? AND p.status = 'paid'
    `,
      [payment_id],
    )

    if (!Array.isArray(payments) || payments.length === 0) {
      return NextResponse.json({ error: "Paiement non trouvé ou non payé" }, { status: 404 })
    }

    const payment = payments[0]

    // Créer un nouveau document PDF
    const doc = new PDFDocument({ margin: 50 })

    // Configurer les en-têtes pour le téléchargement
    const chunks: Buffer[] = []

    doc.on("data", (chunk) => {
      chunks.push(chunk)
    })

    // Promesse pour attendre la fin de la génération du PDF
    const pdfPromise = new Promise<Buffer>((resolve) => {
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(chunks)
        resolve(pdfBuffer)
      })
    })

    // Ajouter le contenu au PDF
    // En-tête
    doc.fontSize(20).text("QUITTANCE DE LOYER", { align: "center" })
    doc.fontSize(12).text(`Période : ${payment.period}`, { align: "center" })
    doc.moveDown(2)

    // Informations du bailleur
    doc.fontSize(14).text("BAILLEUR", { underline: true })
    doc.fontSize(10).text("Nom de la société de gestion")
    doc.text("Adresse complète")
    doc.text("Téléphone / Email")
    doc.moveDown()

    // Informations du locataire
    doc.fontSize(14).text("LOCATAIRE", { underline: true })
    doc.fontSize(10).text(`Nom : ${payment.tenant_name}`)
    doc.text(`Adresse : ${payment.property_name}, ${payment.unit_name}`)
    doc.moveDown(2)

    // Détails du paiement
    doc.fontSize(14).text("DÉTAILS DU PAIEMENT", { underline: true })
    doc.moveDown()

    // Tableau des paiements
    const tableTop = doc.y
    const tableLeft = 50
    const tableRight = 550
    const rowHeight = 20

    // En-tête du tableau
    doc.fontSize(10).text("Description", tableLeft, tableTop)
    doc.text("Montant", tableRight - 80, tableTop, { width: 80, align: "right" })
    doc
      .moveTo(tableLeft, tableTop + 15)
      .lineTo(tableRight, tableTop + 15)
      .stroke()

    // Lignes du tableau
    let rowY = tableTop + 25

    // Loyer
    doc.text(`Loyer ${payment.period}`, tableLeft, rowY)
    doc.text(`${payment.amount.toLocaleString()} FCFA`, tableRight - 80, rowY, { width: 80, align: "right" })
    rowY += rowHeight

    // Charges
    doc.text("Charges", tableLeft, rowY)
    doc.text("0 FCFA", tableRight - 80, rowY, { width: 80, align: "right" })
    rowY += rowHeight

    // Ligne de séparation
    doc
      .moveTo(tableLeft, rowY - 5)
      .lineTo(tableRight, rowY - 5)
      .stroke()

    // Total
    doc.font("Helvetica-Bold")
    doc.text("TOTAL", tableLeft, rowY)
    doc.text(`${payment.amount.toLocaleString()} FCFA`, tableRight - 80, rowY, { width: 80, align: "right" })
    doc.font("Helvetica")

    doc.moveDown(3)

    // Texte de la quittance
    const dateObj = new Date(payment.date)
    const formattedDate = `${dateObj.getDate().toString().padStart(2, "0")}/${(dateObj.getMonth() + 1).toString().padStart(2, "0")}/${dateObj.getFullYear()}`

    doc.text(
      `Je soussigné(e), [Nom du bailleur], déclare avoir reçu la somme de ${payment.amount.toLocaleString()} FCFA ` +
        `de ${payment.tenant_name} au titre du loyer et des charges pour la période du [date début] au [date fin].`,
      { align: "justify" },
    )

    doc.moveDown()
    doc.text("Cette quittance annule tous les reçus qui auraient pu être établis pour cette même période.")

    doc.moveDown(2)
    doc.text(`Fait à [Ville], le ${formattedDate}`, { align: "right" })

    doc.moveDown(3)
    doc.text("Signature du bailleur", { align: "right" })

    // Finaliser le document
    doc.end()

    // Attendre que le PDF soit généré
    const pdfBuffer = await pdfPromise

    // Créer la réponse avec le PDF
    const response = new NextResponse(pdfBuffer)

    // Définir les en-têtes
    response.headers.set("Content-Type", "application/pdf")
    response.headers.set(
      "Content-Disposition",
      `attachment; filename=quittance_${payment.tenant_name.replace(/\s+/g, "_")}_${payment.period.replace(/\s+/g, "_")}.pdf`,
    )

    return response
  } catch (error: any) {
    console.error("Erreur lors de la génération du PDF:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

