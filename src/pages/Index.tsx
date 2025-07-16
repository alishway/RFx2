import { useAuth } from "@/contexts/AuthContext";
import { RFxIntakeForm } from "@/components/RFxIntakeForm";
import UserMenu from "@/components/UserMenu";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  const { user, profile } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">RFx Dev Assist</h1>
            {profile && (
              <span className="text-sm text-muted-foreground">
                Welcome back, {profile.first_name || 'User'}!
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <UserMenu />
            ) : (
              <Button asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Procurement Request Form</h2>
          <p className="text-lg text-muted-foreground mb-6">
            AI-Powered Procurement Assistance for Canadian Public Sector
          </p>
        </div>
        
        <RFxIntakeForm />
      </div>
    </div>
  );
};

export default Index;
