import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import IntakeForm from "./pages/IntakeForm";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import ProcurementReview from "./pages/ProcurementReview";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/intake-form/:formId" element={
              <ProtectedRoute>
                <IntakeForm />
              </ProtectedRoute>
            } />
            <Route path="/procurement-review" element={
              <ProtectedRoute requiredRole="procurement_lead">
                <ProcurementReview />
              </ProtectedRoute>
            } />
            <Route path="/procurement-review/:formId" element={
              <ProtectedRoute requiredRole="procurement_lead">
                <ProcurementReview />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
