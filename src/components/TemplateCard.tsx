import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AppTemplate } from "@/data/appTemplates";
import { App } from "@/types";
import { Check } from "lucide-react";
import { TemplateAppsListModal } from "@/components/TemplateAppsListModal";
import { useState } from "react";

interface TemplateCardProps {
  template: AppTemplate;
  apps: App[];
  isSelected: boolean;
  onClick: () => void;
  onEdit: () => void;
  onViewAllApps: () => void;
  onEditFromView?: () => void;
}

export const TemplateCard = ({ template, apps, isSelected, onClick, onEdit, onViewAllApps }: TemplateCardProps) => {
  const [showAppsList, setShowAppsList] = useState(false);

  return (
    <>
      <TemplateAppsListModal
        open={showAppsList}
        onOpenChange={setShowAppsList}
        templateId={template.id}
        templateName={template.name}
      />
    <Card 
      className={`cursor-pointer transition-all duration-200 border-2 ${
        isSelected 
          ? 'border-[#012D68] bg-blue-50 shadow-lg' 
          : 'border-gray-200 hover:border-[#012D68]/50 hover:shadow-md'
      } h-[400px]`}
      onClick={onClick}
    >
      {/* Navy Blue Header */}
      <div className="bg-[#012D68] rounded-t-lg p-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white text-4xl">{template.name}</h3>
            {template.isDefault && (
              <Badge variant="secondary" className="text-xs bg-white/20 text-white">CLocked Recommended</Badge>
            )}
          </div>
          {isSelected && (
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-[#012D68]" />
            </div>
          )}
        </div>
        <p className="text-gray-200 text-sm">{template.description}</p>
      </div>

      <CardContent className="p-4 flex flex-col h-[calc(100%-88px)]">
        {/* Scrollable Apps List */}
        <div className="flex-1 overflow-y-auto mb-4 max-h-[200px]">
          <div className="space-y-2">
            {apps.map((app) => (
              <div key={app.id} className="flex items-center gap-3 p-2 rounded-lg border border-gray-100">
                <div className="w-8 h-8 rounded-lg overflow-hidden">
                  <img 
                    src={app.icon} 
                    alt={app.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-sm text-gray-700">{app.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="text-[#012D68] border-[#012D68] hover:bg-[#012D68] hover:text-white"
          >
            Edit Template
          </Button>
          
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowAppsList(true);
            }}
            className="bg-[#012D68] hover:bg-[#011f4a] text-white"
          >
            View All Apps
          </Button>
        </div>
      </CardContent>
    </Card>
    </>
  );
};