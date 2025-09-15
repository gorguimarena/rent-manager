import { NextResponse } from "next/server"
import pool from "@/lib/db"
import type { RowDataPacket } from "mysql2"

// Récupérer les données pour les rapports
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "income"
    const period = searchParams.get("period") || "month"
    const year = searchParams.get("year") || new Date().getFullYear().toString()
    const month = searchParams.get("month") || (new Date().getMonth() + 1).toString().padStart(2, "0")

    let data

    switch (type) {
      case "income":
        data = await getIncomeReport(period, year, month)
        break
      case "expenses":
        data = await getExpensesReport(period, year, month)
        break
      case "occupancy":
        data = await getOccupancyReport(period, year, month)
        break
      case "overview":
      default:
        data = await getOverviewReport(period, year, month)
        break
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Erreur lors de la génération du rapport:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// Rapport de revenus
async function getIncomeReport(period: string, year: string, month: string) {
  let query = ""
  let params: any[] = []

  if (period === "year") {
    query = `
      SELECT 
        MONTH(p.date) as month,
        SUM(p.amount) as revenue
      FROM payments p
      WHERE p.status = 'paid'
        AND YEAR(p.date) = ?
      GROUP BY MONTH(p.date)
      ORDER BY MONTH(p.date)
    `
    params = [year]
  } else if (period === "month") {
    query = `
      SELECT 
        DAY(p.date) as day,
        SUM(p.amount) as revenue
      FROM payments p
      WHERE p.status = 'paid'
        AND YEAR(p.date) = ?
        AND MONTH(p.date) = ?
      GROUP BY DAY(p.date)
      ORDER BY DAY(p.date)
    `
    params = [year, month]
  } else {
    // quarter
    query = `
      SELECT 
        MONTH(p.date) as month,
        SUM(p.amount) as revenue
      FROM payments p
      WHERE p.status = 'paid'
        AND YEAR(p.date) = ?
        AND QUARTER(p.date) = ?
      GROUP BY MONTH(p.date)
      ORDER BY MONTH(p.date)
    `
    const quarter = Math.ceil(Number.parseInt(month) / 3)
    params = [year, quarter.toString()] as string[]
  }

  const [results] = await pool.query<RowDataPacket[]>(query, params)

  // Calculer le total
  let total = 0
  for (const row of results) {
    total += row.revenue
  }

  return {
    data: results,
    total,
    period,
    year,
    month,
  }
}

// Rapport de dépenses
async function getExpensesReport(period: string, year: string, month: string) {
  let query = ""
  let params: any[] = []

  if (period === "year") {
    query = `
      SELECT 
        MONTH(e.date) as month,
        SUM(e.amount) as expenses,
        e.category
      FROM expenses e
      WHERE YEAR(e.date) = ?
      GROUP BY MONTH(e.date), e.category
      ORDER BY MONTH(e.date), e.category
    `
    params = [year]
  } else if (period === "month") {
    query = `
      SELECT 
        DAY(e.date) as day,
        SUM(e.amount) as expenses,
        e.category
      FROM expenses e
      WHERE YEAR(e.date) = ?
        AND MONTH(e.date) = ?
      GROUP BY DAY(e.date), e.category
      ORDER BY DAY(e.date), e.category
    `
    params = [year, month]
  } else {
    // quarter
    query = `
      SELECT 
        MONTH(e.date) as month,
        SUM(e.amount) as expenses,
        e.category
      FROM expenses e
      WHERE YEAR(e.date) = ?
        AND QUARTER(e.date) = ?
      GROUP BY MONTH(e.date), e.category
      ORDER BY MONTH(e.date), e.category
    `
    const quarter = Math.ceil(Number.parseInt(month) / 3)
    params = [year, quarter]
  }

  const [results] = await pool.query<RowDataPacket[]>(query, params)

  // Calculer le total par catégorie
  const categories: Record<string, number> = {}
  let total = 0

  for (const row of results) {
    if (!categories[row.category]) {
      categories[row.category] = 0
    }
    categories[row.category] += row.expenses
    total += row.expenses
  }

  const categoryData = Object.entries(categories).map(([name, value]) => ({ name, value }))

  return {
    data: results,
    categories: categoryData,
    total,
    period,
    year,
    month,
  }
}

// Rapport d'occupation
async function getOccupancyReport(period: string, year: string, month: string) {
  let query = ""
  let params = []

  if (period === "year") {
    query = `
      SELECT 
        MONTH(CURDATE()) as month,
        COUNT(u.id) as total_units,
        SUM(CASE WHEN u.status = 'occupied' THEN 1 ELSE 0 END) as occupied_units
      FROM units u
      WHERE 1=1
    `
    params = []
  } else if (period === "month") {
    query = `
      SELECT 
        DAY(CURDATE()) as day,
        COUNT(u.id) as total_units,
        SUM(CASE WHEN u.status = 'occupied' THEN 1 ELSE 0 END) as occupied_units
      FROM units u
      WHERE 1=1
    `
    params = []
  } else {
    // quarter
    query = `
      SELECT 
        MONTH(CURDATE()) as month,
        COUNT(u.id) as total_units,
        SUM(CASE WHEN u.status = 'occupied' THEN 1 ELSE 0 END) as occupied_units
      FROM units u
      WHERE 1=1
    `
    params = []
  }

  const [results] = await pool.query<RowDataPacket[]>(query, params)

  // Calculer le taux d'occupation
  const data = results.map((row) => {
    const occupancyRate = row.total_units > 0 ? Math.round((row.occupied_units / row.total_units) * 100) : 0
    return {
      ...row,
      occupancy_rate: occupancyRate,
    }
  })

  // Calculer le taux d'occupation moyen
  let totalRate = 0
  for (const row of data) {
    totalRate += row.occupancy_rate
  }
  const averageRate = data.length > 0 ? Math.round(totalRate / data.length) : 0

  return {
    data,
    average_rate: averageRate,
    period,
    year,
    month,
  }
}

// Rapport général
async function getOverviewReport(period: string, year: string, month: string) {
  // Récupérer les revenus
  const incomeReport = await getIncomeReport(period, year, month)

  // Récupérer les dépenses
  const expensesReport = await getExpensesReport(period, year, month)

  // Récupérer le taux d'occupation
  const occupancyReport = await getOccupancyReport(period, year, month)

  // Calculer le bénéfice net
  const netProfit = incomeReport.total - expensesReport.total

  return {
    income: incomeReport,
    expenses: expensesReport,
    occupancy: occupancyReport,
    net_profit: netProfit,
    period,
    year,
    month,
  }
}

