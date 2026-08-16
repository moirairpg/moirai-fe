import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../../lib/utils';

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

type TooltipProps = {
  children: ReactNode;
  content?: ReactNode;
  position?: TooltipPosition;
  className?: string;
  delay?: number;
};

const TOOLTIP_OFFSET = 8;

function getPositionStyle(position: TooltipPosition, rect: DOMRect): CSSProperties {
  switch (position) {
    case 'top':
      return { left: rect.left + rect.width / 2, top: rect.top - TOOLTIP_OFFSET, transform: 'translate(-50%, -100%)' };
    case 'bottom':
      return { left: rect.left + rect.width / 2, top: rect.bottom + TOOLTIP_OFFSET, transform: 'translate(-50%, 0)' };
    case 'left':
      return { left: rect.left - TOOLTIP_OFFSET, top: rect.top + rect.height / 2, transform: 'translate(-100%, -50%)' };
    case 'right':
      return { left: rect.right + TOOLTIP_OFFSET, top: rect.top + rect.height / 2, transform: 'translate(0, -50%)' };
    default:
      return { left: rect.left + rect.width / 2, top: rect.top - TOOLTIP_OFFSET, transform: 'translate(-50%, -100%)' };
  }
}

function getArrowClasses(position: TooltipPosition): string {
  switch (position) {
    case 'top':
      return 'top-full left-1/2 transform -translate-x-1/2 border-t-gray-900 dark:border-t-gray-100';
    case 'bottom':
      return 'bottom-full left-1/2 transform -translate-x-1/2 border-b-gray-900 dark:border-b-gray-100';
    case 'left':
      return 'left-full top-1/2 transform -translate-y-1/2 border-l-gray-900 dark:border-l-gray-100';
    case 'right':
      return 'right-full top-1/2 transform -translate-y-1/2 border-r-gray-900 dark:border-r-gray-100';
    default:
      return 'top-full left-1/2 transform -translate-x-1/2 border-t-gray-900 dark:border-t-gray-100';
  }
}

function Tooltip({
  children,
  content,
  position = 'top',
  className = '',
  delay = 500,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  // Store the timer id without forcing re-renders while hovering.
  const timeoutRef = useRef<number | null>(null);

  const clearTooltipTimer = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleMouseEnter = () => {
    clearTooltipTimer();
    timeoutRef.current = window.setTimeout(() => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setTriggerRect(rect);
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    clearTooltipTimer();
    setIsVisible(false);
  };

  useEffect(() => {
    // Avoid delayed updates after unmount.
    return () => {
      clearTooltipTimer();
    };
  }, []);

  if (!content) {
    return <>{children}</>;
  }

  return (
    <div ref={triggerRef} className="relative inline-block" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {children}
      {isVisible && triggerRect && createPortal(
        <div
          style={getPositionStyle(position, triggerRect)}
          className={cn(
            'fixed z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 rounded shadow-lg whitespace-nowrap pointer-events-none',
            'animate-in fade-in-0 duration-200',
            className
          )}
        >
          {content}
          {/* Arrow */}
          <div className={cn('absolute w-0 h-0 border-4 border-transparent', getArrowClasses(position))} />
        </div>,
        document.body,
      )}
    </div>
  );
}

export default Tooltip;
