import React from 'react';

interface ArtisanDividerProps {
  className?: string;
  icon?: 'leaf' | 'spice' | 'star';
}

export const ArtisanDivider: React.FC<ArtisanDividerProps> = ({ className = '', icon = 'leaf' }) => {
  return (
    <div className={`flex items-center justify-center max-w-lg mx-auto my-12 md:my-16 select-none ${className}`}>
      {/* Left fading line */}
      <div className="flex-grow h-[1px] bg-gradient-to-r from-transparent to-border" />
      
      {/* Sketched SVG icon */}
      <div className="mx-5 flex items-center justify-center text-primary/75 animate-float hover:scale-110 transition-transform duration-300" style={{ animationDuration: '6s' }}>
        {icon === 'leaf' && (
          <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
            {/* Hand-sketched organic leaf shape */}
            <path d="M2 22C2 22 5 19.5 9.5 15.5C14 11.5 22 2 22 2C22 2 12.5 10 8.5 14.5C4.5 19 2 22 2 22Z" />
            {/* Center vein */}
            <path d="M2 22L14.5 9.5" />
            {/* Side veins */}
            <path d="M7 17C9 16.5 11 16 11 16" />
            <path d="M10 14C12 13.5 14 13 14 13" />
            <path d="M6 18C7.5 16 8.5 14 8.5 14" />
            <path d="M9 15C10.5 13 11.5 11.5 11.5 11.5" />
          </svg>
        )}
        {icon === 'spice' && (
          <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
            {/* Hand-sketched cardamom pod / spice seed */}
            <path d="M12 3C12 3 7 7.5 7 12C7 16.5 12 21 12 21C12 21 17 16.5 17 12C17 7.5 12 3 12 3Z" />
            {/* Center seam */}
            <path d="M12 3V21" />
            {/* Hand-drawn texture details inside the pod */}
            <path d="M10.5 8C11.2 9.5 11.2 14.5 10.5 16" />
            <path d="M13.5 8C12.8 9.5 12.8 14.5 13.5 16" />
            <path d="M9 11.5H10" />
            <path d="M14 11.5H15" />
            <path d="M9.2 13.5H10" />
            <path d="M14 13.5H14.8" />
          </svg>
        )}
        {icon === 'star' && (
          <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
            {/* Hand-sketched star anise */}
            <path d="M12 12L12 2M12 12L19 5M12 12L22 12M12 12L19 19M12 12L12 22M12 12L5 19M12 12L2 12M12 12L5 5" />
            {/* Hand-drawn star pods */}
            <path d="M12 4C13.5 5 14.5 8.5 12 12" />
            <path d="M18 6C18 7.5 14.5 9 12 12" />
            <path d="M20 12C18.5 13.5 15 13.5 12 12" />
            <path d="M18 18C16.5 18 13.5 14.5 12 12" />
            <path d="M12 20C10.5 19 9.5 15.5 12 12" />
            <path d="M6 18C6 16.5 9.5 15 12 12" />
            <path d="M4 12C5.5 10.5 9 10.5 12 12" />
            <path d="M6 6C7.5 6 10.5 9.5 12 12" />
          </svg>
        )}
      </div>

      {/* Right fading line */}
      <div className="flex-grow h-[1px] bg-gradient-to-l from-transparent to-border" />
    </div>
  );
};

export default ArtisanDivider;
