import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "@/components/DashboardLayout";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { useAuth } from "@/_core/hooks/useAuth";
import LoginPage from "@/pages/LoginPage";
import LeadsPage from "@/pages/LeadsPage";
import LeadDetailPage from "@/pages/LeadDetailPage";
import UsersPage from "@/pages/UsersPage";
import DashboardPage from "@/pages/DashboardPage";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

function Router() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/login" component={LoginPage} />

      {/* Root - redirect to login if not authenticated, else to dashboard */}
      <Route path="/">
        {isAuthenticated ? <DashboardPage /> : <LoginPage />}
      </Route>

      {/* Protected Routes */}
      {isAuthenticated && (
        <>
          <Route path="/leads" component={LeadsPage} />
          <Route path="/leads/:id" component={LeadDetailPage} />
          <Route path="/users" component={UsersPage} />
        </>
      )}

      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
