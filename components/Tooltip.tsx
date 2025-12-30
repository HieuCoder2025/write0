import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delayMs?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  delayMs = 150,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const hideTimeoutRef = useRef<number | null>(null);

  const showTooltip = () => {
    if (hideTimeoutRef.current) {
      window.clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    timeoutRef.current = window.setTimeout(() => {
      setShouldRender(true);
      // Small delay to ensure the element is in the DOM before setting opacity
      // for the transition to trigger correctly if using CSS transitions
      setTimeout(() => setIsVisible(true), 10);
    }, delayMs);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
    // Wait for transition to finish before unmounting
    hideTimeoutRef.current = window.setTimeout(() => {
      setShouldRender(false);
      hideTimeoutRef.current = null;
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      if (hideTimeoutRef.current) window.clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2';
      case 'top':
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case 'bottom':
        return 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 dark:border-b-gray-200 border-l-transparent border-r-transparent border-t-transparent';
      case 'left':
        return 'left-full top-1/2 -translate-y-1/2 border-l-gray-900 dark:border-l-gray-200 border-t-transparent border-b-transparent border-r-transparent';
      case 'right':
        return 'right-full top-1/2 -translate-y-1/2 border-r-gray-900 dark:border-r-gray-200 border-t-transparent border-b-transparent border-l-transparent';
      case 'top':
      default:
        return 'top-full left-1/2 -translate-x-1/2 border-t-gray-900 dark:border-t-gray-200 border-l-transparent border-r-transparent border-b-transparent';
    }
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {shouldRender && (
        <div
          role="tooltip"
          className={`absolute z-50 px-3 py-2 text-xs font-medium text-white dark:text-gray-900 bg-gray-900 dark:bg-gray-200 rounded-lg shadow-[0_10px_25px_-5px_rgba(0,0,0,0.3)] whitespace-nowrap pointer-events-none transition-all duration-100 transform ${getPositionClasses()} ${
            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 translate-y-1'
          }`}
        >
          {content}
          {/* Arrow */}
          <div className={`absolute border-[5px] ${getArrowClasses()}`} />
        </div>
      )}
    </div>
  );
};
