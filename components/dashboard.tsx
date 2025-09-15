"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import {
  AlertCircle,
  Home,
  Users,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  Download,
  Printer,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

// Interfaces pour les types
interface DashboardData {
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  occupancyRate: number
  propertyCount: number
  unitCount: number
  tenantCount: number
  revenueData: { month: string; revenue: number; expenses: number }[]
  expensesByCategory: { name: string; value: number }[]
  overduePayments: { tenant: string; property: string; amount: number; daysLate: number }[]
  occupancyData: { month: string; rate: number }[]
}

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    occupancyRate: 0,
    propertyCount: 0,
    unitCount: 0,
    tenantCount: 0,
    revenueData: [],
    expensesByCategory: [],
    overduePayments: [],
    occupancyData: [],
  })

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState("year")
  const [year, setYear] = useState(new Date().getFullYear().toString())

  const { toast } = useToast()
  const router = useRouter()

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

  useEffect(() => {
    fetchDashboardData()
  }, [period, year])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Récupérer les données du tableau de bord
      const response = await fetch(`/api/dashboard?period=${period}&year=${year}`)

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des données du tableau de bord")
      }

      const data = await response.json()
      setDashboardData(data)
    } catch (error: any) {
      console.error("Erreur:", error)
      setError(error.message || "Une erreur est survenue")

      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les données du tableau de bord. Affichage des données de démonstration.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatMoney = (amount: number) => {
    return Math.round(amount).toLocaleString() + " FCFA"
  }

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return 0
    return Math.round(((current - previous) / previous) * 100)
  }

  // Calculer la variation par rapport au mois précédent
  const currentMonthIndex = new Date().getMonth()
  const revenueChange =
    dashboardData.revenueData.length >= 2 && currentMonthIndex > 0
      ? calculatePercentageChange(
          dashboardData.revenueData[currentMonthIndex].revenue,
          dashboardData.revenueData[currentMonthIndex - 1].revenue,
        )
      : 0

  const expensesChange =
    dashboardData.revenueData.length >= 2 && currentMonthIndex > 0
      ? calculatePercentageChange(
          dashboardData.revenueData[currentMonthIndex].expenses,
          dashboardData.revenueData[currentMonthIndex - 1].expenses,
        )
      : 0

  // Fonction pour exporter les données en CSV
  const exportToCSV = (data: any[], filename: string) => {
    // Convertir les données en format CSV
    const headers = Object.keys(data[0]).join(",")
    const rows = data.map((row) => Object.values(row).join(","))
    const csv = [headers, ...rows].join("\n")

    // Créer un blob et un lien de téléchargement
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Fonction pour imprimer les données
  const printData = (title: string) => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .summary { margin-top: 20px; }
            .summary div { margin-bottom: 10px; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <div class="summary">
            <div>Revenus totaux: ${formatMoney(dashboardData.totalRevenue)}</div>
            <div>Dépenses totales: ${formatMoney(dashboardData.totalExpenses)}</div>
            <div>Bénéfice net: ${formatMoney(dashboardData.netProfit)}</div>
            <div>Taux d'occupation: ${dashboardData.occupancyRate}%</div>
          </div>
          <button onclick="window.print()">Imprimer</button>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  // Fonction pour naviguer vers les rapports détaillés
  const navigateToReports = (tab: string) => {
    router.push(`/reports?tab=${tab}`)
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
        <h2 className="text-3xl font-bold tracking-tight">Tableau de Bord</h2>
        <div className="flex items-center gap-2">
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Année" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
            </SelectContent>
          </Select>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sélectionner une période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="year">Année complète</SelectItem>
              <SelectItem value="quarter">Trimestre actuel</SelectItem>
              <SelectItem value="month">Mois actuel</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenus Mensuels</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(dashboardData.totalRevenue)}</div>
            <div className="flex items-center mt-1">
              {revenueChange >= 0 ? (
                <div className="flex items-center text-green-500 text-xs">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  <span>+{revenueChange}% par rapport au mois dernier</span>
                </div>
              ) : (
                <div className="flex items-center text-red-500 text-xs">
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                  <span>{revenueChange}% par rapport au mois dernier</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Dépenses Mensuelles</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(dashboardData.totalExpenses)}</div>
            <div className="flex items-center mt-1">
              {expensesChange <= 0 ? (
                <div className="flex items-center text-green-500 text-xs">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  <span>{expensesChange}% par rapport au mois dernier</span>
                </div>
              ) : (
                <div className="flex items-center text-red-500 text-xs">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span>+{expensesChange}% par rapport au mois dernier</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Propriétés</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.propertyCount}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.unitCount} logements ({dashboardData.tenantCount} occupés)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taux d'Occupation</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.occupancyRate}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div className="bg-primary h-2.5 rounded-full" style={{ width: `${dashboardData.occupancyRate}%` }}></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="income">Revenus</TabsTrigger>
          <TabsTrigger value="expenses">Dépenses</TabsTrigger>
          <TabsTrigger value="occupancy">Occupation</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader className="flex justify-between items-center">
                <CardTitle>Revenus vs Dépenses</CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportToCSV(dashboardData.revenueData, "revenus-depenses.csv")}
                  >
                    <Download className="h-4 w-4 mr-1" /> CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => printData("Revenus vs Dépenses")}>
                    <Printer className="h-4 w-4 mr-1" /> Imprimer
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pl-2">
                <ChartContainer
                  config={{
                    revenue: {
                      label: "Revenus",
                      color: "hsl(var(--chart-1))",
                    },
                    expenses: {
                      label: "Dépenses",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="aspect-[4/3]"
                >
                  <BarChart data={dashboardData.revenueData} margin={{ top: 10, right: 10, left: 10, bottom: 24 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={80}
                      tickFormatter={(value) => `${value.toLocaleString()} FCFA`}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
                    <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
              <CardFooter>
                <Button variant="link" onClick={() => navigateToReports("overview")}>
                  Voir le rapport détaillé
                </Button>
              </CardFooter>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Paiements en retard</CardTitle>
                <CardDescription>{dashboardData.overduePayments.length} paiements en retard</CardDescription>
              </CardHeader>
              <CardContent>
                {dashboardData.overduePayments.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.overduePayments.map((payment, i) => (
                      <div key={i} className="flex items-center">
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">{payment.tenant}</p>
                          <p className="text-sm text-muted-foreground">{payment.property}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{payment.amount.toLocaleString()} FCFA</p>
                          <p className="text-sm text-muted-foreground">Retard: {payment.daysLate} jours</p>
                        </div>
                      </div>
                    ))}
                    <Button className="w-full" variant="outline" onClick={() => router.push("/payments?filter=unpaid")}>
                      Voir tous les paiements en retard
                    </Button>
                  </div>
                ) : (
                  <div className="flex h-[200px] items-center justify-center">
                    <p className="text-sm text-muted-foreground">Aucun paiement en retard</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mt-4">
            <Card>
              <CardHeader className="flex justify-between items-center">
                <CardTitle>Répartition des Dépenses</CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportToCSV(dashboardData.expensesByCategory, "depenses-categories.csv")}
                  >
                    <Download className="h-4 w-4 mr-1" /> CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dashboardData.expensesByCategory}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {dashboardData.expensesByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${Number(value).toLocaleString()} FCFA`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="link" onClick={() => navigateToReports("expenses")}>
                  Voir le rapport détaillé
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="flex justify-between items-center">
                <CardTitle>Taux d'Occupation</CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportToCSV(dashboardData.occupancyData, "occupation.csv")}
                  >
                    <Download className="h-4 w-4 mr-1" /> CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dashboardData.occupancyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                      <Tooltip formatter={(value) => [`${value}%`, "Taux d'occupation"]} />
                      <Line type="monotone" dataKey="rate" stroke="#8884d8" activeDot={{ r: 8 }} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="link" onClick={() => navigateToReports("occupancy")}>
                  Voir le rapport détaillé
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="income">
          <Card>
            <CardHeader className="flex justify-between items-center">
              <div>
                <CardTitle>Revenus Mensuels</CardTitle>
                <CardDescription>Vue détaillée des revenus pour {year}</CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportToCSV(dashboardData.revenueData, "revenus.csv")}
                >
                  <Download className="h-4 w-4 mr-1" /> CSV
                </Button>
                <Button variant="outline" size="sm" onClick={() => printData("Revenus Mensuels")}>
                  <Printer className="h-4 w-4 mr-1" /> Imprimer
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData.revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `${value.toLocaleString()} FCFA`} />
                    <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} FCFA`, "Revenus"]} />
                    <Bar dataKey="revenue" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenus Totaux</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatMoney(dashboardData.totalRevenue)}</div>
                <p className="text-sm text-muted-foreground mt-2">Revenus totaux pour la période sélectionnée</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bénéfice Net</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatMoney(dashboardData.netProfit)}</div>
                <p className="text-sm text-muted-foreground mt-2">Revenus moins dépenses</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Marge Bénéficiaire</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {dashboardData.totalRevenue > 0
                    ? Math.round((dashboardData.netProfit / dashboardData.totalRevenue) * 100)
                    : 0}
                  %
                </div>
                <p className="text-sm text-muted-foreground mt-2">Pourcentage du bénéfice par rapport aux revenus</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="expenses">
          <Card>
            <CardHeader className="flex justify-between items-center">
              <div>
                <CardTitle>Dépenses par Catégorie</CardTitle>
                <CardDescription>Répartition des dépenses pour {year}</CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportToCSV(dashboardData.expensesByCategory, "depenses-categories.csv")}
                >
                  <Download className="h-4 w-4 mr-1" /> CSV
                </Button>
                <Button variant="outline" size="sm" onClick={() => printData("Dépenses par Catégorie")}>
                  <Printer className="h-4 w-4 mr-1" /> Imprimer
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dashboardData.expensesByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value, percent }) =>
                        `${name}: ${Number(value).toLocaleString()} FCFA (${(percent * 100).toFixed(0)}%)`
                      }
                    >
                      {dashboardData.expensesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${Number(value).toLocaleString()} FCFA`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Dépenses Mensuelles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboardData.revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `${value.toLocaleString()} FCFA`} />
                      <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} FCFA`, "Dépenses"]} />
                      <Bar dataKey="expenses" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Résumé des Dépenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.expensesByCategory.map((category, index) => (
                    <div key={index} className="flex items-center">
                      <div
                        className="w-4 h-4 rounded-full mr-2"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{category.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{category.value.toLocaleString()} FCFA</p>
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 mt-2 border-t">
                    <div className="flex items-center font-bold">
                      <div className="flex-1">
                        <p>Total</p>
                      </div>
                      <div className="text-right">
                        <p>{dashboardData.totalExpenses.toLocaleString()} FCFA</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="occupancy">
          <Card>
            <CardHeader className="flex justify-between items-center">
              <div>
                <CardTitle>Taux d'Occupation Mensuel</CardTitle>
                <CardDescription>Évolution du taux d'occupation pour {year}</CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportToCSV(dashboardData.occupancyData, "occupation.csv")}
                >
                  <Download className="h-4 w-4 mr-1" /> CSV
                </Button>
                <Button variant="outline" size="sm" onClick={() => printData("Taux d'Occupation")}>
                  <Printer className="h-4 w-4 mr-1" /> Imprimer
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dashboardData.occupancyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                    <Tooltip formatter={(value) => [`${value}%`, "Taux d'occupation"]} />
                    <Line type="monotone" dataKey="rate" stroke="#8884d8" activeDot={{ r: 8 }} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Taux d'Occupation Actuel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{dashboardData.occupancyRate}%</div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
                  <div
                    className="bg-primary h-2.5 rounded-full"
                    style={{ width: `${dashboardData.occupancyRate}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Logements Occupés</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {dashboardData.tenantCount} / {dashboardData.unitCount}
                </div>
                <p className="text-sm text-muted-foreground mt-2">Nombre de logements occupés sur le total</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenus Potentiels</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {formatMoney(
                    dashboardData.occupancyRate > 0
                      ? Math.round((dashboardData.totalRevenue / dashboardData.occupancyRate) * 100)
                      : 0,
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-2">Revenus si tous les logements étaient occupés</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Rappel</AlertTitle>
        <AlertDescription>N'oubliez pas de générer les quittances de loyer pour le mois en cours.</AlertDescription>
      </Alert>
    </div>
  )
}

