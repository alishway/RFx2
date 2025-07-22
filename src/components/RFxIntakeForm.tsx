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
import { IntakeFormData } from "@/types/intake";
import { IntakeFormService, SavedIntakeForm } from "@/services/intakeFormService";
import { AISuggestionsDashboard } from "@/components/ai/AISuggestionsDashboard";
import { SuggestionReviewPanel } from "@/components/ai/SuggestionReviewPanel";
import { useToast } from "@/hooks/use-toast";
import { Save, AlertCircle, CheckCircle2, Package, X, Brain } from "lucide-react";

export const RFxIntakeForm = () => {
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
    budgetTolerance: "moderate",
    aiMetadata: {
      suggestionsCount: 0,
      acceptedCount: 0,
      rejectedCount: 0,
      modifiedCount: 0
    }
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
    return () => {
      IntakeFormService.clearAutosave();
    };
  }, []);

  return (
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="chat">Scope Development</TabsTrigger>
          <TabsTrigger value="requirements">Selection Criteria</TabsTrigger>
          <TabsTrigger value="budget">Budget & Timeline</TabsTrigger>
          <TabsTrigger value="attachments">Attachments</TabsTrigger>
          <TabsTrigger value="ai-dashboard" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Dashboard
          </TabsTrigger>
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
              <ScopeChat 
                formData={formData} 
                onUpdate={updateFormData} 
                formId={savedForm?.id}
              />
            </CardContent>
          </Card>

          {/* Deliverables Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Identified Deliverables
                {formData.deliverables && formData.deliverables.length > 0 && (
                  <Badge variant="secondary">{formData.deliverables.length}</Badge>
                )}
              </CardTitle>
              <CardDescription>
                {formData.deliverables && formData.deliverables.length > 0 
                  ? "AI has identified these deliverables from your chat. Click to edit or remove."
                  : "No deliverables identified yet. Use the AI chat above to define your project deliverables."
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {formData.deliverables && formData.deliverables.length > 0 ? (
                <div className="space-y-3">
                  {formData.deliverables.map((deliverable, index) => (
                    <div key={deliverable.id} className="group flex items-center justify-between p-4 border rounded-lg hover:border-primary/50 transition-colors">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{index + 1}. {deliverable.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">{deliverable.description}</div>
                      </div>
                       <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Badge variant={deliverable.selected ? "default" : "secondary"} className="text-xs">
                           {deliverable.selected ? "Included" : "Optional"}
                         </Badge>
                         {/* Show AI badge if it's AI-suggested */}
                         {deliverable.description?.includes('AI-suggested') && (
                           <Badge variant="outline" className="text-xs border-primary text-primary">
                             AI
                           </Badge>
                         )}
                         <Button 
                           variant="ghost" 
                           size="sm"
                           onClick={() => {
                             const updated = formData.deliverables?.filter(d => d.id !== deliverable.id) || [];
                             updateFormData({ deliverables: updated });
                           }}
                           className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                         >
                           <X className="h-3 w-3" />
                         </Button>
                       </div>
                    </div>
                  ))}
                  <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      💡 <strong>Tip:</strong> Continue chatting with AI to refine or add more deliverables. All changes are auto-saved.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm mb-2">No deliverables defined yet</p>
                  <p className="text-xs">Use the AI chat above to describe what you need delivered</p>
                </div>
              )}
            </CardContent>
          </Card>
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

        <TabsContent value="ai-dashboard" className="space-y-4">
          {savedForm?.id ? (
            <AISuggestionsDashboard 
              intakeFormId={savedForm.id}
              onSuggestionUpdate={() => {
                // Refresh form data if needed
                console.log('AI suggestion updated');
              }}
            />
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm mb-2">Save your form first to access AI suggestions</p>
                  <p className="text-xs">AI suggestions will appear here once you've saved your intake form</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};