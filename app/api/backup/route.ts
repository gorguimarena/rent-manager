import { NextResponse } from "next/server"
import pool from "@/lib/db"
import type { RowDataPacket } from "mysql2"
import fs from "fs"
import path from "path"
import { promisify } from "util"

const writeFileAsync = promisify(fs.writeFile)
const readFileAsync = promisify(fs.readFile)
const mkdirAsync = promisify(fs.mkdir)

// Créer une sauvegarde
export async function POST() {
  try {
    // Créer le dossier de sauvegarde s'il n'existe pas
    const backupDir = path.join(process.cwd(), "backups")
    try {
      await mkdirAsync(backupDir, { recursive: true })
    } catch (err) {
      // Le dossier existe déjà
    }

    // Générer un nom de fichier avec la date
    const now = new Date()
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}-${String(now.getSeconds()).padStart(2, "0")}`
    const filename = `backup_${timestamp}.json`
    const filePath = path.join(backupDir, filename)

    // Récupérer toutes les tables
    const [tables] = await pool.query<RowDataPacket[]>("SHOW TABLES")

    const backup: Record<string, any[]> = {}

    // Pour chaque table, récupérer toutes les données
    for (const tableRow of tables) {
      const tableName = tableRow[`Tables_in_${process.env.DB_NAME || "gestion_loyers"}`]

      const [rows] = await pool.query<RowDataPacket[]>(`SELECT * FROM ${tableName}`)
      backup[tableName] = rows
    }

    // Écrire les données dans un fichier JSON
    await writeFileAsync(filePath, JSON.stringify(backup, null, 2))

    return NextResponse.json({
      message: "Sauvegarde créée avec succès",
      filename,
      timestamp,
      path: filePath,
    })
  } catch (error: any) {
    console.error("Erreur lors de la création de la sauvegarde:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// Récupérer la liste des sauvegardes
export async function GET() {
  try {
    const backupDir = path.join(process.cwd(), "backups")

    // Vérifier si le dossier existe
    if (!fs.existsSync(backupDir)) {
      return NextResponse.json({ backups: [] })
    }

    // Lire le contenu du dossier
    const files = fs.readdirSync(backupDir)

    // Filtrer les fichiers JSON et récupérer leurs informations
    const backups = files
      .filter((file) => file.endsWith(".json"))
      .map((file) => {
        const stats = fs.statSync(path.join(backupDir, file))
        return {
          filename: file,
          size: stats.size,
          created_at: stats.mtime,
        }
      })
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime()) // Trier par date décroissante

    return NextResponse.json({ backups })
  } catch (error: any) {
    console.error("Erreur lors de la récupération des sauvegardes:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

