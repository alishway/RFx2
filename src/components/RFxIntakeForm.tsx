import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScopeChat } from "./intake/ScopeChat";
import { RequirementsWizard } from "./intake/RequirementsWizard";
import { BudgetTolerance } from "./intake/BudgetTolerance";
import { IntakeFormData } from "@/types/intake";

export const RFxIntakeForm = () => {
  const [formData, setFormData] = useState<IntakeFormData>({
    background: "",
    commodityType: "",
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

  const updateFormData = (updates: Partial<IntakeFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="max-w-6xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chat">Scope Development</TabsTrigger>
          <TabsTrigger value="requirements">Selection Criteria</TabsTrigger>
          <TabsTrigger value="budget">Budget & Timeline</TabsTrigger>
        </TabsList>
        
        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI-Assisted Scope Development</CardTitle>
              <CardDescription>
                Chat with our AI assistant to develop your procurement scope. 
                We'll guide you through defining your requirements and ensure compliance with Canadian procurement regulations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScopeChat formData={formData} onUpdate={updateFormData} />
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
      </Tabs>
    </div>
  );
};