import { IconButton } from '@material-ui/core';
import React from 'react';
import { cn } from 'src/constants/helpers';
import { LayoutComponentProps } from 'src/pages/ReportsNew/Layout/types';
import { TbLayoutSidebarFilled } from 'react-icons/tb';

const Sidebar = ({ children, state, sidebarHead }: { sidebarHead: React.ReactNode } & LayoutComponentProps) => {
  const { isMobile, isSidebarOpen, toggleSidebar, transitionComplete } = state;

  return (
    <aside
      className={cn(
        'relative flex-shrink-0 rounded-l-[10px] bg-[var(--dark-primary,white)]  transition-all duration-300',
        isSidebarOpen ? 'w-[--report-sidebar-width] [border-right:1px_solid_var(--common-border-color)]' : 'w-0 overflow-hidden',
        transitionComplete ? '' : 'overflow-hidden',
        isMobile ? 'absolute bottom-0 top-0 z-40 h-full max-h-full transition-all duration-200' : ''
      )}
    >
      <div className={cn('flex h-full max-h-[--max-h] w-[--report-sidebar-width] flex-col px-4 py-3')}>
        <div className="side-head mb-4">
          <div className="flex-grow [&_h6]:mb-4 [&_h6]:pr-[28px] [&_h6]:text-[16px] [&_h6]:font-semibold [&_h6]:leading-[22px]">{sidebarHead}</div>
          <div className="absolute right-2 top-2">
            <IconButton size="small" style={{ padding: 5 }} onClick={toggleSidebar}>
              <TbLayoutSidebarFilled className="text-[--new-theme-color]" />
            </IconButton>
          </div>
        </div>
        <div className="flex-grow overflow-y-auto">{children}</div>
      </div>
    </aside>
  );
};

export default Sidebar;
