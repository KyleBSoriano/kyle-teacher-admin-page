import React, { useState } from "react";
import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSettings } from "@/context/SettingsContext";

interface HelpTooltipProps {
  content: string;
  className?: string;
}

const HelpTooltip: React.FC<HelpTooltipProps> = ({ content, className = "" }) => {
  const [open, setOpen] = useState(false);
  const { showHelpTooltips } = useSettings();

  // Don't render if help tooltips are disabled
  if (!showHelpTooltips) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={`inline-flex items-center justify-center w-4 h-4 ml-2 text-gray-400 hover:text-gray-600 transition-colors ${className}`}
            aria-label="Help information"
            onClick={() => setOpen(!open)}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent 
          side="bottom" 
          align="start"
          className="z-[9999] max-w-xs bg-white border border-gray-200 shadow-lg"
          sideOffset={8}
          alignOffset={-8}
        >
          <p className="text-sm text-gray-700">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default HelpTooltip;