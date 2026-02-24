
import { App, AttendanceData, Class, Student } from "@/types";

export const mockApps: App[] = [
  // Educational Apps
  {
    id: "app1",
    name: "Calculator",
    icon: "https://is1-ssl.mzstatic.com/image/thumb/Purple116/v4/e9/54/b8/e954b8fa-8f27-6ca1-33d2-3e991b17e0b5/AppIcon-0-0-1x_U007emarketing-0-0-0-7-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/256x256bb.jpg",
    category: "Utilities",
    description: "Scientific calculator for math problems",
  },
  {
    id: "app2",
    name: "Dictionary",
    icon: "https://is1-ssl.mzstatic.com/image/thumb/Purple116/v4/e3/52/c4/e352c4b5-8c23-ab15-d68f-9dc61b7acca7/AppIcon-0-1x_U007emarketing-0-7-0-0-85-220.png/256x256bb.jpg",
    category: "Reference",
    description: "English dictionary and thesaurus",
  },
  {
    id: "app3",
    name: "Quizlet",
    icon: "https://is1-ssl.mzstatic.com/image/thumb/Purple116/v4/84/de/0a/84de0aa0-2e18-f5a2-8632-676c681e184d/AppIcon-0-0-1x_U007emarketing-0-0-0-7-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/256x256bb.jpg",
    category: "Education",
    description: "Flashcards and study tools",
  },
  {
    id: "app4",
    name: "Khan Academy",
    icon: "https://is1-ssl.mzstatic.com/image/thumb/Purple126/v4/e2/ce/b8/e2ceb840-1e6e-dfa3-930e-ad39f2905245/AppIcon-0-0-1x_U007emarketing-0-0-0-7-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/256x256bb.jpg",
    category: "Education",
    description: "Free educational videos and exercises",
  },
  {
    id: "app5",
    name: "Desmos",
    icon: "https://is1-ssl.mzstatic.com/image/thumb/Purple116/v4/b1/6d/98/b16d98ad-fcde-2c77-99f5-3ef7e66adf47/AppIconCGAlgebra-0-0-1x_U007emarketing-0-0-0-7-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/256x256bb.jpg",
    category: "Education",
    description: "Graphing calculator and math tools",
  },
  {
    id: "app6",
    name: "Google Docs",
    icon: "https://is1-ssl.mzstatic.com/image/thumb/Purple126/v4/f6/51/7a/f6517a45-cdd3-cfaa-41fd-153d71226ee4/AppIcon-0-0-1x_U007emarketing-0-0-0-6-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/256x256bb.jpg",
    category: "Productivity",
    description: "Create and edit documents",
  },
  {
    id: "app7",
    name: "Edpuzzle",
    icon: "https://is1-ssl.mzstatic.com/image/thumb/Purple116/v4/5f/86/e9/5f86e95a-93c4-a059-af99-9b6962f1a164/AppIcon-1x_U007emarketing-0-7-0-85-220.png/256x256bb.jpg",
    category: "Education",
    description: "Interactive video lessons",
  },
  {
    id: "app8",
    name: "Kahoot",
    icon: "https://is1-ssl.mzstatic.com/image/thumb/Purple116/v4/24/8c/75/248c75fb-7f8c-795a-11e9-5479918988a1/AppIcon-0-0-1x_U007emarketing-0-0-0-7-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/256x256bb.jpg",
    category: "Education",
    description: "Game-based learning platform",
  },
  {
    id: "app9",
    name: "GeoGebra",
    icon: "https://is1-ssl.mzstatic.com/image/thumb/Purple126/v4/c7/65/e0/c765e023-e8dc-e1cd-5f99-fe9090da2f87/AppIcon-0-0-1x_U007emarketing-0-0-0-5-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/256x256bb.jpg",
    category: "Education",
    description: "Dynamic mathematics software",
  },
  {
    id: "app10",
    name: "Duolingo",
    icon: "https://is1-ssl.mzstatic.com/image/thumb/Purple126/v4/3d/a9/c3/3da9c3de-ff6f-5331-c916-4105ed160769/AppIcon-0-0-1x_U007emarketing-0-0-0-7-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/256x256bb.jpg",
    category: "Languages",
    description: "Language learning app",
  },
  // New educational apps
  {
    id: "app11",
    name: "Google Classroom",
    icon: "https://is1-ssl.mzstatic.com/image/thumb/Purple126/v4/0d/9e/bc/0d9ebccc-9aa2-3da8-a8f0-246fc5e6e6eb/AppIcon-0-0-1x_U007emarketing-0-0-0-6-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/256x256bb.jpg",
    category: "Education",
    description: "Classroom management platform",
  },
  {
    id: "app12",
    name: "Canva",
    icon: "https://is1-ssl.mzstatic.com/image/thumb/Purple116/v4/06/56/e1/0656e172-eea3-5262-eca1-d5111fe1f190/AppIcon-0-0-1x_U007emarketing-0-0-0-7-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/256x256bb.jpg",
    category: "Creativity",
    description: "Design tool for presentations and graphics",
  },
  {
    id: "app13",
    name: "Grammarly",
    icon: "https://is1-ssl.mzstatic.com/image/thumb/Purple116/v4/22/4b/67/224b6764-e4b9-e14b-893e-7ef91071a48c/AppIcon-0-0-1x_U007emarketing-0-0-0-7-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/256x256bb.jpg",
    category: "Writing",
    description: "Writing assistant and grammar checker",
  },
  {
    id: "app14",
    name: "Wolfram Alpha",
    icon: "https://is1-ssl.mzstatic.com/image/thumb/Purple116/v4/da/25/54/da255476-bd59-a027-f1d9-1864b0ad9514/AppIcon-0-0-1x_U007emarketing-0-0-0-3-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/256x256bb.jpg",
    category: "Education",
    description: "Computational knowledge engine",
  },
  {
    id: "app15",
    name: "Brilliant",
    icon: "https://is1-ssl.mzstatic.com/image/thumb/Purple116/v4/29/bf/54/29bf5421-a4b9-c6fb-876a-31ae6cec3daf/AppIcon-0-0-1x_U007emarketing-0-0-0-7-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/256x256bb.jpg",
    category: "Education",
    description: "Learn math, science, and computer science",
  },
  // Utility apps
  {
    id: "app16",
    name: "Clock",
    icon: "https://is1-ssl.mzstatic.com/image/thumb/Purple126/v4/0b/8c/a9/0b8ca9a1-6d22-35ce-8cc9-ccf268cbaa96/AppIcon-0-0-1x_U007emarketing-0-0-0-6-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/256x256bb.jpg",
    category: "Utilities",
    description: "Clock, timer, and stopwatch",
  },
  {
    id: "app17",
    name: "Notes",
    icon: "https://is1-ssl.mzstatic.com/image/thumb/Purple126/v4/9e/22/eb/9e22eb1b-fb2e-b2c3-8fd9-e6d18b91f70e/AppIcon-0-0-1x_U007emarketing-0-0-0-7-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/256x256bb.jpg",
    category: "Utilities",
    description: "Simple note-taking app",
  },
  {
    id: "app18",
    name: "Calendar",
    icon: "https://is1-ssl.mzstatic.com/image/thumb/Purple116/v4/fd/3c/77/fd3c7798-c613-9d0f-acee-0a85431255a6/AppIcon-0-0-1x_U007emarketing-0-0-0-7-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/256x256bb.jpg",
    category: "Utilities",
    description: "Calendar and scheduling",
  },
  {
    id: "app19",
    name: "Translator",
    icon: "https://is1-ssl.mzstatic.com/image/thumb/Purple126/v4/12/c5/61/12c56125-982b-504c-270c-99618d982c78/AppIcon-0-0-1x_U007emarketing-0-0-0-7-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/256x256bb.jpg",
    category: "Utilities",
    description: "Language translation tool",
  },
  {
    id: "app20",
    name: "FindMy",
    icon: "https://is1-ssl.mzstatic.com/image/thumb/Purple116/v4/da/68/f1/da68f17c-e111-9923-5f65-29047412fc95/AppIcon-0-0-1x_U007emarketing-0-0-0-10-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/256x256bb.jpg",
    category: "Utilities",
    description: "Find lost devices",
  },
  // Safety apps
  {
    id: "app21",
    name: "Emergency SOS",
    icon: "https://is1-ssl.mzstatic.com/image/thumb/Purple126/v4/47/d3/96/47d3963c-0c4e-b586-1e51-830574ca92c9/AppIcon-0-0-1x_U007emarketing-0-0-0-10-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/256x256bb.jpg",
    category: "Safety",
    description: "Quick access to emergency services",
  },
  {
    id: "app22",
    name: "Health",
    icon: "https://is1-ssl.mzstatic.com/image/thumb/Purple116/v4/d0/a0/0c/d0a00c77-b35e-f168-5509-9e3c83b0722d/AppIcon-0-0-1x_U007emarketing-0-0-0-7-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/256x256bb.jpg",
    category: "Safety",
    description: "Health tracking and medical ID",
  },
  {
    id: "app23",
    name: "Digital Wellness",
    icon: "https://is1-ssl.mzstatic.com/image/thumb/Purple116/v4/bb/c9/d3/bbc9d356-8782-6d89-6a11-2d1918e36919/AppIcon-0-0-1x_U007emarketing-0-0-0-7-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/256x256bb.jpg",
    category: "Safety",
    description: "Screen time management and digital wellbeing",
  },
  // Extra apps
  {
    id: "app24",
    name: "Phone",
    icon: "https://is1-ssl.mzstatic.com/image/thumb/Purple126/v4/c9/7a/3c/c97a3c8a-c8c9-a378-058d-40765026b456/AppIcon-0-0-1x_U007emarketing-0-0-0-7-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/256x256bb.jpg",
    category: "Communication",
    description: "Make phone calls",
  },
  {
    id: "app25",
    name: "ChatGPT",
    icon: "https://is1-ssl.mzstatic.com/image/thumb/Purple116/v4/b8/99/2b/b8992b5a-3005-4e99-85c6-f61e7bfa8036/AppIcon-0-0-1x_U007emarketing-0-0-0-7-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/256x256bb.jpg",
    category: "AI Tools",
    description: "AI-powered chat assistant",
  },
  {
    id: "app26",
    name: "Spotify",
    icon: "https://is1-ssl.mzstatic.com/image/thumb/Purple116/v4/47/10/1b/47101b96-ea57-81da-1c52-5886c8733f79/AppIcon-0-0-1x_U007emarketing-0-0-0-7-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/256x256bb.jpg",
    category: "Entertainment",
    description: "Music streaming service",
  },
  {
    id: "app27",
    name: "Settings",
    icon: "https://is1-ssl.mzstatic.com/image/thumb/Purple116/v4/d3/0a/87/d30a87be-aa21-0c3d-4e81-2c95fc356544/AppIcon-0-0-1x_U007emarketing-0-0-0-7-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/256x256bb.jpg",
    category: "System",
    description: "Device settings",
  },
];

