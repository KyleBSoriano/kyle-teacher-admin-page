import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { useAppContext } from "@/context/AppContext";
import { useAuthContext } from "@/context/AuthContext";
import { useSchedule } from "@/context/ScheduleContext";
import { QrCode, Plus, Play, Edit, Trash2, LogOut } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import FullscreenQRModal from "@/components/FullscreenQRModal";
import { AppPickerDialog } from "@/components/AppPickerDialog";
import { CreateClassDialog } from "@/components/CreateClassDialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getAllTemplatesForPeriod } from "@/data/appTemplates";
import { toast } from "@/hooks/use-toast";
import { getAppIcon } from "@/utils/appIcons";
import clockedLogo from "@/assets/clocked-logo.png";
import HelpTooltip from "@/components/ui/HelpTooltip";
import { getClassTimesFromSchedule, getActivePeriodKey } from "@/utils/scheduleUtils";
import { format } from "date-fns";
import { useSchoolAllowedApps } from "@/hooks/useSchoolAllowedApps";
import { useAppCatalog } from "@/hooks/useAppCatalog";
import { useRealTimeAttendance } from "@/hooks/useRealTimeAttendance";
import { Class } from "@/types";
import { X } from "lucide-react";
import { useAppTemplates } from "@/hooks/useAppTemplates";

