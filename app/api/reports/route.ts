import { NextResponse } from "next/server"
import { jsonServer } from "@/lib/json-server"

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
  const payments = await jsonServer.get('payments', { status: 'paid' })
  
  let filteredPayments = payments
  
  if (period === "year") {
    filteredPayments = payments.filter((payment: any) => {
      const paymentDate = new Date(payment.date)
      return paymentDate.getFullYear() === Number(year)
    })
  } else if (period === "month") {
    filteredPayments = payments.filter((payment: any) => {
      const paymentDate = new Date(payment.date)
      return paymentDate.getFullYear() === Number(year) && paymentDate.getMonth() + 1 === Number(month)
    })
  }

  // Grouper par période
  const groupedData: any = {}
  
  filteredPayments.forEach((payment: any) => {
    const paymentDate = new Date(payment.date)
    let key: string
    
    if (period === "year") {
      key = paymentDate.getMonth().toString()
    } else if (period === "month") {
      key = paymentDate.getDate().toString()
    } else {
      key = paymentDate.getMonth().toString()
    }
    
    if (!groupedData[key]) {
      groupedData[key] = 0
    }
    groupedData[key] += payment.amount
  })

  const data = Object.entries(groupedData).map(([key, revenue]) => ({
    [period === "month" ? "day" : "month"]: Number(key),
    revenue,
  }))

  const total = filteredPayments.reduce((sum: number, payment: any) => sum + payment.amount, 0)

  return {
    data,
    total,
    period,
    year,
    month,
  }
}

// Rapport de dépenses
async function getExpensesReport(period: string, year: string, month: string) {
  const expenses = await jsonServer.get('expenses')
  
  let filteredExpenses = expenses
  
  if (period === "year") {
    filteredExpenses = expenses.filter((expense: any) => {
      const expenseDate = new Date(expense.date)
      return expenseDate.getFullYear() === Number(year)
    })
  } else if (period === "month") {
    filteredExpenses = expenses.filter((expense: any) => {
      const expenseDate = new Date(expense.date)
      return expenseDate.getFullYear() === Number(year) && expenseDate.getMonth() + 1 === Number(month)
    })
  }

  // Grouper par période et catégorie
  const groupedData: any = {}
  const categories: any = {}
  
  filteredExpenses.forEach((expense: any) => {
    const expenseDate = new Date(expense.date)
    let key: string
    
    if (period === "year") {
      key = expenseDate.getMonth().toString()
    } else if (period === "month") {
      key = expenseDate.getDate().toString()
    } else {
      key = expenseDate.getMonth().toString()
    }
    
    if (!groupedData[key]) {
      groupedData[key] = {}
    }
    if (!groupedData[key][expense.category]) {
      groupedData[key][expense.category] = 0
    }
    groupedData[key][expense.category] += expense.amount

    // Calculer le total par catégorie
    if (!categories[expense.category]) {
      categories[expense.category] = 0
    }
    categories[expense.category] += expense.amount
  })

  const data = Object.entries(groupedData).map(([key, categoryData]) => ({
    [period === "month" ? "day" : "month"]: Number(key),
    expenses: Object.values(categoryData as any).reduce((sum: number, val: number) => sum + val, 0),
    category: Object.keys(categoryData as any)[0], // Première catégorie pour simplifier
  }))

  const categoryData = Object.entries(categories).map(([name, value]) => ({ 
    name: getCategoryLabel(name), 
    value 
  }))

  const total = filteredExpenses.reduce((sum: number, expense: any) => sum + expense.amount, 0)

  return {
    data,
    categories: categoryData,
    total,
    period,
    year,
    month,
  }
}

// Rapport d'occupation
async function getOccupancyReport(period: string, year: string, month: string) {
  const units = await jsonServer.get('units')
  
  const totalUnits = units.length
  const occupiedUnits = units.filter((unit: any) => unit.status === 'occupied').length
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0

  // Simuler des données mensuelles (dans une vraie application, vous auriez un historique)
  const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"]
  const data = months.map((month, index) => ({
    month,
    total_units: totalUnits,
    occupied_units: occupiedUnits,
    occupancy_rate: occupancyRate,
  }))

  return {
    data,
    average_rate: occupancyRate,
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

// Fonction utilitaire pour obtenir le libellé de la catégorie
function getCategoryLabel(category: string) {
  switch (category) {
    case "utilities":
      return "Charges"
    case "maintenance":
      return "Entretien"
    case "repairs":
      return "Réparations"
    case "taxes":
      return "Taxes"
    case "insurance":
      return "Assurance"
    case "water":
      return "Eau"
    case "electricity":
      return "Électricité"
    case "other":
      return "Autre"
    default:
      return category
  }
}