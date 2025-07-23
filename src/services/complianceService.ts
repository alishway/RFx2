import type { Database } from "@/integrations/supabase/types";

type IntakeForm = Database["public"]["Tables"]["intake_forms"]["Row"];

export interface ComplianceCheck {
  id: string;
  name: string;
  description: string;
  type: "critical" | "warning" | "info";
  passed: boolean;
  details?: string;
}

export interface ComplianceResult {
  overallScore: number;
  totalChecks: number;
  passedChecks: number;
  criticalFlags: number;
  warningFlags: number;
  checks: ComplianceCheck[];
}

export class ComplianceService {
  static async analyzeCompliance(intakeForm: IntakeForm): Promise<ComplianceResult> {
    const checks: ComplianceCheck[] = [];

    // Timeline validation
    if (intakeForm.start_date && intakeForm.end_date) {
      const startDate = new Date(intakeForm.start_date);
      const endDate = new Date(intakeForm.end_date);
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      checks.push({
        id: "timeline_minimum",
        name: "Minimum Timeline Requirements",
        description: "Project timeline meets minimum procurement posting requirements",
        type: daysDiff < 15 ? "critical" : "info",
        passed: daysDiff >= 15,
        details: `Project duration: ${daysDiff} days. Minimum 15 days required for most procurements.`
      });
    }

    // Budget validation - commented out since estimated_value column was removed
    // TODO: Re-implement when budget fields are added back to the form
    const estimatedBudget = 0; // Placeholder
    if (estimatedBudget > 0) {
      const thresholdCAD = 25000; // CFTA threshold example
      
      checks.push({
        id: "trade_agreement_threshold",
        name: "Trade Agreement Threshold",
        description: "Project value and trade agreement obligations",
        type: estimatedBudget > thresholdCAD ? "warning" : "info",
        passed: true,
        details: estimatedBudget > thresholdCAD 
          ? `Value: $${estimatedBudget.toLocaleString()} CAD - Subject to CFTA/CETA obligations`
          : `Value: $${estimatedBudget.toLocaleString()} CAD - Below major trade agreement thresholds`
      });
    }

    // Requirements validation
    if (intakeForm.requirements) {
      const requirements = intakeForm.requirements as any;
      const mandatoryCount = requirements?.mandatory?.length || 0;
      const ratedCount = requirements?.rated?.length || 0;
      
      checks.push({
        id: "evaluation_criteria_balance",
        name: "Evaluation Criteria Balance",
        description: "Appropriate balance between mandatory and rated criteria",
        type: mandatoryCount > ratedCount * 2 ? "warning" : "info",
        passed: mandatoryCount <= ratedCount * 2,
        details: `${mandatoryCount} mandatory, ${ratedCount} rated criteria. Avoid excessive mandatory requirements.`
      });
    }

    // Commodity type validation
    checks.push({
      id: "commodity_classification",
      name: "Commodity Classification",
      description: "Service/goods classification is specified",
      type: !intakeForm.commodity_type ? "warning" : "info",
      passed: !!intakeForm.commodity_type,
      details: intakeForm.commodity_type 
        ? `Classified as: ${intakeForm.commodity_type}`
        : "Commodity type not specified - may affect procurement method selection"
    });

    // Content analysis for restrictive language
    const combinedContent = [
      intakeForm.background,
      intakeForm.title,
      JSON.stringify(intakeForm.deliverables || {}),
      JSON.stringify(intakeForm.requirements || {})
    ].join(" ").toLowerCase();

    const restrictivePatterns = [
      { pattern: /must have \d+ years/, flag: "Experience requirements may be restrictive" },
      { pattern: /only.*certified by/, flag: "Certification requirements may favor specific vendors" },
      { pattern: /proprietary|brand name/, flag: "Possible brand name specification detected" },
      { pattern: /pre-qualified|preferred vendor/, flag: "Vendor preference language detected" }
    ];

    restrictivePatterns.forEach((pattern, index) => {
      const detected = pattern.pattern.test(combinedContent);
      if (detected) {
        checks.push({
          id: `restrictive_language_${index}`,
          name: "Restrictive Language Check",
          description: "Content review for potentially restrictive requirements",
          type: "critical",
          passed: false,
          details: pattern.flag
        });
      }
    });

    // Calculate scores
    const totalChecks = checks.length;
    const passedChecks = checks.filter(c => c.passed).length;
    const criticalFlags = checks.filter(c => c.type === "critical" && !c.passed).length;
    const warningFlags = checks.filter(c => c.type === "warning" && !c.passed).length;
    const overallScore = totalChecks > 0 ? (passedChecks / totalChecks) * 100 : 100;

    return {
      overallScore: Math.round(overallScore * 100) / 100,
      totalChecks,
      passedChecks,
      criticalFlags,
      warningFlags,
      checks
    };
  }

  static getComplianceStatus(result: ComplianceResult): {
    status: "excellent" | "good" | "needs_review" | "critical";
    color: string;
    message: string;
  } {
    if (result.criticalFlags > 0) {
      return {
        status: "critical",
        color: "destructive",
        message: `${result.criticalFlags} critical issues require immediate attention`
      };
    }
    
    if (result.overallScore >= 90) {
      return {
        status: "excellent",
        color: "default",
        message: "Excellent compliance - ready for procurement"
      };
    }
    
    if (result.overallScore >= 75) {
      return {
        status: "good",
        color: "secondary",
        message: "Good compliance with minor recommendations"
      };
    }
    
    return {
      status: "needs_review",
      color: "outline",
      message: "Requires review before proceeding"
    };
  }
}