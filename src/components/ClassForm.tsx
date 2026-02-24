import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Class } from "@/types";
import { ArrowLeft, Plus } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

interface ClassFormProps {
  initialData?: Class;
  onSubmit: (data: Omit<Class, "id">) => void;
  isEditing?: boolean;
}

const ClassForm = ({ initialData, onSubmit, isEditing = false }: ClassFormProps) => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<Omit<Class, "id">>({
    period: initialData?.period || "",
    subject: initialData?.subject || "",
    description: initialData?.description || "",
    startTime: "",
    endTime: "",
    students: initialData?.students || [],
    allowedApps: initialData?.allowedApps || [],
  });

  const [startPeriod, setStartPeriod] = useState("AM");
  const [endPeriod, setEndPeriod] = useState("AM");
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    // Advance tutorial to step 3 if we're in tutorial mode and on step 2
    if (window.location.pathname === '/classes/new') {
      // Tutorial advancement will be handled by the parent component (CreateClassPage)
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <Link 
          to="/classes" 
          className="inline-flex items-center text-sm text-[#012D68] hover:text-[#011f4a] mb-6"
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Classes
        </Link>
        
        <h1 className="text-2xl font-bold text-[#012D68] mb-1">
          {isEditing ? "Edit Class" : "Create New Class"}
        </h1>
        <p className="text-gray-600 text-base">
          {isEditing 
            ? "Update your class settings and information" 
            : "Create a new class to manage students and app permissions"
          }
        </p>
      </div>
      
      <Card className="bg-white shadow-lg rounded-lg border border-gray-200 drop-shadow-md p-6" data-tutorial="class-form">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="period" className="text-[#012D68] font-medium">Period *</Label>
                <Select
                  value={formData.period}
                  onValueChange={(value) => setFormData({ ...formData, period: value })}
                  required
                >
                  <SelectTrigger className="border-gray-300 focus:border-[#012D68] focus:ring-[#012D68]">
                    <SelectValue placeholder="Select a Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Period 0">Period 0</SelectItem>
                    <SelectItem value="Period 1">Period 1</SelectItem>
                    <SelectItem value="Period 2">Period 2</SelectItem>
                    <SelectItem value="Period 3">Period 3</SelectItem>
                    <SelectItem value="Period 4">Period 4</SelectItem>
                    <SelectItem value="Period 5">Period 5</SelectItem>
                    <SelectItem value="Period 6">Period 6</SelectItem>
                    <SelectItem value="Period 7">Period 7</SelectItem>
                    <SelectItem value="Period 8">Period 8</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-[#012D68] font-medium">Subject *</Label>
                <Input
                  id="subject"
                  placeholder="Enter subject"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="border-gray-300 focus:border-[#012D68] focus:ring-[#012D68]"
                />
              </div>
            </div>

          </div>
          
          <div className="flex justify-end space-x-4 pt-4">
            <Button 
              variant="outline" 
              type="button" 
              onClick={() => navigate("/classes")}
              className="border-gray-300 text-gray-600 hover:bg-gray-50 px-4 py-2 h-10 rounded-lg"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-[#012D68] hover:bg-[#011f4a] px-4 py-2 h-10 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg"
              data-tutorial="create-class-submit"
            >
              <Plus className="mr-2 h-4 w-4" />
              {isEditing ? "Update Class" : "Create Class"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ClassForm;