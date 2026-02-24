
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import { Settings, Home, MessageSquare, Clock, Phone, Search, Calculator } from "lucide-react";

const StudentMobilePage = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { getClassById } = useAppContext();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const classData = classId ? getClassById(classId) : undefined;
  
  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  if (!classData) {
    return <div>Class not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col max-w-sm mx-auto">
      {/* Header */}
      <div className="bg-[#012D68] text-white px-4 py-3 flex justify-between items-center">
        <span className="text-lg font-medium">{formatTime(currentTime)}</span>
        <div className="flex items-center space-x-1">
          <div className="flex space-x-1">
            <div className="w-1 h-3 bg-white rounded-full"></div>
            <div className="w-1 h-3 bg-white rounded-full"></div>
            <div className="w-1 h-3 bg-white rounded-full"></div>
            <div className="w-1 h-3 bg-white rounded-full"></div>
          </div>
          <span className="text-sm ml-2">LTE</span>
          <div className="w-6 h-3 bg-white rounded-sm ml-2"></div>
        </div>
      </div>

      {/* App Header */}
      <div className="bg-[#012D68] text-white text-center py-4">
        <h1 className="text-2xl font-bold text-white">CLocked</h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 space-y-6">
        {/* Welcome Section */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-[#012D68]">Welcome, Kyle!</h2>
          <Settings className="w-6 h-6 text-gray-600" />
        </div>

        {/* Achievement Card */}
        <div className="bg-blue-200 rounded-lg p-4 space-y-3">
          <p className="text-[#012D68] font-medium">
            You've arrived to class on time 3 days in a row!
          </p>
          
          <div className="bg-white rounded-lg p-3 border-l-4 border-blue-500">
            <div className="h-4"></div>
          </div>
          
          <div className="flex justify-between items-center">
            <p className="text-[#012D68] text-sm font-medium">
              You're in the top 1% at your school!
            </p>
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <Clock className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>

        {/* Attendance Stats */}
        <div className="flex space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-[#012D68] rounded-full"></div>
            <span className="text-sm text-gray-600">Day's attended</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <span className="text-sm text-gray-600">Perfect attendance</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 border-2 border-gray-300 rounded-full"></div>
            <span className="text-sm text-gray-600">School year</span>
          </div>
        </div>

        {/* Allowed Apps */}
        <div className="grid grid-cols-4 gap-4">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-12 h-12 bg-white border border-gray-200 rounded-lg flex items-center justify-center shadow-sm">
              <Phone className="w-6 h-6 text-gray-500" />
            </div>
            <span className="text-xs text-gray-700">Phone</span>
          </div>
          
          <div className="flex flex-col items-center space-y-2">
            <div className="w-12 h-12 bg-white border border-gray-200 rounded-lg flex items-center justify-center shadow-sm">
              <Search className="w-6 h-6 text-gray-500" />
            </div>
            <span className="text-xs text-gray-700">FindMy</span>
          </div>
          
          <div className="flex flex-col items-center space-y-2">
            <div className="w-12 h-12 bg-white border border-gray-200 rounded-lg flex items-center justify-center shadow-sm">
              <Settings className="w-6 h-6 text-gray-500" />
            </div>
            <span className="text-xs text-gray-700">Settings</span>
          </div>
          
          <div className="flex flex-col items-center space-y-2">
            <div className="w-12 h-12 bg-white border border-gray-200 rounded-lg flex items-center justify-center shadow-sm">
              <Calculator className="w-6 h-6 text-gray-500" />
            </div>
            <span className="text-xs text-gray-700">Calculator</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex justify-center">
          <div className="bg-blue-200 text-[#012D68] px-4 py-2 rounded-full text-sm font-medium">
            Q Search
          </div>
        </div>

        {/* Current Class Status */}
        <div className="text-center space-y-2 mt-8">
          <p className="text-gray-500 text-sm">You're currently CLocked into...</p>
          <h3 className="text-xl font-bold text-[#012D68]">
            {classData.subject} - {classData.period}
          </h3>
        </div>

        {/* Learn More Link */}
        <div className="text-center mt-6">
          <button 
            className="text-gray-500 text-sm underline"
            onClick={() => navigate('/')}
          >
            Click to learn more about CLocked
          </button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex justify-around">
          <div className="flex flex-col items-center space-y-1">
            <Home className="w-6 h-6 text-blue-500" />
            <span className="text-xs text-blue-500">Home</span>
          </div>
          <div className="flex flex-col items-center space-y-1">
            <MessageSquare className="w-6 h-6 text-gray-400" />
            <span className="text-xs text-gray-400">Reminders</span>
          </div>
          <div className="flex flex-col items-center space-y-1">
            <Clock className="w-6 h-6 text-gray-400" />
            <span className="text-xs text-gray-400">Streaks</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentMobilePage;
