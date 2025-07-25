import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { RFxIntakeForm } from "@/components/RFxIntakeForm";
import { ScopeChatProvider } from "@/contexts/ScopeChatContext";
import { IntakeFormService, SavedIntakeForm } from "@/services/intakeFormService";
import { IntakeFormData } from "@/types/intake";

const IntakeForm = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [initialData, setInitialData] = useState<IntakeFormData | null>(null);
  const [loading, setLoading] = useState(false);
  const isNewForm = formId === "new";

  useEffect(() => {
    if (!isNewForm && formId) {
      loadExistingForm(formId);
    }
  }, [formId, isNewForm]);

  const loadExistingForm = async (id: string) => {
    setLoading(true);
    try {
      const { data, error } = await IntakeFormService.loadForm(id);
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      if (data) {
        // Convert SavedIntakeForm to IntakeFormData
        const formData: IntakeFormData = {
          title: data.title,
          background: data.background || "",
          commodityType: data.commodity_type || "",
          estimatedValue: "",
          startDate: data.start_date || "",
          endDate: data.end_date || "",
          attachments: [],
          budgetTolerance: data.budget_tolerance || "moderate",
          deliverables: Array.isArray(data.deliverables) ? data.deliverables : [],
          tasks: Array.isArray(data.tasks) ? data.tasks : [],
          requirements: {
            mandatory: data.requirements?.mandatory || [],
            rated: data.requirements?.rated || [],
            priceWeight: data.requirements?.priceWeight || 30,
          },
        };
        setInitialData(formData);
      }
    } catch (error) {
      console.error("Error loading form:", error);
      toast({
        title: "Error",
        description: "Failed to load form data",
        variant: "destructive",
      });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading form data...</p>
        </div>
      </div>
    );
  }

  return (
    <ScopeChatProvider>
      <div className="min-h-screen bg-background">
        {/* Header with Back Button */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleBackToDashboard}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              <div className="border-l h-6"></div>
              <h1 className="text-xl font-semibold">
                {isNewForm ? "Create New RFx Form" : "Edit RFx Form"}
              </h1>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="max-w-7xl mx-auto p-6">
          <RFxIntakeForm 
            initialData={initialData}
            formId={isNewForm ? undefined : formId}
          />
        </div>
      </div>
    </ScopeChatProvider>
  );
};

export default IntakeForm;