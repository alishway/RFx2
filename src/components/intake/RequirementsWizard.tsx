import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { IntakeFormData, Requirement } from "@/types/intake";
import { useToast } from "@/hooks/use-toast";

interface RequirementsWizardProps {
  formData: IntakeFormData;
  onUpdate: (updates: Partial<IntakeFormData>) => void;
}

export const RequirementsWizard = ({ formData, onUpdate }: RequirementsWizardProps) => {
  const [newRequirement, setNewRequirement] = useState<Partial<Requirement>>({
    name: "",
    description: "",
    type: "mandatory"
  });
  const { toast } = useToast();

  const addRequirement = () => {
    if (!newRequirement.name || !newRequirement.description) {
      toast({
        title: "Missing Information",
        description: "Please provide both name and description for the requirement.",
        variant: "destructive"
      });
      return;
    }

    const requirement: Requirement = {
      id: Date.now().toString(),
      name: newRequirement.name,
      description: newRequirement.description,
      type: newRequirement.type as 'mandatory' | 'rated',
      weight: newRequirement.type === 'rated' ? 10 : undefined,
      scale: newRequirement.type === 'rated' ? '0-4' : undefined
    };

    const updatedRequirements = { ...formData.requirements };
    
    if (requirement.type === 'mandatory') {
      updatedRequirements.mandatory = [...updatedRequirements.mandatory, requirement];
    } else {
      updatedRequirements.rated = [...updatedRequirements.rated, requirement];
    }

    onUpdate({ requirements: updatedRequirements });
    setNewRequirement({ name: "", description: "", type: "mandatory" });
  };

  const removeRequirement = (id: string, type: 'mandatory' | 'rated') => {
    const updatedRequirements = { ...formData.requirements };
    
    if (type === 'mandatory') {
      updatedRequirements.mandatory = updatedRequirements.mandatory.filter(req => req.id !== id);
    } else {
      updatedRequirements.rated = updatedRequirements.rated.filter(req => req.id !== id);
    }

    onUpdate({ requirements: updatedRequirements });
  };

  const updatePriceWeight = (weight: number[]) => {
    const updatedRequirements = { ...formData.requirements };
    updatedRequirements.priceWeight = weight[0];
    onUpdate({ requirements: updatedRequirements });
  };

  const checkComplianceIssues = () => {
    const issues: string[] = [];
    
    // Check for excessive experience requirements
    [...formData.requirements.mandatory, ...formData.requirements.rated].forEach(req => {
      if (req.description.match(/\d{2,}\s*years?\s*(of\s*)?experience/i)) {
        const years = req.description.match(/(\d{2,})\s*years?/i)?.[1];
        if (years && parseInt(years) > 20) {
          issues.push(`"${req.name}" requires ${years} years experience - consider if this is reasonable`);
        }
      }
    });

    // Check price weight
    if (formData.requirements.priceWeight < 40) {
      issues.push("Price weight below 40% may not comply with procurement policies");
    }

    return issues;
  };

  const complianceIssues = checkComplianceIssues();

  return (
    <div className="space-y-6">
      {complianceIssues.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Compliance Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {complianceIssues.map((issue, index) => (
                <li key={index} className="text-sm">{issue}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Mandatory Criteria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.requirements.mandatory.map((req) => (
              <div key={req.id} className="p-3 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">{req.name}</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRequirement(req.id, 'mandatory')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">{req.description}</p>
                <Badge variant="outline" className="mt-2">Pass/Fail</Badge>
              </div>
            ))}
            
            {formData.requirements.mandatory.length === 0 && (
              <p className="text-muted-foreground text-center py-4">No mandatory criteria added yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rated Criteria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.requirements.rated.map((req) => (
              <div key={req.id} className="p-3 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">{req.name}</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRequirement(req.id, 'rated')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{req.description}</p>
                <div className="flex gap-2">
                  <Badge variant="secondary">Weight: {req.weight}%</Badge>
                  <Badge variant="outline">Scale: {req.scale}</Badge>
                </div>
              </div>
            ))}
            
            {formData.requirements.rated.length === 0 && (
              <p className="text-muted-foreground text-center py-4">No rated criteria added yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Add New Requirement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="req-name">Requirement Name</Label>
              <Input
                id="req-name"
                value={newRequirement.name || ""}
                onChange={(e) => setNewRequirement(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Relevant Experience"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="req-type">Type</Label>
              <Select
                value={newRequirement.type || "mandatory"}
                onValueChange={(value) => setNewRequirement(prev => ({ ...prev, type: value as 'mandatory' | 'rated' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mandatory">Mandatory (Pass/Fail)</SelectItem>
                  <SelectItem value="rated">Rated (Scored)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="req-description">Description</Label>
            <Input
              id="req-description"
              value={newRequirement.description || ""}
              onChange={(e) => setNewRequirement(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what you're looking for..."
            />
          </div>

          <Button onClick={addRequirement} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Requirement
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Price Weight</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Price Weight: {formData.requirements.priceWeight}%</Label>
            <Slider
              value={[formData.requirements.priceWeight]}
              onValueChange={updatePriceWeight}
              max={100}
              min={30}
              step={5}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Minimum 40% recommended for most procurements
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};