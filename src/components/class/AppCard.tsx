
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { App } from "@/types";
import { cn } from "@/lib/utils";

interface AppCardProps {
  app: App;
  isAllowed: boolean;
  onToggleApp: (appId: string) => void;
}

const AppCard = ({ app, isAllowed, onToggleApp }: AppCardProps) => {
  // Map app names to emojis
  const getAppEmoji = (appName: string): string => {
    const name = appName.toLowerCase();
    
    // Map of common apps to emojis
    const emojiMap: Record<string, string> = {
      'clock': '⏰',
      'calendar': '📅',
      'calculator': '🧮',
      'notes': '📝',
      'books': '📚',
      'health': '❤️',
      'settings': '⚙️',
      'camera': '📷',
      'photos': '🖼️',
      'maps': '🗺️',
      'mail': '📧',
      'music': '🎵',
      'weather': '☀️',
      'safari': '🌐',
      'messages': '💬',
      'phone': '📱',
      'facetime': '📹',
      'contacts': '👥',
      'findmy': '🔍',
      'emergency sos': '🆘',
      'digital wellness': '⏱️',
      'reminders': '🔔',
      'wallet': '💳',
      'app store': '📲',
      'podcasts': '🎙️',
      'files': '📁',
      'home': '🏠',
      'translate': '🔤',
      'shortcuts': '⚡',
      'voice memos': '🎤',
      'stocks': '📈',
      'news': '📰',
      'tv': '📺',
      'activity': '⭐',
      'compass': '🧭',
      'measure': '📏',
      'magnifier': '🔎',
      'tips': '💡',
      'itunes': '🎧'
    };
    
    // Return the emoji if found in the map, otherwise return a default emoji
    return emojiMap[name] || '📱';
  };

  return (
    <Card 
      key={app.id} 
      className={cn(
        "p-4 transition-all duration-300",
        isAllowed ? "border-[#0a2558]/50 bg-[#85c5e3]/10" : "border-gray-200"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="h-10 w-10 flex items-center justify-center text-2xl">
            {getAppEmoji(app.name)}
          </div>
          <div className="ml-3">
            <h3 className="font-medium">{app.name}</h3>
            <p className="text-xs text-gray-500">{app.description}</p>
          </div>
        </div>
        <Switch 
          checked={isAllowed}
          onCheckedChange={() => onToggleApp(app.id)}
          className="data-[state=checked]:bg-[#8DCEE9]"
        />
      </div>
    </Card>
  );
};

export default AppCard;