// Period-specific student rosters with scrambled order
const period1Students = [
  { id: "s1", name: "Alex Johnson", email: "alexj@school.edu", deviceId: "dev-001" },
  { id: "s7", name: "Jamie Garcia", email: "jamieg@school.edu", deviceId: "dev-007" },
  { id: "s3", name: "Jordan Lee", email: "jordanl@school.edu", deviceId: "dev-003" },
  { id: "s12", name: "Reese Martinez", email: "reesem@school.edu", deviceId: "dev-012" },
  { id: "s5", name: "Riley Davis", email: "rileyd@school.edu", deviceId: "dev-005" },
  { id: "s9", name: "Avery Thomas", email: "averyt@school.edu", deviceId: "dev-009" },
  { id: "s2", name: "Taylor Smith", email: "taylors@school.edu", deviceId: "dev-002" },
  { id: "s14", name: "Harper Evans", email: "harpere@school.edu", deviceId: "dev-014" },
  { id: "s6", name: "Morgan Wilson", email: "morganw@school.edu", deviceId: "dev-006" },
  { id: "s11", name: "Cameron Lewis", email: "cameronl@school.edu", deviceId: "dev-011" },
  { id: "s4", name: "Casey Brown", email: "caseyb@school.edu", deviceId: "dev-004" },
  { id: "s15", name: "Rowan Green", email: "rowang@school.edu", deviceId: "dev-015" },
  { id: "s8", name: "Quinn Miller", email: "quinnm@school.edu", deviceId: "dev-008" },
  { id: "s10", name: "Jordan Parker", email: "jordanp@school.edu", deviceId: "dev-010" },
  { id: "s13", name: "Drew Collins", email: "drewc@school.edu", deviceId: "dev-013" },
  { id: "s16", name: "Skyler Adams", email: "skylera@school.edu", deviceId: "dev-016" },
];

