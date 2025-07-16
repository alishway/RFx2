import React, { useState } from "react";
import ProcurementReviewDashboard from "@/components/procurement/ProcurementReviewDashboard";
import FormReviewDetail from "@/components/procurement/FormReviewDetail";

const ProcurementReview: React.FC = () => {
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);

  const handleSelectForm = (formId: string) => {
    setSelectedFormId(formId);
  };

  const handleBack = () => {
    setSelectedFormId(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {selectedFormId ? (
        <FormReviewDetail formId={selectedFormId} onBack={handleBack} />
      ) : (
        <ProcurementReviewDashboard onSelectForm={handleSelectForm} />
      )}
    </div>
  );
};

export default ProcurementReview;