import { RFxIntakeForm } from "@/components/RFxIntakeForm";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">RFx Dev Assist</h1>
          <p className="text-xl text-muted-foreground">AI-Powered Procurement Assistance for Canadian Public Sector</p>
        </div>
        <RFxIntakeForm />
      </div>
    </div>
  );
};

export default Index;