const ClassesPage = () => {
  const { classes, getStudentsForClass, deleteClass, apps, updateClass } = useAppContext();
  const { user, schoolId } = useAuthContext();
  const { scheduleBlocks } = useSchedule();
  const [currentClassStatus, setCurrentClassStatus] = useState("No Currently Active Class");
  const [minutesUntilNextClass, setMinutesUntilNextClass] = useState<number | null>(null);
  const { allowedAppKeys } = useSchoolAllowedApps();
  const { apps: allCatalogApps } = useAppCatalog();
  const { saveTemplate } = useAppTemplates();
  const navigate = useNavigate();
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [createClassDialogOpen, setCreateClassDialogOpen] = useState(false);
  const [appPickerOpen, setAppPickerOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTemplateDialogOpen, setDeleteTemplateDialogOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [classToDelete, setClassToDelete] = useState<string>("");
  const [templateToDelete, setTemplateToDelete] = useState<string>("");
  const [searchParams, setSearchParams] = useSearchParams();
  const periodParam = searchParams.get('period');
  const [selectedPeriod, setSelectedPeriod] = useState(periodParam || "period1");
  // Success dialog state for first class creation
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdClass, setCreatedClass] = useState<Class | null>(null);
  const [showAppPickerForNewClass, setShowAppPickerForNewClass] = useState(false);
  
  // Debug: Track createClassDialogOpen state changes
  useEffect(() => {
    console.log('🔍 createClassDialogOpen state changed:', createClassDialogOpen);
  }, [createClassDialogOpen]);
  
  // Update current class status
  useEffect(() => {
    const updateClassStatus = () => {
      // Helper to check if date is in daylight saving time (PST/PDT)
      const isDaylightSavingTime = (date: Date): boolean => {
        const year = date.getFullYear();
        const march = new Date(year, 2, 1);
        const november = new Date(year, 10, 1);
        
        let secondSundayMarch = march;
        let sundayCount = 0;
        while (sundayCount < 2) {
          if (secondSundayMarch.getDay() === 0) sundayCount++;
          if (sundayCount < 2) secondSundayMarch = new Date(secondSundayMarch.getTime() + 86400000);
        }
        
        let firstSundayNovember = november;
        while (firstSundayNovember.getDay() !== 0) {
          firstSundayNovember = new Date(firstSundayNovember.getTime() + 86400000);
        }
        
        return date >= secondSundayMarch && date < firstSundayNovember;
      };
      
      const now = new Date();
      const isDST = isDaylightSavingTime(now);
      const pstOffset = -8 * 60;
      const actualOffset = isDST ? -7 * 60 : pstOffset;
      
      const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
      const pstTime = new Date(utcTime + (actualOffset * 60000));
      
      const today = new Date(pstTime);
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];
      
      const todaySchedule = scheduleBlocks
        .filter(block => block.schedule_date === todayStr)
        .sort((a, b) => {
          const parseTime = (timeStr: string): number => {
            if (!timeStr) return 0;
            if (timeStr.match(/^\d{1,2}:\d{2}$/)) {
              const [hours, minutes] = timeStr.split(':').map(Number);
              return hours * 60 + minutes;
            }
            const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
            if (match) {
              let hours = parseInt(match[1]);
              const minutes = parseInt(match[2]);
              const isPM = match[3].toUpperCase() === 'PM';
              if (isPM && hours !== 12) hours += 12;
              if (!isPM && hours === 12) hours = 0;
              return hours * 60 + minutes;
            }
            return 0;
          };
          return parseTime(a.start_time || '') - parseTime(b.start_time || '');
        });
      
      const currentMinutes = pstTime.getHours() * 60 + pstTime.getMinutes();
      
      for (const block of todaySchedule) {
        if (!block.start_time || !block.end_time) continue;
        
        const parseTimeToMinutes = (timeStr: string): number => {
          if (timeStr.match(/^\d{1,2}:\d{2}$/)) {
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours * 60 + minutes;
          }
          const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
          if (match) {
            let hours = parseInt(match[1]);
            const minutes = parseInt(match[2]);
            const isPM = match[3].toUpperCase() === 'PM';
            if (isPM && hours !== 12) hours += 12;
            if (!isPM && hours === 12) hours = 0;
            return hours * 60 + minutes;
          }
          return 0;
        };
        
        const startMinutes = parseTimeToMinutes(block.start_time);
        const endMinutes = parseTimeToMinutes(block.end_time);
        
        if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
          const minutesRemaining = endMinutes - currentMinutes;
          setMinutesUntilNextClass(null);
          setCurrentClassStatus(`Current Class: ${block.period} - Active (${minutesRemaining} min left)`);
          return;
        }
      }
      
      setCurrentClassStatus("No Currently Active Class");
      const parseTimeToMinutesForNext = (timeStr: string): number => {
        if (!timeStr) return 0;
        if (timeStr.match(/^\d{1,2}:\d{2}$/)) {
          const [hours, minutes] = timeStr.split(':').map(Number);
          return hours * 60 + minutes;
        }
        const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (match) {
          let hours = parseInt(match[1]);
          const minutes = parseInt(match[2]);
          const isPM = match[3].toUpperCase() === 'PM';
          if (isPM && hours !== 12) hours += 12;
          if (!isPM && hours === 12) hours = 0;
          return hours * 60 + minutes;
        }
        return 0;
      };
      const nextBlock = todaySchedule.find(block => block.start_time && parseTimeToMinutesForNext(block.start_time) > currentMinutes);
      if (nextBlock) {
        setMinutesUntilNextClass(parseTimeToMinutesForNext(nextBlock.start_time) - currentMinutes);
      } else {
        setMinutesUntilNextClass(null);
      }
    };
    
    updateClassStatus();
    const interval = setInterval(updateClassStatus, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [scheduleBlocks]);

  // Sync period from URL and default to active period when no period in URL (e.g. on login)
  useEffect(() => {
    if (periodParam) {
      setSelectedPeriod(periodParam);
      return;
    }
    const activeKey = getActivePeriodKey(scheduleBlocks);
    if (activeKey) {
      setSelectedPeriod(activeKey);
      setSearchParams({ period: activeKey });
    }
  }, [periodParam, scheduleBlocks]);

  // Helper function to normalize period names
  const normalizePeriod = (period: string): string => {
    // Convert 'period1' to 'Period 1', 'period2' to 'Period 2', etc.
    const match = period.match(/period(\d+)/i);
    if (match) {
      return `Period ${match[1]}`;
    }
    return period;
  };

  // Get templates for the selected period from database - filtered by school_id, class_id, and period
  const getTemplatesForPeriod = async (period: string) => {
    const selectedClass = classes.find((_, index) => period === `period${index + 1}`);
    if (!selectedClass || !schoolId) {
      console.log('⚠️ No class or schoolId:', { selectedClass: !!selectedClass, schoolId });
      return [];
    }
    
    const normalizedPeriod = normalizePeriod(period);
    
    console.log('🔍 Fetching templates:', {
      period: period,
      normalizedPeriod: normalizedPeriod,
      classPeriod: selectedClass.period,
      classId: selectedClass.id,
      schoolId: schoolId
    });
    
    try {
      // First, try to match by the normalized period (e.g., "Period 1")
      // Also try matching by the actual class.period value in case they differ
      let query = supabase
        .from('app_templates')
        .select('*')
        .eq('school_id', schoolId)
        .eq('class_id', selectedClass.id)
        .not('class_id', 'is', null);
      
      // Try both normalized period and actual class period
      const periodOptions = [normalizedPeriod, selectedClass.period].filter(Boolean);
      if (periodOptions.length > 0) {
        query = query.in('period', periodOptions);
      }
      
      const { data: dbTemplates, error } = await query
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Error fetching templates:', error);
        return [];
      }
      
      console.log('📊 Raw templates from DB:', {
        count: dbTemplates?.length || 0,
        templates: dbTemplates?.map(t => ({
          id: t.id,
          name: t.name,
          period: t.period,
          class_id: t.class_id,
          school_id: t.school_id
        }))
      });
      
      // If no templates exist for this class/period, return empty array
      if (!dbTemplates || dbTemplates.length === 0) {
        console.log('⚠️ No templates found in database for:', {
          normalizedPeriod,
          classPeriod: selectedClass.period,
          classId: selectedClass.id
        });
        return [];
      }
      
      // Additional client-side filtering to ensure only templates for this specific school and class
      // Accept templates that match either normalizedPeriod OR the actual class.period
      const filteredTemplates = dbTemplates.filter(t => {
        const matchesSchool = t.school_id === schoolId;
        const matchesClass = t.class_id === selectedClass.id;
        const matchesPeriod = t.period === normalizedPeriod || t.period === selectedClass.period;
        
        if (!matchesSchool || !matchesClass || !matchesPeriod) {
          console.log('🔍 Template filtered out:', {
            id: t.id,
            name: t.name,
            matchesSchool,
            matchesClass,
            matchesPeriod,
            templatePeriod: t.period,
            expectedPeriod: normalizedPeriod,
            classPeriod: selectedClass.period
          });
        }
        
        return matchesSchool && matchesClass && matchesPeriod;
      });
      
      // Convert database templates to the expected format
      const formattedTemplates = filteredTemplates.map(t => ({
        id: t.id,
        name: t.name || 'App Template',
        description: t.description || '',
        apps: Array.isArray(t.apps) ? t.apps : [],
        isRecommended: t.name === 'Default'
      }));
      
      console.log('📋 Loaded templates from database:', {
        classId: selectedClass.id,
        classPeriod: selectedClass.period,
        period: period,
        normalizedPeriod: normalizedPeriod,
        templatesFound: formattedTemplates.length,
        templates: formattedTemplates.map(t => ({ id: t.id, name: t.name, class_id: 'check_db' }))
      });
      return formattedTemplates;
    } catch (error) {
      console.error('Error fetching templates:', error);
      return [];
    }
  };
  
  const [templates, setTemplates] = useState<any[]>([]);
  // Cache templates per period to avoid re-fetching
  const [templateCache, setTemplateCache] = useState<Map<string, any[]>>(new Map());
  // Track previous classes length to detect when classes transition from empty to populated
  const [prevClassesLength, setPrevClassesLength] = useState(0);
  
  // Update templates when period changes or classes are loaded
  useEffect(() => {
    // Explicit check: Don't try to load templates if classes array is empty
    if (classes.length === 0) {
      console.log('⚠️ Classes array is empty, waiting for classes to load...');
      setPrevClassesLength(0);
      return;
    }
    
    // Clear template cache when classes transition from empty to populated
    // This ensures fresh template load when classes first become available
    if (prevClassesLength === 0 && classes.length > 0) {
      console.log('🔄 Classes just loaded, clearing template cache to force fresh load');
      setTemplateCache(new Map());
      setPrevClassesLength(classes.length);
    } else if (prevClassesLength !== classes.length) {
      setPrevClassesLength(classes.length);
    }
    
    // Improved selectedClass finding logic - more defensive
    const periodNumber = parseInt(selectedPeriod.replace('period', ''));
    const selectedClass = classes.find((_, index) => {
      const classIndex = index + 1;
      return periodNumber === classIndex;
    });
    
    if (!selectedClass) {
      console.log('⚠️ No class found for selected period:', { 
        selectedPeriod,
        periodNumber,
        classesCount: classes.length,
        classPeriods: classes.map(c => c.period)
      });
      return;
    }
    
    if (!schoolId) {
      console.log('⚠️ Waiting for schoolId:', { 
        selectedPeriod,
        classId: selectedClass.id,
        schoolId: !!schoolId 
      });
      return;
    }
    
    console.log('✅ Loading templates for:', {
      selectedPeriod,
      classId: selectedClass.id,
      classPeriod: selectedClass.period,
      classesCount: classes.length
    });
    
    // Check cache first - instant return if cached
    if (templateCache.has(selectedPeriod)) {
      const cachedTemplates = templateCache.get(selectedPeriod)!;
      setTemplates(cachedTemplates);
      console.log('✅ Templates loaded from cache for', selectedPeriod, ':', cachedTemplates.length, 'templates');
      return;
    }
    
    // Only fetch if not cached
    const loadTemplates = async () => {
      console.log('📥 Fetching templates from database for', selectedPeriod);
      const periodTemplates = await getTemplatesForPeriod(selectedPeriod);
      setTemplates(periodTemplates);
      // Cache for future use
      setTemplateCache(prev => new Map(prev).set(selectedPeriod, periodTemplates));
      console.log('📥 Templates loaded from database for', selectedPeriod, ':', periodTemplates.length, 'templates');
    };
    loadTemplates();
  }, [selectedPeriod, classes, schoolId, prevClassesLength]); // Re-run when period, classes, or schoolId change

  const handleQrClick = () => {
    if (classes.length === 0) {
      return; // No classes, can't view QR
    }
    const selectedClass = classes.find((_, index) => selectedPeriod === `period${index + 1}`);
    if (selectedClass) {
      setSelectedClassId(selectedClass.id);
      setQrDialogOpen(true);
    }
  };

  const handleClockOutAll = async () => {
    if (classes.length === 0 || !schoolId) {
      return; // No classes, nothing to do
    }

    try {
      // Get all students enrolled in any of the teacher's classes who are currently clocked in
      const classIds = classes.map(c => c.id);
      
      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select('student_id')
        .in('class_id', classIds);

      if (enrollError) {
        throw enrollError;
      }

      if (!enrollments || enrollments.length === 0) {
        toast({
          title: "No students enrolled",
          description: "No students are enrolled in your classes."
        });
        return;
      }

      const studentIds = enrollments.map(e => e.student_id).filter((id): id is string => id !== null);

      // Get only clocked-in students
      const { data: clockedInStudents, error: studentsError } = await supabase
        .from('students')
        .select('id')
        .in('id', studentIds)
        .eq('clocked_in', true)
        .eq('school_id', schoolId);

      if (studentsError) {
        throw studentsError;
      }

      if (!clockedInStudents || clockedInStudents.length === 0) {
        toast({
          title: "Info",
          description: "No students are currently clocked in."
        });
        return;
      }

      // Clock out each student using the edge function (for push notifications)
      const clockOutPromises = clockedInStudents.map(student => 
        supabase.functions.invoke("admin-clock-out-student", {
          body: { 
            student_id: student.id, 
            school_id: schoolId 
          },
        })
      );

      // Wait for all clock-outs to complete
      const results = await Promise.allSettled(clockOutPromises);
      
      // Check if any failed
      const failures = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.error));
      
      if (failures.length > 0) {
        console.error('Some clock-outs failed:', failures);
        // Continue anyway - some may have succeeded
      }
      
      toast({
        title: "All students clocked out",
        description: `All ${clockedInStudents.length} clocked-in students have been clocked out.`
      });
    } catch (error: any) {
      console.error('Error clocking out students:', error);
      toast({
        title: "Error", 
        description: error.message || "Failed to clock out all students. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleActivateTemplate = async (templateId: string) => {
    const selectedClass = classes.find((_, index) => selectedPeriod === `period${index + 1}`);
    if (!selectedClass) {
      toast({
        title: "Error",
        description: "No class selected. Please select a class first.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Call edge function to update class template and send push notifications
      const { data, error } = await supabase.functions.invoke("set-class-active-template", {
        body: { 
          class_id: selectedClass.id, 
          template_id: templateId 
        },
      });

      if (error) {
        throw error;
      }

      if (!data || !data.ok) {
        throw new Error(data?.error || "Failed to activate template");
      }

      // Update local state to reflect the change
      await updateClass(selectedClass.id, { activeTemplateId: templateId });
      
      // Success toast removed - template activation is visible in UI
    } catch (error: any) {
      console.error('Error activating template:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to activate template. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editingTemplateApps, setEditingTemplateApps] = useState<string[]>([]);
  const [editingTemplateName, setEditingTemplateName] = useState<string>("");
  
  const handleEditTemplate = async (templateId: string) => {
    // Find the template to get its current apps
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setEditingTemplateId(templateId);
      // Apps are already app_catalog keys
      const apps = template.apps || [];
      setEditingTemplateApps(apps);
      setEditingTemplateName(template.name || "App Template");
      setAppPickerOpen(true);
    }
  };
  
  const handleDeleteTemplate = (templateId: string) => {
    const isActive = selectedClass?.activeTemplateId === templateId;
    if (isActive) {
      toast({
        title: "Cannot Delete",
        description: "Cannot delete the active template. Please activate another template first.",
        variant: "destructive"
      });
      return;
    }
    
    setTemplateToDelete(templateId);
    setDeleteTemplateDialogOpen(true);
  };

  const openDeleteClassDialog = (classId: string) => {
    setClassToDelete(classId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteClass = async () => {
    if (!classToDelete) return;

    try {
      await deleteClass(classToDelete);
      setDeleteDialogOpen(false);
      setClassToDelete("");
      
      // If the deleted class was selected, switch to first available class or show empty state
      const deletedClassIndex = classes.findIndex(c => c.id === classToDelete);
      if (deletedClassIndex >= 0 && selectedPeriod === `period${deletedClassIndex + 1}`) {
        if (classes.length > 1) {
          setSelectedPeriod("period1");
        }
      }
    } catch (error) {
      console.error('Error deleting class:', error);
      // Error is already handled by deleteClass
    }
  };
  
  const confirmDeleteTemplate = async () => {
    try {
      const { error } = await supabase
        .from('app_templates')
        .delete()
        .eq('id', templateToDelete);
      
      if (error) throw error;
      
      // Remove from cache and refresh templates
      setTemplateCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(selectedPeriod);
        return newCache;
      });
      const updatedTemplates = await getTemplatesForPeriod(selectedPeriod);
      setTemplates(updatedTemplates);
      // Update cache
      setTemplateCache(prev => new Map(prev).set(selectedPeriod, updatedTemplates));
      
      // Success toast removed - template deletion is visible in UI
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: "Failed to delete template.",
        variant: "destructive"
      });
    }
    
    setDeleteTemplateDialogOpen(false);
    setTemplateToDelete("");
  };
  
  const handleCreateNewTemplate = () => {
    setEditingTemplateId(null);
    setEditingTemplateApps([]); // Start with no apps selected
    setEditingTemplateName("App Template");
    setAppPickerOpen(true);
  };

  // Handler for when a class is created (from CreateClassDialog)
  const handleClassCreated = (newClass: Class) => {
    setCreatedClass(newClass);
    setShowSuccessDialog(true);
    setCreateClassDialogOpen(false);
  };

  // Handler for "Set App Access" button in success dialog
  const handleSetAppAccessForNewClass = () => {
    setShowSuccessDialog(false);
    setShowAppPickerForNewClass(true);
  };

  // Handler for "Skip & Customize Later" button in success dialog
  const handleSkipTemplateForNewClass = () => {
    setShowSuccessDialog(false);
    setCreatedClass(null);
    // Success toast removed - user already saw success dialog
  };

  // Handler for app picker completion for newly created class
  const handleAppPickerCompleteForNewClass = async (selectedApps: string[], name: string) => {
    if (!createdClass) return;
    
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
      
      // Find which period this class belongs to (for cache invalidation)
      // The created class should now be in the classes array after addClass() updated state
      const classIndex = classes.findIndex(c => c.id === createdClass.id);
      let periodKey = selectedPeriod; // Default to current selected period
      
      if (classIndex >= 0) {
        // Class found in array, use its index
        periodKey = `period${classIndex + 1}`;
      } else {
        // Class not found yet, try to match by period name
        // Find the period key that matches this class's period
        const matchingPeriodIndex = classes.findIndex(c => c.period === createdClass.period);
        if (matchingPeriodIndex >= 0) {
          periodKey = `period${matchingPeriodIndex + 1}`;
        }
      }
      
      console.log('🔄 Invalidating template cache for period:', periodKey, 'after creating template for class:', createdClass.id);
      
      // Invalidate template cache for this period and reload templates
      setTemplateCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(periodKey);
        return newCache;
      });
      
      // Reload templates for this period
      const updatedTemplates = await getTemplatesForPeriod(periodKey);
      setTemplates(updatedTemplates);
      setTemplateCache(prev => new Map(prev).set(periodKey, updatedTemplates));
      
      console.log('✅ Templates reloaded after creation:', {
        periodKey,
        templatesCount: updatedTemplates.length,
        templates: updatedTemplates.map(t => ({ id: t.id, name: t.name }))
      });
      
      setShowAppPickerForNewClass(false);
      setCreatedClass(null);
      
      // Success toast removed - template is visible in the UI
    } catch (error) {
      console.error('Error in handleAppPickerCompleteForNewClass:', error);
      toast({
        title: "Error",
        description: "Failed to save app template. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleAppPickerComplete = async (apps: string[], name: string) => {
    try {
      // Validate that all selected apps are in the allowed list (only if apps are selected)
      // Allow empty templates (0 apps) to block all apps
      let finalApps = apps;
      if (apps.length > 0 && allowedAppKeys.length > 0) {
        const invalidApps = apps.filter(appKey => !allowedAppKeys.includes(appKey));
        if (invalidApps.length > 0) {
          console.warn('⚠️ Attempted to save apps not in allowed list:', invalidApps);
          toast({
            title: "Invalid Apps",
            description: `Some selected apps are not allowed for your school. Only apps from your allowed list can be saved.`,
            variant: "destructive"
          });
          // Filter out invalid apps
          finalApps = apps.filter(appKey => allowedAppKeys.includes(appKey));
          if (finalApps.length === 0) {
            // No valid apps, but allow saving empty template (block all apps)
            console.log('🚫 Saving template with 0 apps - all apps will be blocked');
            finalApps = [];
          }
        }
      } else if (apps.length === 0) {
        console.log('🚫 Saving template with 0 apps - all apps will be blocked');
      }
      
      if (editingTemplateId) {
        // Update existing template with both apps AND name
        const { error } = await supabase
          .from('app_templates')
          .update({ 
            apps: finalApps,
            name: name || 'App Template'
          })
          .eq('id', editingTemplateId);
        
        if (error) throw error;
        
        // Invalidate cache and reload templates
        setTemplateCache(prev => {
          const newCache = new Map(prev);
          newCache.delete(selectedPeriod);
          return newCache;
        });
        const updatedTemplates = await getTemplatesForPeriod(selectedPeriod);
        setTemplates(updatedTemplates);
        setTemplateCache(prev => new Map(prev).set(selectedPeriod, updatedTemplates));
        
        // Success toast removed - template update is visible in UI
      } else {
        // Create new template for this specific class and period
        const normalizedSelectedPeriod = normalizePeriod(selectedPeriod);
        const selectedClass = classes.find((_, index) => selectedPeriod === `period${index + 1}`);
        
        if (!selectedClass) {
          toast({
            title: "Error",
            description: "No class selected. Please select a class first.",
            variant: "destructive"
          });
          return;
        }
        
        if (!schoolId) {
          toast({
            title: "Error",
            description: "School ID is required to create templates.",
            variant: "destructive"
          });
          return;
        }
        
        console.log('💾 Attempting to save template:', {
          name: name || 'App Template',
          description: 'Custom template',
          apps: finalApps,
          period: normalizedSelectedPeriod,
          class_id: selectedClass.id,
          school_id: schoolId
        });
        
        const { data: insertedTemplate, error } = await supabase
          .from('app_templates')
          .insert({
            name: name || 'App Template',
            description: 'Custom template',
            apps: finalApps,
            period: normalizedSelectedPeriod,
            class_id: selectedClass.id, // class_id is UUID type in database
            school_id: schoolId // Always associate template with the user's school
          })
          .select()
          .single();
        
        if (error) {
          console.error('❌ Template insert error:', error);
          console.error('Error details:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
          throw error;
        }
        
        console.log('✅ Template saved successfully:', insertedTemplate);
        
        // Success toast removed - template creation is visible in UI
      }
      
      // Invalidate cache and reload templates for current period
      setTemplateCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(selectedPeriod);
        return newCache;
      });
      const updatedTemplates = await getTemplatesForPeriod(selectedPeriod);
      setTemplates(updatedTemplates);
      setTemplateCache(prev => new Map(prev).set(selectedPeriod, updatedTemplates));
      
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: "Failed to save template.",
        variant: "destructive"
      });
    }
    
    setAppPickerOpen(false);
    setEditingTemplateId(null);
  };
  
  // Get app display name from app_catalog
  const getAppName = (appKey: string) => {
    // First try app_catalog
    const catalogApp = allCatalogApps.find(a => a.key === appKey);
    if (catalogApp) return catalogApp.display_name;
    
    // Fallback to old app system for backward compatibility
    const app = apps.find(a => a.id === appKey);
    return app?.name || appKey;
  };

  // Get the selected class
  const selectedClass = classes.find((_, index) => selectedPeriod === `period${index + 1}`);
  const studentsInClass = selectedClass ? getStudentsForClass(selectedClass.id) : [];
  const activeTemplateId = selectedClass?.activeTemplateId;

  // Period number for attendance (e.g. "period4" -> 4)
  const periodNumber = parseInt(selectedPeriod.replace(/\D/g, ''), 10) || 1;
  const { attendanceCount: dashboardClockedInCount } = useRealTimeAttendance(
    selectedClass?.id || '',
    studentsInClass.length || 0,
    periodNumber,
    format(new Date(), 'yyyy-MM-dd')
  );

  if (classes.length === 0) {
    const hasNoClasses = classes.length === 0;
    const buttonOpacity = hasNoClasses ? 'opacity-30' : '';
    const buttonDisabled = hasNoClasses;
    
    return (
      <div className="space-y-6">
        {/* Header with Name, Date, and Buttons */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#012D68] mb-1">
              {user?.name || 'User'}'s Dashboard
            </h1>
            <p className="text-gray-600 text-base">
            {currentClassStatus.startsWith('Current Class: ') && currentClassStatus.includes(' - ') ? (
              <>
                Current Class: <span className="font-bold">{currentClassStatus.slice(15).split(' - ')[0]}</span>
                {' - ' + currentClassStatus.slice(15).split(' - ').slice(1).join(' - ')}
              </>
            ) : currentClassStatus.includes(' - ') ? (
              <>
                <span className="font-bold">{currentClassStatus.split(' - ')[0]}</span>
                {' - ' + currentClassStatus.split(' - ').slice(1).join(' - ')}
              </>
            ) : (
              <>
                {currentClassStatus}
                {currentClassStatus === "No Currently Active Class" && minutesUntilNextClass != null && (
                  <span className="text-gray-600"> — Next class starts in {minutesUntilNextClass} min</span>
                )}
              </>
            )}
          </p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={handleClockOutAll}
              disabled={buttonDisabled}
              variant="outline"
              className={`bg-white border border-[#012D68] text-[#012D68] hover:bg-gray-50 hover:border-[#012D68] px-8 py-6 text-lg font-semibold shadow-lg transition-all duration-200 ${buttonOpacity}`}
            >
              <LogOut className="mr-3 h-6 w-6" /> Clock Out All
            </Button>
            <Button 
              onClick={handleQrClick}
              disabled={buttonDisabled}
              className={`bg-[#012D68] hover:bg-[#011f4a] text-white border-2 border-[#012D68] px-8 py-6 text-lg font-semibold shadow-lg transition-all duration-200 ${buttonOpacity}`}
            >
              <QrCode className="mr-3 h-6 w-6" /> View QR
            </Button>
          </div>
        </div>

        <Card className="border-0 shadow-lg">
          <div className="bg-[#012D68] rounded-t-lg p-4">
            <div className="flex items-center mb-1">
              <CardTitle className="text-xl font-bold text-white">Create a class</CardTitle>
            </div>
            <p className="text-gray-200 text-sm">Create each of your classes once to complete your onboarding</p>
          </div>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-[#012D68] rounded-full flex items-center justify-center mb-4">
              <Plus className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-[#012D68] mb-2">No Classes Yet</h2>
            <p className="text-gray-600 mb-6 max-w-md">
              Create your first class to start managing students and app permissions
            </p>
            <Button 
              className="bg-[#012D68] hover:bg-[#011f4a]"
              onClick={() => {
                console.log('🔘 Button clicked - setting createClassDialogOpen to true');
                setCreateClassDialogOpen(true);
                console.log('✅ setCreateClassDialogOpen(true) called');
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Create Your First Class
            </Button>
          </CardContent>
        </Card>
        
        {/* Create Class Dialog - Must be rendered even when no classes exist */}
        <CreateClassDialog 
          open={createClassDialogOpen}
          onOpenChange={setCreateClassDialogOpen}
          onClassCreated={handleClassCreated}
        />

        {/* App Picker Dialog for Newly Created Class */}
        <AppPickerDialog 
          open={showAppPickerForNewClass}
          onOpenChange={setShowAppPickerForNewClass}
          onComplete={handleAppPickerCompleteForNewClass}
          initialApps={[]}
          allowedAppKeys={allowedAppKeys}
        />

        {/* Success Dialog for Newly Created Class */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent className="sm:max-w-md p-0 rounded-lg overflow-hidden">
            {/* Navy Blue Header */}
            <div className="bg-[#012D68] px-6 py-4 flex items-center justify-between">
              <div className="text-white text-xl font-semibold">
                Class Created Successfully!
              </div>
              <button
                onClick={() => setShowSuccessDialog(false)}
                className="text-white hover:text-gray-200 transition-colors focus:outline-none focus:ring-0 focus:ring-offset-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="text-center space-y-4 py-6 px-6">
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
            
            <div className="flex justify-end gap-3 pt-4 pb-6 px-6 border-t border-gray-200">
              <Button 
                variant="outline" 
                onClick={handleSkipTemplateForNewClass}
                className="border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                Skip & Customize Later
              </Button>
              <Button 
                onClick={handleSetAppAccessForNewClass}
                className="bg-[#012D68] hover:bg-[#011f4a] text-white transition-all duration-200 hover:scale-105 hover:shadow-lg"
              >
                Set App Access
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Date and Actions */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#012D68] mb-1">
            {user?.name || 'User'}'s Dashboard
          </h1>
          <p className="text-gray-600 text-base">
          {currentClassStatus.startsWith('Current Class: ') && currentClassStatus.includes(' - ') ? (
            <>
              Current Class: <span className="font-bold">{currentClassStatus.slice(15).split(' - ')[0]}</span>
              {' - ' + currentClassStatus.slice(15).split(' - ').slice(1).join(' - ')}
            </>
          ) : currentClassStatus.includes(' - ') ? (
            <>
              <span className="font-bold">{currentClassStatus.split(' - ')[0]}</span>
              {' - ' + currentClassStatus.split(' - ').slice(1).join(' - ')}
            </>
          ) : (
            <>
              {currentClassStatus}
              {currentClassStatus === "No Currently Active Class" && minutesUntilNextClass != null && (
                <span className="text-gray-600"> — Next class starts in {minutesUntilNextClass} min</span>
              )}
            </>
          )}
        </p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={handleClockOutAll}
            variant="outline"
            className="bg-white border border-[#012D68] text-[#012D68] hover:bg-gray-50 hover:border-[#012D68] px-8 py-6 text-lg font-semibold shadow-lg transition-all duration-200"
          >
            <LogOut className="mr-3 h-6 w-6" /> Clock Out All
          </Button>
          <Button 
            onClick={handleQrClick}
            className="bg-[#012D68] hover:bg-[#011f4a] text-white border-2 border-[#012D68] px-8 py-6 text-lg font-semibold shadow-lg transition-all duration-200"
          >
            <QrCode className="mr-3 h-6 w-6" /> View QR
          </Button>
        </div>
      </div>

      {/* Period Selection - Horizontal Above Content */}
      <div className="mt-8 mb-6">
        <div className="flex gap-2 flex-wrap items-center justify-between">
          <div className="flex gap-2 flex-wrap items-center">
            {classes.map((classItem, index) => {
              const period = index + 1;
              return (
                <Button
                  key={classItem.id}
                  variant={selectedPeriod === `period${period}` ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    const key = `period${period}`;
                    setSelectedPeriod(key);
                    setSearchParams({ period: key });
                  }}
                  className={`transition-all duration-200 hover:scale-105 ${selectedPeriod === `period${period}` ? "bg-[#012D68] hover:bg-[#011f4a] text-white shadow-lg" : "text-[#012D68] hover:bg-sky-100 hover:shadow-md"}`}
                >
                  {classItem.period}
                </Button>
              );
            })}
            <Button 
              variant="outline"
              size="sm"
              className="border border-[#012D68] transition-all duration-200 hover:scale-105 text-[#012D68] hover:bg-sky-100 hover:shadow-md"
              onClick={() => setCreateClassDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Class
            </Button>
          </div>
        </div>
      </div>

      {/* Period Info Bar and Content Container */}
      {selectedClass && (() => {
        // Get today's schedule block times for this class period
        const today = format(new Date(), 'yyyy-MM-dd');
        const scheduleTimes = getClassTimesFromSchedule(selectedClass.period, scheduleBlocks, today);
        const displayStartTime = scheduleTimes?.startTime || selectedClass.startTime || 'No schedule set';
        const displayEndTime = scheduleTimes?.endTime || selectedClass.endTime || '';
        const displayTime = scheduleTimes 
          ? `${displayStartTime} - ${displayEndTime}`
          : (selectedClass.startTime && selectedClass.endTime 
            ? `${selectedClass.startTime} - ${selectedClass.endTime}`
            : 'No schedule set');

        return (
          <div className="rounded-lg shadow-lg overflow-hidden">
            {/* Blue Header */}
            <div className="bg-[#012D68] p-6">
              <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-white">{selectedClass.period}</h2>
                    <p className="text-white/80 text-sm">
                      {displayTime}
                    </p>
                  </div>
              <div className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <h3 className="text-xl font-bold text-white">{selectedClass.subject}</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:text-red-200 hover:bg-white/20"
                    onClick={() => openDeleteClassDialog(selectedClass.id)}
                    title={`Delete ${selectedClass.period} - ${selectedClass.subject}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-end gap-1">
                  <p className="text-white/80 text-sm">Class Code: {selectedClass.code}</p>
                  <HelpTooltip content="Share this code with students to join your class" />
                </div>
              </div>
            </div>
          </div>

          {/* White Content Container */}
          <div className="bg-white p-6 space-y-6">
            {/* App Templates Section */}
            <div className="flex items-center mb-2">
              <h3 className="text-lg font-semibold text-[#012D68]">App Templates</h3>
              <HelpTooltip content="Create and manage templates with different app permissions for different activities" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              {templates.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500 mb-4">No app templates yet. Create your first template to configure allowed apps for this period.</p>
                  <Button
                    onClick={handleCreateNewTemplate}
                    variant="outline"
                    className="bg-white border-2 border-[#012D68] text-[#012D68] hover:bg-gray-50 hover:border-[#012D68]"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Create First Template
                  </Button>
                </div>
              ) : (
                templates.map((template) => {
                const isActive = activeTemplateId === template.id;
                const displayApps = template.apps.slice(0, 3);
                const moreCount = template.apps.length > 3 ? template.apps.length - 3 : 0;
                
                return (
                   <Card key={template.id} className={`relative flex flex-col ${isActive ? 'border-[#8dc4e0] border-2' : 'border-gray-200'}`}>
                    <CardContent className="p-4 flex flex-col flex-1 flex-grow min-h-0">
                      {/* Template Header - fixed height so titles align across cards with/without active icon */}
                      <div className="flex items-center justify-between gap-2 min-h-10 flex-shrink-0">
                        <h3 className="font-bold text-[#012D68] flex-1 min-w-0 truncate">{template.name}</h3>
                        {isActive ? (
                          <div className="flex items-center justify-center flex-shrink-0 w-10 h-10">
                            <img src={clockedLogo} alt="Active" className="h-10 w-10" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 flex-shrink-0" aria-hidden />
                        )}
                      </div>

                      {/* App Icons - fixed height so icons align across cards regardless of count */}
                      <div className="flex items-start gap-2 flex-wrap h-[88px] mt-2 flex-shrink-0">
                        {displayApps.map((appId, idx) => {
                          const IconComponent = getAppIcon(appId);
                          const appName = getAppName(appId);
                          return (
                            <div key={idx} className="flex flex-col items-center gap-1 w-12 flex-shrink-0">
                              <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center">
                                <IconComponent className="w-5 h-5 text-gray-700" strokeWidth={1.5} />
                              </div>
                              <span className="text-xs text-gray-600 w-full truncate text-center">{appName}</span>
                            </div>
                          );
                        })}
                        {moreCount > 0 && (
                          <div className="flex flex-col items-center gap-1 w-12 flex-shrink-0">
                            <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-700">+{moreCount}</span>
                            </div>
                            <span className="text-xs text-gray-600">more</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons - aligned vertically across cards */}
                      <div className="flex gap-2 pt-2 mt-auto flex-shrink-0">
                        <Button
                          onClick={() => handleActivateTemplate(template.id)}
                          className={isActive
                            ? "flex-1 bg-[#8dc4e0]/30 hover:bg-[#8dc4e0]/50 text-[#012D68] border border-[#8dc4e0] shadow-sm"
                            : "flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700"
                          }
                          size="sm"
                        >
                          <Play className="mr-2 h-4 w-4" />
                          {isActive ? "Active" : "Activate"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditTemplate(template.id)}
                          className="px-3"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        {template.id !== "template1" && template.id !== "template2" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="p-2 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
              )}
            </div>

            {/* Attendance Counter and Bottom Action Buttons */}
            <div className="flex justify-between items-center pt-4">
              {/* Left Side - Attendance Counter */}
              <div className="flex flex-col gap-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-[#012D68]">
                    {dashboardClockedInCount}/{studentsInClass.length}
                  </span>
                  <span className="text-gray-700">Students CLocked In</span>
                </div>
                <div className="w-48 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-[#012D68] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${studentsInClass.length > 0 ? (dashboardClockedInCount / studentsInClass.length) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Right Side - Action Buttons */}
              <div className="flex gap-4">
                <Button
                  onClick={handleCreateNewTemplate}
                  variant="outline"
                  size="sm"
                  className="border border-[#012D68] transition-all duration-200 hover:scale-105 text-[#012D68] hover:bg-sky-100 hover:shadow-md"
                >
                  <Plus className="mr-2 h-4 w-4" /> Create New Template
                </Button>
              </div>
            </div>
          </div>
        </div>
        );
      })()}

      {/* Create Class Dialog */}
      <CreateClassDialog 
        open={createClassDialogOpen}
        onOpenChange={setCreateClassDialogOpen}
        onClassCreated={handleClassCreated}
      />

      {/* App Picker Dialog */}
      <AppPickerDialog 
        open={appPickerOpen}
        onOpenChange={setAppPickerOpen}
        onComplete={handleAppPickerComplete}
        initialApps={editingTemplateApps}
        templateName={editingTemplateName}
        allowedAppKeys={allowedAppKeys}
      />

      {/* App Picker Dialog for Newly Created Class */}
      <AppPickerDialog 
        open={showAppPickerForNewClass}
        onOpenChange={setShowAppPickerForNewClass}
        onComplete={handleAppPickerCompleteForNewClass}
        initialApps={[]}
        allowedAppKeys={allowedAppKeys}
      />

      {/* Modals */}
      <FullscreenQRModal 
        open={qrDialogOpen} 
        onOpenChange={setQrDialogOpen} 
        classId={selectedClassId} 
      />

      {/* Delete Template Confirmation */}
      <Dialog open={deleteTemplateDialogOpen} onOpenChange={setDeleteTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTemplateDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteTemplate}>
              Delete Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Class Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Class</DialogTitle>
            <DialogDescription>
              {classToDelete && (() => {
                const classToDeleteObj = classes.find(c => c.id === classToDelete);
                return classToDeleteObj 
                  ? `Are you sure you want to delete ${classToDeleteObj.period} - ${classToDeleteObj.subject}? This will also delete all associated templates, enrollments, and attendance records. This action cannot be undone.`
                  : "Are you sure you want to delete this class? This action cannot be undone.";
              })()}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteClass}>
              Delete Class
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog for Newly Created Class - Rendered outside conditional so it persists */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md p-0 rounded-lg overflow-hidden">
          {/* Navy Blue Header */}
          <div className="bg-[#012D68] px-6 py-4 flex items-center justify-between">
            <div className="text-white text-xl font-semibold">
              Class Created Successfully!
            </div>
            <button
              onClick={() => setShowSuccessDialog(false)}
              className="text-white hover:text-gray-200 transition-colors focus:outline-none focus:ring-0 focus:ring-offset-0"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="text-center space-y-4 py-6 px-6">
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
          
          <div className="flex justify-end gap-3 pt-4 pb-6 px-6 border-t border-gray-200">
            <Button 
              variant="outline" 
              onClick={handleSkipTemplateForNewClass}
              className="border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              Skip & Customize Later
            </Button>
            <Button 
              onClick={handleSetAppAccessForNewClass}
              className="bg-[#012D68] hover:bg-[#011f4a] text-white transition-all duration-200 hover:scale-105 hover:shadow-lg"
            >
              Set App Access
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClassesPage;
