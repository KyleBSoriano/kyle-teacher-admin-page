import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppContext } from "@/context/AppContext";
import { Class } from "@/types";
import { Plus, X } from "lucide-react";
import { FormEvent, useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { useAppTemplates } from "@/hooks/useAppTemplates";
import { AppPickerDialog } from "@/components/AppPickerDialog";
import { useSchoolAllowedApps } from "@/hooks/useSchoolAllowedApps";

interface CreateClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClassCreated?: (newClass: Class) => void;
}

export const CreateClassDialog = ({ open, onOpenChange, onClassCreated }: CreateClassDialogProps) => {
  const { addClass, updateClass } = useAppContext();
  const { saveTemplate } = useAppTemplates();
  const { allowedAppKeys } = useSchoolAllowedApps();
  const [showAppPickerDialog, setShowAppPickerDialog] = useState(false);
  const [createdClass, setCreatedClass] = useState<Class | null>(null);
  
  // Debug: Log when open prop changes
  useEffect(() => {
    console.log('📦 CreateClassDialog - open prop changed:', open);
  }, [open]);
  
  const [formData, setFormData] = useState({
    period: "",
    subject: "",
  });

  // Generate a 6-digit code
  const generateClassCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const classCode = generateClassCode();
      const classWithCode: Omit<Class, "id"> = { 
        period: formData.period,
        subject: formData.subject,
        code: classCode, 
        students: [],
        allowedApps: [] 
      };
      const newClass = await addClass(classWithCode);
      setCreatedClass(newClass);
      
      // Close the create dialog
      onOpenChange(false);
      
      // Reset form
      setFormData({ period: "", subject: "" });
      
      // Notify parent component about the created class
      if (onClassCreated) {
        onClassCreated(newClass);
      }
    } catch (error) {
      console.error('Error creating class:', error);
      // Error is already handled by addClass
    }
  };

  const handleAppPickerComplete = async (selectedApps: string[], name: string) => {
    if (!createdClass) return;
    
    // Validate that all selected apps are in the allowed list (only if apps are selected)
    // Allow empty templates (0 apps) to block all apps
    let validApps = selectedApps;
    if (selectedApps.length > 0 && allowedAppKeys.length > 0) {
      const invalidApps = selectedApps.filter(appKey => !allowedAppKeys.includes(appKey));
      if (invalidApps.length > 0) {
        console.warn('⚠️ Attempted to save apps not in allowed list:', invalidApps);
        // Filter out invalid apps
        validApps = selectedApps.filter(appKey => allowedAppKeys.includes(appKey));
        if (validApps.length === 0) {
          // No valid apps, but allow saving empty template (block all apps)
          console.log('🚫 Saving template with 0 apps - all apps will be blocked');
          validApps = [];
        }
      }
    } else if (selectedApps.length === 0) {
      console.log('🚫 Saving template with 0 apps - all apps will be blocked');
    }
    
    try {
      // Update the created class with selected apps
      await updateClass(createdClass.id, { allowedApps: validApps });
      
      // Automatically create a template with the selected apps for this class
      const savedTemplate = await saveTemplate({
        name: `${createdClass.period} - ${createdClass.subject}`,
        description: `Template for ${createdClass.subject}`,
        apps: validApps,
        period: createdClass.period,
        class_id: createdClass.id // Associate template with this specific class
      });
      
      // Set this template as active for the class in Supabase
      if (savedTemplate?.id) {
        await updateClass(createdClass.id, { activeTemplateId: savedTemplate.id });
      }
      
      setShowAppPickerDialog(false);
      
      // Success toast removed - template is visible in the UI
    } catch (error) {
      console.error('Error in handleAppPickerComplete:', error);
      // Error is already handled by updateClass and saveTemplate
    }
  };

  // Note: Success dialog is now handled by parent component (ClassesPage)
  // This component only handles the app picker for classes created via this dialog

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] p-0 rounded-lg overflow-hidden">
          {/* Navy Blue Header */}
          <div className="bg-[#012D68] px-6 py-4 flex items-center justify-between">
            <div className="text-white text-xl font-semibold">
              Create New Class
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="text-white hover:text-gray-200 transition-colors focus:outline-none focus:ring-0 focus:ring-offset-0"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="period" className="text-[#012D68] font-medium">Period *</Label>
                <Select
                  value={formData.period}
                  onValueChange={(value) => setFormData({ ...formData, period: value })}
                  required
                >
                  <SelectTrigger className="border-gray-300 focus:border-[#012D68] focus:ring-[#012D68]">
                    <SelectValue placeholder="Select a Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Period 0">Period 0</SelectItem>
                    <SelectItem value="Period 1">Period 1</SelectItem>
                    <SelectItem value="Period 2">Period 2</SelectItem>
                    <SelectItem value="Period 3">Period 3</SelectItem>
                    <SelectItem value="Period 4">Period 4</SelectItem>
                    <SelectItem value="Period 5">Period 5</SelectItem>
                    <SelectItem value="Period 6">Period 6</SelectItem>
                    <SelectItem value="Period 7">Period 7</SelectItem>
                    <SelectItem value="Period 8">Period 8</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-[#012D68] font-medium">Subject *</Label>
                <Input
                  id="subject"
                  placeholder="Enter subject"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="border-gray-300 focus:border-[#012D68] focus:ring-[#012D68]"
                />
              </div>
            </div>
            
            <DialogFooter className="gap-2 sm:gap-0">
              <Button 
                variant="outline" 
                type="button" 
                onClick={() => onOpenChange(false)}
                className="border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-[#012D68] hover:bg-[#011f4a] transition-all duration-200 hover:scale-105 hover:shadow-lg"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Class
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* App Picker Dialog - Only shown if user wants to set apps immediately after creation */}
      <AppPickerDialog
        open={showAppPickerDialog}
        onOpenChange={setShowAppPickerDialog}
        onComplete={handleAppPickerComplete}
        initialApps={[]}
        allowedAppKeys={allowedAppKeys}
      />
    </>
  );
};
