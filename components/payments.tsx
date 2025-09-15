"use client"

import { useState, useEffect, useRef } from "react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { Search, Plus, Calendar, FileText, Euro, Printer, Download, AlertCircle, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

// Interfaces pour les types
interface Tenant {
  id: number
  name: string
  unit_id: number
  unit_name: string
  property_name: string
  rent_amount: number
}

// Ajouter la fonctionnalité de paiement partiel et éviter les paiements doubles
// Modifier l'interface Payment pour inclure le statut de paiement partiel

interface Payment {
  id: number
  tenant_id: number
  tenant_name: string
  unit_name: string
  property_name: string
  amount: number
  paid_amount?: number
  date: string | null
  type: string
  status: string
  period: string
}

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false)
  const [isGeneratePaymentsOpen, setIsGeneratePaymentsOpen] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<string>("")
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const receiptRef = useRef<HTMLDivElement>(null)

  const [newPayment, setNewPayment] = useState({
    tenant_id: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    period: "",
    type: "rent",
  })

  const [generatePeriod, setGeneratePeriod] = useState("")

  // Ajouter un nouvel état pour le montant payé
  const [paidAmount, setPaidAmount] = useState<string>("")

  const { toast } = useToast()

  // Ajouter les états pour les informations du bailleur
  const [companyName, setCompanyName] = useState("Ma Société Immobilière")
  const [adminEmail, setAdminEmail] = useState("admin@example.com")
  const [phoneNumber, setPhoneNumber] = useState("+123 456 789")
  const [address, setAddress] = useState("123 Rue Principale, Ville")

  // Charger les données
  useEffect(() => {
    fetchPayments()
    fetchTenants()
    fetchCompanySettings()
  }, [])

  // Ajouter une fonction pour charger les paramètres du bailleur
  const fetchCompanySettings = async () => {
    try {
      // Dans une application réelle, vous feriez un appel API ici
      // Pour l'instant, nous utilisons des valeurs par défaut
      setCompanyName("Ma Société Immobilière")
      setAdminEmail("admin@example.com")
      setPhoneNumber("+123 456 789")
      setAddress("123 Rue Principale, Ville")
    } catch (error) {
      console.error("Erreur lors du chargement des paramètres:", error)
    }
  }

  const fetchPayments = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/payments")

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des paiements")
      }

      const data = await response.json()
      setPayments(data)
    } catch (error: any) {
      console.error("Erreur:", error)
      setError(error.message || "Une erreur est survenue")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTenants = async () => {
    try {
      const response = await fetch("/api/tenants")

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des locataires")
      }

      const data = await response.json()
      setTenants(data)
    } catch (error: any) {
      console.error("Erreur:", error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
      })
    }
  }

  const handleTenantChange = (value: string) => {
    setSelectedTenant(value)

    const tenant = tenants.find((t) => t.id.toString() === value)
    if (tenant) {
      setNewPayment({
        ...newPayment,
        tenant_id: value,
        amount: tenant.rent_amount.toString(),
      })
    }
  }

  // Modifier la fonction handleAddPayment pour vérifier les paiements existants
  const handleAddPayment = async () => {
    if (newPayment.tenant_id && newPayment.amount && newPayment.date && newPayment.period) {
      try {
        // Vérifier si un paiement existe déjà pour cette période et ce locataire
        const checkResponse = await fetch(
          `/api/payments?tenant_id=${newPayment.tenant_id}&period=${newPayment.period}&type=${newPayment.type}`,
        )

        if (!checkResponse.ok) {
          throw new Error("Erreur lors de la vérification des paiements existants")
        }

        const existingPayments = await checkResponse.json()

        if (existingPayments.length > 0) {
          // Trouver le locataire pour afficher son nom
          const tenant = tenants.find((t) => t.id.toString() === newPayment.tenant_id)
          const tenantName = tenant ? tenant.name : "Le locataire"

          // Un paiement existe déjà pour cette période
          toast({
            variant: "destructive",
            title: "Paiement déjà effectué",
            description: `${tenantName} a déjà payé pour la période ${newPayment.period}. Vous pouvez consulter ou modifier ce paiement dans la liste.`,
          })
          return
        }

        const response = await fetch("/api/payments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newPayment),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Erreur lors de l'ajout du paiement")
        }

        const addedPayment = await response.json()

        // Mettre à jour la liste des paiements
        fetchPayments()

        setNewPayment({
          tenant_id: "",
          amount: "",
          date: new Date().toISOString().split("T")[0],
          period: "",
          type: "rent",
        })
        setSelectedTenant("")
        setIsAddPaymentOpen(false)

        toast({
          title: "Paiement enregistré",
          description: "Le paiement a été enregistré avec succès.",
        })
      } catch (error: any) {
        console.error("Erreur:", error)
        toast({
          variant: "destructive",
          title: "Erreur",
          description: error.message || "Une erreur est survenue",
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

  const handleGeneratePayments = async () => {
    if (generatePeriod) {
      try {
        const response = await fetch("/api/payments", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ period: generatePeriod }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Erreur lors de la génération des paiements")
        }

        const result = await response.json()

        // Mettre à jour la liste des paiements
        fetchPayments()

        setGeneratePeriod("")
        setIsGeneratePaymentsOpen(false)

        toast({
          title: "Paiements générés",
          description: `${result.results.length} paiements ont été générés pour la période ${generatePeriod}.`,
        })
      } catch (error: any) {
        console.error("Erreur:", error)
        toast({
          variant: "destructive",
          title: "Erreur",
          description: error.message || "Une erreur est survenue",
        })
      }
    } else {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez sélectionner une période.",
      })
    }
  }

  const handleDeletePayment = async (id: number) => {
    try {
      const response = await fetch(`/api/payments/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erreur lors de la suppression du paiement")
      }

      // Mettre à jour la liste des paiements
      fetchPayments()

      toast({
        title: "Paiement supprimé",
        description: "Le paiement a été supprimé avec succès.",
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

  // Modifier la fonction handleRegisterPayment pour inclure le paiement partiel
  const handleRegisterPayment = async (payment: Payment) => {
    try {
      setSelectedPayment(payment)

      // Ouvrir un dialogue pour demander si c'est un paiement complet ou partiel
      const dialogResult = await new Promise<{ isPartial: boolean; amount: number }>((resolve) => {
        // Utiliser le dialogue existant ou créer un nouveau
        const amount = payment.amount
        setPaidAmount(amount.toString())

        // Ouvrir un dialogue personnalisé
        const dialog = document.createElement("dialog")
        dialog.className = "fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        dialog.innerHTML = `
        <div class="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
          <h3 class="text-lg font-medium mb-4">Enregistrer le paiement</h3>
          <div class="mb-4">
            <p class="mb-2">Montant total dû: ${amount.toLocaleString()} FCFA</p>
            <label class="block mb-2">
              <input type="radio" name="paymentType" value="full" checked> Paiement complet
            </label>
            <label class="block">
              <input type="radio" name="paymentType" value="partial"> Paiement partiel
            </label>
          </div>
          <div id="partialAmountContainer" class="mb-4 hidden">
            <label class="block mb-2">Montant payé (FCFA)</label>
            <input type="number" id="partialAmount" class="w-full p-2 border rounded" value="${amount}">
          </div>
          <div class="flex justify-end space-x-2">
            <button id="cancelBtn" class="px-4 py-2 border rounded">Annuler</button>
            <button id="confirmBtn" class="px-4 py-2 bg-primary text-white rounded">Confirmer</button>
          </div>
        </div>
      `
        document.body.appendChild(dialog)
        dialog.showModal()

        // Gérer l'affichage du champ de montant partiel
        const paymentTypeRadios = dialog.querySelectorAll('input[name="paymentType"]')
        const partialAmountContainer = dialog.querySelector("#partialAmountContainer")
        const partialAmountInput = dialog.querySelector("#partialAmount") as HTMLInputElement

        paymentTypeRadios.forEach((radio) => {
          radio.addEventListener("change", (e) => {
            const target = e.target as HTMLInputElement
            if (target.value === "partial") {
              partialAmountContainer?.classList.remove("hidden")
            } else {
              partialAmountContainer?.classList.add("hidden")
            }
          })
        })

        // Gérer les boutons
        const cancelBtn = dialog.querySelector("#cancelBtn")
        const confirmBtn = dialog.querySelector("#confirmBtn")

        cancelBtn?.addEventListener("click", () => {
          dialog.close()
          document.body.removeChild(dialog)
          resolve({ isPartial: false, amount: 0 })
        })

        confirmBtn?.addEventListener("click", () => {
          const selectedType = dialog.querySelector('input[name="paymentType"]:checked') as HTMLInputElement
          const isPartial = selectedType.value === "partial"
          const paidAmount = isPartial ? Number(partialAmountInput.value) : amount

          dialog.close()
          document.body.removeChild(dialog)
          resolve({ isPartial, amount: paidAmount })
        })
      })

      // Si l'utilisateur a annulé
      if (dialogResult.amount === 0) return

      // Déterminer le statut en fonction du montant payé
      const status = dialogResult.isPartial && dialogResult.amount < payment.amount ? "partial" : "paid"

      const response = await fetch(`/api/payments/${payment.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: payment.amount,
          paid_amount: dialogResult.amount,
          date: new Date().toISOString().split("T")[0],
          type: payment.type,
          status: status,
          period: payment.period,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erreur lors de l'enregistrement du paiement")
      }

      // Mettre à jour la liste des paiements
      fetchPayments()

      toast({
        title: "Paiement enregistré",
        description:
          status === "partial"
            ? `Paiement partiel de ${dialogResult.amount.toLocaleString()} FCFA enregistré.`
            : "Le paiement a été enregistré avec succès.",
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

  const showReceipt = (payment: Payment) => {
    setSelectedPayment(payment)
    setReceiptDialogOpen(true)
  }

  const printReceipt = () => {
    if (receiptRef.current) {
      const printWindow = window.open("", "_blank")
      if (printWindow) {
        printWindow.document.write("<html><head><title>Quittance de Loyer</title>")
        printWindow.document.write("<style>")
        printWindow.document.write(`
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .receipt { max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; }
          .header { text-align: center; margin-bottom: 20px; }
          .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .subtitle { font-size: 16px; color: #666; }
          .info { margin-bottom: 20px; }
          .info-row { display: flex; margin-bottom: 5px; }
          .info-label { font-weight: bold; width: 150px; }
          .amount { font-size: 20px; font-weight: bold; margin: 20px 0; text-align: center; }
          .footer { margin-top: 40px; text-align: center; font-size: 14px; color: #666; }
          .signature { margin-top: 60px; display: flex; justify-content: space-between; }
          .signature-box { width: 45%; }
          .signature-line { border-top: 1px solid #000; margin-top: 40px; }
          @media print {
            body { margin: 0; padding: 0; }
            .receipt { border: none; }
            .print-button { display: none; }
          }
        `)
        printWindow.document.write("</style></head><body>")
        printWindow.document.write(receiptRef.current.innerHTML)
        printWindow.document.write('<div class="print-button" style="text-align: center; margin-top: 20px;">')
        printWindow.document.write('<button onclick="window.print()">Imprimer</button>')
        printWindow.document.write("</div>")
        printWindow.document.write("</body></html>")
        printWindow.document.close()
      }
    }
  }

  const generatePDF = async () => {
    if (!selectedPayment) return

    try {
      const response = await fetch("/api/pdf/receipt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ payment_id: selectedPayment.id }),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la génération du PDF")
      }

      // Récupérer le blob du PDF
      const blob = await response.blob()

      // Créer un URL pour le blob
      const url = window.URL.createObjectURL(blob)

      // Créer un lien pour télécharger le PDF
      const a = document.createElement("a")
      a.href = url
      a.download = `quittance_${selectedPayment.tenant_name.replace(/\s+/g, "_")}_${selectedPayment.period.replace(/\s+/g, "_")}.pdf`
      document.body.appendChild(a)
      a.click()

      // Nettoyer
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "PDF généré",
        description: "La quittance a été générée avec succès.",
      })
    } catch (error: any) {
      console.error("Erreur:", error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la génération du PDF",
      })
    }
  }

  // Générer les options de période (mois actuel et 2 mois suivants)
  const generatePeriodOptions = () => {
    const months = [
      "Janvier",
      "Février",
      "Mars",
      "Avril",
      "Mai",
      "Juin",
      "Juillet",
      "Août",
      "Septembre",
      "Octobre",
      "Novembre",
      "Décembre",
    ]
    const now = new Date()
    const options = []

    for (let i = 0; i < 3; i++) {
      const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const month = months[futureDate.getMonth()]
      const year = futureDate.getFullYear()
      options.push(`${month} ${year}`)
    }

    return options
  }

  const periodOptions = generatePeriodOptions()

  const filteredPayments = payments.filter(
    (payment) =>
      (payment.tenant_name && payment.tenant_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (payment.property_name && payment.property_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (payment.unit_name && payment.unit_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      payment.period.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.status.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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
        <h2 className="text-3xl font-bold tracking-tight">Gestion des Paiements</h2>
        <div className="flex space-x-2">
          <Dialog open={isGeneratePaymentsOpen} onOpenChange={setIsGeneratePaymentsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                Générer les Paiements
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Générer les paiements pour une période</DialogTitle>
                <DialogDescription>
                  Cette action va créer des paiements en attente pour tous les locataires actifs.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="generate-period">Période</Label>
                  <Select value={generatePeriod} onValueChange={(value) => setGeneratePeriod(value)}>
                    <SelectTrigger id="generate-period">
                      <SelectValue placeholder="Sélectionnez une période" />
                    </SelectTrigger>
                    <SelectContent>
                      {periodOptions.map((period, index) => (
                        <SelectItem key={index} value={period}>
                          {period}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsGeneratePaymentsOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleGeneratePayments}>Générer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddPaymentOpen} onOpenChange={setIsAddPaymentOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Enregistrer un Paiement
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enregistrer un nouveau paiement</DialogTitle>
                <DialogDescription>Entrez les informations du paiement.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="payment-tenant">Locataire</Label>
                  <Select value={selectedTenant} onValueChange={handleTenantChange}>
                    <SelectTrigger id="payment-tenant">
                      <SelectValue placeholder="Sélectionnez un locataire" />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id.toString()}>
                          {tenant.name} - {tenant.unit_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="payment-period">Période</Label>
                  <Select
                    value={newPayment.period}
                    onValueChange={(value) => setNewPayment({ ...newPayment, period: value })}
                  >
                    <SelectTrigger id="payment-period">
                      <SelectValue placeholder="Sélectionnez une période" />
                    </SelectTrigger>
                    <SelectContent>
                      {periodOptions.map((period, index) => (
                        <SelectItem key={index} value={period}>
                          {period}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="payment-amount">Montant (FCFA)</Label>
                    <Input
                      id="payment-amount"
                      type="number"
                      value={newPayment.amount}
                      onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                      placeholder="450000"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="payment-date">Date de paiement</Label>
                    <Input
                      id="payment-date"
                      type="date"
                      value={newPayment.date}
                      onChange={(e) => setNewPayment({ ...newPayment, date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="payment-type">Type de paiement</Label>
                  <Select
                    value={newPayment.type}
                    onValueChange={(value) => setNewPayment({ ...newPayment, type: value })}
                  >
                    <SelectTrigger id="payment-type">
                      <SelectValue placeholder="Sélectionnez un type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rent">Loyer</SelectItem>
                      <SelectItem value="deposit">Dépôt de garantie</SelectItem>
                      <SelectItem value="charges">Charges</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddPaymentOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleAddPayment}>Enregistrer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher un paiement..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Tous</TabsTrigger>
          <TabsTrigger value="paid">Payés</TabsTrigger>
          <TabsTrigger value="unpaid">Impayés</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Locataire</TableHead>
                    <TableHead>Logement</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Aucun paiement trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.tenant_name}</TableCell>
                        <TableCell>{payment.unit_name}</TableCell>
                        <TableCell>{payment.period}</TableCell>
                        <TableCell>{Math.round(payment.amount).toLocaleString()} FCFA</TableCell>
                        <TableCell>
                          {payment.date ? (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(payment.date), "dd/MM/yyyy", { locale: fr })}
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        {/* Affichage du statut de paiement avec support pour les paiements partiels */}
                        <TableCell>
                          <Badge
                            variant={
                              payment.status === "paid"
                                ? "outline"
                                : payment.status === "partial"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {payment.status === "paid"
                              ? "Payé"
                              : payment.status === "partial"
                                ? `Partiel (${payment.paid_amount?.toLocaleString()} FCFA)`
                                : "Impayé"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            {payment.status === "paid" && (
                              <Button variant="ghost" size="icon" onClick={() => showReceipt(payment)}>
                                <FileText className="h-4 w-4" />
                                <span className="sr-only">Quittance</span>
                              </Button>
                            )}
                            {payment.status === "unpaid" && (
                              <Button variant="ghost" size="icon" onClick={() => handleRegisterPayment(payment)}>
                                <Euro className="h-4 w-4" />
                                <span className="sr-only">Payer</span>
                              </Button>
                            )}
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
                                    Cette action ne peut pas être annulée. Cela supprimera définitivement ce paiement.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeletePayment(payment.id)}>
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
        </TabsContent>
        <TabsContent value="paid">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Locataire</TableHead>
                    <TableHead>Logement</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments
                    .filter((payment) => payment.status === "paid")
                    .map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.tenant_name}</TableCell>
                        <TableCell>{payment.unit_name}</TableCell>
                        <TableCell>{payment.period}</TableCell>
                        <TableCell>{Math.round(payment.amount).toLocaleString()} FCFA</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {payment.date && format(new Date(payment.date), "dd/MM/yyyy", { locale: fr })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => showReceipt(payment)}>
                            <FileText className="h-4 w-4" />
                            <span className="sr-only">Quittance</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="unpaid">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Locataire</TableHead>
                    <TableHead>Logement</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments
                    .filter((payment) => payment.status === "unpaid")
                    .map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.tenant_name}</TableCell>
                        <TableCell>{payment.unit_name}</TableCell>
                        <TableCell>{payment.period}</TableCell>
                        <TableCell>{Math.round(payment.amount).toLocaleString()} FCFA</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={() => handleRegisterPayment(payment)}>
                            <Euro className="mr-2 h-4 w-4" />
                            Enregistrer le paiement
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {/* Dialog pour afficher la quittance */}
      {/* Dialogue de reçu compact avec informations du bailleur */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>Quittance de Loyer</DialogTitle>
            <DialogDescription>
              Quittance pour {selectedPayment?.tenant_name} - {selectedPayment?.period}
            </DialogDescription>
          </DialogHeader>

          <div ref={receiptRef} className="receipt p-4 border rounded-lg max-h-[500px] overflow-auto">
            <div className="header text-center mb-4">
              <h1 className="title text-xl font-bold mb-1">QUITTANCE DE LOYER</h1>
              <p className="subtitle text-sm text-gray-600">Période : {selectedPayment?.period}</p>
            </div>

            <div className="info mb-4 grid grid-cols-2 gap-4">
              <div>
                <h2 className="text-base font-semibold mb-1">BAILLEUR</h2>
                <p className="text-sm">{companyName || "Nom de la société de gestion"}</p>
                <p className="text-sm">{address || "Adresse complète"}</p>
                <p className="text-sm">
                  {phoneNumber || "Téléphone"} / {adminEmail || "Email"}
                </p>
              </div>

              <div>
                <h2 className="text-base font-semibold mb-1">LOCATAIRE</h2>
                <p className="text-sm">
                  <strong>Nom :</strong> {selectedPayment?.tenant_name}
                </p>
                <p className="text-sm">
                  <strong>Adresse :</strong> {selectedPayment?.property_name}, {selectedPayment?.unit_name}
                </p>
              </div>
            </div>

            <div className="payment-details mb-4">
              <h2 className="text-base font-semibold mb-1">DÉTAILS DU PAIEMENT</h2>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1">Description</th>
                    <th className="text-right py-1">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-1">Loyer {selectedPayment?.period}</td>
                    <td className="text-right py-1">
                      {selectedPayment ? Math.round(selectedPayment.amount).toLocaleString() : 0} FCFA
                    </td>
                  </tr>
                  {selectedPayment?.status === "partial" && (
                    <tr className="border-b text-orange-500">
                      <td className="py-1">Montant payé</td>
                      <td className="text-right py-1">
                        {selectedPayment?.paid_amount ? Math.round(selectedPayment.paid_amount).toLocaleString() : 0}{" "}
                        FCFA
                      </td>
                    </tr>
                  )}
                  <tr className="border-b">
                    <td className="py-1">Charges</td>
                    <td className="text-right py-1">0 FCFA</td>
                  </tr>
                  <tr className="font-bold">
                    <td className="py-1">TOTAL</td>
                    <td className="text-right py-1">
                      {selectedPayment?.status === "partial"
                        ? selectedPayment?.paid_amount?.toLocaleString()
                        : selectedPayment
                          ? Math.round(selectedPayment.amount).toLocaleString()
                          : 0}{" "}
                      FCFA
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mb-4 text-sm">
              <p>
                Je soussigné(e), {companyName || "[Nom du bailleur]"}, déclare avoir reçu la somme de{" "}
                {selectedPayment?.status === "partial"
                  ? selectedPayment?.paid_amount?.toLocaleString()
                  : selectedPayment
                    ? Math.round(selectedPayment.amount).toLocaleString()
                    : 0}{" "}
                FCFA
                {selectedPayment?.status === "partial" &&
                  ` (paiement partiel sur un total de ${selectedPayment?.amount.toLocaleString()} FCFA)`}{" "}
                de {selectedPayment?.tenant_name} au titre du loyer
                {selectedPayment?.status === "partial" ? " partiel" : ""} pour la période du [date début] au [date fin].
              </p>
            </div>

            <div className="footer text-sm">
              <p>
                Fait à [Ville], le{" "}
                {selectedPayment?.date
                  ? format(new Date(selectedPayment.date), "dd/MM/yyyy", { locale: fr })
                  : format(new Date(), "dd/MM/yyyy", { locale: fr })}
              </p>

              <div className="signature mt-4 flex justify-end">
                <div className="signature-box">
                  <p>Signature du bailleur</p>
                  <div className="signature-line mt-6 border-t border-black w-32"></div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            <div>
              <Button variant="outline" onClick={printReceipt} className="mr-2">
                <Printer className="mr-2 h-4 w-4" />
                Imprimer
              </Button>
              <Button onClick={generatePDF}>
                <Download className="mr-2 h-4 w-4" />
                Télécharger PDF
              </Button>
            </div>
            <Button variant="outline" onClick={() => setReceiptDialogOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

