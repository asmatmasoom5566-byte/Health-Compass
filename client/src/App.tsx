import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { ThemeProvider } from "./components/ui/theme-provider";
import { useEffect } from "react";
import { SettingsProvider } from "./contexts/SettingsContext";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { DefiningSymptomsEnsurer } from "./utils/defining-symptoms-ensurer";
import { DefiningSymptomsManager } from './utils/defining-symptoms-manager';
import Landing from "./pages/Landing";
import History from "./pages/History";
import Prescription from "./pages/Prescription";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyAccount from "./pages/VerifyAccount";
import AdminDashboard from "./pages/AdminDashboard";
import PharmacologyDashboard from "./pages/PharmacologyDashboard";
import TestPage from "./pages/TestPage";
import RegesterPage from "./pages/RegesterPage";
import AllVisitsPage from "./pages/AllVisitsPage";
import SymptomDatabasePage from "./pages/SymptomDatabasePage";
import NotFound from "./pages/not-found";

function Router() {
  return (
    <Switch>
      {/* Public Routes - No authentication required */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/verify" component={VerifyAccount} />
      
      {/* Protected Routes - Require authentication */}
      <Route path="/">
        <ProtectedRoute>
          <Landing />
        </ProtectedRoute>
      </Route>
      <Route path="/test">
        <ProtectedRoute>
          <TestPage />
        </ProtectedRoute>
      </Route>
      <Route path="/prescription">
        <ProtectedRoute>
          <Prescription />
        </ProtectedRoute>
      </Route>
      <Route path="/history">
        <ProtectedRoute>
          <History />
        </ProtectedRoute>
      </Route>
      <Route path="/pharmacology">
        <ProtectedRoute>
          <PharmacologyDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/regester">
        <ProtectedRoute>
          <RegesterPage />
        </ProtectedRoute>
      </Route>
      <Route path="/all-visits">
        <ProtectedRoute>
          <AllVisitsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/symptom-database">
        <ProtectedRoute>
          <SymptomDatabasePage />
        </ProtectedRoute>
      </Route>
      
      {/* Admin Routes - Require admin role */}
      <Route path="/admin">
        <ProtectedRoute requireAdmin={true}>
          <AdminDashboard />
        </ProtectedRoute>
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // No auto-updates - preserve conditions exactly as they are

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <AuthProvider>
        <SettingsProvider>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider defaultTheme="light" storageKey="health-compass-theme">
              <TooltipProvider>
                <Toaster />
                <Router />
              </TooltipProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </SettingsProvider>
      </AuthProvider>
    </div>
  );
}

export default App;