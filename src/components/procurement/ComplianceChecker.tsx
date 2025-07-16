import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle, Info, RefreshCw } from "lucide-react";
import type { ComplianceResult, ComplianceCheck } from "@/services/complianceService";

interface ComplianceCheckerProps {
  complianceResult: ComplianceResult;
  onRefresh: () => void;
}

const ComplianceChecker: React.FC<ComplianceCheckerProps> = ({
  complianceResult,
  onRefresh
}) => {
  const getCheckIcon = (check: ComplianceCheck) => {
    if (check.passed) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    
    switch (check.type) {
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getCheckBadgeVariant = (check: ComplianceCheck) => {
    if (check.passed) return "default";
    
    switch (check.type) {
      case "critical":
        return "destructive";
      case "warning":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getOverallStatus = () => {
    if (complianceResult.criticalFlags > 0) {
      return {
        text: "Critical Issues Found",
        color: "text-red-600",
        bgColor: "bg-red-50 border-red-200"
      };
    }
    
    if (complianceResult.overallScore >= 90) {
      return {
        text: "Excellent Compliance",
        color: "text-green-600",
        bgColor: "bg-green-50 border-green-200"
      };
    }
    
    if (complianceResult.overallScore >= 75) {
      return {
        text: "Good Compliance",
        color: "text-blue-600",
        bgColor: "bg-blue-50 border-blue-200"
      };
    }
    
    return {
      text: "Needs Review",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 border-yellow-200"
    };
  };

  const overallStatus = getOverallStatus();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Compliance Analysis</h3>
          <p className="text-muted-foreground">
            Automated compliance check results
          </p>
        </div>
        <Button onClick={onRefresh} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Analysis
        </Button>
      </div>

      {/* Overall Score Card */}
      <Card className={`border ${overallStatus.bgColor}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className={overallStatus.color}>
                {overallStatus.text}
              </CardTitle>
              <CardDescription>
                Overall compliance score: {complianceResult.overallScore}%
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {complianceResult.passedChecks}/{complianceResult.totalChecks}
              </div>
              <div className="text-sm text-muted-foreground">Checks Passed</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={complianceResult.overallScore} className="w-full" />
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold text-red-600">
                  {complianceResult.criticalFlags}
                </div>
                <div className="text-sm text-muted-foreground">Critical Issues</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-yellow-600">
                  {complianceResult.warningFlags}
                </div>
                <div className="text-sm text-muted-foreground">Warnings</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-green-600">
                  {complianceResult.passedChecks}
                </div>
                <div className="text-sm text-muted-foreground">Passed</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Checks */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Compliance Checks</CardTitle>
          <CardDescription>
            Review each compliance requirement and its status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {complianceResult.checks.map((check, index) => (
              <div
                key={check.id}
                className={`p-4 rounded-lg border ${
                  check.passed 
                    ? "bg-green-50 border-green-200" 
                    : check.type === "critical"
                    ? "bg-red-50 border-red-200"
                    : check.type === "warning"
                    ? "bg-yellow-50 border-yellow-200"
                    : "bg-blue-50 border-blue-200"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getCheckIcon(check)}
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{check.name}</h4>
                        <Badge variant={getCheckBadgeVariant(check) as any}>
                          {check.passed ? "Passed" : check.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {check.description}
                      </p>
                      {check.details && (
                        <p className="text-sm mt-2 p-2 bg-white/50 rounded border">
                          <strong>Details:</strong> {check.details}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {complianceResult.criticalFlags > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Action Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">
                This submission has critical compliance issues that must be resolved before proceeding:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {complianceResult.checks
                  .filter(check => check.type === "critical" && !check.passed)
                  .map((check, index) => (
                    <li key={index}>{check.name}</li>
                  ))
                }
              </ul>
              <div className="mt-4">
                <Button variant="destructive" size="sm">
                  Return for Revision
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ComplianceChecker;