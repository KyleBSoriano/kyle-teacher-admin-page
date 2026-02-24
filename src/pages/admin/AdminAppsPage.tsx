import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Play, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { getAppIcon } from "@/utils/appIcons";
import { AppPickerDialog } from "@/components/AppPickerDialog";
import clockedLogo from "@/assets/clocked-logo.png";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import HelpTooltip from "@/components/ui/HelpTooltip";
import { useSchoolAllowedApps } from "@/hooks/useSchoolAllowedApps";
import { useAppCatalog } from "@/hooks/useAppCatalog";
import { useAuthContext } from "@/context/AuthContext";
import { useClassStatusSubtitle } from "@/hooks/useClassStatus";

const AdminAppsPage = () => {
  const { schoolId } = useAuthContext();
  const classStatusSubtitle = useClassStatusSubtitle();
  const { allowedAppKeys, loading: allowedAppsLoading, updateAllowedApps } = useSchoolAllowedApps();
  const { apps: allCatalogApps, loading: catalogLoading } = useAppCatalog();
  const [appPickerOpen, setAppPickerOpen] = useState(false);
  const [defaultTemplateApps, setDefaultTemplateApps] = useState<string[]>([]); // app_catalog keys
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState<string>("Default");
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [confirmClockOutOpen, setConfirmClockOutOpen] = useState(false);

  const handleClockOutAll = async () => {
    if (!schoolId) {
      toast({
        title: "Error",
        description: "School ID not found",
        variant: "destructive"
      });
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke("admin-clock-out-school", {
        body: { school_id: schoolId },
      });
      if (error) throw error;
      if (!data || !data.ok) throw new Error(data?.error || "Failed to clock out all students");
      toast({
        title: "Success",
        description: data.message || `All students in your school have been clocked out${data.clocked_out_count > 0 ? ` (${data.clocked_out_count} students)` : ''}`,
      });
      setConfirmClockOutOpen(false);
    } catch (error: any) {
      console.error('Error clocking out students:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to clock out students",
        variant: "destructive"
      });
      setConfirmClockOutOpen(false);
    }
  };

  // Load default template from database on mount
  useEffect(() => {
    if (schoolId) {
      console.log('🏫 [DEBUG] School ID:', schoolId);
      console.log('🔍 [DEBUG] About to load template with query:', {
        table: 'app_templates',
        filters: {
          school_id: schoolId,
          period: 'baseline',
          class_id: 'IS NULL'
        },
        order: 'updated_at DESC',
        limit: 1
      });
      loadDefaultTemplate();
      // Debug: Log all baseline templates
      debugAllBaselineTemplates();
      // Read current active apps
      readCurrentActiveApps();
    } else {
      console.warn('⚠️ [DEBUG] No schoolId available');
    }
  }, [schoolId]);

  // Function to read and display currently active apps
  const readCurrentActiveApps = async () => {
    if (!schoolId) return;
    
    try {
      console.log('📖 [READ] Reading current active apps from baseline template...');
      
      const { data: template, error } = await supabase
        .from('app_templates')
        .select('id, name, apps, period, class_id, school_id, updated_at, created_at')
        .eq('school_id', schoolId)
        .eq('period', 'baseline')
        .is('class_id', null)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('❌ [READ] Error reading template:', error);
        return;
      }

      if (!template) {
        console.log('⚠️ [READ] No baseline template found in database');
        return;
      }

      // Process apps field
      let activeApps: string[] = [];
      if (template.apps) {
        if (Array.isArray(template.apps)) {
          activeApps = template.apps.filter((item): item is string => typeof item === 'string');
        } else if (typeof template.apps === 'string') {
          try {
            const parsed = JSON.parse(template.apps);
            activeApps = Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
          } catch (e) {
            console.error('❌ [READ] Failed to parse apps:', e);
          }
        }
      }

      console.log('✅ [READ] CURRENTLY ACTIVE APPS IN BASELINE TEMPLATE:', {
        templateId: template.id,
        templateName: template.name,
        activeApps: activeApps,
        appsCount: activeApps.length,
        appsRaw: template.apps,
        lastUpdated: template.updated_at,
        period: template.period,
        classId: template.class_id,
        schoolId: template.school_id
      });

      // Also show in a more readable format
      if (activeApps.length > 0) {
        console.log('📱 [READ] Active Apps List:', activeApps.join(', '));
      } else {
        console.log('⚠️ [READ] No apps are currently active (empty array)');
      }

    } catch (error) {
      console.error('❌ [READ] Exception reading active apps:', error);
    }
  };

  // Debug function to show all baseline templates
  const debugAllBaselineTemplates = async () => {
    if (!schoolId) return;
    
    try {
      const { data: allTemplates, error } = await supabase
        .from('app_templates')
        .select('*')
        .eq('school_id', schoolId)
        .eq('period', 'baseline')
        .is('class_id', null)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('❌ [DEBUG] Error fetching all baseline templates:', error);
        return;
      }

      console.log('📊 [DEBUG] All baseline templates in database:', {
        count: allTemplates?.length || 0,
        templates: allTemplates?.map(t => ({
          id: t.id,
          name: t.name,
          apps: t.apps,
          appsType: typeof t.apps,
          appsIsArray: Array.isArray(t.apps),
          appsLength: Array.isArray(t.apps) ? t.apps.length : (t.apps ? 'object' : 'null/empty'),
          updated_at: t.updated_at,
          created_at: t.created_at,
          school_id: t.school_id,
          period: t.period,
          class_id: t.class_id
        }))
      });
      
      // Also check raw JSONB
      if (allTemplates && allTemplates.length > 0) {
        console.log('🔍 [DEBUG] Raw apps data from first template:', {
          raw: allTemplates[0].apps,
          stringified: JSON.stringify(allTemplates[0].apps),
          parsed: typeof allTemplates[0].apps === 'string' ? JSON.parse(allTemplates[0].apps) : allTemplates[0].apps
        });
      }
    } catch (error) {
      console.error('❌ [DEBUG] Exception fetching all baseline templates:', error);
    }
  };

  const loadDefaultTemplate = async () => {
    if (!schoolId) return;

    try {
      console.log('🔍 [DEBUG] Loading BASELINE template for school:', schoolId);
      
      const { data, error } = await supabase
        .from('app_templates')
        .select('*')
        .eq('school_id', schoolId)
        .eq('period', 'baseline')
        .is('class_id', null)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('❌ [DEBUG] Error loading template:', error);
        throw error;
      }

      console.log('📋 [DEBUG] Template query result:', {
        found: !!data,
        data: data,
        error: error
      });

      if (data) {
        console.log('✅ [DEBUG] Loaded BASELINE template from database:', {
          id: data.id,
          name: data.name,
          apps: data.apps,
          appsType: typeof data.apps,
          appsIsArray: Array.isArray(data.apps),
          appsLength: Array.isArray(data.apps) ? data.apps.length : 'N/A',
          appsValue: JSON.stringify(data.apps),
          period: data.period,
          class_id: data.class_id,
          school_id: data.school_id,
          updated_at: data.updated_at,
          created_at: data.created_at
        });
        
        // Handle apps field - could be JSONB, array, or null
        let apps: string[] = [];
        if (data.apps) {
          if (Array.isArray(data.apps)) {
            // Ensure all items are strings
            apps = data.apps.filter((item): item is string => typeof item === 'string');
          } else if (typeof data.apps === 'string') {
            try {
              const parsed = JSON.parse(data.apps);
              apps = Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
            } catch (e) {
              console.error('❌ [DEBUG] Failed to parse apps as JSON:', e);
              apps = [];
            }
          } else if (typeof data.apps === 'object') {
            // JSONB object, try to extract array
            if (Array.isArray(data.apps)) {
              apps = data.apps.filter((item): item is string => typeof item === 'string');
            }
          }
        }
        
        console.log('📦 [DEBUG] Processed apps array:', {
          original: data.apps,
          originalType: typeof data.apps,
          originalStringified: JSON.stringify(data.apps),
          processed: apps,
          length: apps.length,
          isEmpty: apps.length === 0
        });
        
        // Alert if apps array is empty
        if (apps.length === 0) {
          console.warn('⚠️ [DEBUG] WARNING: Baseline template has NO APPS (empty array)');
          console.warn('⚠️ [DEBUG] This means no apps are allowed in the baseline template');
        } else {
          console.log('✅ [DEBUG] Baseline template has apps:', apps.join(', '));
        }
        
        setDefaultTemplateApps(apps);
        setTemplateId(data.id);
        setTemplateName(data.name || 'App Template');
        console.log('✅ [DEBUG] Set local state - apps:', apps, 'templateId:', data.id);
      } else {
        // Create default template with first few allowed apps if available
        const initialApps = allowedAppKeys.slice(0, 4);
        const { data: newTemplate, error: insertError } = await supabase
          .from('app_templates')
          .insert({
            name: 'App Template',
            apps: initialApps,
            description: 'Default app template for campus use',
            class_id: null,
            period: 'baseline',
            school_id: schoolId
          })
          .select()
          .single();

        if (insertError) throw insertError;
        
        if (newTemplate) {
          setTemplateId(newTemplate.id);
          setDefaultTemplateApps(initialApps);
          setTemplateName(newTemplate.name || 'App Template');
        }
      }
    } catch (error) {
      console.error('❌ [DEBUG] Error loading baseline template:', error);
      toast({
        title: "Error",
        description: "Failed to load baseline template",
        variant: "destructive"
      });
    }
  };

  // Get allowed apps from app_catalog
  const allowedApps = allCatalogApps.filter(app => allowedAppKeys.includes(app.key));

  const isActive = true; // Default template is always active

  // Get app display name from app_catalog
  const getAppDisplayName = (appKey: string) => {
    const app = allCatalogApps.find(a => a.key === appKey);
    return app?.display_name || appKey;
  };

  const handleEditTemplate = () => {
    setAppPickerOpen(true);
  };

  const handleAppPickerComplete = async (selectedApps: string[], name: string) => {
    setAppPickerOpen(false);
    
    // Validate that all selected apps are in the allowed list (only if apps are selected)
    // Allow empty templates (0 apps) to block all apps
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
        const validApps = selectedApps.filter(appKey => allowedAppKeys.includes(appKey));
        if (validApps.length === 0) {
          // No valid apps, but allow saving empty template (block all apps)
          console.log('🚫 Saving template with 0 apps - all apps will be blocked');
          selectedApps = [];
        } else {
          // Use only valid apps
          selectedApps = validApps;
        }
      }
    } else if (selectedApps.length === 0) {
      console.log('🚫 Saving template with 0 apps - all apps will be blocked');
    }
    
    console.log('🎯 [DEBUG] handleAppPickerComplete called with:', {
      selectedApps,
      name,
      currentTemplateId: templateId,
      currentApps: defaultTemplateApps,
      schoolId
    });
    
    if (!schoolId) {
      console.error('❌ [DEBUG] No schoolId found');
      toast({
        title: "Error",
        description: "School ID not found. Please refresh the page.",
        variant: "destructive"
      });
      return;
    }

    // Prevent multiple simultaneous saves
    if (isSavingTemplate) {
      console.warn('⚠️ [DEBUG] Save already in progress, ignoring duplicate save request');
      return;
    }
    
    setIsSavingTemplate(true);
    
    // Try edge function first, but if it fails, use fallback immediately
    let edgeFunctionSucceeded = false;
    
    try {
      console.log('📤 [DEBUG] Calling edge function with:', {
        school_id: schoolId,
        apps: selectedApps,
        name: name || 'App Template'
      });
      
      // Call edge function to update baseline template and send push notifications
      const { data, error } = await supabase.functions.invoke("admin-update-baseline-template", {
        body: { 
          school_id: schoolId, 
          apps: selectedApps, 
          name: name || 'App Template' 
        },
      });
      
      console.log('📥 [DEBUG] Edge function response:', {
        data,
        error,
        hasData: !!data,
        hasError: !!error,
        dataOk: data?.ok,
        dataError: data?.error
      });

      // Handle Supabase client errors (network, HTTP errors, etc.)
      if (error) {
        console.error('❌ Edge function error:', error);
        console.error('❌ Error details:', {
          message: error.message,
          name: error.name,
          context: error.context,
          status: (error as any).status,
          statusText: (error as any).statusText,
        });
        
        // Extract error message from response if available
        let errorMessage = error.message || "Failed to update baseline template";
        
        // Check if error has response data with error message
        if (data && typeof data === 'object' && 'error' in data) {
          errorMessage = (data as any).error || errorMessage;
        } else if (error.context && error.context.body) {
          try {
            const errorBody = typeof error.context.body === 'string' 
              ? JSON.parse(error.context.body) 
              : error.context.body;
            if (errorBody?.error) {
              errorMessage = errorBody.error;
            }
          } catch (e) {
            // Ignore JSON parse errors
          }
        }
        
        console.log('⚠️ Edge function failed, will use fallback. Error:', errorMessage);
        // Don't throw here - let fallback handle it
        edgeFunctionSucceeded = false;
      } else if (!data || !data.ok) {
        // Handle function-level errors (function returned ok: false)
        const errorMsg = data?.error || "Failed to update baseline template";
        console.error('❌ Edge function returned error:', errorMsg);
        console.log('⚠️ Edge function returned ok: false, will use fallback');
        edgeFunctionSucceeded = false;
      } else {
        // Success!
        console.log('✅ Baseline template updated successfully via edge function:', data);
        edgeFunctionSucceeded = true;
        
        // Update local state after successful save
        setDefaultTemplateApps(selectedApps);
        setTemplateName(name || 'App Template');
        
        // Success toast removed - template update is visible in UI
        setIsSavingTemplate(false);
        return; // Exit early on success
      }
    } catch (error: any) {
      // Edge function threw an exception
      console.error('❌ [DEBUG] Edge function exception:', error);
      console.error('❌ [DEBUG] Exception details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      edgeFunctionSucceeded = false;
    }
    
    // If edge function failed, use fallback
    console.log('🔍 [DEBUG] Checking if fallback should run. edgeFunctionSucceeded:', edgeFunctionSucceeded);
    if (!edgeFunctionSucceeded) {
      console.log('🔄 [DEBUG] ✅ FALLBACK TRIGGERED - Edge function failed, using fallback: updating template directly via Supabase...');
      try {
        // Find existing baseline template (most recent one)
        console.log('🔍 [DEBUG] Searching for existing baseline template...');
        const { data: existingTemplate, error: findError } = await supabase
          .from('app_templates')
          .select('id, apps, name, updated_at')
          .eq('school_id', schoolId)
          .eq('period', 'baseline')
          .is('class_id', null)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        console.log('🔍 [DEBUG] Template search result:', {
          found: !!existingTemplate,
          template: existingTemplate,
          error: findError
        });

        if (findError) {
          console.error('❌ [DEBUG] Error finding template:', findError);
          throw new Error(`Failed to find template: ${findError.message}`);
        }

        if (existingTemplate) {
          console.log('📝 [DEBUG] Updating existing template:', {
            templateId: existingTemplate.id,
            currentApps: existingTemplate.apps,
            currentAppsType: typeof existingTemplate.apps,
            newApps: selectedApps,
            newAppsType: typeof selectedApps,
            currentName: existingTemplate.name,
            newName: name || 'App Template'
          });
          
          // Ensure apps is properly formatted as JSONB array
          const appsToSave = Array.isArray(selectedApps) ? selectedApps : [];
          console.log('💾 [DEBUG] Saving apps to database:', appsToSave);
          
          // Update existing template
          const { data: updatedTemplate, error: updateError } = await supabase
            .from('app_templates')
            .update({
              apps: appsToSave, // Ensure it's an array
              name: name || 'App Template',
              updated_at: new Date().toISOString()
            })
            .eq('id', existingTemplate.id)
            .select()
            .single();

          console.log('📝 [DEBUG] Update result:', {
            updated: !!updatedTemplate,
            template: updatedTemplate,
            error: updateError
          });

          if (updateError) {
            console.error('❌ [DEBUG] Update error:', updateError);
            throw new Error(`Failed to update template: ${updateError.message}`);
          }

          if (!updatedTemplate) {
            console.error('❌ [DEBUG] Update returned no data');
            throw new Error('Update succeeded but no data returned');
          }

          console.log('✅ [DEBUG] Fallback successful: Template updated directly:', {
            id: updatedTemplate.id,
            apps: updatedTemplate.apps,
            name: updatedTemplate.name
          });
          
          // Update local state
          setDefaultTemplateApps(selectedApps);
          setTemplateName(name || 'App Template');
          setTemplateId(existingTemplate.id);
          
          console.log('✅ [DEBUG] Local state updated:', {
            apps: selectedApps,
            name: name || 'App Template',
            templateId: existingTemplate.id
          });

          toast({
            title: "Template Updated",
            description: "Template updated successfully. (Note: Push notifications may not have been sent due to edge function error.)",
          });
          setIsSavingTemplate(false);
          return; // Success, exit early
        } else {
          // Create new template if none exists
          console.log('📝 [DEBUG] No existing template found, creating new one...');
          const { data: newTemplate, error: createError } = await supabase
            .from('app_templates')
            .insert({
              name: name || 'App Template',
              apps: selectedApps,
              description: 'Default app template for campus use',
              class_id: null,
              period: 'baseline',
              school_id: schoolId
            })
            .select()
            .single();

          console.log('📝 [DEBUG] Create result:', {
            created: !!newTemplate,
            template: newTemplate,
            error: createError
          });

          if (createError) {
            console.error('❌ [DEBUG] Create error:', createError);
            throw new Error(`Failed to create template: ${createError.message}`);
          }

          if (!newTemplate) {
            console.error('❌ [DEBUG] Create returned no data');
            throw new Error('Create succeeded but no data returned');
          }

          console.log('✅ [DEBUG] Fallback successful: Template created directly:', {
            id: newTemplate.id,
            apps: newTemplate.apps,
            name: newTemplate.name
          });
          
          // Update local state
          setDefaultTemplateApps(selectedApps);
          setTemplateName(name || 'App Template');
          setTemplateId(newTemplate.id);
          
          console.log('✅ [DEBUG] Local state updated:', {
            apps: selectedApps,
            name: name || 'App Template',
            templateId: newTemplate.id
          });

          toast({
            title: "Template Created",
            description: "Template created successfully. (Note: Push notifications may not have been sent due to edge function error.)",
          });
          setIsSavingTemplate(false);
          return; // Success, exit early
        }
      } catch (fallbackError: any) {
        console.error('❌ [DEBUG] Fallback also failed:', fallbackError);
        console.error('❌ [DEBUG] Fallback error details:', {
          message: fallbackError.message,
          stack: fallbackError.stack,
          name: fallbackError.name
        });
        
        // Reload from database to restore previous state
        await loadDefaultTemplate();
        
        // Show error message
        toast({
          title: "Error",
          description: `Failed to save template. ${fallbackError.message || "Please try again."}`,
          variant: "destructive"
        });
      }
    }
    
    // Always reset saving state (in case we didn't return early)
    setIsSavingTemplate(false);
  };


  return (
    <div className="space-y-6">
      <AdminPageHeader 
        title="Apps Management" 
        subtitle={classStatusSubtitle}
        onClockOutAllClick={() => setConfirmClockOutOpen(true)}
      />

      {/* Two-column layout - match Dashboard (grid cols-5, left 2, right 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left subsection - App Catalog (Allowed Apps on Campus) */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-lg rounded-lg overflow-hidden w-full">
            <div className="bg-[#012D68] rounded-t-lg p-4">
              <div className="flex items-center mb-1">
                <h2 className="text-xl font-bold text-white">App Catalog</h2>
                <HelpTooltip content="The approved set of apps teachers can choose to enable for classroom use and IEP accommodations" />
              </div>
              <p className="text-gray-200 text-sm">Allowed Apps on Campus</p>
            </div>
            <CardContent className="bg-white p-6 rounded-b-lg space-y-4">
              <p className="text-gray-600 text-sm">
                Allowed apps refer to the approved set of apps teachers may choose to enable for classroom use.
              </p>

              {/* Numbered Apps List */}
              <div className="space-y-2">
                {allowedAppsLoading || catalogLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading apps...</div>
                ) : allowedApps.length > 0 ? (
                  allowedApps.map((app, index) => {
                    const IconComponent = getAppIcon(app.key);
                    return (
                      <div 
                        key={app.key}
                        className="flex items-center gap-3 p-2 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                      >
                        <span className="text-sm font-medium text-gray-500 w-6 text-center flex-shrink-0">
                          {index + 1}.
                        </span>
                        <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                          <IconComponent className="w-5 h-5 text-gray-700" strokeWidth={1.5} />
                        </div>
                        <span className="font-medium text-gray-900 text-sm">{app.display_name}</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No allowed apps set. Click Edit to add apps.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right subsection - Default App Template (same width as Schedule right subsection) */}
        <div className="lg:col-span-3">
          <Card className="border-0 shadow-lg rounded-lg overflow-hidden w-full">
            <div className="bg-[#012D68] rounded-t-lg p-4">
              <div className="flex items-center mb-1">
                <h2 className="text-xl font-bold text-white">Default App Template</h2>
                <HelpTooltip content="Set the default apps available during passing periods and in classes unless customized by teachers" />
              </div>
              <p className="text-gray-200 text-sm">Set the time blocks, for student use</p>
            </div>
            <CardContent className="bg-white p-6 rounded-b-lg space-y-6">
              <p className="text-gray-600 text-sm">
                List of apps permitted on campus during passing periods or breaks, and set as the default allowed apps in class unless a teacher customizes their settings.
              </p>

              {/* Template Display - Active template style matching teacher dashboard */}
              <Card className={`relative flex flex-col ${isActive ? 'border-[#8dc4e0] border-2' : 'border-gray-200'}`}>
                <CardContent className="p-4 flex flex-col flex-1 flex-grow min-h-0">
                  <div className="flex items-center justify-between gap-2 min-h-10 flex-shrink-0">
                    <h3 className="font-bold text-[#012D68] flex-1 min-w-0 truncate">{templateName}</h3>
                    {isActive ? (
                      <div className="flex items-center justify-center flex-shrink-0 w-10 h-10">
                        <img src={clockedLogo} alt="Active" className="h-10 w-10" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 flex-shrink-0" aria-hidden />
                    )}
                  </div>

                  <div className="flex items-start gap-2 flex-wrap h-[88px] mt-2 flex-shrink-0">
                    {defaultTemplateApps.slice(0, 3).map((appKey, idx) => {
                      const IconComponent = getAppIcon(appKey);
                      const appName = getAppDisplayName(appKey);
                      return (
                        <div key={idx} className="flex flex-col items-center gap-1 w-12 flex-shrink-0">
                          <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center">
                            <IconComponent className="w-5 h-5 text-gray-700" strokeWidth={1.5} />
                          </div>
                          <span className="text-xs text-gray-600 w-full truncate text-center">{appName}</span>
                        </div>
                      );
                    })}
                    {defaultTemplateApps.length > 3 && (
                      <div className="flex flex-col items-center gap-1 w-12 flex-shrink-0">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-700">+{defaultTemplateApps.length - 3}</span>
                        </div>
                        <span className="text-xs text-gray-600">more</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2 mt-auto flex-shrink-0">
                    <Button
                      size="sm"
                      className="flex-1 bg-[#8dc4e0]/30 hover:bg-[#8dc4e0]/50 text-[#012D68] border border-[#8dc4e0] shadow-sm"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Active
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEditTemplate}
                      className="px-3"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Clock Out All Confirmation Dialog */}
      <AlertDialog open={confirmClockOutOpen} onOpenChange={setConfirmClockOutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-[#012D68]">Clock Out All Students?</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Are you sure you want to clock out all students in your school? This action will clock out all currently clocked-in students and remove their app restrictions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-medium">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClockOutAll}
              className="bg-red-600 hover:bg-red-700 font-semibold"
            >
              Clock Out All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* App Picker Dialog for Template */}
      <AppPickerDialog 
        open={appPickerOpen}
        onOpenChange={setAppPickerOpen}
        onComplete={handleAppPickerComplete}
        initialApps={defaultTemplateApps}
        templateName={templateName}
        allowedAppKeys={allowedAppKeys}
      />
    </div>
  );
};

export default AdminAppsPage;
