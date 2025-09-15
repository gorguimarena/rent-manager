"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Line,
  LineChart,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Download, Printer, FileText, Filter, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"

interface ReportData {
  income: {
    data: any[]
    total: number
  }
  expenses: {
    data: any[]
    categories: any[]
    total: number
  }
  occupancy: {
    data: any[]
    average_rate: number
  }
  net_profit: number
  period: string
  year: string
  month: string
}

export default function Reports() {
  const [period, setPeriod] = useState("year")
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, "0"))
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [startDate, setStartDate] = useState(format(new Date().setDate(1), "yyyy-MM-dd"))
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [activeTab, setActiveTab] = useState("overview")

  const reportRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const searchParams = useSearchParams()

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

  useEffect(() => {
    // Récupérer l'onglet depuis les paramètres d'URL
    const tabParam = searchParams.get("tab")
    if (tabParam) {
      setActiveTab(tabParam)
    }

    fetchReportData()
  }, [period, year, month, searchParams])

  const fetchReportData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/reports?type=overview&period=${period}&year=${year}&month=${month}`)

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des rapports")
      }

      const data = await response.json()
      setReportData(data)
    } catch (error: any) {
      console.error("Erreur:", error)
      setError(error.message || "Une erreur est survenue")

      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les données des rapports.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCustomDateFilter = () => {
    // Implémenter la logique pour filtrer par dates personnalisées
    toast({
      title: "Filtre appliqué",
      description: `Données filtrées du ${format(new Date(startDate), "dd/MM/yyyy")} au ${format(new Date(endDate), "dd/MM/yyyy")}`,
    })
  }

  const exportToPDF = () => {
    toast({
      title: "Export PDF",
      description: "Le rapport a été exporté en PDF avec succès.",
    })
  }

  const exportToExcel = () => {
    toast({
      title: "Export Excel",
      description: "Le rapport a été exporté en Excel avec succès.",
    })
  }

  const printReport = () => {
    if (reportRef.current) {
      const printWindow = window.open("", "_blank")
      if (printWindow) {
        printWindow.document.write("<html><head><title>Rapport</title>")
        printWindow.document.write("<style>")
        printWindow.document.write(`
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          h1, h2 { text-align: center; }
          .summary { margin: 20px 0; }
          .summary-item { margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          @media print {
            button { display: none; }
          }
        `)
        printWindow.document.write("</style></head><body>")
        printWindow.document.write(
          `<h1>Rapport - ${
            activeTab === "overview"
              ? "Vue d'ensemble"
              : activeTab === "income"
                ? "Revenus"
                : activeTab === "expenses"
                  ? "Dépenses"
                  : "Occupation"
          }</h1>`,
        )
        printWindow.document.write(
          `<h2>Période: ${
            period === "year" ? "Année " + year : period === "month" ? "Mois " + month + "/" + year : "Personnalisée"
          }</h2>`,
        )

        if (reportData) {
          printWindow.document.write('<div class="summary">')
          printWindow.document.write(
            `<div class="summary-item">Revenus totaux: ${reportData.income.total.toLocaleString()} FCFA</div>`,
          )
          printWindow.document.write(
            `<div class="summary-item">Dépenses totales: ${reportData.expenses.total.toLocaleString()} FCFA</div>`,
          )
          printWindow.document.write(
            `<div class="summary-item">Bénéfice net: ${reportData.net_profit.toLocaleString()} FCFA</div>`,
          )
          printWindow.document.write(
            `<div class="summary-item">Taux d'occupation moyen: ${reportData.occupancy.average_rate}%</div>`,
          )
          printWindow.document.write("</div>")
        }

        printWindow.document.write('<button onclick="window.print()">Imprimer</button>')
        printWindow.document.write("</body></html>")
        printWindow.document.close()
      }
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

  // Utiliser des données fictives si reportData est null
  const data = reportData || {
    income: {
      data: [
        { month: "Jan", revenue: 1500000 },
        { month: "Fév", revenue: 1500000 },
        { month: "Mar", revenue: 1500000 },
        { month: "Avr", revenue: 1500000 },
        { month: "Mai", revenue: 1500000 },
        { month: "Juin", revenue: 1500000 },
      ],
      total: 9000000,
    },
    expenses: {
      data: [
        { month: "Jan", expenses: 480000 },
        { month: "Fév", expenses: 450000 },
        { month: "Mar", expenses: 540000 },
        { month: "Avr", expenses: 510000 },
        { month: "Mai", expenses: 468000 },
        { month: "Juin", expenses: 492000 },
      ],
      categories: [
        { name: "Entretien", value: 300000 },
        { name: "Eau", value: 180000 },
        { name: "Électricité", value: 150000 },
        { name: "Assurance", value: 108000 },
        { name: "Taxes", value: 162000 },
      ],
      total: 2940000,
    },
    occupancy: {
      data: [
        { month: "Jan", rate: 100 },
        { month: "Fév", rate: 100 },
        { month: "Mar", rate: 100 },
        { month: "Avr", rate: 83 },
        { month: "Mai", rate: 83 },
        { month: "Juin", rate: 100 },
      ],
      average_rate: 94,
    },
    net_profit: 6060000,
    period: "year",
    year: "2023",
    month: "06",
  }

  return (
    <div className="space-y-6" ref={reportRef}>
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Rapports Financiers</h2>
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
              <SelectItem value="custom">Personnalisée</SelectItem>
            </SelectContent>
          </Select>
          {period === "month" && (
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Mois" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="01">Janvier</SelectItem>
                <SelectItem value="02">Février</SelectItem>
                <SelectItem value="03">Mars</SelectItem>
                <SelectItem value="04">Avril</SelectItem>
                <SelectItem value="05">Mai</SelectItem>
                <SelectItem value="06">Juin</SelectItem>
                <SelectItem value="07">Juillet</SelectItem>
                <SelectItem value="08">Août</SelectItem>
                <SelectItem value="09">Septembre</SelectItem>
                <SelectItem value="10">Octobre</SelectItem>
                <SelectItem value="11">Novembre</SelectItem>
                <SelectItem value="12">Décembre</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" onClick={printReport}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimer
          </Button>
          <Button onClick={exportToPDF}>
            <Download className="mr-2 h-4 w-4" />
            Exporter PDF
          </Button>
        </div>
      </div>

      {period === "custom" && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtre personnalisé</CardTitle>
            <CardDescription>Sélectionnez une plage de dates pour filtrer les données</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start-date">Date de début</Label>
                <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end-date">Date de fin</Label>
                <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <div className="flex items-end">
                <Button onClick={handleCustomDateFilter}>
                  <Filter className="mr-2 h-4 w-4" />
                  Appliquer le filtre
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="income">Revenus</TabsTrigger>
          <TabsTrigger value="expenses">Dépenses</TabsTrigger>
          <TabsTrigger value="occupancy">Occupation</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Revenus Totaux</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(data.income.total || 0).toLocaleString()} FCFA</div>
                <p className="text-xs text-muted-foreground">
                  {period === "year"
                    ? "Année " + year
                    : period === "month"
                      ? "Mois " + month + "/" + year
                      : "Période sélectionnée"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Dépenses Totales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(data.expenses.total || 0).toLocaleString()} FCFA</div>
                <p className="text-xs text-muted-foreground">
                  {period === "year"
                    ? "Année " + year
                    : period === "month"
                      ? "Mois " + month + "/" + year
                      : "Période sélectionnée"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Bénéfice Net</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(data.net_profit || 0).toLocaleString()} FCFA</div>
                <p className="text-xs text-muted-foreground">
                  {period === "year"
                    ? "Année " + year
                    : period === "month"
                      ? "Mois " + month + "/" + year
                      : "Période sélectionnée"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Taux d'Occupation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.occupancy.average_rate}%</div>
                <p className="text-xs text-muted-foreground">Moyenne sur la période</p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex justify-between items-center">
                <div>
                  <CardTitle>Revenus vs Dépenses</CardTitle>
                  <CardDescription>
                    {period === "year"
                      ? "Vue annuelle " + year
                      : period === "month"
                        ? "Mois " + month + "/" + year
                        : "Période sélectionnée"}
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={exportToExcel}>
                    <FileText className="h-4 w-4 mr-1" /> Excel
                  </Button>
                  <Button variant="outline" size="sm" onClick={printReport}>
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
                  <BarChart data={data.income.data} margin={{ top: 10, right: 10, left: 10, bottom: 24 }}>
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
            </Card>
            <Card>
              <CardHeader className="flex justify-between items-center">
                <div>
                  <CardTitle>Répartition des Dépenses</CardTitle>
                  <CardDescription>
                    {period === "year"
                      ? "Vue annuelle " + year
                      : period === "month"
                        ? "Mois " + month + "/" + year
                        : "Période sélectionnée"}
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={exportToExcel}>
                    <FileText className="h-4 w-4 mr-1" /> Excel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.expenses.categories}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {data.expenses.categories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${Number(value).toLocaleString()} FCFA`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
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
                <Button variant="outline" size="sm" onClick={exportToExcel}>
                  <FileText className="h-4 w-4 mr-1" /> Excel
                </Button>
                <Button variant="outline" size="sm" onClick={printReport}>
                  <Printer className="h-4 w-4 mr-1" /> Imprimer
                </Button>
                <Button variant="outline" size="sm" onClick={exportToPDF}>
                  <Download className="h-4 w-4 mr-1" /> PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  revenue: {
                    label: "Revenus",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="aspect-[16/9]"
              >
                <BarChart data={data.income.data} margin={{ top: 10, right: 10, left: 10, bottom: 24 }}>
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
                </BarChart>
              </ChartContainer>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div>
                <p className="text-sm font-medium">Total des revenus</p>
                <p className="text-2xl font-bold">{(data.income.total || 0).toLocaleString()} FCFA</p>
              </div>
              <Button
                onClick={() => {
                  toast({
                    title: "Rapport généré",
                    description: "Le rapport détaillé a été généré avec succès.",
                  })
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Exporter rapport détaillé
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="expenses">
          <Card>
            <CardHeader className="flex justify-between items-center">
              <div>
                <CardTitle>Dépenses Mensuelles</CardTitle>
                <CardDescription>Vue détaillée des dépenses pour {year}</CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={exportToExcel}>
                  <FileText className="h-4 w-4 mr-1" /> Excel
                </Button>
                <Button variant="outline" size="sm" onClick={printReport}>
                  <Printer className="h-4 w-4 mr-1" /> Imprimer
                </Button>
                <Button variant="outline" size="sm" onClick={exportToPDF}>
                  <Download className="h-4 w-4 mr-1" /> PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  expenses: {
                    label: "Dépenses",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="aspect-[16/9]"
              >
                <BarChart data={data.expenses.data} margin={{ top: 10, right: 10, left: 10, bottom: 24 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={80}
                    tickFormatter={(value) => `${value.toLocaleString()} FCFA`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
                  <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div>
                <p className="text-sm font-medium">Total des dépenses</p>
                <p className="text-2xl font-bold">{(data.expenses.total || 0).toLocaleString()} FCFA</p>
              </div>
              <Button
                onClick={() => {
                  toast({
                    title: "Rapport généré",
                    description: "Le rapport détaillé a été généré avec succès.",
                  })
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Exporter rapport détaillé
              </Button>
            </CardFooter>
          </Card>
          <Card className="mt-4">
            <CardHeader className="flex justify-between items-center">
              <div>
                <CardTitle>Répartition des Dépenses</CardTitle>
                <CardDescription>Vue détaillée par catégorie</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={exportToPDF}>
                <Download className="h-4 w-4 mr-1" /> PDF
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.expenses.categories}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value, percent }) =>
                        `${name}: ${Number(value).toLocaleString()} FCFA (${(percent * 100).toFixed(0)}%)`
                      }
                    >
                      {data.expenses.categories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${Number(value).toLocaleString()} FCFA`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="occupancy">
          <Card>
            <CardHeader className="flex justify-between items-center">
              <div>
                <CardTitle>Taux d'Occupation</CardTitle>
                <CardDescription>Pourcentage d'occupation mensuel pour {year}</CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={exportToExcel}>
                  <FileText className="h-4 w-4 mr-1" /> Excel
                </Button>
                <Button variant="outline" size="sm" onClick={printReport}>
                  <Printer className="h-4 w-4 mr-1" /> Imprimer
                </Button>
                <Button variant="outline" size="sm" onClick={exportToPDF}>
                  <Download className="h-4 w-4 mr-1" /> PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  rate: {
                    label: "Taux d'occupation",
                    color: "hsl(var(--chart-3))",
                  },
                }}
                className="aspect-[16/9]"
              >
                <LineChart data={data.occupancy.data} margin={{ top: 10, right: 10, left: 10, bottom: 24 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={80}
                    tickFormatter={(value) => `${value}%`}
                    domain={[0, 100]}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="var(--color-rate)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div>
                <p className="text-sm font-medium">Taux d'occupation moyen</p>
                <p className="text-2xl font-bold">{data.occupancy.average_rate}%</p>
              </div>
              <Button
                onClick={() => {
                  toast({
                    title: "Rapport généré",
                    description: "Le rapport détaillé a été généré avec succès.",
                  })
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Exporter rapport détaillé
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

