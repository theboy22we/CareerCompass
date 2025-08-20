import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  BarChart3, 
  Pickaxe, 
  Heart, 
  Bot,
  Settings
} from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

const navItems: NavItem[] = [
  {
    path: '/dashboard',
    label: 'Trading',
    icon: <TrendingUp className="w-4 h-4" />,
  },
  {
    path: '/performance',
    label: 'Performance',
    icon: <BarChart3 className="w-4 h-4" />,
  },
  {
    path: '/mining',
    label: 'Mining',
    icon: <Pickaxe className="w-4 h-4" />,
  },
  {
    path: '/social-impact',
    label: 'Social Impact',
    icon: <Heart className="w-4 h-4" />,
  },
  {
    path: '/ai-manager',
    label: 'AI Manager',
    icon: <Bot className="w-4 h-4" />,
    badge: 'NEW'
  }
];

export function NavigationBar() {
  const [location] = useLocation();

  return (
    <div className="bg-card border-b border-border mobile-compact">
      <div className="flex items-center justify-between">
        {/* Logo/Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-r from-yellow-400 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center relative overflow-hidden">
            <i className="fa-brands fa-bitcoin text-white text-sm sm:text-xl animate-spin" style={{animationDuration: '20s'}}></i>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg sm:text-2xl font-bold text-primary" style={{fontFamily: 'Orbitron', letterSpacing: '2px'}}>
              KLOUD BOT PRO
            </h1>
            <p className="text-xs text-muted-foreground" style={{fontFamily: 'Rajdhani', letterSpacing: '1px'}}>
              Cosmic Trading Intelligence
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          {navItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <Button
                variant={location === item.path ? 'default' : 'ghost'}
                size="sm"
                className={`
                  mobile-compact-card relative
                  ${location === item.path 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-accent hover:text-accent-foreground'
                  }
                `}
              >
                {item.icon}
                <span className="hidden sm:inline ml-2">{item.label}</span>
                {item.badge && (
                  <Badge 
                    variant="secondary" 
                    className="absolute -top-1 -right-1 text-xs px-1 py-0 h-4 min-w-0"
                  >
                    {item.badge}
                  </Badge>
                )}
              </Button>
            </Link>
          ))}
        </div>

        {/* Settings/Profile */}
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" className="mobile-compact-card">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}