const period2Students = [
  { id: "s13", name: "Drew Collins", email: "drewc@school.edu", deviceId: "dev-013" },
  { id: "s2", name: "Taylor Smith", email: "taylors@school.edu", deviceId: "dev-002" },
  { id: "s8", name: "Quinn Miller", email: "quinnm@school.edu", deviceId: "dev-008" },
  { id: "s15", name: "Rowan Green", email: "rowang@school.edu", deviceId: "dev-015" },
  { id: "s4", name: "Casey Brown", email: "caseyb@school.edu", deviceId: "dev-004" },
  { id: "s10", name: "Jordan Parker", email: "jordanp@school.edu", deviceId: "dev-010" },
  { id: "s1", name: "Alex Johnson", email: "alexj@school.edu", deviceId: "dev-001" },
  { id: "s16", name: "Skyler Adams", email: "skylera@school.edu", deviceId: "dev-016" },
  { id: "s7", name: "Jamie Garcia", email: "jamieg@school.edu", deviceId: "dev-007" },
  { id: "s3", name: "Jordan Lee", email: "jordanl@school.edu", deviceId: "dev-003" },
  { id: "s11", name: "Cameron Lewis", email: "cameronl@school.edu", deviceId: "dev-011" },
  { id: "s6", name: "Morgan Wilson", email: "morganw@school.edu", deviceId: "dev-006" },
  { id: "s12", name: "Reese Martinez", email: "reesem@school.edu", deviceId: "dev-012" },
  { id: "s5", name: "Riley Davis", email: "rileyd@school.edu", deviceId: "dev-005" },
  { id: "s14", name: "Harper Evans", email: "harpere@school.edu", deviceId: "dev-014" },
  { id: "s9", name: "Avery Thomas", email: "averyt@school.edu", deviceId: "dev-009" },
];

