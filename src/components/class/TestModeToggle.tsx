
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";

interface TestModeToggleProps {
  isTestModeActive: boolean;
  onActivateTestMode: () => void;
  onActivateClassMode: () => void;
}

const TestModeToggle = ({ 
  isTestModeActive, 
  onActivateTestMode, 
  onActivateClassMode 
}: TestModeToggleProps) => {
  return isTestModeActive ? (
    <Button
      onClick={onActivateClassMode}
      className="bg-[#0a2558] hover:bg-[#153a7a] text-white transition-all duration-300"
    >
      Activate Class Mode
    </Button>
  ) : (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          className="bg-[#33C3F0] hover:bg-[#33C3F0]/80 text-white transition-all duration-300"
        >
          Activate Test Mode
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Activate Test Mode?</AlertDialogTitle>
          <AlertDialogDescription>
            This will restrict all apps except for the essential ones: Clock, Find My, Settings, Emergency SOS, Digital Wellness, and Health.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onActivateTestMode}>Activate</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default TestModeToggle;
