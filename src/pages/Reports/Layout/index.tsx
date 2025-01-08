import { cn } from 'src/constants/helpers';
import Content from 'src/pages/Reports/Layout/Content';
import Sidebar from 'src/pages/Reports/Layout/Sidebar';
import useLayout from 'src/pages/Reports/Layout/useLayout';

const Layout = ({ sidebarContent, children, sidebarHead }) => {
  const state = useLayout();
  const { isSidebarOpen, isMobile, toggleSidebar } = state;

  return (
    <div className="border detail-container-v1 flex h-[--max-h] p-0 [--max-h:calc(100vh-100px)]">
      <div
        onClick={toggleSidebar}
        title={isMobile && isSidebarOpen ? 'Close Sidebar' : ''}
        className={cn(
          ' absolute inset-0 cursor-pointer rounded-[10px] bg-black/50 [backdrop-filter:blur(3px)] ',
          isMobile && isSidebarOpen ? 'z-30 opacity-100 [transition:opacity_300ms,_backdrop-filter_300ms]' : '-z-10 opacity-0'
        )}
      />
      {/* {isSidebarOpen && isMobile && <div className="absolute inset-0 z-30 rounded-[10px] bg-black/50" onClick={toggleSidebar}></div>} */}
      <div className="relative flex w-full flex-grow rounded-[10px] [--report-head-height:40px] [--report-sidebar-width:284px]">
        <Sidebar state={state} sidebarHead={sidebarHead}>
          {sidebarContent}
        </Sidebar>
        <Content state={state}>{children({ isSidebarOpen, isMobile })}</Content>
      </div>
    </div>
  );
};

export default Layout;
