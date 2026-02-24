import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuthContext } from '@/context/AuthContext';

export interface AppTemplate {
  id: string;
  name: string;
  description: string;
  apps: string[];
  period?: string;
  class_id?: string;
  created_at?: string;
  updated_at?: string;
}

export const useAppTemplates = (period?: string) => {
  const { schoolId } = useAuthContext();
  const [templates, setTemplates] = useState<AppTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Default "Create Custom" template option
  const defaultTemplates: AppTemplate[] = [
    {
      id: "default-custom",
      name: "Custom",
      description: "Create a Custom Template",
      apps: []
    }
  ];

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('app_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (period) {
        // Fetch templates for this specific period OR the baseline template
        query = query.or(`period.eq.${period},period.eq.baseline`);
      } else {
        // If no period specified, only fetch baseline templates
        query = query.eq('period', 'baseline');
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching templates:', error);
        setTemplates(defaultTemplates);
        return;
      }

      // Combine default templates with custom templates
      const customTemplates = (data || []).map(row => ({
        id: row.id,
        name: row.name,
        description: row.description || '',
        apps: (row.apps as any) || [],
        period: row.period || undefined,
        class_id: row.class_id || undefined,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));

      setTemplates([...defaultTemplates, ...customTemplates]);
    } catch (err) {
      console.error('Unexpected error fetching templates:', err);
      setTemplates(defaultTemplates);
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async (template: Omit<AppTemplate, 'id' | 'created_at' | 'updated_at'>) => {
    if (!schoolId) {
      toast({
        title: "Error saving template",
        description: "School ID is required to save templates.",
        variant: "destructive"
      });
      return null;
    }
    
    try {
      console.log('💾 Attempting to save template via useAppTemplates:', {
        name: template.name,
        description: template.description,
        apps: template.apps,
        period: template.period,
        class_id: template.class_id,
        school_id: schoolId
      });
      
      const { data, error } = await supabase
        .from('app_templates')
        .insert({
          name: template.name,
          description: template.description || null,
          apps: template.apps, // apps is ARRAY type in database
          period: template.period || null,
          class_id: template.class_id || null, // class_id is UUID type in database
          school_id: schoolId // Always associate template with the user's school
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error saving template:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        toast({
          title: "Error saving template",
          description: error.message || 'Failed to save template. Check console for details.',
          variant: "destructive"
        });
        return null;
      }
      
      console.log('✅ Template saved successfully:', data);

      // Success toast removed - template save is visible in UI

      // Refresh templates
      await fetchTemplates();
      
      return data;
    } catch (err) {
      console.error('Unexpected error saving template:', err);
      toast({
        title: "Error saving template",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return null;
    }
  };

  const updateTemplate = async (id: string, updates: Partial<AppTemplate>) => {
    try {
      const updateData: any = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.apps) updateData.apps = updates.apps;
      if (updates.period !== undefined) updateData.period = updates.period;
      if (updates.class_id !== undefined) updateData.class_id = updates.class_id;

      const { error } = await supabase
        .from('app_templates')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Error updating template:', error);
        toast({
          title: "Error updating template",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      // Success toast removed - template update is visible in UI

      // Refresh templates
      await fetchTemplates();
      
      return true;
    } catch (err) {
      console.error('Unexpected error updating template:', err);
      toast({
        title: "Error updating template",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('app_templates')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting template:', error);
        toast({
          title: "Error deleting template",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Template deleted",
        description: "The template has been deleted successfully.",
      });

      // Refresh templates
      await fetchTemplates();
      
      return true;
    } catch (err) {
      console.error('Unexpected error deleting template:', err);
      toast({
        title: "Error deleting template",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [period]);

  return {
    templates,
    loading,
    saveTemplate,
    updateTemplate,
    deleteTemplate,
    refetch: fetchTemplates
  };
};
