import React, { useCallback, useEffect, useRef, useState } from 'react';
import RippleButton from 'src/components/RippleButton';
import { cn } from 'src/constants/helpers';

type TabContextType<D> = {
  value: D;
  onChange: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, value: D) => void;
  setSizes: (value: string | number, data: { rect: DOMRect; offsetLeft: number; node: HTMLElement }) => void;
};
const TabContext = React.createContext<TabContextType<any> | null>(null);

export const ConnectedTabs = <D extends string | number>({
  value,
  onChange,
  children,
  className
}: {
  value: D;
  onChange: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, value: D) => void;
  children: React.ReactNode;
} & Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'>) => {
  const sizesRef = useRef<Record<string | number, { rect: DOMRect; offsetLeft: number; node: HTMLElement }>>({});
  const sortedSizeRef = useRef<{ key: string | number; rect: DOMRect; offsetLeft: number }[]>([]);
  const [{ left, width }, setLeftWidth] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  const setSizes = useCallback((value: string | number, data: { rect: DOMRect; offsetLeft: number; node: HTMLElement }) => {
    sizesRef.current[value] = data;
    const sizes = sizesRef.current;
    const keys = Object.keys(sizes);
    sortedSizeRef.current = keys.sort((a, b) => sizes[a].rect.x - sizes[b].rect.x).map((k) => ({ key: k, ...sizes[k] }));
  }, []);

  useEffect(() => {
    const sortedData = sortedSizeRef.current;
    let width = sortedData[0]?.rect.width || 0,
      left = sortedData[0]?.offsetLeft || 0;
    for (let i = 0; i < sortedData.length; i++) {
      const data = sortedData[i];
      if (data.key === value) {
        width = data.rect.width;
        left = data.offsetLeft;
        sizesRef.current[value]?.node.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    }
    setLeftWidth({ left, width });
  }, [value]);

  return (
    <TabContext.Provider value={{ value, onChange, setSizes }}>
      <div
        className={cn(
          'hide-scrollbar relative flex max-w-full flex-shrink flex-grow basis-auto justify-start overflow-x-auto whitespace-nowrap border-b',
          className
        )}
      >
        <div role="tablist" className={cn('flex snap-x snap-mandatory scroll-m-2 ')}>
          {children}
        </div>
        <span className="absolute bottom-0 h-[2px] bg-theme transition-all duration-300" style={{ left, width }} />
      </div>
    </TabContext.Provider>
  );
};

//

export const ConnectedTab = <D extends string | number>({
  value: tabValue,
  label,
  className,
  children,
  ...rest
}: { value: D; label?: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const context = React.useContext(TabContext);
  if (!context) {
    throw new Error('ContainedTab must be used within a ContainedTabs component.');
  }
  const { value, onChange, setSizes } = context;

  const isActive = value === tabValue;
  const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    onChange(e, tabValue);
  };

  return (
    <RippleButton
      ref={(node) => {
        if (node != null) {
          const rect = node.getBoundingClientRect();
          setSizes(tabValue, { offsetLeft: node.offsetLeft, rect, node });
        }
      }}
      role="tab"
      aria-selected={isActive}
      onClick={handleClick}
      className={cn(
        ' block min-w-fit flex-grow rounded-t-md px-5 py-2 text-sm font-medium transition-all',
        'text-[rgba(0,0,0,0.75)] dark:text-[white] ',
        isActive ? 'text-theme' : 'hover:bg-theme/10 dark:hover:bg-theme/30',
        className
      )}
      {...rest}
    >
      {label || children}
    </RippleButton>
  );
};
