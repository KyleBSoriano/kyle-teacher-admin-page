
export interface Student {
  id: string;
  name: string;
  email: string;
  grade?: number;
  classIds?: string[];
  deviceId?: string;
  attendanceRecords?: AttendanceRecord[];
}

export interface Class {
  id: string;
  period: string;
  subject: string;
  description?: string;
  roomNumber?: string;
  startTime?: string;
  endTime?: string;
  students: string[]; // student ids
  allowedApps: string[]; // app ids
  code?: string; // 6-digit class code
  activeTemplateId?: string; // ID of the currently active app template
}

export interface App {
  id: string;
  name: string;
  icon: string;
  category: string;
  description: string;
  isCustom?: boolean;
}

export interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent' | 'tardy';
  timestamp?: string;
}

export interface AttendanceData {
  classId: string;
  date: string;
  records: {
    studentId: string;
    status: 'present' | 'absent' | 'tardy';
    timestamp?: string;
  }[];
}
