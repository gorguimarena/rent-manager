import mysql from "mysql2/promise"
import type { RowDataPacket, OkPacket } from "mysql2"

// Interface pour représenter un utilisateur
interface User extends RowDataPacket {
  id: number
  username: string
  password: string
  email: string
  role: string
}

// Configuration de la connexion à la base de données
const pool = mysql.createPool({
  host: process.env.DB_HOST || "mysql-db-1",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "gorgui02",
  database: process.env.DB_NAME || "db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

// Fonction pour initialiser la base de données
export async function initDatabase() {
  try {
    // Vérifier si la table users existe
    const [tables] = await pool.query<RowDataPacket[]>(`
      SHOW TABLES LIKE 'users'
    `)

    // Si la table n'existe pas, la créer
    if (Array.isArray(tables) && tables.length === 0) {
      console.log("Création de la table users...")

      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(50) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          email VARCHAR(100) NOT NULL,
          role VARCHAR(20) NOT NULL DEFAULT 'user',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)

      // Insérer un utilisateur administrateur par défaut
      await pool.query<OkPacket>(`
        INSERT INTO users (username, password, email, role) 
        VALUES ('admin', 'admin123', 'admin@example.com', 'admin')
      `)

      console.log("Table users créée et utilisateur admin ajouté")
    } else {
      console.log("La table users existe déjà")

      // Ne pas vérifier ou créer l'utilisateur admin s'il existe déjà
      // Cela évite de réinitialiser les paramètres
    }

    console.log("Initialisation de la base de données terminée")
  } catch (error) {
    console.error("Erreur lors de l'initialisation de la base de données:", error)
  }
}

// Initialiser la base de données au démarrage
initDatabase().catch(console.error)

export default pool

