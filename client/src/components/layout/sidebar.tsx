import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  BarChart3, 
  Pickaxe, 
  Heart, 
  Bot,
  Settings,
  Home,
  Wallet,
  Brain,
  Shield,
  Globe,
  Users,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  category: 'main' | 'trading' | 'operations' | 'tools';
}

const navItems: NavItem[] = [
  // Main Dashboards
  {
    path: '/dashboard',
    label: 'Trading Hub',
    icon: <Home className="w-4 h-4" />,
    category: 'main'
  },
  {
    path: '/performance',
    label: 'Performance',
    icon: <BarChart3 className="w-4 h-4" />,
    category: 'main'
  },

  // Trading Tools
  {
    path: '/live-trading',
    label: 'Live Trading',
    icon: <TrendingUp className="w-4 h-4" />,
    category: 'trading'
  },
  {
    path: '/portfolio',
    label: 'Portfolio',
    icon: <Wallet className="w-4 h-4" />,
    category: 'trading'
  },
  {
    path: '/ai-predictions',
    label: 'AI Predictions',
    icon: <Brain className="w-4 h-4" />,
    category: 'trading',
    badge: 'AI'
  },

  // Operations
  {
    path: '/mining',
    label: 'Mining Ops',
    icon: <Pickaxe className="w-4 h-4" />,
    category: 'operations'
  },
  {
    path: '/social-impact',
    label: 'Social Impact',
    icon: <Heart className="w-4 h-4" />,
    category: 'operations'
  },
  {
    path: '/security',
    label: 'Security',
    icon: <Shield className="w-4 h-4" />,
    category: 'operations'
  },

  // Tools & Settings
  {
    path: '/ai-manager',
    label: 'AI Manager',
    icon: <Bot className="w-4 h-4" />,
    category: 'tools',
    badge: 'NEW'
  },
  {
    path: '/global-operations',
    label: 'Global Ops',
    icon: <Globe className="w-4 h-4" />,
    category: 'tools'
  },
  {
    path: '/community',
    label: 'Community',
    icon: <Users className="w-4 h-4" />,
    category: 'tools'
  },
  {
    path: '/settings',
    label: 'Settings',
    icon: <Settings className="w-4 h-4" />,
    category: 'tools'
  }
];

const categoryLabels = {
  main: 'Main Dashboards',
  trading: 'Trading Tools',
  operations: 'Operations',
  tools: 'Tools & Settings'
};

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const groupedItems = navItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);

  return (
    <div className={cn(
      "bg-card border-r border-border transition-all duration-300 flex flex-col",
      collapsed ? "w-16" : "w-64",
      className
    )}>
      {/* Header */}
      <div className="mobile-compact-card border-b border-border">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <i className="fa-brands fa-bitcoin text-white text-sm animate-spin" style={{animationDuration: '20s'}}></i>
              </div>
              <div>
                <h1 className="text-sm font-bold text-primary mobile-header" style={{fontFamily: 'Orbitron'}}>
                  KLOUD BOT PRO
                </h1>
                <p className="text-xs text-muted-foreground mobile-card" style={{fontFamily: 'Rajdhani'}}>
                  Cosmic Trading
                </p>
              </div>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="mobile-compact-card"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <div className="mobile-compact-card mobile-compact-space">
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category}>
              {!collapsed && (
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mobile-card">
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </h3>
              )}
              
              <div className="mobile-compact-space">
                {items.map((item) => (
                  <Link key={item.path} href={item.path}>
                    <Button
                      variant={location === item.path ? 'default' : 'ghost'}
                      size="sm"
                      className={cn(
                        "w-full justify-start relative mobile-compact-card",
                        collapsed && "justify-center px-2",
                        location === item.path 
                          ? 'bg-primary text-primary-foreground' 
                          : 'hover:bg-accent hover:text-accent-foreground'
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      {item.icon}
                      {!collapsed && (
                        <>
                          <span className="ml-2 mobile-card">{item.label}</span>
                          {item.badge && (
                            <Badge 
                              variant="secondary" 
                              className="ml-auto text-xs px-2 py-0 h-5"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </>
                      )}
                      {collapsed && item.badge && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                      )}
                    </Button>
                  </Link>
                ))}
              </div>
              
              {!collapsed && <Separator className="my-4" />}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Connection Status */}
      <div className="mobile-compact-card border-t border-border">
        {!collapsed ? (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground mobile-card">API Status</span>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-yellow-400" />
              <span className="text-xs font-medium text-yellow-400 mobile-card">Mock Data</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-2 h-2 rounded-full bg-yellow-400" />
          </div>
        )}
      </div>
    </div>
  );
}