import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X, Wifi, Battery, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ConfirmAttendancePage = () => {
  const { classId } = useParams<{ classId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [isQRExpired, setIsQRExpired] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAutoClockInAttempted, setIsAutoClockInAttempted] = useState(false);
  
  // Check authentication and auto-clock-in on page load
  useEffect(() => {
    const checkAuthAndClockIn = async () => {
      if (!classId) return;
      
      try {
        // Check if user is authenticated
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          setIsAuthenticated(false);
          setIsAutoClockInAttempted(true);
          return;
        }
        
        setIsAuthenticated(true);
        
        // Auto-clock-in authenticated student
        const accessToken = session.access_token;
        const response = await fetch(`https://dqynrbjixuidwqiacggx.supabase.co/functions/v1/clock-in-via-qr`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            class_id: classId
          })
        });

        const result = await response.json();
        
        if (result.ok) {
          setIsConfirmed(true);
          toast({
            title: "Successfully Clocked In",
            description: result.message || `You've been clocked in to ${result.class_subject || 'class'}.`,
          });
        } else if (result.error) {
          // Handle specific errors
          if (result.error.includes("not enrolled")) {
            toast({
              title: "Not Enrolled",
              description: "You are not enrolled in this class. Please contact your teacher.",
              variant: "destructive",
            });
          } else if (result.error.includes("Unauthorized")) {
            toast({
              title: "Authentication Required",
              description: "Please sign in to clock in.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Error",
              description: result.error || "Failed to clock in. Please try again.",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error('Error during auto clock-in:', error);
        toast({
          title: "Error",
          description: "Failed to clock in automatically. You can try the manual confirmation below.",
          variant: "destructive",
        });
      } finally {
        setIsAutoClockInAttempted(true);
      }
    };

    checkAuthAndClockIn();
  }, [classId]);
  
  // Check QR code timestamp validity (lenient client-side check)
  useEffect(() => {
    const timestamp = searchParams.get('t');
    if (timestamp) {
      const qrTime = parseInt(timestamp);
      const currentTime = Date.now();
      const timeDifference = currentTime - qrTime;
      
      // QR code expires after 15 seconds on client (more lenient than server)
      // Server will do the strict 10-second check
      if (timeDifference > 15000) {
        setIsQRExpired(true);
      }
    } else {
      // If no timestamp, assume it's an old QR code
      setIsQRExpired(true);
    }
  }, [searchParams]);
  
  // Mock class data for the confirmation page - no need for context
  const classData = { subject: "Algebra I", period: "Period 1" };
  
  const handleConfirm = async () => {
    if (!classId || isQRExpired) return;
    
    setIsLoading(true);
    try {
      // Get timestamp from URL parameters
      const timestamp = searchParams.get('t');
      
      // Call the public edge function to record attendance
      const response = await fetch(`https://dqynrbjixuidwqiacggx.supabase.co/functions/v1/record-attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          classId,
          studentName: `Student ${Date.now()}`,
          timestamp: timestamp
        })
      });

      const result = await response.json();
      
      // Handle expired QR codes from server response
      if (!result.success && result.expired) {
        setIsQRExpired(true);
        throw new Error(result.error || 'QR code has expired');
      }
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to record attendance');
      }

      setIsConfirmed(true);
      
      toast({
        title: "Attendance Confirmed",
        description: `You've joined ${classData?.subject || 'CLocked Class'}.`,
      });
    } catch (error) {
      console.error('Error confirming attendance:', error);
      toast({
        title: "Error",
        description: "Failed to confirm attendance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingEmail(true);
    try {
      // Get timestamp from URL parameters  
      const timestamp = searchParams.get('t');
      
      // Call the edge function to save email
      const response = await fetch(`https://dqynrbjixuidwqiacggx.supabase.co/functions/v1/record-attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          classId,
          email: email.trim(),
          studentName: `Student ${Date.now()}`,
          timestamp: timestamp
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Email Saved",
          description: "Thank you for providing your email!",
        });
        
        // Redirect after a short delay
        setTimeout(() => {
          navigate(`/student/${classId}`);
        }, 2000);
      } else {
        throw new Error('Failed to save email');
      }
    } catch (error) {
      console.error('Error saving email:', error);
      toast({
        title: "Error",
        description: "Failed to save email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingEmail(false);
    }
  };
  
  // QR codes no longer expire, so we removed the expiration check
  
  if (isConfirmed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-[#012D68] to-[#1a4285] text-white px-4 py-4 flex items-center justify-between shadow-lg">
          <span className="text-lg font-semibold">19:02</span>
          <span className="text-lg font-bold tracking-wide">CLocked</span>
          <div className="flex items-center space-x-2">
            <Wifi className="w-4 h-4" />
            <span className="text-xs">LTE</span>
            <Battery className="w-6 h-3" />
          </div>
        </div>

        <div className="flex-1 bg-white flex flex-col items-center justify-center p-6">
          <div className="animate-fade-in max-w-md w-full">
            <h1 className="text-4xl font-bold mb-4 text-center text-gray-800">
              You're now "CLocked In"
            </h1>
            
            <p className="text-center text-gray-600 mb-8 px-4 leading-relaxed text-lg">
              Enter your email to keep in touch, and feel free to request a demo directly on our website!
            </p>

            <div className="w-full space-y-4">
              <div className="relative">
                <input
                  type="email"
                  placeholder="Enter Email here"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-lg focus:border-[#012D68] focus:ring-2 focus:ring-[#012D68]/20 transition-all duration-200 outline-none"
                />
              </div>
              
              <Button 
                onClick={handleSave}
                disabled={isSavingEmail}
                className="w-full bg-gradient-to-r from-[#012D68] to-[#1a4285] hover:from-[#1a4285] hover:to-[#2557a0] text-white rounded-xl h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingEmail ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Show expired QR code error
  if (isQRExpired) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Mobile Header */}
        <div className="bg-[#012D68] text-white px-4 py-3 flex items-center justify-between">
          <span className="text-lg font-medium">19:02</span>
          <span className="text-lg font-bold">CLocked</span>
          <div className="flex items-center space-x-1">
            <div className="flex space-x-0.5">
              <div className="w-1 h-2 bg-white rounded-full"></div>
              <div className="w-1 h-2 bg-white rounded-full"></div>
              <div className="w-1 h-2 bg-white rounded-full"></div>
              <div className="w-1 h-2 bg-white rounded-full"></div>
            </div>
            <span className="text-xs ml-1">LTE</span>
            <Battery className="w-5 h-3 ml-1" />
          </div>
        </div>

        <div className="flex-1 bg-white flex flex-col items-center justify-center px-6 py-8">
          <div className="w-full max-w-sm text-center">
            <div className="mb-6">
              <AlertTriangle className="w-20 h-20 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-4 text-red-600">QR Code Expired</h1>
              <p className="text-gray-600 mb-6">
                This QR code has expired for security reasons. Please scan the current QR code displayed by your teacher.
              </p>
              <Button 
                onClick={() => window.close()}
                className="bg-[#012D68] hover:bg-[#1a4285] text-white px-8 py-3 rounded-lg font-semibold"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Show loading state while checking auth
  if (!isAutoClockInAttempted) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="bg-[#012D68] text-white px-4 py-3 flex items-center justify-between">
          <span className="text-lg font-medium">19:02</span>
          <span className="text-lg font-bold">CLocked</span>
          <div className="flex items-center space-x-1">
            <div className="flex space-x-0.5">
              <div className="w-1 h-2 bg-white rounded-full"></div>
              <div className="w-1 h-2 bg-white rounded-full"></div>
              <div className="w-1 h-2 bg-white rounded-full"></div>
              <div className="w-1 h-2 bg-white rounded-full"></div>
            </div>
            <span className="text-xs ml-1">LTE</span>
            <Battery className="w-5 h-3 ml-1" />
          </div>
        </div>

        <div className="flex-1 bg-white flex flex-col items-center justify-center px-6 py-8">
          <div className="w-full max-w-sm text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#012D68] mx-auto mb-4"></div>
            <p className="text-gray-600">Checking authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Mobile Header */}
      <div className="bg-[#012D68] text-white px-4 py-3 flex items-center justify-between">
        <span className="text-lg font-medium">19:02</span>
        <span className="text-lg font-bold">CLocked</span>
        <div className="flex items-center space-x-1">
          <div className="flex space-x-0.5">
            <div className="w-1 h-2 bg-white rounded-full"></div>
            <div className="w-1 h-2 bg-white rounded-full"></div>
            <div className="w-1 h-2 bg-white rounded-full"></div>
            <div className="w-1 h-2 bg-white rounded-full"></div>
          </div>
          <span className="text-xs ml-1">LTE</span>
          <Battery className="w-5 h-3 ml-1" />
        </div>
      </div>

      <div className="flex-1 bg-white flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-bold mb-8 text-center text-black">Welcome to CLocked!</h1>
          
          {/* Clock Icon Container */}
          <div className="bg-gray-50 rounded-2xl p-8 mb-8 shadow-sm border border-gray-100">
            <div className="flex justify-center">
              <div className="w-32 h-32">
                <img 
                  src="/lovable-uploads/676db90f-c066-4584-b6b6-992bc26e8c50.png" 
                  alt="CLocked Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>

          {!isAuthenticated && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-sm text-blue-800 text-center">
              For automatic clock-in, please use the CLocked mobile app. You can also confirm manually below.
            </p>
          </div>
          )}

          <p className="text-lg mb-8 text-center text-black">Are you in this class now?</p>
          
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-1 text-[#012D68]">
              Mr. Soriano's
            </h2>
            <h3 className="text-2xl font-bold mb-2 text-[#012D68]">CLocked Class</h3>
            <p className="text-gray-500">Startup UCLA</p>
          </div>
          
          <Button 
            onClick={handleConfirm} 
            disabled={isLoading}
            className="w-full bg-[#012D68] hover:bg-[#1a4285] text-white rounded-xl h-14 text-lg font-semibold mb-6 shadow-sm"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Confirming...
              </div>
            ) : (
              "Confirm"
            )}
          </Button>
          
          <button 
            onClick={() => window.close()} 
            className="text-black hover:text-gray-700 underline text-lg block w-full text-center"
          >
            Wrong class
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmAttendancePage;