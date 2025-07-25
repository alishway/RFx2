import { useAuth } from "@/contexts/AuthContext";
import { EndUserDashboard } from "@/components/dashboard/EndUserDashboard";
import { ProcurementDashboard } from "@/components/dashboard/ProcurementDashboard";
import { ApproverDashboard } from "@/components/dashboard/ApproverDashboard";
import { Loader2 } from "lucide-react";

const Dashboard = () => {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Role-based dashboard rendering
  switch (profile?.role) {
    case 'procurement_lead':
      return <ProcurementDashboard />;
    case 'approver':
    case 'admin':
      return <ApproverDashboard />;
    case 'end_user':
    default:
      return <EndUserDashboard />;
  }
};

export default Dashboard;