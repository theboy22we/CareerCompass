import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/theme-provider';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="cosmic-action-btn relative overflow-hidden group transition-all duration-300"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-cyan-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      {theme === 'light' ? (
        <Moon className="h-[1.2rem] w-[1.2rem] text-primary transition-all duration-300 group-hover:rotate-12 group-hover:scale-110" />
      ) : (
        <Sun className="h-[1.2rem] w-[1.2rem] text-accent transition-all duration-300 group-hover:rotate-180 group-hover:scale-110" />
      )}
      
      <span className="sr-only">Toggle theme</span>
      
      {/* Cosmic glow effect */}
      <div className="absolute inset-0 bg-gradient-radial from-accent/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
    </Button>
  );
}