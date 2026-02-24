import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import { useAuthContext } from "@/context/AuthContext";
import { useTutorial } from "@/context/TutorialContext";
import { Class } from "@/types";
import ClassForm from "@/components/ClassForm";
import { AppPickerDialog } from "@/components/AppPickerDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useSchoolAllowedApps } from "@/hooks/useSchoolAllowedApps";

const CreateClassPage = () => {
  const { addClass, updateClass } = useAppContext();
  const { schoolId } = useAuthContext();
  const { allowedAppKeys } = useSchoolAllowedApps();
  const { nextStep, isActive, getCurrentStep, advanceToStep } = useTutorial();
  const navigate = useNavigate();
  const location = useLocation();
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showAppPickerDialog, setShowAppPickerDialog] = useState(false);
  const [createdClass, setCreatedClass] = useState<Class | null>(null);
  const [formData, setFormData] = useState<Omit<Class, "id"> | null>(null);
  
  // Generate a 6-digit code
  const generateClassCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };
  
  // Handle tutorial step 3/4 - auto-show success dialog
  useEffect(() => {
    if (isActive && getCurrentStep()?.id === 'class-created-success' && location.state?.showTutorialDialog) {
      // Create a mock class for tutorial demonstration
      const mockClass: Class = {
        id: "tutorial-class",
        period: "Period 1",
        subject: "Geometry",
        startTime: "9:00 AM",
        endTime: "10:30 AM",
        code: "240801",
        students: [],
        allowedApps: []
      };
      setCreatedClass(mockClass);
      setShowSuccessDialog(true);
    }
  }, [isActive, getCurrentStep, location.state]);
  
  
  const handleSubmit = async (submittedFormData: Omit<Class, "id">) => {
    try {
      const classCode = generateClassCode();
      const classWithCode = { ...submittedFormData, code: classCode, allowedApps: [] };
      const newClass = await addClass(classWithCode);
      setCreatedClass(newClass);
      setFormData(submittedFormData);
      setShowSuccessDialog(true);
      
      // Advance tutorial to step 3 if we're in tutorial mode
      if (isActive && getCurrentStep()?.id === 'class-form') {
        setTimeout(() => {
          nextStep();
        }, 100);
      }
    } catch (error) {
      console.error('Error creating class:', error);
      // Error is already handled by addClass
    }
  };

  const handleAppPickerComplete = async (selectedApps: string[], name: string) => {
    if (!createdClass || !formData) return;
    
    // Validate that all selected apps are in the allowed list (only if apps are selected)
    // Allow empty templates (0 apps) to block all apps
    let validApps = selectedApps;
    if (selectedApps.length > 0 && allowedAppKeys.length > 0) {
      const invalidApps = selectedApps.filter(appKey => !allowedAppKeys.includes(appKey));
      if (invalidApps.length > 0) {
        console.warn('⚠️ Attempted to save apps not in allowed list:', invalidApps);
        toast({
          title: "Invalid Apps",
          description: `Some selected apps are not allowed for your school. Only apps from your allowed list can be saved.`,
          variant: "destructive"
        });
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
    
      // Use the name from the dialog, or generate a default
      const templateName = name || (selectedApps.length > 0 
        ? `${createdClass.period} - ${selectedApps.length} App${selectedApps.length !== 1 ? 's' : ''}`
        : `${createdClass.period} Custom`);
      
      try {
        // Save template to database
        const { supabase } = await import('@/integrations/supabase/client');
        const { data, error } = await supabase
          .from('app_templates')
          .insert({
            name: templateName,
            school_id: schoolId,
            description: `Custom apps for ${createdClass.period}`,
            apps: validApps,
            period: createdClass.period,
            class_id: createdClass.id
          })
          .select()
          .single();
        
        if (error) throw error;
        
        console.log('Created custom template in database:', data);
        
        // Set this template as active for the class in Supabase
        await updateClass(createdClass.id, { activeTemplateId: data.id });
        
        setShowAppPickerDialog(false);
        
        // Success toast removed - template creation is visible in UI
        
        // If tutorial is active, end it here
        if (isActive && getCurrentStep()?.id === 'choose-app-template') {
          navigate('/');
        } else {
          navigate('/classes');
        }
      } catch (error) {
        console.error('Error saving template:', error);
        toast({
          title: "Error",
          description: "Failed to save app template. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating class:', error);
      // Error is already handled by updateClass
    }
  };
  
  const handleSetAppAccess = () => {
    // Close the success dialog and show app picker dialog
    setShowSuccessDialog(false);
    setShowAppPickerDialog(true);
    
    // Advance tutorial to step 4 if in tutorial mode
    if (isActive && getCurrentStep()?.id === 'class-created-success') {
      setTimeout(() => {
        advanceToStep(3); // Step 4/4: choose-app-template
      }, 300);
    }
  };

  const handleSkipTemplate = () => {
    setShowSuccessDialog(false);
    navigate('/classes');
  };
  
  return (
    <>
      <ClassForm onSubmit={handleSubmit} isEditing={false} />
      
      <Dialog open={showSuccessDialog} onOpenChange={(open) => {
        // Only allow closing the dialog if not in tutorial mode or if tutorial allows it
        if (!isActive || getCurrentStep()?.id !== 'class-created-success') {
          setShowSuccessDialog(open);
        }
      }}>
        <DialogContent className="sm:max-w-md" data-tutorial="class-created-success">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-semibold text-[#012D68]">
              Class Created Successfully!
            </DialogTitle>
          </DialogHeader>
          
          <div className="text-center space-y-4 py-4">
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-3xl font-bold text-[#012D68] mb-2 tracking-wider">
                {createdClass?.code}
              </div>
            </div>
            
            <p className="text-gray-600">
              Here's your unique code for <span className="font-medium">{createdClass?.period} - {createdClass?.subject}</span>. 
              Share with your students to join the class.
            </p>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={handleSkipTemplate}
              className="border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              Skip & Customize Later
            </Button>
            <Button 
              onClick={handleSetAppAccess}
              className="bg-[#012D68] hover:bg-[#011f4a] text-white transition-all duration-200 hover:scale-105 hover:shadow-lg"
              data-tutorial="set-app-access"
            >
              Set App Access
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* App Picker Dialog */}
      <AppPickerDialog
        open={showAppPickerDialog}
        onOpenChange={(open) => {
          if (!isActive || getCurrentStep()?.id !== 'choose-app-template') {
            setShowAppPickerDialog(open);
          }
        }}
        onComplete={handleAppPickerComplete}
        initialApps={[]}
        allowedAppKeys={allowedAppKeys}
      />
    </>
  );
};

export default CreateClassPage;
