import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit, Trash2, Plus, Package } from "lucide-react";
import { Deliverable, IntakeFormData } from "@/types/intake";
import { useToast } from "@/hooks/use-toast";

interface DeliverablesManagerProps {
  formData: IntakeFormData;
  onUpdate: (updates: Partial<IntakeFormData>) => void;
}

export const DeliverablesManager: React.FC<DeliverablesManagerProps> = ({ formData, onUpdate }) => {
  const [editingDeliverable, setEditingDeliverable] = useState<Deliverable | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newDeliverable, setNewDeliverable] = useState({
    name: "",
    description: ""
  });
  const { toast } = useToast();

  const handleEdit = (deliverable: Deliverable) => {
    setEditingDeliverable(deliverable);
    setNewDeliverable({
      name: deliverable.name,
      description: deliverable.description
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (deliverableId: string) => {
    const updatedDeliverables = formData.deliverables.filter(d => d.id !== deliverableId);
    onUpdate({ deliverables: updatedDeliverables });
    
    toast({
      title: "Deliverable Removed",
      description: "The deliverable has been removed from your form",
    });
  };

  const handleSave = () => {
    if (!newDeliverable.name.trim()) {
      toast({
        title: "Error",
        description: "Deliverable name is required",
        variant: "destructive"
      });
      return;
    }

    const updatedDeliverables = [...formData.deliverables];
    
    if (editingDeliverable) {
      // Update existing
      const index = updatedDeliverables.findIndex(d => d.id === editingDeliverable.id);
      if (index !== -1) {
        updatedDeliverables[index] = {
          ...editingDeliverable,
          name: newDeliverable.name.trim(),
          description: newDeliverable.description.trim()
        };
      }
    } else {
      // Add new
      const newDel: Deliverable = {
        id: Math.random().toString(36).substr(2, 9),
        name: newDeliverable.name.trim(),
        description: newDeliverable.description.trim(),
        selected: true
      };
      updatedDeliverables.push(newDel);
    }

    onUpdate({ deliverables: updatedDeliverables });
    
    toast({
      title: editingDeliverable ? "Deliverable Updated" : "Deliverable Added",
      description: `"${newDeliverable.name}" has been ${editingDeliverable ? 'updated' : 'added to your form'}`,
    });

    setIsDialogOpen(false);
    setEditingDeliverable(null);
    setNewDeliverable({ name: "", description: "" });
  };

  const handleToggleSelection = (deliverableId: string) => {
    const updatedDeliverables = formData.deliverables.map(d => 
      d.id === deliverableId ? { ...d, selected: !d.selected } : d
    );
    onUpdate({ deliverables: updatedDeliverables });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Identified Deliverables
            </CardTitle>
            <CardDescription>
              Manage and edit your procurement deliverables. You have full control over AI suggestions.
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingDeliverable(null);
                setNewDeliverable({ name: "", description: "" });
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Deliverable
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingDeliverable ? 'Edit Deliverable' : 'Add New Deliverable'}
                </DialogTitle>
                <DialogDescription>
                  {editingDeliverable 
                    ? 'Make changes to the deliverable details below.'
                    : 'Enter the details for your new deliverable.'
                  }
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Name *</label>
                  <Input
                    value={newDeliverable.name}
                    onChange={(e) => setNewDeliverable(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Data Analysis Report"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={newDeliverable.description}
                    onChange={(e) => setNewDeliverable(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Provide detailed description of this deliverable..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    {editingDeliverable ? 'Update' : 'Add'} Deliverable
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {formData.deliverables.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No deliverables identified yet</p>
            <p className="text-sm text-muted-foreground">
              Use the AI chat above to identify deliverables, or add them manually.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {formData.deliverables.map((deliverable, index) => (
              <div key={deliverable.id} className="flex items-start justify-between p-4 border rounded-lg bg-card">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{index + 1}. {deliverable.name}</span>
                    <Badge 
                      variant={deliverable.selected ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => handleToggleSelection(deliverable.id)}
                    >
                      {deliverable.selected ? "Included" : "Optional"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {deliverable.description || "No description provided"}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(deliverable)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(deliverable.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};