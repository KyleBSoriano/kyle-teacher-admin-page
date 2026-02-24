import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface ViewScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ViewScheduleModal = ({ isOpen, onClose }: ViewScheduleModalProps) => {
  const [currentWeek, setCurrentWeek] = useState(0);
  const [scheduleType, setScheduleType] = useState("MTWF");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-3xl font-bold text-[#012D68]">Bell Schedule</DialogTitle>
              <p className="text-gray-600 mt-1">Full Schedule View</p>
            </div>
            <Button variant="outline" size="icon" onClick={onClose} className="focus-visible:ring-0 focus-visible:ring-offset-0">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="mt-6">
          {/* Schedule Container with Calendar Background */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            {/* Navigation and schedule container */}
            <div className="flex items-start justify-between mb-6">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setCurrentWeek(prev => prev - 1)}
                className="p-3 hover:bg-gray-100 rounded-lg mt-16"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>

              {/* Schedule Grid Container */}
              <div className="flex-1 relative mx-4">
                {/* Day headers */}
                <div className="grid grid-cols-5 gap-0 mb-4 ml-16">
                  <div className="text-center">
                    <div className="text-lg text-gray-600 mb-2">Mon</div>
                    <div className="text-3xl font-semibold text-[#012D68] mb-4">
                      {String(22 + currentWeek * 7)}
                    </div>
                    <Select value="MTWF">
                      <SelectTrigger className="h-8 text-sm px-3 text-white border-none bg-blue-400">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MTWF">MTWF</SelectItem>
                        <SelectItem value="Minimum">Minimum</SelectItem>
                        <SelectItem value="Assembly">Assembly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="text-center">
                    <div className="text-lg text-gray-600 mb-2">Tue</div>
                    <div className="text-3xl font-semibold text-[#012D68] mb-4">
                      {String(23 + currentWeek * 7)}
                    </div>
                    <Select value="MTWF">
                      <SelectTrigger className="h-8 text-sm px-3 text-white border-none bg-blue-400">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MTWF">MTWF</SelectItem>
                        <SelectItem value="Minimum">Minimum</SelectItem>
                        <SelectItem value="Assembly">Assembly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="text-center">
                    <div className="text-lg text-gray-600 mb-2">Wed</div>
                    <div className="text-3xl font-semibold text-[#012D68] mb-4">
                      {String(24 + currentWeek * 7)}
                    </div>
                    <Select 
                      value={scheduleType} 
                      onValueChange={setScheduleType}
                    >
                      <SelectTrigger className="h-8 text-sm px-3 text-white border-none bg-[#012D68]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MTWF">MTWF</SelectItem>
                        <SelectItem value="Minimum">Minimum</SelectItem>
                        <SelectItem value="Assembly">Assembly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="text-center">
                    <div className="text-lg text-gray-600 mb-2">Thu</div>
                    <div className="text-3xl font-semibold text-[#012D68] mb-4">
                      {String(25 + currentWeek * 7)}
                    </div>
                    <Select value="MTWF">
                      <SelectTrigger className="h-8 text-sm px-3 text-white border-none bg-blue-400">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MTWF">MTWF</SelectItem>
                        <SelectItem value="Minimum">Minimum</SelectItem>
                        <SelectItem value="Assembly">Assembly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="text-center">
                    <div className="text-lg text-gray-600 mb-2">Fri</div>
                    <div className="text-3xl font-semibold text-[#012D68] mb-4">
                      {String(26 + currentWeek * 7)}
                    </div>
                    <Select value="MTWF">
                      <SelectTrigger className="h-8 text-sm px-3 text-white border-none bg-blue-400">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MTWF">MTWF</SelectItem>
                        <SelectItem value="Minimum">Minimum</SelectItem>
                        <SelectItem value="Assembly">Assembly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Calendar Grid with Time Column and Schedule */}
                <div className="relative" style={{ height: '600px' }}>
                  {/* Time column */}
                  <div className="absolute left-0 top-0 w-16 h-full">
                    {['7 AM', '8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM'].map((time, index) => (
                      <div 
                        key={time} 
                        className="absolute text-[#012D68] font-medium text-sm text-right pr-2"
                        style={{ top: `${index * 60}px`, height: '60px', lineHeight: '16px' }}
                      >
                        {time}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Grid Background */}
                  <div className="absolute left-16 top-0 right-0 h-full">
                    {/* Horizontal grid lines */}
                    {Array.from({ length: 11 }, (_, i) => (
                      <div 
                        key={i} 
                        className="absolute w-full border-t border-gray-200"
                        style={{ top: `${i * 60}px` }}
                      />
                    ))}
                    {/* Vertical grid lines */}
                    {Array.from({ length: 6 }, (_, i) => (
                      <div 
                        key={i} 
                        className="absolute h-full border-l border-gray-200"
                        style={{ left: `${i * 20}%` }}
                      />
                    ))}
                  </div>

                  {/* Schedule Content Grid */}
                  <div className="absolute left-16 top-0 right-0 h-full grid grid-cols-5 gap-0">
                    {/* Monday Schedule */}
                    <div className="relative">
                      {/* Period 1: 8:30-9:27 (1.5 hours from 7AM = 90px top, 57min = 57px height) */}
                      <div 
                        className="absolute w-full bg-[#012D68] text-white p-2 rounded text-xs mx-1"
                        style={{ top: '90px', height: '57px' }}
                      >
                        <div className="font-semibold">Period 1</div>
                        <div className="opacity-90">8:30 - 9:27am</div>
                      </div>
                      {/* Period 2: 9:34-10:31 (2.57 hours from 7AM = 154px top, 57min = 57px height) */}
                      <div 
                        className="absolute w-full bg-[#012D68] text-white p-2 rounded text-xs mx-1"
                        style={{ top: '154px', height: '57px' }}
                      >
                        <div className="font-semibold">Period 2</div>
                        <div className="opacity-90">9:34 - 10:31am</div>
                      </div>
                      {/* Period 3: 10:38-11:35 (3.63 hours from 7AM = 218px top, 57min = 57px height) */}
                      <div 
                        className="absolute w-full bg-[#012D68] text-white p-2 rounded text-xs mx-1"
                        style={{ top: '218px', height: '57px' }}
                      >
                        <div className="font-semibold">Period 3</div>
                        <div className="opacity-90">10:38 - 11:35am</div>
                      </div>
                      {/* Period 4: 11:42-12:41 (4.7 hours from 7AM = 282px top, 59min = 59px height) */}
                      <div 
                        className="absolute w-full bg-[#012D68] text-white p-2 rounded text-xs mx-1"
                        style={{ top: '282px', height: '59px' }}
                      >
                        <div className="font-semibold">Period 4</div>
                        <div className="opacity-90">11:42 - 12:41pm</div>
                      </div>
                      {/* Lunch: 12:41-1:22 (5.68 hours from 7AM = 341px top, 41min = 41px height) */}
                      <div 
                        className="absolute w-full bg-blue-400 text-white p-2 rounded text-xs mx-1"
                        style={{ top: '341px', height: '41px' }}
                      >
                        <div className="font-semibold">Lunch</div>
                        <div className="opacity-90">12:41 - 1:22pm</div>
                      </div>
                      {/* Period 5: 1:29-2:26 (6.48 hours from 7AM = 389px top, 57min = 57px height) */}
                      <div 
                        className="absolute w-full bg-[#012D68] text-white p-2 rounded text-xs mx-1"
                        style={{ top: '389px', height: '57px' }}
                      >
                        <div className="font-semibold">Period 5</div>
                        <div className="opacity-90">1:29 - 2:26pm</div>
                      </div>
                      {/* Period 6: 2:33-3:30 (7.55 hours from 7AM = 453px top, 57min = 57px height) */}
                      <div 
                        className="absolute w-full bg-[#012D68] text-white p-2 rounded text-xs mx-1"
                        style={{ top: '453px', height: '57px' }}
                      >
                        <div className="font-semibold">Period 6</div>
                        <div className="opacity-90">2:33 - 3:30pm</div>
                      </div>
                    </div>

                    {/* Tuesday Schedule (Same as Monday) */}
                    <div className="relative">
                      <div 
                        className="absolute w-full bg-[#012D68] text-white p-2 rounded text-xs mx-1"
                        style={{ top: '90px', height: '57px' }}
                      >
                        <div className="font-semibold">Period 1</div>
                        <div className="opacity-90">8:30 - 9:27am</div>
                      </div>
                      <div 
                        className="absolute w-full bg-[#012D68] text-white p-2 rounded text-xs mx-1"
                        style={{ top: '154px', height: '57px' }}
                      >
                        <div className="font-semibold">Period 2</div>
                        <div className="opacity-90">9:34 - 10:31am</div>
                      </div>
                      <div 
                        className="absolute w-full bg-[#012D68] text-white p-2 rounded text-xs mx-1"
                        style={{ top: '218px', height: '57px' }}
                      >
                        <div className="font-semibold">Period 3</div>
                        <div className="opacity-90">10:38 - 11:35am</div>
                      </div>
                      <div 
                        className="absolute w-full bg-[#012D68] text-white p-2 rounded text-xs mx-1"
                        style={{ top: '282px', height: '59px' }}
                      >
                        <div className="font-semibold">Period 4</div>
                        <div className="opacity-90">11:42 - 12:41pm</div>
                      </div>
                      <div 
                        className="absolute w-full bg-blue-400 text-white p-2 rounded text-xs mx-1"
                        style={{ top: '341px', height: '41px' }}
                      >
                        <div className="font-semibold">Lunch</div>
                        <div className="opacity-90">12:41 - 1:22pm</div>
                      </div>
                      <div 
                        className="absolute w-full bg-[#012D68] text-white p-2 rounded text-xs mx-1"
                        style={{ top: '389px', height: '57px' }}
                      >
                        <div className="font-semibold">Period 5</div>
                        <div className="opacity-90">1:29 - 2:26pm</div>
                      </div>
                      <div 
                        className="absolute w-full bg-[#012D68] text-white p-2 rounded text-xs mx-1"
                        style={{ top: '453px', height: '57px' }}
                      >
                        <div className="font-semibold">Period 6</div>
                        <div className="opacity-90">2:33 - 3:30pm</div>
                      </div>
                    </div>

                    {/* Wednesday Schedule (Minimum Day) */}
                    <div className="relative">
                      {/* Period 1: 9:00-9:47 (2 hours from 7AM = 120px top, 47min = 47px height) */}
                      <div 
                        className="absolute w-full bg-[#012D68] text-white p-2 rounded text-xs mx-1"
                        style={{ top: '120px', height: '47px' }}
                      >
                        <div className="font-semibold">Period 1</div>
                        <div className="opacity-90">9:00 - 9:47am</div>
                      </div>
                      {/* Period 2: 9:54-10:41 (2.9 hours from 7AM = 174px top, 47min = 47px height) */}
                      <div 
                        className="absolute w-full bg-[#012D68] text-white p-2 rounded text-xs mx-1"
                        style={{ top: '174px', height: '47px' }}
                      >
                        <div className="font-semibold">Period 2</div>
                        <div className="opacity-90">9:54 - 10:41am</div>
                      </div>
                      {/* Period 3: 10:48-11:35 (3.8 hours from 7AM = 228px top, 47min = 47px height) */}
                      <div 
                        className="absolute w-full bg-[#012D68] text-white p-2 rounded text-xs mx-1"
                        style={{ top: '228px', height: '47px' }}
                      >
                        <div className="font-semibold">Period 3</div>
                        <div className="opacity-90">10:48 - 11:35am</div>
                      </div>
                      {/* Period 4: 11:35-12:31 (4.58 hours from 7AM = 275px top, 56min = 56px height) */}
                      <div 
                        className="absolute w-full bg-[#012D68] text-white p-2 rounded text-xs mx-1"
                        style={{ top: '275px', height: '56px' }}
                      >
                        <div className="font-semibold">Period 4</div>
                        <div className="opacity-90">11:35 - 12:31pm</div>
                      </div>
                      {/* Lunch: 12:31-1:12 (5.52 hours from 7AM = 331px top, 41min = 41px height) */}
                      <div 
                        className="absolute w-full bg-blue-400 text-white p-2 rounded text-xs mx-1"
                        style={{ top: '331px', height: '41px' }}
                      >
                        <div className="font-semibold">Lunch</div>
                        <div className="opacity-90">12:31 - 1:12pm</div>
                      </div>
                      {/* Period 5: 1:19-2:06 (6.32 hours from 7AM = 379px top, 47min = 47px height) */}
                      <div 
                        className="absolute w-full bg-[#012D68] text-white p-2 rounded text-xs mx-1"
                        style={{ top: '379px', height: '47px' }}
                      >
                        <div className="font-semibold">Period 5</div>
                        <div className="opacity-90">1:19 - 2:06pm</div>
                      </div>
                      {/* Period 6: 2:13-3:00 (7.22 hours from 7AM = 433px top, 47min = 47px height) */}
                      <div 
                        className="absolute w-full bg-[#012D68] text-white p-2 rounded text-xs mx-1"
                        style={{ top: '433px', height: '47px' }}
                      >
                        <div className="font-semibold">Period 6</div>
                        <div className="opacity-90">2:13 - 3:00pm</div>
                      </div>
                    </div>

                    {/* Thursday Schedule (Same as Mon/Tue) */}
                    <div className="relative">
                      <div 
                        className="absolute w-full bg-[#012D68] text-white p-2 rounded text-xs mx-1"
                        style={{ top: '90px', height: '57px' }}
                      >
                        <div className="font-semibold">Period 1</div>
                        <div className="opacity-90">8:30 - 9:27am</div>
                      </div>
                      <div 
                        className="absolute w-full bg-[#012D68] text-white p-2 rounded text-xs mx-1"
                        style={{ top: '154px', height: '57px' }}
                      >
                        <div className="font-semibold">Period 2</div>
                        <div className="opacity-90">9:34 - 10:31am</div>
                      </div>
                      <div 
                        className="absolute w-full bg-[#012D68] text-white p-2 rounded text-xs mx-1"
                        style={{ top: '218px', height: '57px' }}
                      >
                        <div className="font-semibold">Period 3</div>
                        <div className="opacity-90">10:38 - 11:35am</div>
                      </div>
                      <div 
                        className="absolute w-full bg-[#012D68] text-white p-2 rounded text-xs mx-1"
                        style={{ top: '282px', height: '59px' }}
                      >
                        <div className="font-semibold">Period 4</div>
                        <div className="opacity-90">11:42 - 12:41pm</div>
                      </div>
                      <div 
                        className="absolute w-full bg-blue-400 text-white p-2 rounded text-xs mx-1"
                        style={{ top: '341px', height: '41px' }}
                      >
                        <div className="font-semibold">Lunch</div>
                        <div className="opacity-90">12:41 - 1:22pm</div>
                      </div>
                      <div 
                        className="absolute w-full bg-[#012D68] text-white p-2 rounded text-xs mx-1"
                        style={{ top: '389px', height: '57px' }}
                      >
                        <div className="font-semibold">Period 5</div>
                        <div className="opacity-90">1:29 - 2:26pm</div>
                      </div>
                      <div 
                        className="absolute w-full bg-[#012D68] text-white p-2 rounded text-xs mx-1"
                        style={{ top: '453px', height: '57px' }}
                      >
                        <div className="font-semibold">Period 6</div>
                        <div className="opacity-90">2:33 - 3:30pm</div>
                      </div>
                    </div>

                    {/* Friday Schedule (Empty for testing) */}
                    <div className="relative">
                      {/* Empty column for testing new schedule blocks */}
                    </div>
                  </div>
                </div>
              </div>

              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setCurrentWeek(prev => prev + 1)}
                className="p-3 hover:bg-gray-100 rounded-lg mt-16"
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};