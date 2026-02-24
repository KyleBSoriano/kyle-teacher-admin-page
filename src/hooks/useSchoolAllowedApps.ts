import { useState, useEffect } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to get and manage school's allowed apps from app_catalog
 * Returns app_catalog keys that are allowed for the current school
 */
export const useSchoolAllowedApps = () => {
  const { schoolId } = useAuthContext();
  const [allowedAppKeys, setAllowedAppKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAllowedApps = async () => {
    if (!schoolId) {
      setAllowedAppKeys([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch school's allowed_apps (array of app_catalog keys)
      const { data, error: fetchError } = await supabase
        .from('schools')
        .select('allowed_apps')
        .eq('id', schoolId)
        .single();

      if (fetchError) throw fetchError;

      if (data?.allowed_apps && Array.isArray(data.allowed_apps)) {
        setAllowedAppKeys(data.allowed_apps as string[]);
      } else {
        // Empty array if not set
        setAllowedAppKeys([]);
      }
    } catch (err: any) {
      console.error('Error loading allowed apps:', err);
      setError(err.message || 'Failed to load allowed apps');
      setAllowedAppKeys([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllowedApps();
  }, [schoolId]);

  const updateAllowedApps = async (newAllowedApps: string[]) => {
    if (!schoolId) {
      throw new Error('School ID is required');
    }

    try {
      setError(null);
      const { error: updateError } = await supabase
        .from('schools')
        .update({ allowed_apps: newAllowedApps })
        .eq('id', schoolId);

      if (updateError) throw updateError;

      setAllowedAppKeys(newAllowedApps);
      return true;
    } catch (err: any) {
      console.error('Error updating allowed apps:', err);
      setError(err.message || 'Failed to update allowed apps');
      throw err;
    }
  };

  return {
    allowedAppKeys,
    loading,
    error,
    refetch: loadAllowedApps,
    updateAllowedApps,
  };
};

