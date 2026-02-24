
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { useState } from "react";
import { App } from "@/types";

interface AddAppDialogProps {
  onAddApp: (newApp: Omit<App, "id" | "isCustom">) => void;
  iconOptions: string[];
}

const AddAppDialog = ({ onAddApp, iconOptions }: AddAppDialogProps) => {
  const [newApp, setNewApp] = useState<Omit<App, "id" | "isCustom">>({
    name: "",
    icon: iconOptions[0],
    category: "Education",
    description: "",
  });

  const handleAddApp = () => {
    if (!newApp.name || !newApp.description) return;
    
    onAddApp(newApp);
    
    // Reset form
    setNewApp({
      name: "",
      icon: iconOptions[0],
      category: "Education",
      description: "",
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-[#85c5e3] hover:bg-[#0a2558] text-[#0a2558] hover:text-white">
          <Plus className="mr-2 h-4 w-4" /> Add Custom App
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New App</DialogTitle>
          <DialogDescription>Create a custom app that can be allowed or restricted during class.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="appName" className="text-right">
              Name
            </Label>
            <Input
              id="appName"
              value={newApp.name}
              onChange={(e) => setNewApp({ ...newApp, name: e.target.value })}
              className="col-span-3"
              placeholder="App name"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="appIcon" className="text-right">
              Icon
            </Label>
            <Select
              value={newApp.icon}
              onValueChange={(value) => setNewApp({ ...newApp, icon: value })}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select an icon" />
              </SelectTrigger>
              <SelectContent>
                <div className="grid grid-cols-3 gap-2 p-2">
                  {iconOptions.map((icon) => (
                    <Button
                      key={icon}
                      variant="outline"
                      className={cn("h-12 w-12 p-0", newApp.icon === icon && "border-primary")}
                      onClick={() => setNewApp({ ...newApp, icon })}
                    >
                      <img src={icon} alt="App icon" className="h-10 w-10 rounded-md" />
                    </Button>
                  ))}
                </div>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="appCategory" className="text-right">
              Category
            </Label>
            <Select
              value={newApp.category}
              onValueChange={(value) => setNewApp({ ...newApp, category: value })}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {['Education', 'Utilities', 'Reference', 'Productivity', 'Math', 'Languages', 'Safety', 'Creativity', 'AI Tools', 'Writing', 'Communication', 'Entertainment', 'System'].map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="appDescription" className="text-right">
              Description
            </Label>
            <Input
              id="appDescription"
              value={newApp.description}
              onChange={(e) => setNewApp({ ...newApp, description: e.target.value })}
              className="col-span-3"
              placeholder="Brief description of the app"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button 
              onClick={handleAddApp} 
              disabled={!newApp.name || !newApp.description}
              className="bg-[#0a2558] hover:bg-[#153a7a]"
            >
              Add App
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddAppDialog;
