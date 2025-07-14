import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, AlertTriangle, Info } from "lucide-react";
import { format } from "date-fns";
import { IntakeFormData } from "@/types/intake";

interface BudgetToleranceProps {
  formData: IntakeFormData;
  onUpdate: (updates: Partial<IntakeFormData>) => void;
}

export const BudgetTolerance = ({ formData, onUpdate }: BudgetToleranceProps) => {
  const [estimatedValue, setEstimatedValue] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const budgetLabels = {
    sensitive: "Budget Sensitive",
    moderate: "Moderate Flexibility",
    flexible: "Budget Flexible"
  };

  const getBudgetDescription = (tolerance: string) => {
    switch (tolerance) {
      case 'sensitive':
        return "Strict budget constraints, minimal overruns acceptable";
      case 'moderate':
        return "Some flexibility for value-added services";
      case 'flexible':
        return "Open to higher costs for exceptional value";
      default:
        return "";
    }
  };

  const getTradeAgreementInfo = (value: number | null) => {
    if (!value) return null;

    const thresholds = [
      { name: "BPS Threshold", value: 121200, description: "Broader Public Sector competitive threshold" },
      { name: "CFTA Threshold", value: 430000, description: "Canadian Free Trade Agreement threshold" },
      { name: "CETA Threshold", value: 8800000, description: "Canada-EU Trade Agreement threshold" }
    ];

    const applicable = thresholds.filter(t => value >= t.value);
    return applicable.length > 0 ? applicable : null;
  };

  const calculateMinimumPostingDays = (value: number | null) => {
    if (!value) return null;
    
    if (value >= 8800000) return 35; // CETA
    if (value >= 430000) return 30;  // CFTA
    if (value >= 121200) return 30;  // BPS
    return null;
  };

  const tradeAgreementInfo = getTradeAgreementInfo(estimatedValue);
  const minimumPostingDays = calculateMinimumPostingDays(estimatedValue);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Budget Tolerance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Budget Flexibility: {budgetLabels[formData.budgetTolerance]}</Label>
            <Slider
              value={[formData.budgetTolerance === 'sensitive' ? 0 : formData.budgetTolerance === 'moderate' ? 50 : 100]}
              onValueChange={(value) => {
                const tolerance = value[0] <= 33 ? 'sensitive' : value[0] <= 66 ? 'moderate' : 'flexible';
                onUpdate({ budgetTolerance: tolerance });
              }}
              max={100}
              step={1}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              {getBudgetDescription(formData.budgetTolerance)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Estimated Value</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="estimated-value">Estimated Contract Value (CAD)</Label>
            <Input
              id="estimated-value"
              type="number"
              placeholder="e.g., 150000"
              value={estimatedValue || ""}
              onChange={(e) => setEstimatedValue(e.target.value ? parseFloat(e.target.value) : null)}
            />
          </div>

          {tradeAgreementInfo && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-500" />
                <span className="font-medium">Applicable Trade Agreements</span>
              </div>
              <div className="space-y-2">
                {tradeAgreementInfo.map((agreement, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                    <span className="text-sm font-medium">{agreement.name}</span>
                    <Badge variant="secondary">${agreement.value.toLocaleString()}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {minimumPostingDays && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <span className="font-medium text-yellow-800">Minimum Posting Period</span>
              </div>
              <p className="text-sm text-yellow-700">
                This contract value requires a minimum {minimumPostingDays}-day posting period
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Start Date</CardTitle>
          </CardHeader>
          <CardContent>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Select start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => {
                    setStartDate(date);
                    onUpdate({ startDate: date?.toISOString() || "" });
                  }}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>End Date</CardTitle>
          </CardHeader>
          <CardContent>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "Select end date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => {
                    setEndDate(date);
                    onUpdate({ endDate: date?.toISOString() || "" });
                  }}
                  disabled={(date) => date < (startDate || new Date())}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};