import React from 'react';
import RippleButton from 'src/components/RippleButton';
import { cn } from 'src/constants/helpers';

type TabContextType<D> = {
  value: D;
  onChange: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, value: D) => void;
};
const TabContext = React.createContext<TabContextType<any> | null>(null);
const ContainedTabs = <D,>({
  value,
  onChange,
  children,
  className
}: {
  value: D;
  onChange: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, value: D) => void;
  children: React.ReactNode;
} & Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'>) => {
  return (
    <TabContext.Provider value={{ value, onChange }}>
      <div className={cn('overflow-hidden rounded-[8px] bg-gray-200 p-1 dark:bg-[--dark-secondary]', className)}>
        <div role="tablist" className={cn('hide-scrollbar flex max-w-full snap-x snap-mandatory scroll-m-2 gap-1 overflow-x-auto ')}>
          {children}
        </div>
      </div>
    </TabContext.Provider>
  );
};

export const ContainedTab = <D,>({
  value: tabValue,
  label,
  className,
  ...rest
}: { value: D; label: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const context = React.useContext(TabContext);
  if (!context) {
    throw new Error('ContainedTab must be used within a ContainedTabs component.');
  }
  const { value, onChange } = context;

  const isActive = value === tabValue;
  const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    onChange(e, tabValue);
  };

  return (
    <RippleButton
      role="tab"
      aria-selected={isActive}
      onClick={handleClick}
      className={cn(
        ' block min-w-fit flex-grow rounded-md px-4 py-1 text-sm font-medium',
        '',
        isActive ? 'bg-[--dark-primary,white]' : '',
        className
      )}
      {...rest}
    >
      {label}
    </RippleButton>
  );
};

export default ContainedTabs;
