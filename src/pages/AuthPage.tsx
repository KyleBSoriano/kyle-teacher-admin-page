import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthContext } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";

const AuthPage = () => {
  const navigate = useNavigate();
  const { 
    isAuthenticated, 
    isLoading,
    authError,
    clearAuthError,
    signUp,
    signIn,
    role
  } = useAuthContext();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [schoolCode, setSchoolCode] = useState('');
  const [selectedRole, setSelectedRole] = useState<'teacher' | 'admin'>('teacher');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect authenticated users to appropriate dashboard
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      if (role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, isLoading, role, navigate]);

  // Handle sign up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({ 
        title: 'Error', 
        description: 'Password must be at least 6 characters',
        variant: 'destructive'
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      await signUp(email, password, schoolCode, name, selectedRole);
      toast({
        title: 'Account created',
        description: 'Your account has been created successfully.',
      });
      // Navigation will happen automatically via useEffect
    } catch (error: any) {
      // Error is handled by AuthContext and shown via authError
      console.error('Sign up error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle sign in
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await signIn(email, password);
      toast({
        title: 'Signed in',
        description: 'Welcome back!',
      });
      // Navigation will happen automatically via useEffect
    } catch (error: any) {
      // Error is handled by AuthContext and shown via authError
      console.error('Sign in error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state
  if (isLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5] p-4">
        <Card className="w-full max-w-md border-gray-200 bg-white shadow-sm">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <img 
                src="/clocked-logo.png" 
                alt="CLocked Logo" 
                className="h-16 w-auto"
              />
            </div>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-[#012D68] rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-[#012D68] rounded-full animate-pulse delay-100"></div>
              <div className="w-2 h-2 bg-[#012D68] rounded-full animate-pulse delay-200"></div>
            </div>
            <p className="text-[#012D68] font-medium">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5] p-4">
      <Card className="w-full max-w-md border-gray-200 bg-white shadow-sm">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center mb-2">
            <img 
              src="/clocked-logo.png" 
              alt="CLocked Logo" 
              className="h-14 w-auto"
            />
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {authError && !authError.toLowerCase().includes('timeout') && (
            <p className="mb-4 text-sm text-red-600 font-medium">
              {authError.toLowerCase().includes('failed to fetch') ? 'Incorrect Username/Password. Please Try Again' : authError}
            </p>
          )}

          <Tabs value={isSignUp ? 'signup' : 'signin'} onValueChange={(value) => setIsSignUp(value === 'signup')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Login</TabsTrigger>
              <TabsTrigger value="signup">Create an Account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-3 mt-3">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="teacher@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-[#012D68] hover:bg-[#012D68]/90 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Logging In...' : 'Login'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-2.5 mt-3">
              <form onSubmit={handleSignUp} className="space-y-2.5">
                <div className="space-y-2">
                  <Label htmlFor="signup-role">Role</Label>
                  <Select
                    value={selectedRole}
                    onValueChange={(value) => setSelectedRole(value as 'teacher' | 'admin')}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="signup-role">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Enter your preferred name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="teacher@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-school-code">4-Digit School Code</Label>
                  <Input
                    id="signup-school-code"
                    type="text"
                    placeholder="Enter your school code"
                    value={schoolCode}
                    onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                    required
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-gray-500">Code provided by administrator</p>
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-[#012D68] hover:bg-[#012D68]/90 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating Account...' : 'Create an Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
