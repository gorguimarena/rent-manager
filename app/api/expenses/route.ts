import { NextResponse } from "next/server"
import { jsonServer } from "@/lib/json-server"

// Récupérer toutes les dépenses
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const property_id = searchParams.get("property_id")
    const category = searchParams.get("category")
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")

    let params: any = {}

    if (property_id) {
      params.property_id = property_id
    }

    if (category) {
      params.category = category
    }

    const expenses = await jsonServer.get('expenses', params)

    // Filtrer par dates si nécessaire
    let filteredExpenses = expenses
    if (startDate || endDate) {
      filteredExpenses = expenses.filter((expense: any) => {
        const expenseDate = new Date(expense.date)
        if (startDate && expenseDate < new Date(startDate)) return false
        if (endDate && expenseDate > new Date(endDate)) return false
        return true
      })
    }

    // Pour chaque dépense, récupérer le nom de la propriété
    for (const expense of filteredExpenses) {
      try {
        const property = await jsonServer.get(`properties/${expense.property_id}`)
        expense.property_name = property?.name || 'Propriété inconnue'
      } catch (error) {
        console.error(`Erreur lors de la récupération de la propriété pour la dépense ${expense.id}:`, error)
        expense.property_name = 'Propriété inconnue'
      }
    }

    // Trier par date décroissante
    filteredExpenses.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json(filteredExpenses)
  } catch (error: any) {
    console.error("Erreur lors de la récupération des dépenses:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// Créer une nouvelle dépense
export async function POST(request: Request) {
  try {
    const { property_id, amount, date, description, category } = await request.json()

    if (!property_id || !amount || !date || !description || !category) {
      return NextResponse.json({ error: "Tous les champs obligatoires doivent être remplis" }, { status: 400 })
    }

    // Vérifier si la propriété existe
    try {
      await jsonServer.get(`properties/${property_id}`)
    } catch (error) {
      return NextResponse.json({ error: "Propriété non trouvée" }, { status: 404 })
    }

    // Créer la dépense
    const newExpense = {
      property_id: Number(property_id),
      amount: Number(amount),
      date,
      description,
      category,
      created_at: new Date().toISOString(),
    }

    const result = await jsonServer.post('expenses', newExpense)

    // Récupérer le nom de la propriété
    try {
      const property = await jsonServer.get(`properties/${property_id}`)
      result.property_name = property.name
    } catch (error) {
      result.property_name = 'Propriété inconnue'
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error("Erreur lors de la création de la dépense:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}