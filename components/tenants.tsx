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
import { Search, Plus, Home, Phone, Calendar, Edit, FileText, Trash2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Separator } from "@/components/ui/separator"

// Interfaces pour les types
interface Unit {
  id: number
  name: string
  property_id: number
  type: string
  size: number
  rent: number
  status: string
}

interface Property {
  id: number
  name: string
  address: string
  units: Unit[]
}

interface Tenant {
  id: number
  name: string
  phone: string
  email: string
  unit_id: number
  unit_name: string
  property_name: string
  rent_amount: number
  deposit_amount: number
  lease_start: string
  lease_end: string
  payment_status: string
}

export default function Tenants() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [isAddTenantOpen, setIsAddTenantOpen] = useState(false)
  const [isEditTenantOpen, setIsEditTenantOpen] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<string>("")

  // Ajouter la fonctionnalité d'affichage des détails du locataire
  // Ajouter ces états au début du composant, après les autres états

  const [isViewTenantOpen, setIsViewTenantOpen] = useState(false)
  const [viewTenant, setViewTenant] = useState<Tenant | null>(null)

  const [newTenant, setNewTenant] = useState({
    name: "",
    phone: "",
    email: "",
    unit_id: "",
    deposit_amount: "",
    lease_start: new Date().toISOString().split("T")[0],
    lease_end: "",
  })

  const [editTenant, setEditTenant] = useState<{
    id: number
    name: string
    phone: string
    email: string
    unit_id: string
    deposit_amount: string
    lease_start: string
    lease_end: string
    payment_status: string
  }>({
    id: 0,
    name: "",
    phone: "",
    email: "",
    unit_id: "",
    deposit_amount: "",
    lease_start: "",
    lease_end: "",
    payment_status: "up-to-date",
  })

  const { toast } = useToast()

  // Charger les données
  useEffect(() => {
    fetchTenants()
    fetchProperties()
  }, [])

  const fetchTenants = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/tenants")

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des locataires")
      }

      const data = await response.json()
      setTenants(data)
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

  const handlePropertyChange = (value: string) => {
    setSelectedProperty(value)

    const property = properties.find((p) => p.id.toString() === value)
    if (property) {
      // Filtrer les unités disponibles (vacantes)
      const units = property.units.filter((unit) => unit.status === "vacant")
      setAvailableUnits(units)
      setNewTenant({ ...newTenant, unit_id: "" }) // Réinitialiser l'unité sélectionnée
    } else {
      setAvailableUnits([])
    }
  }

  const handleAddTenant = async () => {
    if (newTenant.name && newTenant.phone && newTenant.unit_id && newTenant.deposit_amount && newTenant.lease_start) {
      try {
        const response = await fetch("/api/tenants", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newTenant),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Erreur lors de l'ajout du locataire")
        }

        const addedTenant = await response.json()

        setTenants([...tenants, addedTenant])
        setNewTenant({
          name: "",
          phone: "",
          email: "",
          unit_id: "",
          deposit_amount: "",
          lease_start: new Date().toISOString().split("T")[0],
          lease_end: "",
        })
        setSelectedProperty("")
        setAvailableUnits([])
        setIsAddTenantOpen(false)

        // Mettre à jour les propriétés pour refléter le changement de statut de l'unité
        fetchProperties()

        toast({
          title: "Locataire ajouté",
          description: "Le locataire a été ajouté avec succès.",
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

  const handleEditTenant = async () => {
    if (
      editTenant.name &&
      editTenant.phone &&
      editTenant.unit_id &&
      editTenant.deposit_amount &&
      editTenant.lease_start
    ) {
      try {
        const response = await fetch(`/api/tenants/${editTenant.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editTenant),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Erreur lors de la modification du locataire")
        }

        const updatedTenant = await response.json()

        setTenants(tenants.map((tenant) => (tenant.id === editTenant.id ? updatedTenant : tenant)))

        setIsEditTenantOpen(false)

        // Mettre à jour les propriétés pour refléter le changement de statut de l'unité
        fetchProperties()

        toast({
          title: "Locataire modifié",
          description: "Le locataire a été modifié avec succès.",
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

  const handleDeleteTenant = async (id: number) => {
    try {
      const response = await fetch(`/api/tenants/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erreur lors de la suppression du locataire")
      }

      setTenants(tenants.filter((tenant) => tenant.id !== id))

      // Mettre à jour les propriétés pour refléter le changement de statut de l'unité
      fetchProperties()

      toast({
        title: "Locataire supprimé",
        description: "Le locataire a été supprimé avec succès.",
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

  const prepareEditTenant = (tenant: Tenant) => {
    // Récupérer toutes les unités disponibles et l'unité actuelle du locataire
    const property = properties.find((p) => p.units.some((u) => u.id === tenant.unit_id))

    if (property) {
      const units = property.units.filter((unit) => unit.status === "vacant" || unit.id === tenant.unit_id)
      setAvailableUnits(units)
      setSelectedProperty(property.id.toString())
    }

    setEditTenant({
      id: tenant.id,
      name: tenant.name,
      phone: tenant.phone,
      email: tenant.email || "",
      unit_id: tenant.unit_id.toString(),
      deposit_amount: tenant.deposit_amount.toString(),
      lease_start: tenant.lease_start,
      lease_end: tenant.lease_end || "",
      payment_status: tenant.payment_status,
    })

    setIsEditTenantOpen(true)
  }

  // Ajouter cette fonction après les autres fonctions de gestion

  const handleViewTenant = (tenant: Tenant) => {
    setViewTenant(tenant)
    setIsViewTenantOpen(true)
  }

  const filteredTenants = tenants.filter(
    (tenant) =>
      tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.property_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.unit_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.payment_status.toLowerCase().includes(searchTerm.toLowerCase()),
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
        <h2 className="text-3xl font-bold tracking-tight">Gestion des Locataires</h2>
        <Dialog open={isAddTenantOpen} onOpenChange={setIsAddTenantOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un Locataire
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Ajouter un nouveau locataire</DialogTitle>
              <DialogDescription>Entrez les informations du nouveau locataire.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="tenant-name">Nom complet</Label>
                  <Input
                    id="tenant-name"
                    value={newTenant.name}
                    onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                    placeholder="Jean Dupont"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tenant-phone">Téléphone</Label>
                  <Input
                    id="tenant-phone"
                    value={newTenant.phone}
                    onChange={(e) => setNewTenant({ ...newTenant, phone: e.target.value })}
                    placeholder="06 12 34 56 78"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tenant-email">Email (optionnel)</Label>
                <Input
                  id="tenant-email"
                  type="email"
                  value={newTenant.email}
                  onChange={(e) => setNewTenant({ ...newTenant, email: e.target.value })}
                  placeholder="jean.dupont@example.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="tenant-property">Maison</Label>
                  <Select value={selectedProperty} onValueChange={handlePropertyChange}>
                    <SelectTrigger id="tenant-property">
                      <SelectValue placeholder="Sélectionnez une maison" />
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
                  <Label htmlFor="tenant-unit">Logement</Label>
                  <Select
                    value={newTenant.unit_id}
                    onValueChange={(value) => setNewTenant({ ...newTenant, unit_id: value })}
                    disabled={!selectedProperty || availableUnits.length === 0}
                  >
                    <SelectTrigger id="tenant-unit">
                      <SelectValue placeholder="Sélectionnez un logement" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUnits.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id.toString()}>
                          {unit.name} - {unit.rent} FCFA/mois
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tenant-deposit">Dépôt de garantie (FCFA)</Label>
                <Input
                  id="tenant-deposit"
                  type="number"
                  value={newTenant.deposit_amount}
                  onChange={(e) => setNewTenant({ ...newTenant, deposit_amount: e.target.value })}
                  placeholder="450000"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="tenant-lease-start">Début du bail</Label>
                  <Input
                    id="tenant-lease-start"
                    type="date"
                    value={newTenant.lease_start}
                    onChange={(e) => setNewTenant({ ...newTenant, lease_start: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tenant-lease-end">Fin du bail (optionnel)</Label>
                  <Input
                    id="tenant-lease-end"
                    type="date"
                    value={newTenant.lease_end}
                    onChange={(e) => setNewTenant({ ...newTenant, lease_end: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddTenantOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleAddTenant}>Ajouter</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher un locataire..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Tous</TabsTrigger>
          <TabsTrigger value="up-to-date">À jour</TabsTrigger>
          <TabsTrigger value="late">En retard</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Logement</TableHead>
                    <TableHead>Loyer</TableHead>
                    <TableHead>Début du bail</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTenants.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Aucun locataire trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTenants.map((tenant) => (
                      <TableRow key={tenant.id}>
                        <TableCell>
                          <div className="font-medium">{tenant.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {tenant.phone}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{tenant.unit_name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Home className="h-3 w-3" /> {tenant.property_name}
                          </div>
                        </TableCell>
                        <TableCell>{Math.round(tenant.rent_amount).toLocaleString()} FCFA/mois</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(tenant.lease_start), "dd/MM/yyyy", { locale: fr })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={tenant.payment_status === "up-to-date" ? "outline" : "destructive"}>
                            {tenant.payment_status === "up-to-date" ? "À jour" : "En retard"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="icon" onClick={() => prepareEditTenant(tenant)}>
                              <Edit className="h-4 w-4" />
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
                                    Cette action ne peut pas être annulée. Cela supprimera définitivement le locataire
                                    et libérera le logement associé.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteTenant(tenant.id)}>
                                    Supprimer
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            <Button variant="ghost" size="icon" onClick={() => handleViewTenant(tenant)}>
                              <FileText className="h-4 w-4" />
                            </Button>
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
        <TabsContent value="up-to-date">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Logement</TableHead>
                    <TableHead>Loyer</TableHead>
                    <TableHead>Début du bail</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTenants
                    .filter((tenant) => tenant.payment_status === "up-to-date")
                    .map((tenant) => (
                      <TableRow key={tenant.id}>
                        <TableCell>
                          <div className="font-medium">{tenant.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {tenant.phone}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{tenant.unit_name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Home className="h-3 w-3" /> {tenant.property_name}
                          </div>
                        </TableCell>
                        <TableCell>{Math.round(tenant.rent_amount).toLocaleString()} FCFA/mois</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(tenant.lease_start), "dd/MM/yyyy", { locale: fr })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">À jour</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="icon" onClick={() => prepareEditTenant(tenant)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleViewTenant(tenant)}>
                              <FileText className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="late">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Logement</TableHead>
                    <TableHead>Loyer</TableHead>
                    <TableHead>Début du bail</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTenants
                    .filter((tenant) => tenant.payment_status === "late")
                    .map((tenant) => (
                      <TableRow key={tenant.id}>
                        <TableCell>
                          <div className="font-medium">{tenant.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {tenant.phone}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{tenant.unit_name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Home className="h-3 w-3" /> {tenant.property_name}
                          </div>
                        </TableCell>
                        <TableCell>{Math.round(tenant.rent_amount).toLocaleString()} FCFA/mois</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(tenant.lease_start), "dd/MM/yyyy", { locale: fr })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive">En retard</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="icon" onClick={() => prepareEditTenant(tenant)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleViewTenant(tenant)}>
                              <FileText className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog pour modifier un locataire */}
      <Dialog open={isEditTenantOpen} onOpenChange={setIsEditTenantOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Modifier le locataire</DialogTitle>
            <DialogDescription>Modifiez les informations du locataire.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-tenant-name">Nom complet</Label>
                <Input
                  id="edit-tenant-name"
                  value={editTenant.name}
                  onChange={(e) => setEditTenant({ ...editTenant, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-tenant-phone">Téléphone</Label>
                <Input
                  id="edit-tenant-phone"
                  value={editTenant.phone}
                  onChange={(e) => setEditTenant({ ...editTenant, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-tenant-email">Email (optionnel)</Label>
              <Input
                id="edit-tenant-email"
                type="email"
                value={editTenant.email}
                onChange={(e) => setEditTenant({ ...editTenant, email: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-tenant-property">Maison</Label>
                <Select value={selectedProperty} onValueChange={handlePropertyChange}>
                  <SelectTrigger id="edit-tenant-property">
                    <SelectValue placeholder="Sélectionnez une maison" />
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
                <Label htmlFor="edit-tenant-unit">Logement</Label>
                <Select
                  value={editTenant.unit_id}
                  onValueChange={(value) => setEditTenant({ ...editTenant, unit_id: value })}
                  disabled={!selectedProperty || availableUnits.length === 0}
                >
                  <SelectTrigger id="edit-tenant-unit">
                    <SelectValue placeholder="Sélectionnez un logement" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUnits.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id.toString()}>
                        {unit.name} - {unit.rent} FCFA/mois
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-tenant-deposit">Dépôt de garantie (FCFA)</Label>
              <Input
                id="edit-tenant-deposit"
                type="number"
                value={editTenant.deposit_amount}
                onChange={(e) => setEditTenant({ ...editTenant, deposit_amount: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-tenant-lease-start">Début du bail</Label>
                <Input
                  id="edit-tenant-lease-start"
                  type="date"
                  value={editTenant.lease_start}
                  onChange={(e) => setEditTenant({ ...editTenant, lease_start: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-tenant-lease-end">Fin du bail (optionnel)</Label>
                <Input
                  id="edit-tenant-lease-end"
                  type="date"
                  value={editTenant.lease_end}
                  onChange={(e) => setEditTenant({ ...editTenant, lease_end: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-tenant-status">Statut de paiement</Label>
              <Select
                value={editTenant.payment_status}
                onValueChange={(value) => setEditTenant({ ...editTenant, payment_status: value })}
              >
                <SelectTrigger id="edit-tenant-status">
                  <SelectValue placeholder="Sélectionnez un statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="up-to-date">À jour</SelectItem>
                  <SelectItem value="late">En retard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditTenantOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleEditTenant}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ajouter le dialogue de visualisation à la fin du composant, juste avant le return final */}

      <Dialog open={isViewTenantOpen} onOpenChange={setIsViewTenantOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Détails du locataire</DialogTitle>
            <DialogDescription>Informations complètes sur le locataire</DialogDescription>
          </DialogHeader>
          {viewTenant && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Informations personnelles</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Nom:</span>
                      <p>{viewTenant.name}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Téléphone:</span>
                      <p>{viewTenant.phone}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Email:</span>
                      <p>{viewTenant.email || "Non renseigné"}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Logement</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Propriété:</span>
                      <p>{viewTenant.property_name}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Unité:</span>
                      <p>{viewTenant.unit_name}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Loyer mensuel:</span>
                      <p>{Math.round(viewTenant.rent_amount).toLocaleString()} FCFA</p>
                    </div>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Bail</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Début du bail:</span>
                      <p>{format(new Date(viewTenant.lease_start), "dd/MM/yyyy", { locale: fr })}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Fin du bail:</span>
                      <p>
                        {viewTenant.lease_end
                          ? format(new Date(viewTenant.lease_end), "dd/MM/yyyy", { locale: fr })
                          : "Indéterminée"}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Dépôt de garantie:</span>
                      <p>{Math.round(viewTenant.deposit_amount).toLocaleString()} FCFA</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Statut</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Statut de paiement:</span>
                      <p>
                        <Badge variant={viewTenant.payment_status === "up-to-date" ? "outline" : "destructive"}>
                          {viewTenant.payment_status === "up-to-date" ? "À jour" : "En retard"}
                        </Badge>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewTenantOpen(false)}>
              Fermer
            </Button>
            <Button onClick={() => prepareEditTenant(viewTenant!)}>Modifier</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

