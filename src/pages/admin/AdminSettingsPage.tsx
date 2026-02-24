import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { useAuthContext } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import HelpTooltip from "@/components/ui/HelpTooltip";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const AdminSettingsPage = () => {
  const { user, signOut, schoolId, refreshUserProfile } = useAuthContext();
  const { showHelpTooltips, toggleHelpTooltips, primaryColor, secondaryColor, tertiaryColor, updateColors } = useSettings();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [tempPrimaryColor, setTempPrimaryColor] = useState(primaryColor);
  const [tempSecondaryColor, setTempSecondaryColor] = useState(secondaryColor);
  const [tempTertiaryColor, setTempTertiaryColor] = useState(tertiaryColor);
  const [isSaving, setIsSaving] = useState(false);

  // Sync form fields when user object changes
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, [user]);
  
  const handleSaveSettings = async () => {
    // Validation
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not found. Please sign in again.",
        variant: "destructive",
      });
      return;
    }

    if (!name.trim()) {
      toast({
        title: "Validation Error",
        description: "Name is required.",
        variant: "destructive",
      });
      return;
    }

    if (!email.trim()) {
      toast({
        title: "Validation Error",
        description: "Email is required.",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Split name into first_name and last_name (if space exists, otherwise use full name as first_name)
      const nameParts = name.trim().split(/\s+/);
      const first_name = nameParts[0] || name.trim();
      const last_name = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

      const { data, error } = await supabase
        .from('profiles')
        .update({
          first_name: first_name,
          last_name: last_name,
          email: email.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Profile update error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });

        // Handle specific error cases
        if (error.code === '42501' || error.message?.includes('row-level security') || error.message?.includes('RLS')) {
          throw new Error('Permission denied. Please check your account permissions or contact support.');
        }
        
        if (error.code === '23505') {
          throw new Error('This email is already in use by another account.');
        }

        throw error;
      }

      if (!data) {
        throw new Error('Update succeeded but no data returned. Please try refreshing the page.');
      }

      // Refresh user profile in context
      await refreshUserProfile();

      toast({
        title: "Settings saved",
        description: "Your account settings have been updated successfully.",
      });
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveColors = () => {
    updateColors(tempPrimaryColor, tempSecondaryColor, tempTertiaryColor);
    toast({
      title: "Colors updated",
      description: "Your color preferences have been saved successfully.",
    });
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      // Navigation will happen automatically via ProtectedRoute redirect
      // But navigate anyway as a fallback
      navigate('/auth', { replace: true });
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };
   
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#012D68] mb-1">
            {user?.name}'s Settings
          </h1>
          <p className="text-gray-600 text-base">Manage your account information</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleSignOut}
            className="bg-[#012D68] hover:bg-[#011f4a] text-white border-2 border-[#012D68] px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <LogOut className="mr-3 h-6 w-6" /> Sign Out
          </Button>
        </div>
      </div>
      
      {/* Settings Cards */}
      <div className="grid gap-6 md:grid-cols-1">
        {/* Account Settings Card */}
        <Card className="border-0 shadow-lg">
          <div className="bg-[#012D68] rounded-t-lg p-4">
            <div className="flex items-center mb-1">
              <CardTitle className="text-xl font-bold text-white">Account Settings</CardTitle>
              <HelpTooltip content="Update your personal information and account details" />
            </div>
            <p className="text-gray-200 text-sm">Update your personal information</p>
          </div>
          <CardContent className="space-y-4 p-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your preferred name"
                  className="border-gray-200 rounded-md"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="border-gray-200 rounded-md"
                />
              </div>
              <Button 
                variant="outline"
                className="w-full bg-white border border-[#012D68] text-[#012D68] hover:bg-gray-50 hover:border-[#012D68] text-lg font-semibold shadow-lg transition-all duration-200 mt-6 disabled:opacity-50" 
                onClick={handleSaveSettings}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
        </Card>

        {/* Display Settings Card */}
        <Card className="border-0 shadow-lg">
          <div className="bg-[#012D68] rounded-t-lg p-4">
            <div className="flex items-center mb-1">
              <CardTitle className="text-xl font-bold text-white">Display Settings</CardTitle>
              <HelpTooltip content="Customize your interface preferences" />
            </div>
            <p className="text-gray-200 text-sm">Adjust interface settings</p>
          </div>
          <CardContent className="space-y-6 p-4">
            {/* Help Tooltips Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="help-tooltips" className="text-base font-medium">
                  Show Help Tooltips
                </Label>
                <p className="text-sm text-gray-500">
                  Display question mark icons with helpful explanations
                </p>
              </div>
              <Switch
                id="help-tooltips"
                checked={showHelpTooltips}
                onCheckedChange={toggleHelpTooltips}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      </div>
  );
};

export default AdminSettingsPage;