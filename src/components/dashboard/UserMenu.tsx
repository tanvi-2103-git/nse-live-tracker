import { useNavigate } from 'react-router-dom';
import { User, LogOut, LogIn, Settings, Briefcase, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface UserMenuProps {
  onOpenPortfolio?: () => void;
}

export function UserMenu({ onOpenPortfolio }: UserMenuProps) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
  };

  if (!user) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => navigate('/auth')}
        className="gap-2"
      >
        <LogIn className="w-4 h-4" />
        <span className="hidden sm:inline">Sign In</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-3 h-3 text-primary" />
          </div>
          <span className="hidden sm:inline max-w-[100px] truncate">
            {user.email?.split('@')[0]}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{user.email?.split('@')[0]}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onOpenPortfolio} className="cursor-pointer">
          <Briefcase className="w-4 h-4 mr-2" />
          My Portfolio
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">
          <Bell className="w-4 h-4 mr-2" />
          Price Alerts
        </DropdownMenuItem>
        <DropdownMenuItem className="text-muted-foreground cursor-pointer">
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-loss cursor-pointer">
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}