import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from './AuthContext';
// No date-fns imports needed - we calculate dates directly from current date

export interface ScheduleBlock {
  id: string;
  period: string;
  start_time: string;
  end_time: string;
  schedule_date: string;
  block_type?: string;
  description?: string;
  color?: string;
}

interface ScheduleContextType {
  scheduleBlocks: ScheduleBlock[];
  addScheduleBlock: (block: Omit<ScheduleBlock, 'id'>) => Promise<void>;
  updateScheduleBlock: (id: string, updates: Partial<ScheduleBlock>) => Promise<void>;
  deleteScheduleBlock: (id: string) => Promise<void>;
  getScheduleForDate: (date: string) => ScheduleBlock[];
  getScheduleForWeek: (startDate: Date) => ScheduleBlock[];
  loading: boolean;
  refreshSchedule: () => Promise<void>;
  currentWeek: number;
  setCurrentWeek: (week: number) => void;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

interface ScheduleProviderProps {
  children: ReactNode;
}

// Calculate the current week - always starts at 0 for the current week
// 0 = current week, 1 = next week, -1 = last week, etc.
const calculateCurrentWeek = () => {
  return 0; // Always start at current week
};

export const ScheduleProvider: React.FC<ScheduleProviderProps> = ({ children }) => {
  const { schoolId } = useAuthContext();
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(calculateCurrentWeek());

  const loadScheduleBlocks = async () => {
    if (!schoolId) {
      setScheduleBlocks([]);
      setLoading(false);
      return;
    }

    try {
      console.log('📅 Loading schedule blocks from database for school:', schoolId);
      const { data, error } = await supabase
        .from('schedule_blocks')
        .select('*')
        .eq('school_id', schoolId)
        .order('schedule_date, start_time');

      if (error) throw error;
      console.log('📅 Loaded', data?.length || 0, 'schedule blocks');
      setScheduleBlocks(data || []);
    } catch (error) {
      console.error('Error loading schedule blocks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScheduleBlocks();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('schedule-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'schedule_blocks'
        },
        () => {
          loadScheduleBlocks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [schoolId]);

  // Reset to current week when schoolId changes (user logs in)
  useEffect(() => {
    if (schoolId) {
      const week = calculateCurrentWeek();
      setCurrentWeek(week);
    }
  }, [schoolId]);

  const addScheduleBlock = async (block: Omit<ScheduleBlock, 'id'>) => {
    if (!schoolId) {
      throw new Error('School ID is required to create schedule blocks');
    }

    try {
      console.log('➕ Adding schedule block to database:', block);

      const { data, error } = await supabase
        .from('schedule_blocks')
        .insert([{ ...block, school_id: schoolId }])
        .select();

      if (error) {
        console.error('❌ Error inserting block:', error);
        throw error;
      }
      
      console.log('✅ Block successfully inserted into database:', data);
      console.log('🔄 Refreshing schedule blocks...');
      
      // Immediately refresh the local state after creation
      await loadScheduleBlocks();
      
      console.log('✅ Schedule blocks refreshed');
    } catch (error) {
      console.error('❌ Error adding schedule block:', error);
      throw error;
    }
  };

  const updateScheduleBlock = async (id: string, updates: Partial<ScheduleBlock>) => {
    try {
      console.log('ScheduleContext: updating block with ID:', id, 'updates:', updates);
      
      const { error } = await supabase
        .from('schedule_blocks')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }
      
      console.log('ScheduleContext: update successful, refreshing data');
      // Immediately refresh the local state after update
      await loadScheduleBlocks();
    } catch (error) {
      console.error('Error updating schedule block:', error);
      throw error;
    }
  };

  const deleteScheduleBlock = async (id: string) => {
    try {
      console.log('🗑️ Deleting schedule block:', id);
      const { error } = await supabase
        .from('schedule_blocks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      console.log('🗑️ Block deleted, refreshing...');
      // Immediately refresh the local state after deletion
      await loadScheduleBlocks();
    } catch (error) {
      console.error('Error deleting schedule block:', error);
      throw error;
    }
  };

  const getScheduleForDate = (date: string): ScheduleBlock[] => {
    return scheduleBlocks.filter(block => block.schedule_date === date);
  };

  const getScheduleForWeek = (startDate: Date): ScheduleBlock[] => {
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    return scheduleBlocks.filter(block => 
      block.schedule_date >= startDateStr && block.schedule_date <= endDateStr
    );
  };

  const refreshSchedule = async () => {
    await loadScheduleBlocks();
  };

  const value: ScheduleContextType = {
    scheduleBlocks,
    addScheduleBlock,
    updateScheduleBlock,
    deleteScheduleBlock,
    getScheduleForDate,
    getScheduleForWeek,
    loading,
    refreshSchedule,
    currentWeek,
    setCurrentWeek
  };

  return (
    <ScheduleContext.Provider value={value}>
      {children}
    </ScheduleContext.Provider>
  );
};

export const useSchedule = () => {
  const context = useContext(ScheduleContext);
  if (context === undefined) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
};