const period3Students = [
  { id: "s6", name: "Morgan Wilson", email: "morganw@school.edu", deviceId: "dev-006" },
  { id: "s14", name: "Harper Evans", email: "harpere@school.edu", deviceId: "dev-014" },
  { id: "s1", name: "Alex Johnson", email: "alexj@school.edu", deviceId: "dev-001" },
  { id: "s9", name: "Avery Thomas", email: "averyt@school.edu", deviceId: "dev-009" },
  { id: "s16", name: "Skyler Adams", email: "skylera@school.edu", deviceId: "dev-016" },
  { id: "s4", name: "Casey Brown", email: "caseyb@school.edu", deviceId: "dev-004" },
  { id: "s11", name: "Cameron Lewis", email: "cameronl@school.edu", deviceId: "dev-011" },
  { id: "s7", name: "Jamie Garcia", email: "jamieg@school.edu", deviceId: "dev-007" },
  { id: "s3", name: "Jordan Lee", email: "jordanl@school.edu", deviceId: "dev-003" },
  { id: "s12", name: "Reese Martinez", email: "reesem@school.edu", deviceId: "dev-012" },
  { id: "s15", name: "Rowan Green", email: "rowang@school.edu", deviceId: "dev-015" },
  { id: "s5", name: "Riley Davis", email: "rileyd@school.edu", deviceId: "dev-005" },
  { id: "s8", name: "Quinn Miller", email: "quinnm@school.edu", deviceId: "dev-008" },
  { id: "s2", name: "Taylor Smith", email: "taylors@school.edu", deviceId: "dev-002" },
  { id: "s10", name: "Jordan Parker", email: "jordanp@school.edu", deviceId: "dev-010" },
  { id: "s13", name: "Drew Collins", email: "drewc@school.edu", deviceId: "dev-013" },
];

