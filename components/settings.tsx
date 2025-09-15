"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertCircle,
  Download,
  Save,
  Upload,
  User,
  Trash2,
  Edit,
  Plus,
  RefreshCw,
  Check,
  Moon,
  Sun,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

// Interfaces pour les types
interface UserType {
  id: number
  username: string
  email: string
  role: string
  created_at: string
}

interface Backup {
  filename: string
  size: number
  created_at: string
}

interface AppSettings {
  companyName: string
  adminEmail: string
  phoneNumber: string
  address: string
  currency: string
  language: string
  dateFormat: string
  darkMode: boolean
  emailNotifications: boolean
  backupFrequency: string
  autoGenerateReceipts: boolean
  logo: string | null
}

export default function Settings() {
  const [backupFrequency, setBackupFrequency] = useState("weekly")
  const [darkMode, setDarkMode] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [autoGenerateReceipts, setAutoGenerateReceipts] = useState(false)
  const [companyName, setCompanyName] = useState("Ma Société Immobilière")
  const [adminEmail, setAdminEmail] = useState("admin@example.com")
  const [phoneNumber, setPhoneNumber] = useState("+123 456 789")
  const [address, setAddress] = useState("123 Rue Principale, Ville")
  const [currency, setCurrency] = useState("fcfa")
  const [language, setLanguage] = useState("fr")
  const [dateFormat, setDateFormat] = useState("dd/MM/yyyy")
  const [logo, setLogo] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const [users, setUsers] = useState<UserType[]>([])
  const [backups, setBackups] = useState<Backup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [isEditUserOpen, setIsEditUserOpen] = useState(false)
  const [isBackupInProgress, setIsBackupInProgress] = useState(false)
  const [isRestoreInProgress, setIsRestoreInProgress] = useState(false)
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    email: "",
    role: "user",
  })

  const [editUser, setEditUser] = useState<{
    id: number
    username: string
    password: string
    email: string
    role: string
  }>({
    id: 0,
    username: "",
    password: "",
    email: "",
    role: "",
  })

  const { toast } = useToast()

  // Charger les données
  useEffect(() => {
    fetchUsers()
    fetchBackups()
    fetchSettings()
  }, [])

  // Surveiller les changements dans les paramètres
  useEffect(() => {
    setHasUnsavedChanges(true)
  }, [
    companyName,
    adminEmail,
    phoneNumber,
    address,
    currency,
    language,
    dateFormat,
    darkMode,
    emailNotifications,
    backupFrequency,
    autoGenerateReceipts,
  ])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/users")

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des utilisateurs")
      }

      const data = await response.json()
      setUsers(data)
    } catch (error: any) {
      console.error("Erreur:", error)
      setError(error.message || "Une erreur est survenue")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchBackups = async () => {
    try {
      const response = await fetch("/api/backup")

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des sauvegardes")
      }

      const data = await response.json()
      setBackups(data.backups)
    } catch (error: any) {
      console.error("Erreur:", error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
      })
    }
  }

  const fetchSettings = async () => {
    try {
      // Essayer de récupérer les paramètres du localStorage d'abord
      const savedSettings = localStorage.getItem("appSettings")

      if (savedSettings) {
        const settings = JSON.parse(savedSettings)
        setCompanyName(settings.companyName || "Ma Société Immobilière")
        setAdminEmail(settings.adminEmail || "admin@example.com")
        setPhoneNumber(settings.phoneNumber || "+123 456 789")
        setAddress(settings.address || "123 Rue Principale, Ville")
        setCurrency(settings.currency || "fcfa")
        setLanguage(settings.language || "fr")
        setDateFormat(settings.dateFormat || "dd/MM/yyyy")
        setDarkMode(settings.darkMode || false)
        setEmailNotifications(settings.emailNotifications !== undefined ? settings.emailNotifications : true)
        setBackupFrequency(settings.backupFrequency || "weekly")
        setAutoGenerateReceipts(settings.autoGenerateReceipts || false)
        setLogo(settings.logo || null)

        setHasUnsavedChanges(false)
        return
      }

      // Si aucun paramètre n'est trouvé dans le localStorage, utiliser les valeurs par défaut
      const settings: AppSettings = {
        companyName: "Ma Société Immobilière",
        adminEmail: "admin@example.com",
        phoneNumber: "+123 456 789",
        address: "123 Rue Principale, Ville",
        currency: "fcfa",
        language: "fr",
        dateFormat: "dd/MM/yyyy",
        darkMode: false,
        emailNotifications: true,
        backupFrequency: "weekly",
        autoGenerateReceipts: false,
        logo: null,
      }

      setCompanyName(settings.companyName)
      setAdminEmail(settings.adminEmail)
      setPhoneNumber(settings.phoneNumber)
      setAddress(settings.address)
      setCurrency(settings.currency)
      setLanguage(settings.language)
      setDateFormat(settings.dateFormat)
      setDarkMode(settings.darkMode)
      setEmailNotifications(settings.emailNotifications)
      setBackupFrequency(settings.backupFrequency)
      setAutoGenerateReceipts(settings.autoGenerateReceipts)
      setLogo(settings.logo)

      setHasUnsavedChanges(false)
    } catch (error: any) {
      console.error("Erreur:", error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les paramètres.",
      })
    }
  }

  const handleAddUser = async () => {
    if (newUser.username && newUser.password && newUser.email && newUser.role) {
      try {
        const response = await fetch("/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newUser),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Erreur lors de l'ajout de l'utilisateur")
        }

        const addedUser = await response.json()

        setUsers([...users, addedUser])
        setNewUser({
          username: "",
          password: "",
          email: "",
          role: "user",
        })
        setIsAddUserOpen(false)

        toast({
          title: "Utilisateur ajouté",
          description: "L'utilisateur a été ajouté avec succès.",
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

  const handleEditUser = async () => {
    if (editUser.username && editUser.email && editUser.role) {
      try {
        const response = await fetch(`/api/users/${editUser.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editUser),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Erreur lors de la modification de l'utilisateur")
        }

        const updatedUser = await response.json()

        setUsers(
          users.map((user) => (user.id === editUser.id ? { ...updatedUser, created_at: user.created_at } : user)),
        )

        setIsEditUserOpen(false)

        toast({
          title: "Utilisateur modifié",
          description: "L'utilisateur a été modifié avec succès.",
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

  const handleDeleteUser = async (id: number) => {
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erreur lors de la suppression de l'utilisateur")
      }

      setUsers(users.filter((user) => user.id !== id))

      toast({
        title: "Utilisateur supprimé",
        description: "L'utilisateur a été supprimé avec succès.",
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

  const prepareEditUser = (user: UserType) => {
    setEditUser({
      id: user.id,
      username: user.username,
      password: "", // Ne pas remplir le mot de passe
      email: user.email,
      role: user.role,
    })

    setIsEditUserOpen(true)
  }

  const createBackup = async () => {
    try {
      setIsBackupInProgress(true)

      const response = await fetch("/api/backup", {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erreur lors de la création de la sauvegarde")
      }

      const result = await response.json()

      // Mettre à jour la liste des sauvegardes
      fetchBackups()

      toast({
        title: "Sauvegarde créée",
        description: `La sauvegarde ${result.filename} a été créée avec succès.`,
      })
    } catch (error: any) {
      console.error("Erreur:", error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
      })
    } finally {
      setIsBackupInProgress(false)
    }
  }

  // Modifions la fonction restoreBackup pour gérer correctement les réponses vides
  // Recherchez la fonction restoreBackup et remplacez le bloc try/catch par celui-ci:

  const restoreBackup = async (filename: string) => {
    try {
      setIsRestoreInProgress(true)

      const response = await fetch("/api/backup/restore", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filename }),
      })

      if (!response.ok) {
        // Vérifier si la réponse contient du contenu avant de tenter de l'analyser
        const text = await response.text()
        let errorMessage = "Erreur lors de la restauration de la sauvegarde"

        if (text) {
          try {
            const errorData = JSON.parse(text)
            errorMessage = errorData.error || errorMessage
          } catch (parseError) {
            console.error("Erreur lors de l'analyse de la réponse:", parseError)
          }
        }

        throw new Error(errorMessage)
      }

      // Vérifier si la réponse contient du contenu avant de tenter de l'analyser
      const text = await response.text()
      const result = text ? JSON.parse(text) : { filename }

      toast({
        title: "Sauvegarde restaurée",
        description: `La sauvegarde ${result.filename} a été restaurée avec succès.`,
      })

      // Recharger les données
      fetchUsers()
    } catch (error: any) {
      console.error("Erreur:", error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
      })
    } finally {
      setIsRestoreInProgress(false)
      setSelectedBackup(null)
    }
  }

  const downloadBackup = async (filename: string) => {
    try {
      const response = await fetch(`/api/backup/${filename}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erreur lors du téléchargement de la sauvegarde")
      }

      // Récupérer le blob
      const blob = await response.blob()

      // Créer un URL pour le blob
      const url = window.URL.createObjectURL(blob)

      // Créer un lien pour télécharger le fichier
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()

      // Nettoyer
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error: any) {
      console.error("Erreur:", error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
      })
    }
  }

  const deleteBackup = async (filename: string) => {
    try {
      const response = await fetch(`/api/backup/${filename}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erreur lors de la suppression de la sauvegarde")
      }

      // Mettre à jour la liste des sauvegardes
      fetchBackups()

      toast({
        title: "Sauvegarde supprimée",
        description: `La sauvegarde ${filename} a été supprimée avec succès.`,
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const saveGeneralSettings = async () => {
    try {
      setIsSaving(true)

      // Créer l'objet de paramètres
      const settings: AppSettings = {
        companyName,
        adminEmail,
        phoneNumber,
        address,
        currency,
        language,
        dateFormat,
        darkMode,
        emailNotifications,
        backupFrequency,
        autoGenerateReceipts,
        logo,
      }

      // Sauvegarder dans le localStorage
      localStorage.setItem("appSettings", JSON.stringify(settings))

      console.log("Paramètres enregistrés:", settings)

      // Appliquer le mode sombre si nécessaire
      const htmlElement = document.documentElement
      if (darkMode) {
        htmlElement.classList.add("dark")
      } else {
        htmlElement.classList.remove("dark")
      }

      setHasUnsavedChanges(false)

      toast({
        title: "Paramètres enregistrés",
        description: "Les paramètres ont été enregistrés avec succès.",
      })
    } catch (error: any) {
      console.error("Erreur:", error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de l'enregistrement des paramètres",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogo(e.target?.result as string)
        setHasUnsavedChanges(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const resetSettings = () => {
    // Réinitialiser les paramètres aux valeurs par défaut
    setCompanyName("Ma Société Immobilière")
    setAdminEmail("admin@example.com")
    setPhoneNumber("+123 456 789")
    setAddress("123 Rue Principale, Ville")
    setCurrency("fcfa")
    setLanguage("fr")
    setDateFormat("dd/MM/yyyy")
    setDarkMode(false)
    setEmailNotifications(true)
    setBackupFrequency("weekly")
    setAutoGenerateReceipts(false)
    setLogo(null)

    // Supprimer les paramètres du localStorage
    localStorage.removeItem("appSettings")

    toast({
      title: "Paramètres réinitialisés",
      description: "Les paramètres ont été réinitialisés aux valeurs par défaut.",
    })

    setHasUnsavedChanges(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Paramètres</h2>
        <div className="flex space-x-2">
          {hasUnsavedChanges && (
            <Alert variant="default" className="py-2 px-4 flex items-center h-10 bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="ml-2 text-sm text-yellow-700">
                Modifications non enregistrées
              </AlertDescription>
            </Alert>
          )}
          <Button variant="outline" onClick={resetSettings}>
            Réinitialiser
          </Button>
          <Button onClick={saveGeneralSettings} disabled={isSaving}>
            {isSaving ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Enregistrer les modifications
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="backup">Sauvegarde</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres Généraux</CardTitle>
              <CardDescription>Configurez les paramètres généraux de l'application.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Nom de l'entreprise</Label>
                  <Input id="company-name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email de l'administrateur</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone-number">Numéro de téléphone</Label>
                  <Input id="phone-number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo">Logo de l'entreprise</Label>
                <div className="flex items-center space-x-4">
                  {logo ? (
                    <div className="relative w-24 h-24 border rounded-md overflow-hidden">
                      <img src={logo || "/placeholder.svg"} alt="Logo" className="w-full h-full object-contain" />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-0 right-0 w-6 h-6 p-0 rounded-full"
                        onClick={() => setLogo(null)}
                      >
                        ×
                      </Button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 border rounded-md flex items-center justify-center bg-muted">
                      <span className="text-muted-foreground text-sm">Aucun logo</span>
                    </div>
                  )}
                  <Input id="logo" type="file" accept="image/*" onChange={handleLogoUpload} className="max-w-xs" />
                </div>
              </div>

              <Separator />

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="currency">Devise</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="Sélectionnez une devise" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fcfa">FCFA</SelectItem>
                      <SelectItem value="eur">Euro (€)</SelectItem>
                      <SelectItem value="usd">Dollar ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Langue</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger id="language">
                      <SelectValue placeholder="Sélectionnez une langue" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="en">Anglais</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date-format">Format de date</Label>
                  <Select value={dateFormat} onValueChange={setDateFormat}>
                    <SelectTrigger id="date-format">
                      <SelectValue placeholder="Sélectionnez un format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dd/MM/yyyy">JJ/MM/AAAA</SelectItem>
                      <SelectItem value="MM/dd/yyyy">MM/JJ/AAAA</SelectItem>
                      <SelectItem value="yyyy-MM-dd">AAAA-MM-JJ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dark-mode">Mode sombre</Label>
                  <p className="text-sm text-muted-foreground">Activer le mode sombre pour l'interface</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Sun className="h-4 w-4 text-muted-foreground" />
                  <Switch id="dark-mode" checked={darkMode} onCheckedChange={setDarkMode} />
                  <Moon className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Notifications par email</Label>
                  <p className="text-sm text-muted-foreground">
                    Recevoir des notifications par email pour les paiements et les échéances
                  </p>
                </div>
                <Switch id="email-notifications" checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-generate-receipts">Génération automatique des quittances</Label>
                  <p className="text-sm text-muted-foreground">
                    Générer automatiquement les quittances lors de l'enregistrement des paiements
                  </p>
                </div>
                <Switch
                  id="auto-generate-receipts"
                  checked={autoGenerateReceipts}
                  onCheckedChange={setAutoGenerateReceipts}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={saveGeneralSettings} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Enregistrer
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="backup">
          <Card>
            <CardHeader>
              <CardTitle>Sauvegarde et Récupération</CardTitle>
              <CardDescription>Gérez les sauvegardes de vos données.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="backup-frequency">Fréquence de sauvegarde automatique</Label>
                <Select value={backupFrequency} onValueChange={setBackupFrequency}>
                  <SelectTrigger id="backup-frequency">
                    <SelectValue placeholder="Sélectionnez une fréquence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Quotidienne</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                    <SelectItem value="monthly">Mensuelle</SelectItem>
                    <SelectItem value="never">Jamais</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sauvegarde manuelle</Label>
                <div className="flex space-x-2">
                  <Button variant="outline" className="flex-1" onClick={createBackup} disabled={isBackupInProgress}>
                    {isBackupInProgress ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Sauvegarde en cours...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Créer une sauvegarde
                      </>
                    )}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="flex-1">
                        <Upload className="mr-2 h-4 w-4" />
                        Restaurer une sauvegarde
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Restaurer une sauvegarde</AlertDialogTitle>
                        <AlertDialogDescription>
                          Attention, cette action remplacera toutes les données actuelles par celles de la sauvegarde.
                          Assurez-vous d'avoir sauvegardé vos données actuelles avant de continuer.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="py-4">
                        <Select value={selectedBackup || ""} onValueChange={setSelectedBackup}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez une sauvegarde" />
                          </SelectTrigger>
                          <SelectContent>
                            {backups.map((backup) => (
                              <SelectItem key={backup.filename} value={backup.filename}>
                                {backup.filename} ({formatFileSize(backup.size)}) -{" "}
                                {format(new Date(backup.created_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => selectedBackup && restoreBackup(selectedBackup)}
                          disabled={!selectedBackup || isRestoreInProgress}
                        >
                          {isRestoreInProgress ? "Restauration en cours..." : "Restaurer"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Sauvegardes disponibles</Label>
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nom</TableHead>
                          <TableHead>Taille</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {backups.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                              Aucune sauvegarde disponible
                            </TableCell>
                          </TableRow>
                        ) : (
                          backups.map((backup) => (
                            <TableRow key={backup.filename}>
                              <TableCell>{backup.filename}</TableCell>
                              <TableCell>{formatFileSize(backup.size)}</TableCell>
                              <TableCell>
                                {format(new Date(backup.created_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-1">
                                  <Button variant="ghost" size="icon" onClick={() => downloadBackup(backup.filename)}>
                                    <Download className="h-4 w-4" />
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
                                          Cette action ne peut pas être annulée. Cela supprimera définitivement cette
                                          sauvegarde.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => deleteBackup(backup.filename)}>
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
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Information</AlertTitle>
                <AlertDescription>
                  {backups.length > 0
                    ? `La dernière sauvegarde a été effectuée le ${format(new Date(backups[0].created_at), "dd/MM/yyyy à HH:mm", { locale: fr })}.`
                    : "Aucune sauvegarde n'a encore été effectuée."}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Utilisateurs</CardTitle>
              <CardDescription>Gérez les utilisateurs qui ont accès à l'application.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {users.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">Aucun utilisateur trouvé</div>
                ) : (
                  users.map((user, index) => (
                    <div key={user.id}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{user.username}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{user.role === "admin" ? "Administrateur" : "Utilisateur"}</Badge>
                          <Button variant="ghost" size="icon" onClick={() => prepareEditUser(user)}>
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
                                  Cette action ne peut pas être annulée. Cela supprimera définitivement cet utilisateur.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      {index < users.length - 1 && <Separator className="my-4" />}
                    </div>
                  ))
                )}
              </div>
              <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter un utilisateur
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ajouter un nouvel utilisateur</DialogTitle>
                    <DialogDescription>Entrez les informations du nouvel utilisateur.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="new-username">Nom d'utilisateur</Label>
                      <Input
                        id="new-username"
                        value={newUser.username}
                        onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="new-password">Mot de passe</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="new-email">Email</Label>
                      <Input
                        id="new-email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="new-role">Rôle</Label>
                      <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                        <SelectTrigger id="new-role">
                          <SelectValue placeholder="Sélectionnez un rôle" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrateur</SelectItem>
                          <SelectItem value="user">Utilisateur</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleAddUser}>Ajouter</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Modifier l'utilisateur</DialogTitle>
                    <DialogDescription>Modifiez les informations de l'utilisateur.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-username">Nom d'utilisateur</Label>
                      <Input
                        id="edit-username"
                        value={editUser.username}
                        onChange={(e) => setEditUser({ ...editUser, username: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-password">Mot de passe (laisser vide pour ne pas changer)</Label>
                      <Input
                        id="edit-password"
                        type="password"
                        value={editUser.password}
                        onChange={(e) => setEditUser({ ...editUser, password: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-email">Email</Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={editUser.email}
                        onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-role">Rôle</Label>
                      <Select
                        value={editUser.role}
                        onValueChange={(value) => setEditUser({ ...editUser, role: value })}
                      >
                        <SelectTrigger id="edit-role">
                          <SelectValue placeholder="Sélectionnez un rôle" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrateur</SelectItem>
                          <SelectItem value="user">Utilisateur</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleEditUser}>Enregistrer</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

