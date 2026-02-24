import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AppCatalogItem {
  key: string;
  display_name: string;
  ios_bundle_id: string;
  aliases: string[] | null;
}

/**
 * Hook to fetch all apps from app_catalog table
 * Caches results to avoid repeated queries
 */
export const useAppCatalog = () => {
  const [apps, setApps] = useState<AppCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAppCatalog = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('app_catalog')
          .select('*')
          .order('display_name', { ascending: true });

        if (fetchError) throw fetchError;

        if (data) {
          setApps(data as AppCatalogItem[]);
        } else {
          setApps([]);
        }
      } catch (err: any) {
        console.error('Error loading app catalog:', err);
        setError(err.message || 'Failed to load app catalog');
        setApps([]);
      } finally {
        setLoading(false);
      }
    };

    loadAppCatalog();
  }, []);

  return {
    apps,
    loading,
    error,
  };
};