const period4Students = [
  { id: "s12", name: "Reese Martinez", email: "reesem@school.edu", deviceId: "dev-012" },
  { id: "s5", name: "Riley Davis", email: "rileyd@school.edu", deviceId: "dev-005" },
  { id: "s10", name: "Jordan Parker", email: "jordanp@school.edu", deviceId: "dev-010" },
  { id: "s2", name: "Taylor Smith", email: "taylors@school.edu", deviceId: "dev-002" },
  { id: "s16", name: "Skyler Adams", email: "skylera@school.edu", deviceId: "dev-016" },
  { id: "s8", name: "Quinn Miller", email: "quinnm@school.edu", deviceId: "dev-008" },
  { id: "s1", name: "Alex Johnson", email: "alexj@school.edu", deviceId: "dev-001" },
  { id: "s13", name: "Drew Collins", email: "drewc@school.edu", deviceId: "dev-013" },
  { id: "s6", name: "Morgan Wilson", email: "morganw@school.edu", deviceId: "dev-006" },
  { id: "s3", name: "Jordan Lee", email: "jordanl@school.edu", deviceId: "dev-003" },
  { id: "s11", name: "Cameron Lewis", email: "cameronl@school.edu", deviceId: "dev-011" },
  { id: "s14", name: "Harper Evans", email: "harpere@school.edu", deviceId: "dev-014" },
  { id: "s7", name: "Jamie Garcia", email: "jamieg@school.edu", deviceId: "dev-007" },
  { id: "s15", name: "Rowan Green", email: "rowang@school.edu", deviceId: "dev-015" },
  { id: "s4", name: "Casey Brown", email: "caseyb@school.edu", deviceId: "dev-004" },
  { id: "s9", name: "Avery Thomas", email: "averyt@school.edu", deviceId: "dev-009" },
];

const period5Students = [
  { id: "s9", name: "Avery Thomas", email: "averyt@school.edu", deviceId: "dev-009" },
  { id: "s3", name: "Jordan Lee", email: "jordanl@school.edu", deviceId: "dev-003" },
  { id: "s15", name: "Rowan Green", email: "rowang@school.edu", deviceId: "dev-015" },
  { id: "s7", name: "Jamie Garcia", email: "jamieg@school.edu", deviceId: "dev-007" },
  { id: "s1", name: "Alex Johnson", email: "alexj@school.edu", deviceId: "dev-001" },
  { id: "s14", name: "Harper Evans", email: "harpere@school.edu", deviceId: "dev-014" },
  { id: "s4", name: "Casey Brown", email: "caseyb@school.edu", deviceId: "dev-004" },
  { id: "s11", name: "Cameron Lewis", email: "cameronl@school.edu", deviceId: "dev-011" },
  { id: "s6", name: "Morgan Wilson", email: "morganw@school.edu", deviceId: "dev-006" },
  { id: "s13", name: "Drew Collins", email: "drewc@school.edu", deviceId: "dev-013" },
  { id: "s8", name: "Quinn Miller", email: "quinnm@school.edu", deviceId: "dev-008" },
  { id: "s16", name: "Skyler Adams", email: "skylera@school.edu", deviceId: "dev-016" },
  { id: "s2", name: "Taylor Smith", email: "taylors@school.edu", deviceId: "dev-002" },
  { id: "s10", name: "Jordan Parker", email: "jordanp@school.edu", deviceId: "dev-010" },
  { id: "s5", name: "Riley Davis", email: "rileyd@school.edu", deviceId: "dev-005" },
  { id: "s12", name: "Reese Martinez", email: "reesem@school.edu", deviceId: "dev-012" },
];

