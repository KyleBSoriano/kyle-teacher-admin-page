import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, X } from "lucide-react";
import { AppTemplate } from "@/data/appTemplates";
import { mockApps } from "@/data/mockData";
import { App } from "@/types";
import { AppIcon } from "@/utils/appIcons";

interface EditTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: AppTemplate | null;
  onSave: (template: AppTemplate) => void;
}

export const EditTemplateModal = ({ open, onOpenChange, template, onSave }: EditTemplateModalProps) => {
  const [templateName, setTemplateName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Always include Phone app for Custom template
  const requiredApps = ["phone"]; // Phone app (using local ID)

  // Map template app IDs to local app IDs
  const mapTemplateAppsToLocalApps = (templateAppIds: string[]): string[] => {
    const appIdMapping: Record<string, string> = {
      'app1': 'app1',
      'app2': 'app2', 
      'app3': 'app3',
      'app4': 'app4',
      'app5': 'app5',
      'app6': 'app6',
      'app7': 'app7',
      'app8': 'app8',
      'app9': 'app9',
      'app10': 'app10',
      'app11': 'app11',
      'app12': 'app12',
      'app13': 'app13',
      'app14': 'app14',
      'app15': 'app15',
      'app16': 'app16',
      'app17': 'app17',
      'app18': 'app18',
      'app19': 'app19',
      'app20': 'app20',
      'app21': 'app21',
      'app22': 'app22',
      'app23': 'app23',
      'app24': 'phone',
      'app25': 'app25',
      'app26': 'app26',
      'app27': 'app27',
      'phone': 'phone'
    };
    
    // Map template IDs to local IDs and filter out any that don't exist in our local app definitions
    const mappedIds = templateAppIds
      .map(templateId => appIdMapping[templateId])
      .filter(localId => localId && mockApps.some(app => app.id === localId));
    
    // Remove duplicates
    return Array.from(new Set(mappedIds));
  };

  useEffect(() => {
    if (template) {
      setTemplateName(template.name);
      setDescription(template.description);
      // Map template app IDs to local app IDs
      const mappedApps = mapTemplateAppsToLocalApps(template.apps);
      setSelectedApps(mappedApps);
    }
  }, [template]);

  const handleAppToggle = (appId: string) => {
    if (requiredApps.includes(appId)) return; // Can't unselect required apps

    setSelectedApps(prev => 
      prev.includes(appId) 
        ? prev.filter(id => id !== appId)
        : [...prev, appId]
    );
  };

  const handleSave = () => {
    if (!template) return;
    
    // Map local app IDs back to template format if needed
    const updatedTemplate: AppTemplate = {
      ...template,
      name: templateName,
      description,
      apps: selectedApps
    };
    
    onSave(updatedTemplate);
    onOpenChange(false);
  };

  // Deduplicate selected apps list
  const uniqueSelectedApps = Array.from(new Set(selectedApps));
  const selectedAppsList = mockApps.filter(app => uniqueSelectedApps.includes(app.id));
  
  // Filter apps based on search query and separate into recommended and non-recommended
  const filteredApps = mockApps.filter(app => 
    app.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const recommendedApps = filteredApps.filter(app => 
    app.category === "Education" || app.category === "Productivity" || 
    app.category === "Communication" || app.category === "Utilities"
  );
  
  const nonRecommendedApps = filteredApps.filter(app => 
    !(app.category === "Education" || app.category === "Productivity" || 
      app.category === "Communication" || app.category === "Utilities")
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-[#012D68]">Edit App Template</DialogTitle>
          <DialogDescription className="sr-only">
            Create and customize an app template by selecting apps and setting name and description
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 overflow-hidden">
          {/* Left Side - Template Configuration */}
          <div className="space-y-3 overflow-y-auto pr-2">
            <div>
              <Label htmlFor="templateName" className="text-base font-medium text-[#012D68]">
                Template Name*
              </Label>
              <Input
                id="templateName"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="mt-1 h-11 border-gray-300"
                placeholder="Enter template name"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-base font-medium text-[#012D68]">
                Description*
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 min-h-[50px] border-gray-300"
                placeholder="Enter template description"
              />
            </div>

            <div>
              <h4 className="text-lg font-semibold text-[#012D68] mb-2">Allowed Apps</h4>
              <Input
                placeholder="Search apps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mb-3 h-10 border-gray-300"
              />
              <div className="space-y-2 max-h-[45vh] overflow-y-auto border border-gray-300 rounded-lg p-3">
                {/* Recommended Apps Section */}
                {recommendedApps.length > 0 && (
                  <div className="space-y-1">
                    <h5 className="text-sm font-medium text-[#012D68] mb-2">Recommended Apps</h5>
                    {recommendedApps.map(app => {
                      const isSelected = uniqueSelectedApps.includes(app.id);
                      const isRequired = requiredApps.includes(app.id);
                      
                      return (
                        <div 
                          key={app.id} 
                          className={`flex items-center space-x-3 p-2 rounded-lg border-2 transition-all cursor-pointer ${
                            isSelected 
                              ? "border-[#012D68] bg-blue-50" 
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => handleAppToggle(app.id)}
                        >
                          <div className="flex-shrink-0">
                            {isSelected ? (
                              <CheckCircle className="w-5 h-5 text-[#012D68]" />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div className="h-8 w-8 flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200">
                            <AppIcon appId={app.id} className="w-5 h-5 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-[#012D68]">{app.name}</span>
                              {isRequired && <span className="text-sm text-gray-500">*</span>}
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                Recommended
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {/* Non-Recommended Apps Section */}
                {nonRecommendedApps.length > 0 && (
                  <div className="space-y-1 pt-3">
                    <h5 className="text-sm font-medium text-[#012D68] mb-2">Other Apps</h5>
                    {nonRecommendedApps.map(app => {
                      const isSelected = uniqueSelectedApps.includes(app.id);
                      const isRequired = requiredApps.includes(app.id);
                      
                      return (
                        <div 
                          key={app.id} 
                          className={`flex items-center space-x-3 p-2 rounded-lg border-2 transition-all cursor-pointer ${
                            isSelected 
                              ? "border-[#012D68] bg-blue-50" 
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => handleAppToggle(app.id)}
                        >
                          <div className="flex-shrink-0">
                            {isSelected ? (
                              <CheckCircle className="w-5 h-5 text-[#012D68]" />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div className="h-8 w-8 flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200">
                            <AppIcon appId={app.id} className="w-5 h-5 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <span className="font-medium text-[#012D68]">{app.name}</span>
                            {isRequired && <span className="text-sm text-gray-500">*</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Selected Apps */}
          <div className="space-y-4 overflow-y-auto pr-2 flex flex-col">
            <div className="space-y-4 flex-1">
              <h4 className="text-lg font-semibold text-[#012D68]">Selected Apps</h4>
              <p className="text-sm text-gray-600">
                Don&apos;t see an app you&apos;d like to allow? Just email us at admin@clockedmobile.com with the app&apos;s name and purpose, and we&apos;ll add it to your List of Allowed Apps.
              </p>
              
              <div className="space-y-3 flex-1">
                <h5 className="font-medium text-gray-700 text-base">Accessible Apps ({selectedAppsList.length})</h5>
                <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 min-h-[300px] max-h-[45vh] overflow-y-auto">
                  {selectedAppsList.map((app, index) => (
                    <div key={app.id} className="flex items-center justify-between py-1.5">
                      <span className="text-base font-medium text-[#012D68]">{index + 1}. {app.name}</span>
                      {!requiredApps.includes(app.id) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAppToggle(app.id)}
                          className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Fixed Bottom buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 bg-white">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="px-6 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={!templateName.trim() || !description.trim()}
                className="px-6 bg-[#012D68] hover:bg-[#011f4a] text-white"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};