"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Search, Plus, Calendar, FileText, AlertCircle, Trash2, Building, Edit } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Textarea } from "@/components/ui/textarea"

// Interfaces pour les types
interface Property {
  id: number
  name: string
}

interface Expense {
  id: number
  property_id: number
  property_name: string
  amount: number
  date: string
  description: string
  category: string
  receipt_url?: string
  created_at: string
  updated_at: string
}

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedProperty, setSelectedProperty] = useState<string>("all")
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)
  const [isEditExpenseOpen, setIsEditExpenseOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [isViewExpenseOpen, setIsViewExpenseOpen] = useState(false)
  const [viewExpense, setViewExpense] = useState<Expense | null>(null)

  const [newExpense, setNewExpense] = useState({
    property_id: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
    category: "utilities",
  })

  const [editExpense, setEditExpense] = useState({
    id: 0,
    property_id: "",
    amount: "",
    date: "",
    description: "",
    category: "",
  })

  const { toast } = useToast()

  // Charger les données
  useEffect(() => {
    fetchExpenses()
    fetchProperties()
  }, [])

  const fetchExpenses = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/expenses")

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des dépenses")
      }

      const data = await response.json()
      setExpenses(data)
    } catch (error: any) {
      console.error("Erreur:", error)
      setError(error.message || "Une erreur est survenue")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchProperties = async () => {
    try {
      const response = await fetch("/api/properties")

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des propriétés")
      }

      const data = await response.json()
      setProperties(data)
    } catch (error: any) {
      console.error("Erreur:", error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
      })
    }
  }

  const handleAddExpense = async () => {
    if (
      newExpense.property_id &&
      newExpense.amount &&
      newExpense.date &&
      newExpense.description &&
      newExpense.category
    ) {
      try {
        const expenseData = {
          property_id: Number.parseInt(newExpense.property_id),
          amount: Number.parseFloat(newExpense.amount),
          date: newExpense.date,
          description: newExpense.description,
          category: newExpense.category,
        }

        const response = await fetch("/api/expenses", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(expenseData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Erreur lors de l'ajout de la dépense")
        }

        // Mettre à jour la liste des dépenses
        fetchExpenses()

        setNewExpense({
          property_id: "",
          amount: "",
          date: new Date().toISOString().split("T")[0],
          description: "",
          category: "utilities",
        })
        setIsAddExpenseOpen(false)

        toast({
          title: "Dépense enregistrée",
          description: "La dépense a été enregistrée avec succès.",
        })
      } catch (error: any) {
        console.error("Erreur:", error)
        toast({
          variant: "destructive",
          title: "Erreur",
          description: error instanceof Error ? error.message : "Une erreur est survenue",
        })
      }
    } else {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
      })
    }
  }

  const handleEditExpense = (expense: Expense) => {
    setSelectedExpense(expense)
    setEditExpense({
      id: expense.id,
      property_id: expense.property_id.toString(),
      amount: expense.amount.toString(),
      date: expense.date,
      description: expense.description,
      category: expense.category,
    })
    setIsEditExpenseOpen(true)
  }

  const handleViewExpense = (expense: Expense) => {
    setViewExpense(expense)
    setIsViewExpenseOpen(true)
  }

  const handleUpdateExpense = async () => {
    if (
      editExpense.property_id &&
      editExpense.amount &&
      editExpense.date &&
      editExpense.description &&
      editExpense.category
    ) {
      try {
        const expenseData = {
          property_id: Number.parseInt(editExpense.property_id),
          amount: Number.parseFloat(editExpense.amount),
          date: editExpense.date,
          description: editExpense.description,
          category: editExpense.category,
        }

        const response = await fetch(`/api/expenses/${editExpense.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(expenseData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Erreur lors de la mise à jour de la dépense")
        }

        // Mettre à jour la liste des dépenses
        fetchExpenses()

        setIsEditExpenseOpen(false)

        toast({
          title: "Dépense mise à jour",
          description: "La dépense a été mise à jour avec succès.",
        })
      } catch (error: any) {
        console.error("Erreur:", error)
        toast({
          variant: "destructive",
          title: "Erreur",
          description: error instanceof Error ? error.message : "Une erreur est survenue",
        })
      }
    } else {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
      })
    }
  }

  const handleDeleteExpense = async (id: number) => {
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erreur lors de la suppression de la dépense")
      }

      // Mettre à jour la liste des dépenses
      fetchExpenses()

      toast({
        title: "Dépense supprimée",
        description: "La dépense a été supprimée avec succès.",
      })
    } catch (error: any) {
      console.error("Erreur:", error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
      })
    }
  }

  // Filtrer les dépenses en fonction des critères de recherche et des filtres
  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch =
      (expense.property_name && expense.property_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = selectedCategory === "all" || expense.category === selectedCategory
    const matchesProperty = selectedProperty === "all" || expense.property_id.toString() === selectedProperty

    return matchesSearch && matchesCategory && matchesProperty
  })

  // Fonction pour obtenir le libellé de la catégorie
  const getCategoryLabel = (category: string) => {
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

  // Fonction pour obtenir la couleur du badge en fonction de la catégorie
  const getCategoryBadgeVariant = (category: string) => {
    switch (category) {
      case "utilities":
        return "outline"
      case "maintenance":
        return "secondary"
      case "repairs":
        return "destructive"
      case "taxes":
        return "default"
      case "insurance":
        return "outline"
      case "water":
        return "secondary"
      case "electricity":
        return "destructive"
      case "other":
        return "outline"
      default:
        return "outline"
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erreur</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Gestion des Dépenses</h2>
        <div className="flex space-x-2">
          <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter une Dépense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter une nouvelle dépense</DialogTitle>
                <DialogDescription>Entrez les informations de la dépense.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="expense-property">Propriété</Label>
                  <Select
                    value={newExpense.property_id}
                    onValueChange={(value) => setNewExpense({ ...newExpense, property_id: value })}
                  >
                    <SelectTrigger id="expense-property">
                      <SelectValue placeholder="Sélectionnez une propriété" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id.toString()}>
                          {property.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="expense-category">Catégorie</Label>
                  <Select
                    value={newExpense.category}
                    onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}
                  >
                    <SelectTrigger id="expense-category">
                      <SelectValue placeholder="Sélectionnez une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="utilities">Charges</SelectItem>
                      <SelectItem value="maintenance">Entretien</SelectItem>
                      <SelectItem value="repairs">Réparations</SelectItem>
                      <SelectItem value="taxes">Taxes</SelectItem>
                      <SelectItem value="insurance">Assurance</SelectItem>
                      <SelectItem value="water">Eau</SelectItem>
                      <SelectItem value="electricity">Électricité</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="expense-amount">Montant (FCFA)</Label>
                    <Input
                      id="expense-amount"
                      type="number"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                      placeholder="50000"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="expense-date">Date</Label>
                    <Input
                      id="expense-date"
                      type="date"
                      value={newExpense.date}
                      onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="expense-description">Description</Label>
                  <Textarea
                    id="expense-description"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                    placeholder="Description de la dépense"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddExpenseOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleAddExpense}>Enregistrer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher une dépense..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Label htmlFor="filter-category" className="whitespace-nowrap">
            Catégorie:
          </Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger id="filter-category" className="w-[180px]">
              <SelectValue placeholder="Toutes les catégories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              <SelectItem value="utilities">Charges</SelectItem>
              <SelectItem value="maintenance">Entretien</SelectItem>
              <SelectItem value="repairs">Réparations</SelectItem>
              <SelectItem value="taxes">Taxes</SelectItem>
              <SelectItem value="insurance">Assurance</SelectItem>
              <SelectItem value="water">Eau</SelectItem>
              <SelectItem value="electricity">Électricité</SelectItem>
              <SelectItem value="other">Autre</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Label htmlFor="filter-property" className="whitespace-nowrap">
            Propriété:
          </Label>
          <Select value={selectedProperty} onValueChange={setSelectedProperty}>
            <SelectTrigger id="filter-property" className="w-[180px]">
              <SelectValue placeholder="Toutes les propriétés" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les propriétés</SelectItem>
              {properties.map((property) => (
                <SelectItem key={property.id} value={property.id.toString()}>
                  {property.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Propriété</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Aucune dépense trouvée
                  </TableCell>
                </TableRow>
              ) : (
                filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-1">
                        <Building className="h-3 w-3" />
                        {expense.property_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getCategoryBadgeVariant(expense.category)}>
                        {getCategoryLabel(expense.category)}
                      </Badge>
                    </TableCell>
                    <TableCell>{Math.round(expense.amount).toLocaleString()} FCFA</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(expense.date), "dd/MM/yyyy", { locale: fr })}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate" title={expense.description}>
                      {expense.description}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => handleViewExpense(expense)}>
                          <FileText className="h-4 w-4" />
                          <span className="sr-only">Afficher</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEditExpense(expense)}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Modifier</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Cette action ne peut pas être annulée. Cela supprimera définitivement cette dépense.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteExpense(expense.id)}>
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog pour éditer une dépense */}
      <Dialog open={isEditExpenseOpen} onOpenChange={setIsEditExpenseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la dépense</DialogTitle>
            <DialogDescription>Modifiez les informations de la dépense.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-expense-property">Propriété</Label>
              <Select
                value={editExpense.property_id}
                onValueChange={(value) => setEditExpense({ ...editExpense, property_id: value })}
              >
                <SelectTrigger id="edit-expense-property">
                  <SelectValue placeholder="Sélectionnez une propriété" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id.toString()}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-expense-category">Catégorie</Label>
              <Select
                value={editExpense.category}
                onValueChange={(value) => setEditExpense({ ...editExpense, category: value })}
              >
                <SelectTrigger id="edit-expense-category">
                  <SelectValue placeholder="Sélectionnez une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="utilities">Charges</SelectItem>
                  <SelectItem value="maintenance">Entretien</SelectItem>
                  <SelectItem value="repairs">Réparations</SelectItem>
                  <SelectItem value="taxes">Taxes</SelectItem>
                  <SelectItem value="insurance">Assurance</SelectItem>
                  <SelectItem value="water">Eau</SelectItem>
                  <SelectItem value="electricity">Électricité</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-expense-amount">Montant (FCFA)</Label>
                <Input
                  id="edit-expense-amount"
                  type="number"
                  value={editExpense.amount}
                  onChange={(e) => setEditExpense({ ...editExpense, amount: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-expense-date">Date</Label>
                <Input
                  id="edit-expense-date"
                  type="date"
                  value={editExpense.date}
                  onChange={(e) => setEditExpense({ ...editExpense, date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-expense-description">Description</Label>
              <Textarea
                id="edit-expense-description"
                value={editExpense.description}
                onChange={(e) => setEditExpense({ ...editExpense, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditExpenseOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateExpense}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Dialog pour afficher une dépense */}
      <Dialog open={isViewExpenseOpen} onOpenChange={setIsViewExpenseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détails de la dépense</DialogTitle>
            <DialogDescription>Informations complètes sur la dépense</DialogDescription>
          </DialogHeader>
          {viewExpense && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Propriété</Label>
                  <p className="mt-1">{viewExpense.property_name}</p>
                </div>
                <div>
                  <Label className="font-medium">Catégorie</Label>
                  <p className="mt-1">
                    <Badge variant={getCategoryBadgeVariant(viewExpense.category)}>
                      {getCategoryLabel(viewExpense.category)}
                    </Badge>
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Montant</Label>
                  <p className="mt-1">{Math.round(viewExpense.amount).toLocaleString()} FCFA</p>
                </div>
                <div>
                  <Label className="font-medium">Date</Label>
                  <p className="mt-1">{format(new Date(viewExpense.date), "dd/MM/yyyy", { locale: fr })}</p>
                </div>
              </div>
              <div>
                <Label className="font-medium">Description</Label>
                <p className="mt-1">{viewExpense.description}</p>
              </div>
              <div>
                <Label className="font-medium">Date de création</Label>
                <p className="mt-1">{format(new Date(viewExpense.created_at), "dd/MM/yyyy HH:mm", { locale: fr })}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewExpenseOpen(false)}>
              Fermer
            </Button>
            {viewExpense && (
              <Button onClick={() => handleEditExpense(viewExpense)}>
                <Edit className="mr-2 h-4 w-4" />
                Modifier
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

