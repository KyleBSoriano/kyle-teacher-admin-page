import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calculator, Phone, Settings, Search, CheckCircle } from "lucide-react";
import { AppIcon } from "@/utils/appIcons";
import { useTutorial } from "@/context/TutorialContext";
import { useNavigate } from "react-router-dom";
import { useAppTemplates } from "@/hooks/useAppTemplates";
import { useAppContext } from "@/context/AppContext";
import { TemplateAppsListModal } from "@/components/TemplateAppsListModal";
import { EditTemplateModal } from "@/components/EditTemplateModal";
import { toast } from "@/hooks/use-toast";

interface ChooseTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  period?: string; // Optional period to filter templates
}

const ChooseTemplateDialog = ({ open, onOpenChange, classId, period }: ChooseTemplateDialogProps) => {
  const { templates, loading } = useAppTemplates(period);
  const { apps, updateClass } = useAppContext();
  const [selectedTemplate, setSelectedTemplate] = useState<string>("default-1");
  const [showAppsList, setShowAppsList] = useState(false);
  const [selectedTemplateForList, setSelectedTemplateForList] = useState<string>("");
  const [showEditTemplate, setShowEditTemplate] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState<any>(null);
  const { isActive, getCurrentStep, endTutorial } = useTutorial();
  const navigate = useNavigate();
  
  // Filter templates: exclude class-specific templates, only show reusable templates
  const displayTemplates = templates.filter(template => !template.class_id);

  const handleViewAllApps = (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTemplateForList(templateId);
    setShowAppsList(true);
  };

  const handleEditTemplate = (template: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setTemplateToEdit(template);
    setShowEditTemplate(true);
  };

  const handleSaveTemplate = (updatedTemplate: any) => {
    console.log("Template saved:", updatedTemplate);
    // The template will be automatically refreshed through the useAppTemplates hook
    setSelectedTemplate(updatedTemplate.id);
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
  };

  const handleCreateWithTemplate = async () => {
    console.log("Creating class with template:", selectedTemplate);
    
    // Update the class's active_template_id in Supabase
    if (classId && selectedTemplate && selectedTemplate !== "default-custom") {
      try {
        await updateClass(classId, { activeTemplateId: selectedTemplate });
        toast({
          title: "Template Activated",
          description: "The template has been activated for this class.",
        });
      } catch (error) {
        console.error('Error activating template:', error);
        toast({
          title: "Error",
          description: "Failed to activate template. Please try again.",
          variant: "destructive"
        });
      }
    }
    
    // If tutorial is active and we're on the choose-app-template step, end the tutorial and navigate to classes
    if (isActive && getCurrentStep()?.id === 'choose-app-template') {
      endTutorial();
      onOpenChange(false);
      // Navigate to classes page after closing dialog
      setTimeout(() => {
        navigate('/classes');
      }, 100);
      return;
    }
    
    // Always navigate to classes page after creating
    onOpenChange(false);
    setTimeout(() => {
      navigate('/classes');
    }, 100);
  };

  return (
    <>
      <TemplateAppsListModal
        open={showAppsList}
        onOpenChange={setShowAppsList}
        templateId={selectedTemplateForList}
        templateName={templates.find(t => t.id === selectedTemplateForList)?.name || ""}
      />
      
      <EditTemplateModal
        open={showEditTemplate}
        onOpenChange={setShowEditTemplate}
        template={templateToEdit}
        onSave={handleSaveTemplate}
      />
      
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl bg-white" data-tutorial="app-template-dialog">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-[#012D68]">
              Choose App Template
            </DialogTitle>
          </DialogHeader>
        
        <div className="space-y-6">
          <p className="text-gray-600 text-sm">
            Select a template to quickly set up allowed apps for your class. You can customize it later.
          </p>
          
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading templates...</div>
          ) : (
          <div className="grid grid-cols-2 gap-6">
            {displayTemplates.map((template) => {
              // Get apps for this template
              const templateApps = apps.filter(app => template.apps.includes(app.id));
              const displayApps = templateApps.slice(0, 4);
              const remainingCount = Math.max(0, templateApps.length - 4);
              
              return (
              <Card 
                key={template.id}
                className={`cursor-pointer border-2 transition-all duration-200 rounded-xl ${
                  selectedTemplate === template.id 
                    ? "border-[#012D68] ring-2 ring-[#012D68]/20" 
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => handleTemplateSelect(template.id)}
              >
                <CardContent className="p-6">
                  {/* Title, badge and radio button */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-[#012D68] text-xl">
                        {template.name}
                      </h3>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedTemplate === template.id 
                        ? "border-[#012D68] bg-[#012D68]" 
                        : "border-gray-300"
                    }`}>
                      {selectedTemplate === template.id && (
                        <CheckCircle className="w-4 h-4 text-white fill-current" />
                      )}
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-6">
                    {template.description}
                  </p>
                  
                  {/* App icons - horizontal layout matching reference */}
                  <div className="mb-6">
                    <div className="flex items-start gap-6">
                      {displayApps.map((app, index) => (
                        <div key={index} className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 rounded-xl shadow-sm border border-gray-200 flex items-center justify-center bg-gray-50">
                            <AppIcon appId={app.id} className="w-6 h-6 text-gray-600" />
                          </div>
                          <span className="text-xs text-gray-700 text-center font-medium">{app.name}</span>
                        </div>
                      ))}
                      {remainingCount > 0 && (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 rounded-xl shadow-sm border border-gray-200 flex items-center justify-center bg-gray-50">
                            <span className="text-xs font-bold text-gray-600">+{remainingCount}</span>
                          </div>
                          <span className="text-xs text-gray-700 text-center font-medium">more</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex-1 text-sm border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
                      onClick={(e) => handleEditTemplate(template, e)}
                    >
                      Edit Template
                    </Button>
                    <Button 
                      size="sm"
                      className="flex-1 bg-[#012D68] hover:bg-[#011f4a] text-white text-sm font-medium"
                      onClick={(e) => handleViewAllApps(template.id, e)}
                    >
                      View All Apps
                    </Button>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
          )}
          
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="border-gray-300 text-gray-600"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateWithTemplate}
              className="bg-[#012D68] hover:bg-[#011f4a] text-white"
            >
              Create Class with Template
            </Button>
          </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChooseTemplateDialog;