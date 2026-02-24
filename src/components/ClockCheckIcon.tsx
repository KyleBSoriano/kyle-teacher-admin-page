
const ClockCheckIcon = ({ className = "", size = 24 }: { className?: string; size?: number }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Clock circle */}
      <circle 
        cx="50" 
        cy="50" 
        r="40" 
        stroke="#012D68" 
        strokeWidth="8" 
        fill="white"
      />
      
      {/* Clock hour markers */}
      <line x1="50" y1="15" x2="50" y2="22" stroke="#012D68" strokeWidth="3" strokeLinecap="round" />
      <line x1="85" y1="50" x2="78" y2="50" stroke="#012D68" strokeWidth="3" strokeLinecap="round" />
      <line x1="50" y1="85" x2="50" y2="78" stroke="#012D68" strokeWidth="3" strokeLinecap="round" />
      <line x1="15" y1="50" x2="22" y2="50" stroke="#012D68" strokeWidth="3" strokeLinecap="round" />
      
      {/* Additional hour markers at diagonal positions */}
      <line x1="72.3" y1="27.7" x2="67.1" y2="32.9" stroke="#012D68" strokeWidth="3" strokeLinecap="round" />
      <line x1="72.3" y1="72.3" x2="67.1" y2="67.1" stroke="#012D68" strokeWidth="3" strokeLinecap="round" />
      <line x1="27.7" y1="72.3" x2="32.9" y2="67.1" stroke="#012D68" strokeWidth="3" strokeLinecap="round" />
      <line x1="27.7" y1="27.7" x2="32.9" y2="32.9" stroke="#012D68" strokeWidth="3" strokeLinecap="round" />
      
      {/* Checkmark */}
      <path 
        d="M32 48 L44 58 L68 32" 
        stroke="#1CB5E0" 
        strokeWidth="6" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        fill="none"
      />
    </svg>
  );
};

export default ClockCheckIcon;
