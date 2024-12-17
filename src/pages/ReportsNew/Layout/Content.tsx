import { IconButton } from '@material-ui/core';
import { TbLayoutSidebarFilled } from 'react-icons/tb';
import { cn } from 'src/constants/helpers';
import { LayoutComponentProps } from 'src/pages/ReportsNew/Layout/types';

const Content = ({ children, state }: LayoutComponentProps) => {
  const { toggleSidebar, isSidebarOpen, isMobile } = state;
  return (
    <main
      className={cn(
        'relative flex-grow p-4 transition-all duration-300',
        isSidebarOpen && !isMobile ? 'max-w-[calc(100%-var(--report-sidebar-width))]' : 'max-w-full'
      )}
    >
      {!isSidebarOpen && (
        <IconButton size="small" style={{ padding: 5, marginRight: 8, height: 32, width: 32 }} onClick={toggleSidebar}>
          <TbLayoutSidebarFilled className="text-[--new-theme-color]" />
        </IconButton>
      )}
      {children}
    </main>
  );
};

export default Content;
