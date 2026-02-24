import { 
  Calculator, 
  Phone, 
  Settings, 
  Search, 
  Calendar,
  BookOpen,
  GraduationCap,
  FileText,
  Video,
  BarChart3,
  Users,
  Paintbrush,
  Music,
  Globe,
  Camera,
  Mail,
  MessageSquare,
  Smartphone,
  Bot,
  Map,
  Zap,
  Star,
  Clock,
  Folder,
  LucideIcon
} from "lucide-react";

// Mapping of app_catalog keys to lucide icons
const appCatalogIconMap: Record<string, LucideIcon> = {
  calendar: Calendar,        // Calendar
  canvas: GraduationCap,     // Canvas
  chatgpt: Bot,              // ChatGPT
  docs: FileText,            // Docs
  drive: Folder,             // Drive
  find_my: Search,           // Find My
  gmail: Mail,               // Gmail
  google_news: Globe,        // Google News
  notion: FileText,          // Notion
  slack: MessageSquare,      // Slack
};

// Legacy mapping of old app IDs to lucide icons (for backward compatibility)
const legacyAppIconMap: Record<string, LucideIcon> = {
  app1: Calculator,     // Calculator
  app2: BookOpen,       // Dictionary
  app3: GraduationCap,  // Quizlet
  app4: Video,          // Khan Academy
  app5: BarChart3,      // Desmos
  app6: FileText,       // Google Docs
  app7: Video,          // Edpuzzle
  app8: Video,          // TED-Ed
  app9: BarChart3,      // GeoGebra
  app10: Search,        // Google Scholar
  app11: Users,         // Google Classroom
  app12: Paintbrush,    // Canva
  app13: Video,         // YouTube
  app14: Music,         // Spotify
  app15: Globe,         // Safari
  app16: Camera,        // Camera
  app17: FileText,      // Notes
  app18: Calendar,      // Calendar
  app19: Mail,          // Mail
  app20: MessageSquare, // Messages
  app21: Search,        // FindMy
  app22: Settings,      // Settings
  app23: Smartphone,    // CLocked
  app24: Phone,         // Phone
  app25: Bot,           // ChatGPT
  app26: Map,           // Maps
  app27: Zap,           // Shortcuts
  app28: Star,          // TestFlight
  app29: Clock,         // Clock
  app30: Folder,        // Files
};

// Get icon for app_catalog key or legacy app ID
export const getAppIcon = (appKeyOrId: string): LucideIcon => {
  // First check app_catalog keys
  if (appCatalogIconMap[appKeyOrId]) {
    return appCatalogIconMap[appKeyOrId];
  }
  
  // Then check legacy app IDs (for backward compatibility)
  if (legacyAppIconMap[appKeyOrId]) {
    return legacyAppIconMap[appKeyOrId];
  }
  
  // Default fallback icon
  return FileText;
};

export const AppIcon = ({ appId, className = "w-6 h-6 text-gray-600" }: { appId: string; className?: string }) => {
  const IconComponent = getAppIcon(appId);
  return <IconComponent className={className} />;
};