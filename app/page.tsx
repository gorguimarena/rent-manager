"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Home, Users, CreditCard, FileText, BarChart3, SettingsIcon, LogOut } from "lucide-react"
import Dashboard from "@/components/dashboard"
import Properties from "@/components/properties"
import Tenants from "@/components/tenants"
import Payments from "@/components/payments"
import Reports from "@/components/reports"
import Settings from "@/components/settings"
import Expenses from "@/components/expenses"
import { useAuth } from "@/contexts/auth-context"

export default function RentalManagement() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-6">
        <h1 className="text-xl font-semibold">Gestion de Loyers</h1>
        <div className="flex items-center gap-4">
          {user && (
            <div className="text-sm text-muted-foreground">
              Connecté en tant que <span className="font-medium text-foreground">{user.username}</span>
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={logout} title="Déconnexion">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar Navigation */}
        <aside className="hidden w-64 border-r bg-muted/40 lg:block">
          <nav className="flex flex-col gap-2 p-4">
            <Button
              variant={activeTab === "dashboard" ? "default" : "ghost"}
              className="justify-start"
              onClick={() => setActiveTab("dashboard")}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Tableau de bord
            </Button>
            <Button
              variant={activeTab === "properties" ? "default" : "ghost"}
              className="justify-start"
              onClick={() => setActiveTab("properties")}
            >
              <Home className="mr-2 h-4 w-4" />
              Maisons
            </Button>
            <Button
              variant={activeTab === "tenants" ? "default" : "ghost"}
              className="justify-start"
              onClick={() => setActiveTab("tenants")}
            >
              <Users className="mr-2 h-4 w-4" />
              Locataires
            </Button>
            <Button
              variant={activeTab === "payments" ? "default" : "ghost"}
              className="justify-start"
              onClick={() => setActiveTab("payments")}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Paiements
            </Button>
            <Button
              variant={activeTab === "expenses" ? "default" : "ghost"}
              className="justify-start"
              onClick={() => setActiveTab("expenses")}
            >
              <FileText className="mr-2 h-4 w-4" />
              Dépenses
            </Button>
            <Button
              variant={activeTab === "reports" ? "default" : "ghost"}
              className="justify-start"
              onClick={() => setActiveTab("reports")}
            >
              <FileText className="mr-2 h-4 w-4" />
              Rapports
            </Button>
            <Button
              variant={activeTab === "settings" ? "default" : "ghost"}
              className="justify-start"
              onClick={() => setActiveTab("settings")}
            >
              <SettingsIcon className="mr-2 h-4 w-4" />
              Paramètres
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          {activeTab === "dashboard" && <Dashboard />}
          {activeTab === "properties" && <Properties />}
          {activeTab === "tenants" && <Tenants />}
          {activeTab === "payments" && <Payments />}
          {activeTab === "expenses" && <Expenses />}
          {activeTab === "reports" && <Reports />}
          {activeTab === "settings" && <Settings />}
        </main>
      </div>
    </div>
  )
}

