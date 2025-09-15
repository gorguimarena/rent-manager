import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

// Télécharger une sauvegarde
export async function GET(request: Request, { params }: { params: { filename: string } }) {
  try {
    const filename = params.filename
    const backupDir = path.join(process.cwd(), "backups")
    const filePath = path.join(backupDir, filename)

    // Vérifier si le fichier existe
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Fichier de sauvegarde non trouvé" }, { status: 404 })
    }

    // Lire le fichier
    const fileBuffer = fs.readFileSync(filePath)

    // Créer une réponse avec le fichier
    const response = new NextResponse(fileBuffer)

    // Définir les en-têtes
    response.headers.set("Content-Disposition", `attachment; filename=${filename}`)
    response.headers.set("Content-Type", "application/json")

    return response
  } catch (error: any) {
    console.error("Erreur lors du téléchargement de la sauvegarde:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// Supprimer une sauvegarde
export async function DELETE(request: Request, { params }: { params: { filename: string } }) {
  try {
    const filename = params.filename
    const backupDir = path.join(process.cwd(), "backups")
    const filePath = path.join(backupDir, filename)

    // Vérifier si le fichier existe
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Fichier de sauvegarde non trouvé" }, { status: 404 })
    }

    // Supprimer le fichier
    fs.unlinkSync(filePath)

    return NextResponse.json({
      message: "Sauvegarde supprimée avec succès",
      filename,
    })
  } catch (error: any) {
    console.error("Erreur lors de la suppression de la sauvegarde:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

