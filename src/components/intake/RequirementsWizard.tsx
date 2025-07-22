import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Trash2, AlertTriangle, Info, Calculator } from "lucide-react";
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

  // Calculate optimal weight distribution
  const calculateOptimalWeight = (currentRatedCount: number) => {
    const remainingWeight = 100 - formData.requirements.priceWeight;
    const totalRatedCriteria = currentRatedCount + 1; // +1 for the new requirement
    return Math.round(remainingWeight / totalRatedCriteria);
  };

  const addRequirement = () => {
    if (!newRequirement.name || !newRequirement.description) {
      toast({
        title: "Missing Information",
        description: "Please provide both name and description for the requirement.",
        variant: "destructive"
      });
      return;
    }

    const isRated = newRequirement.type === 'rated';
    const optimalWeight = isRated ? calculateOptimalWeight(formData.requirements.rated.length) : undefined;

    const requirement: Requirement = {
      id: Date.now().toString(),
      name: newRequirement.name,
      description: newRequirement.description,
      type: newRequirement.type as 'mandatory' | 'rated',
      weight: optimalWeight,
      scale: isRated ? '0-4' : undefined
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

  // Calculate weight distribution metrics
  const getWeightMetrics = () => {
    const totalRatedWeight = formData.requirements.rated.reduce((sum, req) => sum + (req.weight || 0), 0);
    const totalAllocated = formData.requirements.priceWeight + totalRatedWeight;
    const remaining = 100 - totalAllocated;
    
    return {
      totalRatedWeight,
      totalAllocated,
      remaining,
      isBalanced: remaining === 0,
      isOverAllocated: remaining < 0
    };
  };

  const redistributeWeights = () => {
    const remainingWeight = 100 - formData.requirements.priceWeight;
    const ratedCount = formData.requirements.rated.length;
    
    if (ratedCount === 0) return;
    
    const equalWeight = Math.round(remainingWeight / ratedCount);
    const updatedRequirements = { ...formData.requirements };
    
    updatedRequirements.rated = updatedRequirements.rated.map(req => ({
      ...req,
      weight: equalWeight
    }));
    
    onUpdate({ requirements: updatedRequirements });
    
    toast({
      title: "Weights Redistributed",
      description: `All rated criteria now have ${equalWeight}% weight each.`,
    });
  };

  const checkComplianceIssues = () => {
    const issues: string[] = [];
    const metrics = getWeightMetrics();
    
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

    // Check weight distribution
    if (metrics.isOverAllocated) {
      issues.push(`Total weight exceeds 100% (currently ${metrics.totalAllocated}%)`);
    } else if (!metrics.isBalanced && formData.requirements.rated.length > 0) {
      issues.push(`Unallocated weight: ${metrics.remaining}% - consider redistributing`);
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
            <div className="flex justify-between items-center">
              <CardTitle>Rated Criteria</CardTitle>
              {formData.requirements.rated.length > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={redistributeWeights}
                        className="text-xs"
                      >
                        <Calculator className="w-3 h-3 mr-1" />
                        Auto-Balance
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Distribute weights equally among all rated criteria</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
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
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="secondary" className="cursor-help">
                          Weight: {req.weight}%
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-sm">
                          <p><strong>Evaluation Weight</strong></p>
                          <p>Importance of this criterion in the overall evaluation</p>
                          <p>All rated criteria weights + price weight must = 100%</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="cursor-help">
                          Scale: {req.scale}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-sm">
                          <p><strong>Scoring Scale (0-4 points)</strong></p>
                          <p>0 = Does not meet requirement</p>
                          <p>1 = Minimally meets requirement</p>
                          <p>2 = Adequately meets requirement</p>
                          <p>3 = Exceeds requirement</p>
                          <p>4 = Significantly exceeds requirement</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Weight Distribution
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>All weights must total exactly 100%</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const metrics = getWeightMetrics();
              return (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Price Weight:</span>
                    <span className="font-medium">{formData.requirements.priceWeight}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Rated Criteria:</span>
                    <span className="font-medium">{metrics.totalRatedWeight}%</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Total Allocated:</span>
                    <span className={`font-bold ${
                      metrics.isBalanced ? 'text-green-600' : 
                      metrics.isOverAllocated ? 'text-red-600' : 'text-orange-600'
                    }`}>
                      {metrics.totalAllocated}%
                    </span>
                  </div>
                  {!metrics.isBalanced && (
                    <div className="flex justify-between">
                      <span className="text-sm">
                        {metrics.remaining > 0 ? 'Remaining:' : 'Over-allocated:'}
                      </span>
                      <span className={metrics.remaining > 0 ? 'text-orange-600' : 'text-red-600'}>
                        {Math.abs(metrics.remaining)}%
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};