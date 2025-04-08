import { Close } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import React from 'react';
import { cn } from 'src/constants/helpers';
import { useTechnicianContext } from 'src/pages/TechnicianScheduler/Context';
import SearchButton from 'src/pages/TechnicianScheduler/SearchButton';

type LeftSidebarProps = {
  children: React.ReactNode;
  title: React.ReactNode;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isSidebarOpen: boolean;
};
const LeftSidebar = ({ children, title, isSidebarOpen, setIsSidebarOpen }: LeftSidebarProps) => {
  const { leftSearchValue, setLeftSearchValue } = useTechnicianContext();
  return (
    <div
      className={cn(
        'sticky left-0 top-0 z-10 h-[--container-h] overflow-hidden bg-[var(--dark-primary,white)] transition-all duration-300 [--sidebar-w:300px]',
        isSidebarOpen ? 'w-[--sidebar-w] border-r' : 'w-0'
      )}
    >
      <div className={cn('flex h-[--container-h] w-[--sidebar-w]  flex-col overflow-y-auto')}>
        <div className="sticky top-0 flex items-center justify-between gap-2 border-b bg-[--dark-primary,white] p-2">
          <h6 className="line-clamp-1 text-[1rem] font-semibold">{title}</h6>
          <div className="flex">
            <SearchButton value={leftSearchValue} setValue={setLeftSearchValue} />
            <IconButton size="small" onClick={() => setIsSidebarOpen((prev) => !prev)} color="primary">
              <Close fontSize="small" />
            </IconButton>
          </div>
        </div>
        <div className="flex-grow">{children}</div>
      </div>
    </div>
  );
};

export default LeftSidebar;
