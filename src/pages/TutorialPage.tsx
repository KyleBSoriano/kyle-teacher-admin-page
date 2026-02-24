
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, ArrowLeft, Users, BookOpen, Smartphone, BarChart3, CheckCircle, QrCode } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";

const tutorialSteps = [
  {
    id: 1,
    title: "Welcome to CLocked!",
    description: "Your complete student device management solution for the modern classroom.",
    icon: CheckCircle,
    content: (
      <div className="text-center space-y-4">
        <img 
          src="/lovable-uploads/316d69a0-affc-4b95-92dc-630d3fa84396.png" 
          alt="CLocked Logo" 
          className="h-16 w-auto mx-auto"
        />
        <p className="text-lg text-gray-700">
          Transform your classroom technology management with CLocked. 
          Control what students can access on their devices during class time.
        </p>
      </div>
    )
  },
  {
    id: 2,
    title: "Create & Manage Classes",
    description: "Set up your class periods with subjects, schedules, and room assignments.",
    icon: BookOpen,
    content: (
      <div className="space-y-4">
        <h4 className="font-semibold text-[#012D68]">Class Management Features:</h4>
        <ul className="space-y-2 text-gray-700">
          <li>• Create multiple class periods</li>
          <li>• Set subjects and room numbers</li>
          <li>• Schedule class times</li>
          <li>• Add descriptions and notes</li>
        </ul>
        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
          Access via the Classes section in your sidebar
        </p>
      </div>
    )
  },
  {
    id: 3,
    title: "Student Enrollment & QR Check-ins",
    description: "Add students to classes and manage attendance with QR code scanning.",
    icon: Users,
    content: (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 items-center">
          <div>
            <h4 className="font-semibold text-[#012D68] mb-2">Student Management:</h4>
            <ul className="space-y-1 text-gray-700">
              <li>• Enroll students in classes</li>
              <li>• Generate QR codes</li>
              <li>• Monitor device compliance</li>
            </ul>
          </div>
          <div className="text-center">
            <QrCode className="w-16 h-16 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Students scan to join class</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 4,
    title: "App Control & Restrictions",
    description: "Control which apps students can access during class time for focused learning.",
    icon: Smartphone,
    content: (
      <div className="space-y-4">
        <h4 className="font-semibold text-[#012D68]">Smart App Control:</h4>
        <div className="grid grid-cols-2 gap-4">
          <ul className="space-y-2 text-gray-700">
            <li>• Educational apps approved</li>
            <li>• Social media blocked</li>
          </ul>
          <ul className="space-y-2 text-gray-700">
            <li>• Custom app permissions</li>
            <li>• Per-class settings</li>
          </ul>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="bg-green-50 p-2 rounded text-center">
            <div className="w-8 h-8 bg-green-500 rounded mx-auto mb-1"></div>
            <span className="text-xs">Calculator ✓</span>
          </div>
          <div className="bg-red-50 p-2 rounded text-center">
            <div className="w-8 h-8 bg-red-500 rounded mx-auto mb-1"></div>
            <span className="text-xs">TikTok ✗</span>
          </div>
          <div className="bg-green-50 p-2 rounded text-center">
            <div className="w-8 h-8 bg-green-500 rounded mx-auto mb-1"></div>
            <span className="text-xs">Khan Academy ✓</span>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 5,
    title: "Analytics & Insights",
    description: "Get real-time insights into attendance, engagement, and device usage patterns.",
    icon: BarChart3,
    content: (
      <div className="space-y-4">
        <h4 className="font-semibold text-[#012D68]">Comprehensive Analytics:</h4>
        <div className="grid grid-cols-2 gap-4">
          <ul className="space-y-2 text-gray-700">
            <li>• Real-time attendance</li>
            <li>• Device compliance tracking</li>
          </ul>
          <ul className="space-y-2 text-gray-700">
            <li>• App usage analytics</li>
            <li>• Weekly & monthly reports</li>
          </ul>
        </div>
        <div className="bg-gray-50 p-4 rounded">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold">Class Engagement</span>
            <span className="text-xl font-bold text-blue-600">92%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{width: '92%'}}></div>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Attendance: 28/30</span>
            <span>Devices: 26/28</span>
          </div>
        </div>
      </div>
    )
  }
];

const TutorialPage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const { user, completeTutorial } = useAuthContext();

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    completeTutorial();
    navigate("/");
  };

  const handleSkip = () => {
    completeTutorial();
    navigate("/");
  };

  const currentTutorialStep = tutorialSteps[currentStep];
  const Icon = currentTutorialStep.icon;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#012D68] mb-2">
            Welcome, {user?.name || 'User'}!
          </h1>
          <p className="text-gray-600">Let's get you started with CLocked</p>
        </div>

        {/* Main Card */}
        <Card className="mb-8">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Icon className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">{currentTutorialStep.title}</CardTitle>
            <CardDescription className="text-lg">
              {currentTutorialStep.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="min-h-[300px]">
            {currentTutorialStep.content}
          </CardContent>
        </Card>

        {/* Progress */}
        <div className="flex justify-center mb-6">
          <div className="flex space-x-2">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full ${
                  index === currentStep ? "bg-blue-600" : 
                  index < currentStep ? "bg-blue-300" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={handleSkip}>
            Skip Tutorial
          </Button>

          <div className="flex space-x-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handlePrevious}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
            )}

            {currentStep < tutorialSteps.length - 1 ? (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleComplete}>
                Get Started!
                <CheckCircle className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>

        {/* Step counter */}
        <div className="text-center mt-4">
          <span className="text-gray-500">
            Step {currentStep + 1} of {tutorialSteps.length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TutorialPage;
