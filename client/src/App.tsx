import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { NavigationBar } from "@/components/layout/navigation-bar";
import TradingDashboard from "@/pages/trading-dashboard";
import PerformanceDashboard from "@/pages/performance-dashboard";
import MiningOperations from "@/pages/mining-operations";
import SocialImpact from "@/pages/social-impact";
import GhostAI from "@/pages/ghost-ai";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <NavigationBar />

      {/* Main Content */}
      <main className="mobile-compact">
        <Switch>
          <Route path="/" component={TradingDashboard} />
          <Route path="/dashboard" component={TradingDashboard} />
          <Route path="/performance" component={PerformanceDashboard} />
          <Route path="/mining" component={MiningOperations} />
          <Route path="/social-impact" component={SocialImpact} />
          <Route path="/ai-manager" component={GhostAI} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="kloud-bot-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div className="min-h-screen bg-background text-foreground" style={{ opacity: 1, transition: 'none' }}>
            <Toaster />
            <Router />
          </div>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
