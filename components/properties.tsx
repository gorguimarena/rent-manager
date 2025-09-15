"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Plus, User, Edit, Trash2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Définir les interfaces pour les types
interface Unit {
  id: number
  name: string
  type: string
  size: number
  rent: number
  status: string
  tenant_name?: string
}

interface Property {
  id: number
  name: string
  address: string
  units: Unit[]
}

export default function Properties() {
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false)
  const [isAddUnitOpen, setIsAddUnitOpen] = useState(false)
  const [isEditPropertyOpen, setIsEditPropertyOpen] = useState(false)
  const [isEditUnitOpen, setIsEditUnitOpen] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)

  const [newProperty, setNewProperty] = useState({
    name: "",
    address: "",
  })

  const [newUnit, setNewUnit] = useState({
    name: "",
    type: "apartment",
    size: "",
    rent: "",
  })

  const [editProperty, setEditProperty] = useState({
    id: 0,
    name: "",
    address: "",
  })

  const [editUnit, setEditUnit] = useState({
    id: 0,
    name: "",
    type: "",
    size: "",
    rent: "",
    status: "",
  })

  const { toast } = useToast()

  // Charger les propriétés
  useEffect(() => {
    fetchProperties()
  }, [])

  const fetchProperties = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/properties")

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des propriétés")
      }

      const data = await response.json()
      setProperties(data)
    } catch (error: any) {
      console.error("Erreur:", error)
      setError(error.message || "Une erreur est survenue")
    } finally {
      setIsLoading(false)
    }
  }

  // Ajouter une propriété
  const handleAddProperty = async () => {
    if (newProperty.name && newProperty.address) {
      try {
        const response = await fetch("/api/properties", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newProperty),
        })

        if (!response.ok) {
          throw new Error("Erreur lors de l'ajout de la propriété")
        }

        const addedProperty = await response.json()
        setProperties([...properties, addedProperty as Property])
        setNewProperty({ name: "", address: "" })
        setIsAddPropertyOpen(false)

        toast({
          title: "Propriété ajoutée",
          description: "La propriété a été ajoutée avec succès.",
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
  }

  // Modifier une propriété
  const handleEditProperty = async () => {
    if (editProperty.name && editProperty.address) {
      try {
        const response = await fetch(`/api/properties/${editProperty.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: editProperty.name,
            address: editProperty.address,
          }),
        })

        if (!response.ok) {
          throw new Error("Erreur lors de la modification de la propriété")
        }

        const updatedProperty = await response.json()

        setProperties(
          properties.map((property) =>
            property.id === editProperty.id
              ? { ...property, name: updatedProperty.name, address: updatedProperty.address }
              : property,
          ),
        )

        setIsEditPropertyOpen(false)

        toast({
          title: "Propriété modifiée",
          description: "La propriété a été modifiée avec succès.",
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
  }

  // Supprimer une propriété
  const handleDeleteProperty = async (id: number) => {
    try {
      const response = await fetch(`/api/properties/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression de la propriété")
      }

      setProperties(properties.filter((property) => property.id !== id))

      toast({
        title: "Propriété supprimée",
        description: "La propriété a été supprimée avec succès.",
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

  // Ajouter une unité
  const handleAddUnit = async () => {
    if (selectedProperty && newUnit.name && newUnit.rent) {
      try {
        const response = await fetch("/api/units", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            property_id: selectedProperty.id,
            name: newUnit.name,
            type: newUnit.type,
            size: 0, // Valeur par défaut
            rent: Number.parseFloat(newUnit.rent),
          }),
        })

        if (!response.ok) {
          throw new Error("Erreur lors de l'ajout du logement")
        }

        const addedUnit = await response.json()

        setProperties(
          properties.map((property) => {
            if (property.id === selectedProperty.id) {
              return {
                ...property,
                units: [...property.units, addedUnit as Unit],
              }
            }
            return property
          }),
        )

        setNewUnit({ name: "", type: "apartment", size: "", rent: "" })
        setIsAddUnitOpen(false)

        toast({
          title: "Logement ajouté",
          description: "Le logement a été ajouté avec succès.",
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
  }

  // Modifier une unité
  const handleEditUnit = async () => {
    if (editUnit.name && editUnit.size && editUnit.rent) {
      try {
        const response = await fetch(`/api/units/${editUnit.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: editUnit.name,
            type: editUnit.type,
            size: Number.parseInt(editUnit.size),
            rent: Number.parseFloat(editUnit.rent),
            status: editUnit.status,
          }),
        })

        if (!response.ok) {
          throw new Error("Erreur lors de la modification du logement")
        }

        const updatedUnit = await response.json()

        setProperties(
          properties.map((property) => {
            if (property.id === selectedProperty?.id) {
              return {
                ...property,
                units: property.units.map((unit) =>
                  unit.id === editUnit.id ? ({ ...unit, ...updatedUnit } as Unit) : unit,
                ),
              }
            }
            return property
          }),
        )

        setIsEditUnitOpen(false)

        toast({
          title: "Logement modifié",
          description: "Le logement a été modifié avec succès.",
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
  }

  // Supprimer une unité
  const handleDeleteUnit = async (unitId: number, propertyId: number) => {
    try {
      const response = await fetch(`/api/units/${unitId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression du logement")
      }

      setProperties(
        properties.map((property) => {
          if (property.id === propertyId) {
            return {
              ...property,
              units: property.units.filter((unit) => unit.id !== unitId),
            }
          }
          return property
        }),
      )

      toast({
        title: "Logement supprimé",
        description: "Le logement a été supprimé avec succès.",
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
        <h2 className="text-3xl font-bold tracking-tight">Gestion des Maisons</h2>
        <Dialog open={isAddPropertyOpen} onOpenChange={setIsAddPropertyOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une Maison
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter une nouvelle maison</DialogTitle>
              <DialogDescription>Entrez les informations de la nouvelle propriété.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="property-name">Nom</Label>
                <Input
                  id="property-name"
                  value={newProperty.name}
                  onChange={(e) => setNewProperty({ ...newProperty, name: e.target.value })}
                  placeholder="Résidence Les Oliviers"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="property-address">Adresse</Label>
                <Input
                  id="property-address"
                  value={newProperty.address}
                  onChange={(e) => setNewProperty({ ...newProperty, address: e.target.value })}
                  placeholder="123 Rue des Fleurs, 75001 Paris"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddPropertyOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleAddProperty}>Ajouter</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Toutes les Maisons</TabsTrigger>
          <TabsTrigger value="apartments">Appartements</TabsTrigger>
          <TabsTrigger value="studios">Studios</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-4">
          {properties.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-40">
                <p className="text-muted-foreground mb-4">Aucune propriété trouvée</p>
                <Button onClick={() => setIsAddPropertyOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter une propriété
                </Button>
              </CardContent>
            </Card>
          ) : (
            properties.map((property) => (
              <Card key={property.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{property.name}</CardTitle>
                      <CardDescription>{property.address}</CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedProperty(property)
                          setIsAddUnitOpen(true)
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Ajouter un Logement
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditProperty({
                            id: property.id,
                            name: property.name,
                            address: property.address,
                          })
                          setIsEditPropertyOpen(true)
                        }}
                      >
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
                              Cette action ne peut pas être annulée. Cela supprimera définitivement la propriété et tous
                              les logements associés.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteProperty(property.id)}>
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {property.units && property.units.length > 0 ? (
                      property.units.map((unit) => (
                        <Card key={unit.id}>
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">{unit.name}</CardTitle>
                              <div className="flex space-x-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedProperty(property)
                                    setSelectedUnit(unit)
                                    setEditUnit({
                                      id: unit.id,
                                      name: unit.name,
                                      type: unit.type,
                                      size: unit.size.toString(),
                                      rent: unit.rent.toString(),
                                      status: unit.status,
                                    })
                                    setIsEditUnitOpen(true)
                                  }}
                                >
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
                                        Cette action ne peut pas être annulée. Cela supprimera définitivement ce
                                        logement.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteUnit(unit.id, property.id)}>
                                        Supprimer
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                            <CardDescription>
                              {unit.type === "apartment" ? "Appartement" : "Studio"} • {unit.size} m²
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pb-2">
                            <div className="flex justify-between py-1">
                              <span className="text-sm">Loyer:</span>
                              <span className="text-sm font-medium">
                                {Math.round(unit.rent).toLocaleString()} FCFA/mois
                              </span>
                            </div>
                            <div className="flex justify-between py-1">
                              <span className="text-sm">Statut:</span>
                              <span className="text-sm font-medium">
                                {unit.status === "occupied" ? "Occupé" : "Vacant"}
                              </span>
                            </div>
                            {unit.tenant_name && (
                              <div className="flex justify-between items-center py-1">
                                <span className="text-sm">Locataire:</span>
                                <div className="flex items-center">
                                  <User className="mr-1 h-3 w-3" />
                                  <span className="text-sm font-medium">{unit.tenant_name}</span>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="col-span-full flex flex-col items-center justify-center h-40">
                        <p className="text-muted-foreground mb-4">Aucun logement trouvé</p>
                        <Button
                          onClick={() => {
                            setSelectedProperty(property)
                            setIsAddUnitOpen(true)
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Ajouter un logement
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
        <TabsContent value="apartments" className="space-y-4">
          {properties.filter((property) => property.units && property.units.some((unit) => unit.type === "apartment"))
            .length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-40">
                <p className="text-muted-foreground">Aucun appartement trouvé</p>
              </CardContent>
            </Card>
          ) : (
            properties.map(
              (property) =>
                property.units &&
                property.units.some((unit) => unit.type === "apartment") && (
                  <Card key={property.id}>
                    <CardHeader>
                      <CardTitle>{property.name}</CardTitle>
                      <CardDescription>{property.address}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {property.units
                          .filter((unit) => unit.type === "apartment")
                          .map((unit) => (
                            <Card key={unit.id}>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-lg">{unit.name}</CardTitle>
                                <CardDescription>Appartement • {unit.size} m²</CardDescription>
                              </CardHeader>
                              <CardContent className="pb-2">
                                <div className="flex justify-between py-1">
                                  <span className="text-sm">Loyer:</span>
                                  <span className="text-sm font-medium">
                                    {Math.round(unit.rent).toLocaleString()} FCFA/mois
                                  </span>
                                </div>
                                <div className="flex justify-between py-1">
                                  <span className="text-sm">Statut:</span>
                                  <span className="text-sm font-medium">
                                    {unit.status === "occupied" ? "Occupé" : "Vacant"}
                                  </span>
                                </div>
                                {unit.tenant_name && (
                                  <div className="flex justify-between items-center py-1">
                                    <span className="text-sm">Locataire:</span>
                                    <div className="flex items-center">
                                      <User className="mr-1 h-3 w-3" />
                                      <span className="text-sm font-medium">{unit.tenant_name}</span>
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                ),
            )
          )}
        </TabsContent>
        <TabsContent value="studios" className="space-y-4">
          {properties.filter((property) => property.units && property.units.some((unit) => unit.type === "studio"))
            .length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-40">
                <p className="text-muted-foreground">Aucun studio trouvé</p>
              </CardContent>
            </Card>
          ) : (
            properties.map(
              (property) =>
                property.units &&
                property.units.some((unit) => unit.type === "studio") && (
                  <Card key={property.id}>
                    <CardHeader>
                      <CardTitle>{property.name}</CardTitle>
                      <CardDescription>{property.address}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {property.units
                          .filter((unit) => unit.type === "studio")
                          .map((unit) => (
                            <Card key={unit.id}>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-lg">{unit.name}</CardTitle>
                                <CardDescription>Studio • {unit.size} m²</CardDescription>
                              </CardHeader>
                              <CardContent className="pb-2">
                                <div className="flex justify-between py-1">
                                  <span className="text-sm">Loyer:</span>
                                  <span className="text-sm font-medium">
                                    {Math.round(unit.rent).toLocaleString()} FCFA/mois
                                  </span>
                                </div>
                                <div className="flex justify-between py-1">
                                  <span className="text-sm">Statut:</span>
                                  <span className="text-sm font-medium">
                                    {unit.status === "occupied" ? "Occupé" : "Vacant"}
                                  </span>
                                </div>
                                {unit.tenant_name && (
                                  <div className="flex justify-between items-center py-1">
                                    <span className="text-sm">Locataire:</span>
                                    <div className="flex items-center">
                                      <User className="mr-1 h-3 w-3" />
                                      <span className="text-sm font-medium">{unit.tenant_name}</span>
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                ),
            )
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog pour ajouter une unité */}
      <Dialog open={isAddUnitOpen} onOpenChange={setIsAddUnitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un nouveau logement</DialogTitle>
            <DialogDescription>
              Entrez les informations du nouveau logement pour {selectedProperty?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="unit-name">Nom</Label>
              <Input
                id="unit-name"
                value={newUnit.name}
                onChange={(e) => setNewUnit({ ...newUnit, name: e.target.value })}
                placeholder="Appartement 1A"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unit-type">Type</Label>
              <Select value={newUnit.type} onValueChange={(value) => setNewUnit({ ...newUnit, type: value })}>
                <SelectTrigger id="unit-type">
                  <SelectValue placeholder="Sélectionnez un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartment">Appartement</SelectItem>
                  <SelectItem value="studio">Studio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unit-rent">Loyer (FCFA)</Label>
              <Input
                id="unit-rent"
                type="number"
                value={newUnit.rent}
                onChange={(e) => setNewUnit({ ...newUnit, rent: e.target.value })}
                placeholder="750000"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUnitOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddUnit}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog pour modifier une propriété */}
      <Dialog open={isEditPropertyOpen} onOpenChange={setIsEditPropertyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la propriété</DialogTitle>
            <DialogDescription>Modifiez les informations de la propriété.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-property-name">Nom</Label>
              <Input
                id="edit-property-name"
                value={editProperty.name}
                onChange={(e) => setEditProperty({ ...editProperty, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-property-address">Adresse</Label>
              <Input
                id="edit-property-address"
                value={editProperty.address}
                onChange={(e) => setEditProperty({ ...editProperty, address: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditPropertyOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleEditProperty}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog pour modifier une unité */}
      <Dialog open={isEditUnitOpen} onOpenChange={setIsEditUnitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le logement</DialogTitle>
            <DialogDescription>Modifiez les informations du logement.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-unit-name">Nom</Label>
              <Input
                id="edit-unit-name"
                value={editUnit.name}
                onChange={(e) => setEditUnit({ ...editUnit, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-unit-type">Type</Label>
              <Select value={editUnit.type} onValueChange={(value) => setEditUnit({ ...editUnit, type: value })}>
                <SelectTrigger id="edit-unit-type">
                  <SelectValue placeholder="Sélectionnez un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartment">Appartement</SelectItem>
                  <SelectItem value="studio">Studio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-unit-size">Surface (m²)</Label>
              <Input
                id="edit-unit-size"
                type="number"
                value={editUnit.size}
                onChange={(e) => setEditUnit({ ...editUnit, size: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-unit-rent">Loyer (FCFA)</Label>
              <Input
                id="edit-unit-rent"
                type="number"
                value={editUnit.rent}
                onChange={(e) => setEditUnit({ ...editUnit, rent: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-unit-status">Statut</Label>
              <Select value={editUnit.status} onValueChange={(value) => setEditUnit({ ...editUnit, status: value })}>
                <SelectTrigger id="edit-unit-status">
                  <SelectValue placeholder="Sélectionnez un statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vacant">Vacant</SelectItem>
                  <SelectItem value="occupied">Occupé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditUnitOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleEditUnit}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

