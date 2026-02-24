import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, ChevronRight, X, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScheduleModal = ({ isOpen, onClose }: ScheduleModalProps) => {
  const [currentWeek, setCurrentWeek] = useState(0);
  const [scheduleType, setScheduleType] = useState("MTWF");
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("Default");

  const periods = [
    "Period 0", "Period 1", "Period 2", "Period 3", "Period 4",
    "Period 5", "Period 6", "Period 7", "Period 8"
  ];

  const days = [
    { short: "M", full: "Monday", value: "monday" },
    { short: "T", full: "Tuesday", value: "tuesday" },
    { short: "W", full: "Wednesday", value: "wednesday" },
    { short: "T", full: "Thursday", value: "thursday" },
    { short: "F", full: "Friday", value: "friday" }
  ];

  const templates = ["Default", "Lunch", "Passing"];

  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const handleCreateTimeBlock = () => {
    // Here you would implement the logic to create the time block
    console.log({
      period: selectedPeriod,
      startTime,
      endTime,
      days: selectedDays,
      repeatWeekly,
      template: selectedTemplate
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold text-[#012D68]">Create your bell schedule</DialogTitle>
              <p className="text-gray-600 mt-1">Friday May 23, 2025</p>
            </div>
            <Button variant="outline" size="icon" onClick={onClose} className="focus-visible:ring-0 focus-visible:ring-offset-0">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
          {/* Left Side - Create Time Block */}
          <div className="space-y-6">
            <Card className="bg-[#012D68]">
              <CardHeader className="text-white">
                <CardTitle>Create a Time Block</CardTitle>
                <p className="text-blue-200">Set the time blocks, for student use</p>
              </CardHeader>
              <CardContent className="bg-white space-y-6">
                {/* Period Selection */}
                <div className="space-y-2">
                  <Label>Select Time Block</Label>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Time Block" />
                    </SelectTrigger>
                    <SelectContent side="bottom">
                      {periods.map((period, index) => (
                        <SelectItem
                          key={period}
                          value={period}
                          className={index < periods.length - 1 ? "border-b border-gray-200" : ""}
                        >
                          {period}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom" className="border-t border-gray-200">
                        <div className="flex items-center gap-2">
                          <Plus className="w-4 h-4" />
                          Add custom time block
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Time Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Repeat On */}
                <div className="space-y-3">
                  <Label>Repeat On</Label>
                  <div className="flex gap-2">
                    {days.map((day) => (
                      <Button
                        key={day.value}
                        variant={selectedDays.includes(day.value) ? "default" : "outline"}
                        size="sm"
                        className={`w-10 h-10 rounded-full ${
                          selectedDays.includes(day.value) 
                            ? "bg-[#012D68] text-white" 
                            : "text-gray-600"
                        }`}
                        onClick={() => toggleDay(day.value)}
                      >
                        {day.short}
                      </Button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <Label htmlFor="repeat-weekly">Repeat Weekly?</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Yes</span>
                      <Switch 
                        id="repeat-weekly"
                        checked={repeatWeekly}
                        onCheckedChange={setRepeatWeekly}
                      />
                      <span className="text-sm">No</span>
                    </div>
                  </div>
                </div>

                {/* Template Selection */}
                <div className="space-y-3">
                  <Label>Select an App Template</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {templates.map((template) => (
                      <Card 
                        key={template}
                        className={`cursor-pointer border-2 ${
                          selectedTemplate === template 
                            ? "border-[#012D68] bg-blue-50" 
                            : "border-gray-200"
                        }`}
                        onClick={() => setSelectedTemplate(template)}
                      >
                        <CardContent className="p-4 text-center">
                          <h4 className="font-semibold">{template}</h4>
                          <p className="text-xs text-gray-600 mt-1">App Description here</p>
                          <div className="flex gap-1 mt-2 justify-center">
                            <div className="w-4 h-4 bg-green-500 rounded"></div>
                            <div className="w-4 h-4 bg-gray-400 rounded"></div>
                            <div className="w-4 h-4 bg-blue-500 rounded"></div>
                            <div className="w-4 h-4 bg-red-500 rounded"></div>
                          </div>
                          <span className="text-xs text-gray-500">+ 2 more</span>
                          <div className="flex gap-2 mt-3">
                            <Button size="sm" className="flex-1 text-xs">Activate</Button>
                            <Button variant="outline" size="sm" className="flex-1 text-xs">Edit</Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <Button 
                  className="w-full bg-[#012D68] hover:bg-[#011f4a]"
                  onClick={handleCreateTimeBlock}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Time Block
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Schedule View */}
          <div className="space-y-4">
            {/* Week Navigation */}
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setCurrentWeek(prev => prev - 1)}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="grid grid-cols-5 gap-2 flex-1 max-w-md">
                {[
                  { day: 'Mon', date: String(22 + currentWeek * 7) },
                  { day: 'Tue', date: String(23 + currentWeek * 7) },
                  { day: 'Wed', date: String(24 + currentWeek * 7) },
                  { day: 'Thu', date: String(25 + currentWeek * 7) },
                  { day: 'Fri', date: String(26 + currentWeek * 7) }
                ].map((item, index) => (
                  <div key={item.day} className="text-center">
                    <div className="text-sm text-gray-600 mb-1">{item.day}</div>
                    <div className="text-xl font-semibold text-[#012D68] mb-2">
                      {item.date}
                    </div>
                    {index === 4 ? (
                      <Select value="Use Preset">
                        <SelectTrigger className="h-7 text-xs px-2 text-white border-none bg-gray-400">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Use Preset">Use Preset</SelectItem>
                          <SelectItem value="MTWF">MTWF</SelectItem>
                          <SelectItem value="Minimum">Minimum</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Select value={index === 2 ? "Minimum..." : "MTWF"}>
                        <SelectTrigger className={`h-7 text-xs px-2 text-white border-none ${
                          index === 2 ? 'bg-[#012D68]' : 'bg-blue-400'
                        }`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MTWF">MTWF</SelectItem>
                          <SelectItem value="Minimum...">Minimum...</SelectItem>
                          <SelectItem value="Assembly">Assembly</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                ))}
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setCurrentWeek(prev => prev + 1)}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            {/* Schedule Grid */}
            <div className="relative bg-white rounded-lg border">
              {/* Time column */}
              <div className="absolute left-2 top-12 space-y-8">
                {['7 AM', '8 AM', '9 AM', '10 AM', '11 AM', '12 AM', '1 PM', '2 PM', '3 PM', '4 PM'].map((time) => (
                  <div key={time} className="text-[#012D68] font-medium text-xs">
                    {time}
                  </div>
                ))}
              </div>

              {/* Schedule columns */}
              <div className="grid grid-cols-5 gap-2 ml-16 p-4">
                {/* Monday-Thursday columns (with content) */}
                {[0, 1, 2, 3].map((dayIndex) => (
                  <div key={dayIndex} className="space-y-1">
                    {dayIndex === 2 ? (
                      // Wednesday (Minimum Day)
                      <>
                        <div className="bg-[#012D68] text-white p-2 rounded text-xs">
                          <div className="font-semibold">Period 1</div>
                          <div>9:00 - 9:47am</div>
                        </div>
                        <div className="bg-[#012D68] text-white p-2 rounded text-xs">
                          <div className="font-semibold">Period 2</div>
                          <div>9:54 - 10:41am</div>
                        </div>
                        <div className="bg-[#012D68] text-white p-2 rounded text-xs">
                          <div className="font-semibold">Period 3</div>
                          <div>10:48 - 11:35am</div>
                        </div>
                        <div className="bg-[#012D68] text-white p-2 rounded text-xs">
                          <div className="font-semibold">Period 4</div>
                          <div>11:35 - 12:31pm</div>
                        </div>
                        <div className="bg-blue-400 text-white p-2 rounded text-xs">
                          <div className="font-semibold">Lunch</div>
                          <div>12:31 - 1:12pm</div>
                        </div>
                        <div className="bg-[#012D68] text-white p-2 rounded text-xs">
                          <div className="font-semibold">Period 5</div>
                          <div>1:19 - 2:06pm</div>
                        </div>
                        <div className="bg-[#012D68] text-white p-2 rounded text-xs">
                          <div className="font-semibold">Period 6</div>
                          <div>2:13 - 3:00pm</div>
                        </div>
                      </>
                    ) : (
                      // Regular days
                      <>
                        <div className="bg-[#012D68] text-white p-2 rounded text-xs">
                          <div className="font-semibold">Period 1</div>
                          <div>8:30 - 9:27am</div>
                        </div>
                        <div className="bg-[#012D68] text-white p-2 rounded text-xs">
                          <div className="font-semibold">Period 2</div>
                          <div>9:34 - 10:31am</div>
                        </div>
                        <div className="bg-[#012D68] text-white p-2 rounded text-xs">
                          <div className="font-semibold">Period 3</div>
                          <div>10:38 - 11:35am</div>
                        </div>
                        <div className="bg-[#012D68] text-white p-2 rounded text-xs">
                          <div className="font-semibold">Period 4</div>
                          <div>11:42 - 12:41pm</div>
                        </div>
                        <div className="bg-blue-400 text-white p-2 rounded text-xs">
                          <div className="font-semibold">Lunch</div>
                          <div>12:41 - 1:22pm</div>
                        </div>
                        <div className="bg-[#012D68] text-white p-2 rounded text-xs">
                          <div className="font-semibold">Period 5</div>
                          <div>1:29 - 2:26pm</div>
                        </div>
                        <div className="bg-[#012D68] text-white p-2 rounded text-xs">
                          <div className="font-semibold">Period 6</div>
                          <div>2:33 - 3:30pm</div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                
                {/* Friday column (empty for testing) */}
                <div className="space-y-1">
                  <Button 
                    variant="outline" 
                    className="w-full h-20 border-dashed border-2 border-gray-300 text-gray-500 hover:border-[#012D68] hover:text-[#012D68]"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add a Block
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};