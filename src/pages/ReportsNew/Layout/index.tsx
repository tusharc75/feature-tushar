import Content from 'src/pages/ReportsNew/Layout/Content';
import Sidebar from 'src/pages/ReportsNew/Layout/Sidebar';
import useLayout from 'src/pages/ReportsNew/Layout/useLayout';

const Layout = ({ sidebarContent, children, sidebarHead }) => {
  const state = useLayout();
  const { isSidebarOpen, isMobile, toggleSidebar } = state;

  return (
    <div className="detail-container-v1 flex h-[--max-h] p-0 [--max-h:calc(100vh-100px)]">
      {isSidebarOpen && isMobile && <div className="absolute inset-0 z-30 rounded-[10px] bg-black/50" onClick={toggleSidebar}></div>}
      <div className="relative flex w-full flex-grow rounded-[10px] [--report-head-height:40px] [--report-sidebar-width:284px]">
        <Sidebar state={state} sidebarHead={sidebarHead}>
          {sidebarContent}
        </Sidebar>
        <Content state={state}>{children}</Content>
      </div>
    </div>
  );
};

export default Layout;
