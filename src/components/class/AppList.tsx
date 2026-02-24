
import { App } from "@/types";
import AppCard from "./AppCard";

interface AppListProps {
  apps: App[];
  category: string;
  classAllowedApps: string[];
  onToggleApp: (appId: string) => void;
}

const AppList = ({ apps, category, classAllowedApps, onToggleApp }: AppListProps) => {
  // Filter apps by category and sort alphabetically
  const filteredApps = apps
    .filter(app => app.category === category)
    .sort((a, b) => a.name.localeCompare(b.name));

  if (filteredApps.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-[#012D68]">{category} Apps</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredApps.map(app => (
          <AppCard 
            key={app.id} 
            app={app} 
            isAllowed={classAllowedApps.includes(app.id)}
            onToggleApp={onToggleApp}
          />
        ))}
      </div>
    </div>
  );
};

export default AppList;