const period6Students = [
  { id: "s4", name: "Casey Brown", email: "caseyb@school.edu", deviceId: "dev-004" },
  { id: "s16", name: "Skyler Adams", email: "skylera@school.edu", deviceId: "dev-016" },
  { id: "s11", name: "Cameron Lewis", email: "cameronl@school.edu", deviceId: "dev-011" },
  { id: "s8", name: "Quinn Miller", email: "quinnm@school.edu", deviceId: "dev-008" },
  { id: "s2", name: "Taylor Smith", email: "taylors@school.edu", deviceId: "dev-002" },
  { id: "s14", name: "Harper Evans", email: "harpere@school.edu", deviceId: "dev-014" },
  { id: "s6", name: "Morgan Wilson", email: "morganw@school.edu", deviceId: "dev-006" },
  { id: "s10", name: "Jordan Parker", email: "jordanp@school.edu", deviceId: "dev-010" },
  { id: "s1", name: "Alex Johnson", email: "alexj@school.edu", deviceId: "dev-001" },
  { id: "s15", name: "Rowan Green", email: "rowang@school.edu", deviceId: "dev-015" },
  { id: "s12", name: "Reese Martinez", email: "reesem@school.edu", deviceId: "dev-012" },
  { id: "s7", name: "Jamie Garcia", email: "jamieg@school.edu", deviceId: "dev-007" },
  { id: "s5", name: "Riley Davis", email: "rileyd@school.edu", deviceId: "dev-005" },
  { id: "s9", name: "Avery Thomas", email: "averyt@school.edu", deviceId: "dev-009" },
  { id: "s3", name: "Jordan Lee", email: "jordanl@school.edu", deviceId: "dev-003" },
  { id: "s13", name: "Drew Collins", email: "drewc@school.edu", deviceId: "dev-013" },
];

// Function to get students by period
export const getStudentsByPeriod = (period: number): Student[] => {
  switch (period) {
    case 1: return period1Students;
    case 2: return period2Students;
    case 3: return period3Students;
    case 4: return period4Students;
    case 5: return period5Students;
    case 6: return period6Students;
    default: return period1Students;
  }
};

// For backward compatibility - Period 1 students
export const mockStudents: Student[] = period1Students;

export const mockClasses: Class[] = [
  {
    id: "c1",
    period: "Period 1",
    subject: "Algebra I",
    roomNumber: "",
    description: "",
    startTime: "8:30",
    endTime: "9:27",
    students: ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9", "s10", "s11", "s12", "s13", "s14", "s15", "s16"],
    allowedApps: ["app1", "app5", "app9"],
    code: "847293"
  },
  {
    id: "c2",
    period: "Period 2",
    subject: "World History",
    roomNumber: "",
    description: "",
    startTime: "9:35",
    endTime: "10:42",
    students: ["s2", "s4", "s5"],
    allowedApps: ["app2", "app6"],
    code: "562718"
  }
];

export const mockAttendance: AttendanceData[] = [
  {
    classId: "c1",
    date: "2025-05-07",
    records: [
      { studentId: "s1", status: "present", timestamp: "2025-05-07T08:02:15" },
      { studentId: "s2", status: "present", timestamp: "2025-05-07T08:01:30" },
      { studentId: "s3", status: "present", timestamp: "2025-05-07T08:12:45" },
      { studentId: "s4", status: "present", timestamp: "2025-05-07T08:03:22" },
      { studentId: "s5", status: "present", timestamp: "2025-05-07T08:01:15" },
      { studentId: "s6", status: "present", timestamp: "2025-05-07T08:02:45" },
      { studentId: "s7", status: "present", timestamp: "2025-05-07T08:03:10" },
      { studentId: "s8", status: "present", timestamp: "2025-05-07T08:04:30" },
      { studentId: "s9", status: "present", timestamp: "2025-05-07T08:02:55" },
      { studentId: "s10", status: "present", timestamp: "2025-05-07T08:01:48" },
      { studentId: "s11", status: "present", timestamp: "2025-05-07T08:02:22" },
      { studentId: "s12", status: "present", timestamp: "2025-05-07T08:03:41" },
      { studentId: "s13", status: "absent" },
      { studentId: "s14", status: "absent" },
      { studentId: "s15", status: "tardy", timestamp: "2025-05-07T08:15:05" },
      { studentId: "s16", status: "tardy", timestamp: "2025-05-07T08:17:12" },
    ],
  },
];
