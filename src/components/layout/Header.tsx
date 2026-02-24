import DigitalClock from "../DigitalClock";
import { useAuthContext } from "@/context/AuthContext";
import clockedLogo from "@/assets/clocked-logo.png";

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Header = ({ sidebarOpen, setSidebarOpen }: HeaderProps) => {
  const { user } = useAuthContext();
  const schoolName = user?.schoolName || "School";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#012D68] shadow-sm h-16 flex items-center justify-between px-4">
      <div className="flex items-center">
        {sidebarOpen ? (
          <div className="flex items-center gap-3">
            <img src={clockedLogo} alt="CLocked Logo" className="h-10 w-10 brightness-0 invert" />
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">
                {schoolName}
              </h1>
              <p className="text-white/80 text-xs">Proud partner with CLocked LLC</p>
            </div>
          </div>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <DigitalClock />
      </div>
    </header>
  );
};

export default Header;
