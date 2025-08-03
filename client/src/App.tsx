import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { Navigation } from "@/components/navigation";
import Dashboard from "@/pages/dashboard";
import GhostAI from "@/pages/ghost-ai";
import MiningRigs from "@/pages/mining-rigs";
import CustomPools from "@/pages/custom-pools";
import CryptoPortfolio from "@/pages/crypto-portfolio";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="space-y-6">
      {/* Header with Navigation */}
      <header className="flex items-center justify-between p-4 border-b">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            KLOUD BOT PRO
          </h1>
          <p className="text-sm text-muted-foreground">
            Advanced AI-Powered Crypto Trading Ecosystem
          </p>
        </div>
        <Navigation />
      </header>

      {/* Main Content */}
      <main className="px-4">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/ghost-ai" component={GhostAI} />
          <Route path="/mining-rigs" component={MiningRigs} />
          <Route path="/custom-pools" component={CustomPools} />
          <Route path="/crypto-portfolio" component={CryptoPortfolio} />
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
