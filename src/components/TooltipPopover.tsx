import React, { useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import useTooltip from 'src/hooks/useTooltip';

const TooltipPopover = ({ children, title }: { children: React.ReactElement<unknown, any>; title: React.ReactElement | Element[] }) => {
  const [tooltipContainer, setTooltipContainer] = useState<HTMLDivElement>(null);
  const [{ elementPositionY, x, height, isIntersecting }, ref] = useTooltip();
  const [isOnTooltip, setIsOnTooltip] = useState(false);

  const { top, left } = useMemo(() => {
    let data = { top: elementPositionY, left: 0 };
    if (!tooltipContainer) return data;
    const rect = tooltipContainer.getBoundingClientRect();
    if (!rect) return data;
    data.top = elementPositionY - rect.height;
    data.left = x - rect.width * 0.5;
    if (data.top - window.scrollY < 0) {
      data.top = elementPositionY + height;
    }
    if (data.left < 0) {
      data.left = 0;
    }
    return data;
  }, [elementPositionY, tooltipContainer, x, height]);

  return (
    <>
      {React.cloneElement(children, {
        ref: ref
      })}
      {(isIntersecting || isOnTooltip) &&
        ReactDOM.createPortal(
          <div
            onMouseEnter={() => setIsOnTooltip(true)}
            onMouseLeave={() => setIsOnTooltip(false)}
            className="absolute z-[1200]"
            style={{ top, left }}
            ref={setTooltipContainer}
          >
            {title}
          </div>,
          document.body
        )}
    </>
  );
};

export default TooltipPopover;
