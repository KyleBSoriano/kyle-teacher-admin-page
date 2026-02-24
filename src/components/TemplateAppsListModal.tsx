import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getTemplateApps } from "@/data/appTemplates";
import { mockApps } from "@/data/mockData";
import { X } from "lucide-react";

interface TemplateAppsListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  templateName: string;
}

export const TemplateAppsListModal = ({ 
  open, 
  onOpenChange, 
  templateId, 
  templateName 
}: TemplateAppsListModalProps) => {
  const templateApps = getTemplateApps(templateId, mockApps);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-[#012D68] text-xl font-bold">
            {templateName} - Apps List
          </DialogTitle>
          <DialogDescription className="sr-only">
            List of apps included in the {templateName} template
          </DialogDescription>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-6 w-6 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="mt-4">
          <p className="text-gray-600 mb-4">
            This template includes {templateApps.length} apps:
          </p>
          
          <div className="space-y-2">
            {templateApps.map((app, index) => (
              <div key={app.id} className="flex items-center gap-3 text-gray-700">
                <span className="font-medium w-6">{index + 1}.</span>
                <span>{app.name}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-end mt-6">
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-[#012D68] hover:bg-[#011f4a] text-white"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};