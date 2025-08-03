import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Ghost, 
  Pickaxe, 
  Database, 
  Wallet,
  Home,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Portfolio', href: '/crypto-portfolio', icon: Wallet },
  { name: 'Ghost AI', href: '/ghost-ai', icon: Ghost },
  { name: 'Mining Rigs', href: '/mining-rigs', icon: Pickaxe },
  { name: 'Custom Pools', href: '/custom-pools', icon: Database },
];

export function Navigation() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center space-x-1 bg-muted/50 p-1 rounded-lg">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant={location === item.href ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  'flex items-center gap-2 px-3 py-2',
                  location === item.href && 'bg-primary text-primary-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2"
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>

        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 z-50 bg-background border rounded-lg shadow-lg mt-2 p-2">
            <div className="flex flex-col space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant={location === item.href ? 'default' : 'ghost'}
                      size="sm"
                      className={cn(
                        'w-full justify-start gap-2 px-3 py-2',
                        location === item.href && 'bg-primary text-primary-foreground'
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Icon className="h-4 w-4" />
                      {item.name}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}