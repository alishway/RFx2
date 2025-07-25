import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScopeChat } from "./intake/ScopeChat";
import { RequirementsWizard } from "./intake/RequirementsWizard";
import { BudgetTolerance } from "./intake/BudgetTolerance";
import { FileUpload } from "./intake/FileUpload";
import { DeliverablesManager } from "./intake/DeliverablesManager";
import { IntakeFormData } from "@/types/intake";
import { IntakeFormService, SavedIntakeForm } from "@/services/intakeFormService";
import { useToast } from "@/hooks/use-toast";
import { Save, AlertCircle, CheckCircle2 } from "lucide-react";
import { ScopeChatProvider } from "@/contexts/ScopeChatContext";

interface RFxIntakeFormProps {
  initialData?: IntakeFormData | null;
  formId?: string;
  savedFormData?: SavedIntakeForm | null;
}

export const RFxIntakeForm = ({ initialData, formId: existingFormId, savedFormData }: RFxIntakeFormProps) => {
  const [formData, setFormData] = useState<IntakeFormData>({
    title: "",
    background: "",
    commodityType: "",
    estimatedValue: "",
    deliverables: [],
    tasks: [],
    startDate: "",
    endDate: "",
    attachments: [],
    requirements: {
      mandatory: [],
      rated: [],
      priceWeight: 40
    },
    budgetTolerance: "moderate"
  });

  const [activeTab, setActiveTab] = useState("chat");
  const [savedForm, setSavedForm] = useState<SavedIntakeForm | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { toast } = useToast();

  const updateFormData = (updates: Partial<IntakeFormData>) => {
    const newFormData = { ...formData, ...updates };
    setFormData(newFormData);
    
    // Validate form and schedule autosave
    const validation = IntakeFormService.validateForm(newFormData);
    setValidationErrors(validation.errors);
    
    if (validation.isValid) {
      IntakeFormService.scheduleAutosave(newFormData, savedForm?.id, (saved) => {
        setSavedForm(saved);
        toast({
          title: "Auto-saved",
          description: "Form saved automatically",
        });
      });
    }
  };

  const handleSaveForm = async () => {
    setIsSaving(true);
    const validation = IntakeFormService.validateForm(formData);
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      toast({
        title: "Validation Error",
        description: "Please fix the form errors before saving",
        variant: "destructive",
      });
      setIsSaving(false);
      return;
    }

    const result = await IntakeFormService.saveForm(formData, savedForm?.id);
    
    if (result.error) {
      toast({
        title: "Save Failed",
        description: result.error,
        variant: "destructive",
      });
    } else if (result.data) {
      setSavedForm(result.data);
      toast({
        title: "Form Saved",
        description: "Your intake form has been saved successfully",
      });
    }
    
    setIsSaving(false);
  };

  useEffect(() => {
    // Set initial data if provided
    if (initialData) {
      setFormData(initialData);
    }
    
    return () => {
      IntakeFormService.clearAutosave();
    };
  }, [initialData]);

  useEffect(() => {
    // Set saved form data if provided
    if (savedFormData) {
      setSavedForm(savedFormData);
    } else if (existingFormId) {
      setSavedForm({ id: existingFormId } as SavedIntakeForm);
    }
  }, [savedFormData, existingFormId]);

  return (
    <ScopeChatProvider>
      <div className="max-w-6xl mx-auto space-y-6">
      {/* Form Header with Save Status */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">RFx Intake Form</h1>
          <p className="text-muted-foreground">
            {savedForm ? `Last saved: ${new Date(savedForm.updated_at).toLocaleString()}` : 'Not saved yet'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {validationErrors.length > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {validationErrors.length} error{validationErrors.length > 1 ? 's' : ''}
            </Badge>
          )}
          {savedForm && validationErrors.length === 0 && (
            <Badge variant="default" className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Valid
            </Badge>
          )}
          <Button 
            onClick={handleSaveForm} 
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Form'}
          </Button>
        </div>
      </div>

      {/* Validation Errors Display */}
      {validationErrors.length > 0 && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <h3 className="font-medium text-destructive mb-2">Please fix the following errors:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-destructive">{error}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="chat">Scope Development</TabsTrigger>
          <TabsTrigger value="requirements">Selection Criteria</TabsTrigger>
          <TabsTrigger value="budget">Budget & Timeline</TabsTrigger>
          <TabsTrigger value="attachments">Attachments</TabsTrigger>
        </TabsList>
        
        <TabsContent value="chat" className="space-y-4">
          {/* Basic Project Information */}
          <Card>
            <CardHeader>
              <CardTitle>Project Definition</CardTitle>
              <CardDescription>
                Define your project's core identity and business context
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Project Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="e.g., AI-Powered Patient Flow Analytics Platform"
                  value={formData.title || ""}
                  onChange={(e) => updateFormData({ title: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="commodityType">
                  Commodity Type <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="commodityType"
                  type="text"
                  placeholder="e.g., Professional Services"
                  value={formData.commodityType}
                  onChange={(e) => updateFormData({ commodityType: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="background">
                  Background & Problem Statement <span className="text-destructive">*</span>
                </Label>
                <textarea
                  id="background"
                  placeholder="Describe the business problem, current state, and desired outcomes..."
                  value={formData.background}
                  onChange={(e) => updateFormData({ background: e.target.value })}
                  rows={4}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </CardContent>
          </Card>

          {/* AI-Assisted Scope Development */}
          <Card>
            <CardHeader>
              <CardTitle>AI-Assisted Scope Development</CardTitle>
              <CardDescription>
                Collaborate with AI to refine requirements, identify stakeholders, and ensure procurement compliance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScopeChat formData={formData} onUpdate={updateFormData} />
            </CardContent>
          </Card>

          {/* Enhanced Deliverables Manager */}
          <DeliverablesManager formData={formData} onUpdate={updateFormData} />
        </TabsContent>

        <TabsContent value="requirements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Selection Requirements Wizard</CardTitle>
              <CardDescription>
                Define your mandatory and rated evaluation criteria. Our system will ensure compliance with fairness and openness requirements.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RequirementsWizard formData={formData} onUpdate={updateFormData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budget" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Budget Tolerance & Timeline</CardTitle>
              <CardDescription>
                Set your budget parameters and timeline. We'll validate against trade agreement thresholds and posting requirements.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BudgetTolerance formData={formData} onUpdate={updateFormData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attachments" className="space-y-4">
          <FileUpload 
            formId={savedForm?.id}
            attachments={formData.attachments}
            onAttachmentsChange={(files) => updateFormData({ attachments: files })}
          />
        </TabsContent>
      </Tabs>
    </div>
    </ScopeChatProvider>
  );
};