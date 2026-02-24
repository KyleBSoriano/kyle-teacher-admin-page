import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { useAppCatalog } from "@/hooks/useAppCatalog";
import { getAppIcon } from "@/utils/appIcons";

interface AppPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (apps: string[], name: string) => void; // apps are app_catalog keys
  initialApps?: string[]; // app_catalog keys
  templateName?: string;
  allowedAppKeys?: string[]; // app_catalog keys that are allowed for this school
}

export const AppPickerDialog = ({
  open,
  onOpenChange,
  onComplete,
  initialApps = [],
  templateName: initialTemplateName = "App Template",
  allowedAppKeys = [] // List of allowed app_catalog keys from the school
}: AppPickerDialogProps) => {
  const { apps: allCatalogApps, loading: catalogLoading } = useAppCatalog();
  const [templateName, setTemplateName] = useState(initialTemplateName);
  const [selectedApps, setSelectedApps] = useState<string[]>(initialApps || []);
  const [searchQuery, setSearchQuery] = useState("");

  // Sync state with props only when dialog opens
  useEffect(() => {
    if (open) {
      setTemplateName(initialTemplateName);
      setSelectedApps(initialApps || []);
      setSearchQuery("");
    }
  }, [open, initialTemplateName, initialApps]);

  // Filter apps to only show those in allowedAppKeys
  // If allowedAppKeys is empty, show no apps (safer default)
  const availableApps = allCatalogApps.filter(app => {
    if (allowedAppKeys.length === 0) {
      // If no allowed apps specified, show no apps (prevents showing all apps when school config is missing)
      return false;
    }
    return allowedAppKeys.includes(app.key);
  });

  // Filter apps based on search query
  const filteredApps = availableApps.filter(app =>
    app.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleApp = (appKey: string) => {
    if (selectedApps.includes(appKey)) {
      setSelectedApps(prev => prev.filter(key => key !== appKey));
    } else {
      setSelectedApps(prev => [...prev, appKey]);
    }
  };

  const handleComplete = () => {
    // Validate that all selected apps are in the allowed list (only if apps are selected)
    if (selectedApps.length > 0 && allowedAppKeys.length > 0) {
      const invalidApps = selectedApps.filter(appKey => !allowedAppKeys.includes(appKey));
      if (invalidApps.length > 0) {
        console.warn('⚠️ Attempted to save apps not in allowed list:', invalidApps);
        // Filter out invalid apps before saving
        const validApps = selectedApps.filter(appKey => allowedAppKeys.includes(appKey));
        onComplete(validApps, templateName);
        return;
      }
    }
    // Allow saving with 0 apps (empty template = block all apps)
    if (selectedApps.length === 0) {
      console.log('🚫 Saving template with 0 apps - all apps will be blocked');
    }
    onComplete(selectedApps, templateName);
  };

  // Get app display name
  const getAppDisplayName = (appKey: string) => {
    const app = allCatalogApps.find(a => a.key === appKey);
    return app?.display_name || appKey;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full h-[85vh] overflow-hidden flex flex-col p-0">
        {/* Navy Blue Header - generous padding */}
        <div className="bg-[#012D68] px-6 py-5 flex items-center justify-between flex-shrink-0">
          <DialogTitle className="text-white text-xl font-bold tracking-tight">Edit App Template</DialogTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="text-white hover:text-gray-200 transition-colors p-1 focus:outline-none focus:ring-0 focus:ring-offset-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 overflow-hidden p-6">
          {/* Left Side - Template Configuration */}
          <div className="space-y-6 overflow-y-auto pr-1">
            <div className="space-y-2">
              <label className="block text-base font-semibold text-gray-900">Template Name*</label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="h-11 px-3 py-2.5 text-[15px] border-gray-300 rounded-md bg-white placeholder:text-gray-400"
                placeholder="App Template"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-base font-semibold text-gray-900">Allowed Apps</label>
              <Input
                placeholder="Search apps..."
                className="h-10 px-3 py-2 text-[15px] border-gray-300 rounded-md bg-white placeholder:text-gray-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="max-h-[42vh] overflow-y-auto border border-gray-200 rounded-lg bg-white p-1 space-y-1">
                {catalogLoading ? (
                  <div className="text-center py-10 text-gray-500 text-[15px]">Loading apps...</div>
                ) : filteredApps.length > 0 ? (
                  filteredApps.map(app => {
                    const IconComponent = getAppIcon(app.key);
                    const isSelected = selectedApps.includes(app.key);
                    
                    return (
                      <div 
                        key={app.key} 
                        onClick={() => toggleApp(app.key)}
                        className={`flex items-center gap-4 px-4 py-3.5 cursor-pointer transition-colors rounded-lg ${
                          isSelected ? "bg-sky-50 border-2 border-[#8dc4e0]" : "hover:bg-gray-50"
                        }`}
                      >
                        <div className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-[#012D68] bg-[#012D68]" : "border-gray-300 bg-white"}`}>
                          {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[15px] font-semibold text-gray-900">{app.display_name}</span>
                        </div>
                        <div className="flex-shrink-0 h-9 w-9 flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200">
                          <IconComponent className="w-5 h-5 text-gray-700" strokeWidth={1.5} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-10 text-gray-500 text-[15px]">
                    {searchQuery ? `No apps found matching "${searchQuery}"` : "No apps available"}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Template Apps */}
          <div className="overflow-hidden flex flex-col min-h-0">
            <div className="flex-1 flex flex-col min-h-0 space-y-3">
              <h4 className="text-lg font-semibold text-gray-900 flex-shrink-0">Template Apps ({selectedApps.length})</h4>
              <div className="flex-1 min-h-[280px] border border-gray-200 rounded-lg bg-gray-50 flex flex-col p-4">
                {selectedApps.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center min-h-[200px]">
                    <p className="text-gray-400 text-base">No apps selected</p>
                  </div>
                ) : (
                  <div className="w-full overflow-y-auto flex-1 flex flex-col items-stretch divide-y divide-gray-200">
                    {selectedApps.map((appKey, index) => {
                      const app = allCatalogApps.find(a => a.key === appKey);
                      const IconComponent = getAppIcon(appKey);
                      return (
                        <div key={appKey} className="flex items-center justify-between py-3 px-4 hover:bg-gray-100/80">
                          <span className="text-[15px] font-semibold text-gray-900 tabular-nums flex-1 min-w-0">
                            {index + 1}. {app?.display_name || appKey}
                          </span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="h-9 w-9 flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200">
                              <IconComponent className="w-5 h-5 text-gray-700" strokeWidth={1.5} />
                            </div>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); toggleApp(appKey); }}
                              className="h-8 w-8 p-0 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded focus:outline-none focus-visible:ring-0"
                              aria-label="Remove app"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer - Action buttons */}
            <div className="flex justify-end gap-4 pt-6 mt-4 flex-shrink-0">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="rounded-md bg-white border-2 border-[#012D68] text-[#012D68] hover:bg-gray-50 hover:border-[#012D68] h-10 px-6 text-lg font-semibold"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleComplete}
                disabled={!templateName.trim()}
                className="rounded-md bg-[#012D68] hover:bg-[#011f4a] text-white border-2 border-[#012D68] disabled:opacity-50 disabled:pointer-events-none h-10 px-6 text-lg font-semibold"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
