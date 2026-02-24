
import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { useQRRefresh } from "@/hooks/useQRRefresh";

interface QRCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
}

const QRCodeDialog = ({ open, onOpenChange, classId }: QRCodeDialogProps) => {
  const { getClassById } = useAppContext();
  const classData = getClassById(classId);
  
  // Generate static QR code (no rotation)
  const { generateQRValue } = useQRRefresh();
  const qrValue = generateQRValue(classId);
  
  const classTitle = classData ? classData.subject : "Class";
  const classPeriod = classData ? classData.period : "";
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {classTitle} - {classPeriod}
          </DialogTitle>
          <Button 
            variant="ghost" 
            className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-0 focus:ring-offset-0"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-6">
          <div className="border border-gray-200 rounded-lg p-2 bg-white">
            <QRCodeSVG 
              value={qrValue}
              size={280} 
              level="H"  // Higher error correction
              includeMargin={true}
            />
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Scan with a mobile device to check in to class
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeDialog;
