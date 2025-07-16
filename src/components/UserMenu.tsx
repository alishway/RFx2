import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Settings, LogOut } from 'lucide-react';

const UserMenu = () => {
  const { user, profile, signOut } = useAuth();

  if (!user || !profile) return null;

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) {
      return firstName[0].toUpperCase();
    }
    return user.email?.[0]?.toUpperCase() || 'U';
  };

  const getRoleDisplay = (role: string) => {
    const roleMap = {
      'end_user': 'End User',
      'procurement_lead': 'Procurement Lead',
      'approver': 'Approver',
      'admin': 'Admin',
    };
    return roleMap[role as keyof typeof roleMap] || role;
  };

  const getRoleVariant = (role: string) => {
    const variants = {
      'end_user': 'secondary',
      'procurement_lead': 'default',
      'approver': 'outline',
      'admin': 'destructive',
    };
    return variants[role as keyof typeof variants] || 'secondary';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarFallback>
              {getInitials(profile.first_name, profile.last_name)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {profile.first_name && profile.last_name
                ? `${profile.first_name} ${profile.last_name}`
                : 'User'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            <div className="pt-1">
              <Badge variant={getRoleVariant(profile.role) as any} className="text-xs">
                {getRoleDisplay(profile.role)}
              </Badge>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;