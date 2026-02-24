import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  id: string;
  name: string;
  preferredTitle?: string;
  email: string;
  schoolName?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  authError: string | null;
  logout: () => Promise<void>;
  clearAuthError: () => void;
  isLoading: boolean;
  completeTutorial: () => void;
  role: 'teacher' | 'admin' | null;
  schoolId: string | null;
  signUp: (email: string, password: string, schoolCode: string, name: string, role: 'teacher' | 'admin') => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  isAdmin: () => boolean;
  isTeacher: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [role, setRole] = useState<'teacher' | 'admin' | null>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);

  // Safety timeout: Always stop loading after 5 seconds max (reduced for faster loading)
  useEffect(() => {
    const safetyTimeout = setTimeout(() => {
      if (isLoading) {
        console.warn('AuthContext: Safety timeout - forcing loading to stop');
        setIsLoading(false);
      }
    }, 5000); // 5 seconds max

    return () => clearTimeout(safetyTimeout);
  }, [isLoading]);

  // Load user profile from database
  const loadUserProfile = async (userId: string, userEmail?: string) => {
    try {
      setIsLoading(true);
      console.log('🔍 Loading user profile for auth user ID:', userId);
      
      // Get email from session if not provided
      let email = userEmail;
      if (!email) {
        console.log('📧 Getting auth user email from session...');
        const { data: { session } } = await supabase.auth.getSession();
        email = session?.user?.email;
        console.log('📧 Auth user email from session:', email);
      } else {
        console.log('📧 Using provided email:', email);
      }
      
      // Try to get profile by ID first (matches auth.users.id)
      console.log('🔍 Querying profiles table for ID:', userId);
      
      // Add timeout to profile query (reduced from 8s to 3s for faster loading)
      const profileQueryPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile query timeout after 3 seconds')), 3000)
      );
      
      let profile, profileError;
      try {
        const result = await Promise.race([profileQueryPromise, timeoutPromise]) as any;
        profile = result.data;
        profileError = result.error;
        console.log('📊 Profile query result:', { profile, profileError });
      } catch (timeoutError: any) {
        console.error('❌ Profile query timed out:', timeoutError);
        profileError = {
          code: 'TIMEOUT',
          message: timeoutError.message || 'Query timed out - likely RLS policy blocking access',
          details: 'The query took too long. This usually means RLS policies are blocking access. Make sure you have run the RLS policies SQL file.'
        };
        profile = null;
      }

      // If not found by ID or timed out, try by email (for existing accounts)
      if (profileError && (profileError.code === 'PGRST116' || profileError.code === 'TIMEOUT') && email) {
        console.log('⚠️ Profile not found by ID or query timed out, trying by email...');
        const emailQueryPromise = supabase
          .from('profiles')
          .select('*')
          .eq('email', email)
          .single();
        
        const emailTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Email query timeout after 2 seconds')), 2000)
        );
        
        let profileByEmail = null;
        let emailError = null;
        
        try {
          const emailResult = await Promise.race([emailQueryPromise, emailTimeoutPromise]) as any;
          profileByEmail = emailResult.data;
          emailError = emailResult.error;
          
          if (profileByEmail && !emailError) {
            console.log('✅ Found profile by email:', profileByEmail);
            console.log('✅ Found profile by email, updating profile ID to match auth user ID...');
            // Update the profile ID to match the auth user ID
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ id: userId })
              .eq('id', profileByEmail.id);
            
            if (updateError) {
              console.error('Error updating profile ID:', updateError);
              // Still use the profile even if update fails
              profile = profileByEmail;
              profileError = null;
            } else {
              // Re-fetch with correct ID
              const { data: updatedProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
              profile = updatedProfile;
              profileError = null;
            }
          } else {
            profile = profileByEmail;
            profileError = emailError;
          }
        } catch (emailTimeoutError: any) {
          console.error('❌ Email query also timed out:', emailTimeoutError);
          // Keep the original error - RLS is blocking both queries
          console.error('❌ Both ID and email queries timed out. This means RLS policies are blocking access.');
          console.error('❌ Please run the setup_auth_rls_policies.sql file in your Supabase SQL Editor.');
        }
      }

      if (profileError) {
        console.error('❌ Error loading profile:', profileError);
        console.error('Profile error details:', {
          code: profileError.code,
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint
        });
        // Don't show timeout errors to the user - handle silently
        if (profileError.code === 'TIMEOUT' || profileError.message?.toLowerCase().includes('timeout')) {
          console.warn('Profile query timeout - handled silently, trying alternative methods');
          // Don't set authError for timeout - let it try email query or fail silently
          setIsLoading(false);
          return; // Exit early without showing error
        }
        // If profile doesn't exist (PGRST116 = no rows returned)
        if (profileError.code === 'PGRST116') {
          console.warn('Profile not found for user:', userId);
          setAuthError('User profile not found. Please contact support or sign up again.');
          setIsLoading(false);
          return; // Exit early
        }
        // If it's an RLS error, provide helpful message
        if (profileError.message?.includes('row-level security') || profileError.message?.includes('RLS')) {
          console.error('RLS policy blocking profile access:', profileError);
          setAuthError('Access denied. Please check your account permissions. Make sure you have run the RLS policies SQL.');
          setIsLoading(false);
          return;
        }
        throw profileError;
      }

      if (!profile) {
        console.error('Profile is null after loading');
        setAuthError('User profile not found.');
        setIsLoading(false);
        return;
      }

      console.log('✅ Profile loaded:', profile);

      // Get user role
      console.log('🔍 Loading user role for user_id:', userId);
      const { data: userRole, error: roleError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (roleError) {
        console.error('❌ Error loading user role:', roleError);
        console.error('Role error details:', {
          code: roleError.code,
          message: roleError.message,
          details: roleError.details,
          hint: roleError.hint
        });
        // If role doesn't exist (PGRST116 = no rows returned)
        if (roleError.code === 'PGRST116') {
          console.warn('User role not found for user:', userId);
          setAuthError('User role not found. Please contact support or sign up again.');
          setIsLoading(false);
          return; // Exit early
        }
        // If it's an RLS error, provide helpful message
        if (roleError.message?.includes('row-level security') || roleError.message?.includes('RLS')) {
          console.error('RLS policy blocking role access:', roleError);
          setAuthError('Access denied. Please check your account permissions. Make sure you have run the RLS policies SQL.');
          setIsLoading(false);
          return;
        }
        throw roleError;
      }

      if (!userRole) {
        console.error('User role is null after loading');
        setAuthError('User role not found.');
        setIsLoading(false);
        return;
      }

      console.log('✅ User role loaded:', userRole);

      // Set user data
      setUser({
        id: profile.id,
        name: profile.first_name || '',
        preferredTitle: profile.preferred_title || undefined,
        email: profile.email || '',
        schoolName: profile.school_name || undefined,
      });
      setRole(userRole.role as 'teacher' | 'admin');
      setSchoolId(userRole.school_id);
      
      console.log('✅ User profile and role loaded successfully');
    } catch (error: any) {
      console.error('Error loading user profile:', error);
      const msg = error?.message ?? '';
      setAuthError(msg.toLowerCase().includes('failed to fetch') ? 'Incorrect Username/Password. Please Try Again' : (msg || 'Failed to load user profile'));
      // Don't clear user/auth state on error - let user try again
    } finally {
      setIsLoading(false);
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          setIsLoading(false);
          return;
        }
        
        if (session?.user) {
          await loadUserProfile(session.user.id, session.user.email);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserProfile(session.user.id, session.user.email);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setRole(null);
          setSchoolId(null);
          setIsLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign up function
  const signUp = async (
    email: string,
    password: string,
    schoolCode: string,
    name: string,
    selectedRole: 'teacher' | 'admin'
  ) => {
    try {
      setIsLoading(true);
      setAuthError(null);
      
      // Call edge function to create user with service role (ensures user exists before inserting into user_roles)
      const SUPABASE_URL = "https://dqynrbjixuidwqiacggx.supabase.co";
      const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxeW5yYmppeHVpZHdxaWFjZ2d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5ODU5ODMsImV4cCI6MjA2NDU2MTk4M30.9DLDHfIJk03MvxOtlgHF6quVNgGqzMARpDaLiwYmBFE";
      
      console.log('Calling teacher-admin-signup edge function...');
      const response = await fetch(`${SUPABASE_URL}/functions/v1/teacher-admin-signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          email,
          password,
          name,
          schoolCode: schoolCode.toUpperCase(),
          role: selectedRole,
        }),
      });

      console.log('Response status:', response.status, response.statusText);

      if (!response.ok) {
        let errorMessage = 'Failed to create account';
        try {
          const errorText = await response.text();
          console.error('Error response text:', errorText);
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || `Server error: ${response.status} ${response.statusText}`;
          console.error('Signup error response:', errorData);
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}. The edge function may not be deployed yet.`;
          console.error('Failed to parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Set session using the returned tokens
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });

      if (sessionError) {
        throw sessionError;
      }

      // Load user profile - wait for it to complete
      try {
        await loadUserProfile(data.id, data.email);
      } catch (profileError: any) {
        console.error('Error loading profile after sign up:', profileError);
        // Don't throw - account was created successfully, profile might load later
        // The auth state change listener will retry
      }
      
      // Sign-up successful - loading will be set to false by loadUserProfile
    } catch (error: any) {
      console.error('Sign up error:', error);
      setAuthError(error.message || 'Failed to create account');
      setIsLoading(false);
      throw error;
    }
  };

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setAuthError(null);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in auth error:', error);
        throw error;
      }
      
      if (data.user) {
        await loadUserProfile(data.user.id, data.user.email);
      } else {
        throw new Error('No user data returned from sign in');
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      const msg = error?.message ?? '';
      setAuthError(msg.toLowerCase().includes('failed to fetch') ? 'Incorrect Username/Password. Please Try Again' : 'Incorrect Email/Password. Try again');
      setIsLoading(false);
      throw error;
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      // Sign out from Supabase first
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear all auth state immediately
      setUser(null);
      setRole(null);
      setSchoolId(null);
      
      // Don't set isLoading - let the ProtectedRoute handle redirect
      // Setting isLoading would prevent the automatic redirect to /auth
    } catch (error) {
      console.error('Sign out error:', error);
      // Even if there's an error, clear local state
      setUser(null);
      setRole(null);
      setSchoolId(null);
      throw error;
    }
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  const completeTutorial = () => {
    localStorage.setItem('clocked_tutorial_completed', 'true');
  };

  const isAdmin = () => role === 'admin';
  const isTeacher = () => role === 'teacher';

  // Refresh user profile after updates
  const refreshUserProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadUserProfile(session.user.id, session.user.email);
      }
    } catch (error) {
      console.error('Error refreshing user profile:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        authError,
        logout: signOut,
        clearAuthError,
        isLoading,
        completeTutorial,
        role,
        schoolId,
        signUp,
        signIn,
        signOut,
        refreshUserProfile,
        isAdmin,
        isTeacher,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};
