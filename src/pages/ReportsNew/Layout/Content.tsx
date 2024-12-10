import { IconButton } from '@material-ui/core';
import { TbLayoutSidebarFilled } from 'react-icons/tb';
import { LayoutComponentProps } from 'src/pages/ReportsNew/Layout/types';

const Content = ({ children, state }: LayoutComponentProps) => {
  const { toggleSidebar, isSidebarOpen } = state;
  return (
    <main className="relative flex-grow p-4">
      {!isSidebarOpen && (
        <IconButton size="small" style={{ padding: 5 }} onClick={toggleSidebar}>
          <TbLayoutSidebarFilled className="text-[--new-theme-color]" />
        </IconButton>
      )}
      {children}
    </main>
  );
};

export default Content;
