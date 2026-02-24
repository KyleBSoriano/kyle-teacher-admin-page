
import { ReactNode, useState } from "react";
import Sidebar from "./Sidebar";
import { cn } from "@/lib/utils";
import Header from "./Header";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({
  children
}: MainLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  return (
    <div className="flex h-screen bg-gray-100">
      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className={cn("flex-1 transition-all duration-300 pt-16", sidebarOpen ? "ml-48" : "ml-0")}>
        <main className="p-6 h-[calc(100vh-64px)] overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
