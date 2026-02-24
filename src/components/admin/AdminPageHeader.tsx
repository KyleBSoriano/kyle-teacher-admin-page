import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { QrCode, LogOut } from "lucide-react";
import FullscreenQRModal from "@/components/FullscreenQRModal";
import { useAppContext } from "@/context/AppContext";

interface AdminPageHeaderProps {
  title: string;
  subtitle: string;
  /** When provided, shows Clock Out All button (schedule + apps pages) */
  onClockOutAllClick?: () => void;
}

export const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({ title, subtitle, onClockOutAllClick }) => {
  const { classes } = useAppContext();
  const currentClass = classes.length > 0 ? classes[0] : undefined;
  const [qrDialogOpen, setQrDialogOpen] = useState(false);

  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#012D68] mb-1">{title}</h1>
          <p className="text-gray-600 text-base">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          {onClockOutAllClick != null && (
            <Button 
              onClick={onClockOutAllClick}
              variant="outline"
              className="bg-white border border-[#012D68] text-[#012D68] hover:bg-gray-50 hover:border-[#012D68] px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <LogOut className="mr-3 h-6 w-6" /> Clock Out All
            </Button>
          )}
          <Button 
            onClick={() => setQrDialogOpen(true)}
            className="bg-[#012D68] hover:bg-[#011f4a] text-white border-2 border-[#012D68] px-8 py-6 text-lg font-semibold shadow-lg transition-all duration-200"
          >
            <QrCode className="mr-3 h-6 w-6" /> View QR
          </Button>
        </div>
      </div>

      {/* Day buttons and period indicator will be added here by the page component */}

      {/* QR Code Modal */}
      <FullscreenQRModal 
        open={qrDialogOpen} 
        onOpenChange={setQrDialogOpen} 
        classId={currentClass?.id || ''} 
        hideSidebar={true}
      />
    </>
  );
};
