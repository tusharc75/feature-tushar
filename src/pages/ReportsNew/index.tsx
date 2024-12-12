import { Box, Button } from '@material-ui/core';
import { AiFillCalendar } from 'react-icons/ai';
import { Link } from 'react-router-dom';
import Layout from 'src/pages/ReportsNew/Layout';
import SidebarContent from 'src/pages/ReportsNew/SidebarContent';
import SidebarHead from 'src/pages/ReportsNew/SidebarHead';
import useReport from 'src/pages/ReportsNew/useReport';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import ReportsContent from 'src/pages/ReportsNew/ReportsContent';

const ReportsCenter = () => {
  const state = useReport();
  const { permissions } = state;

  return (
    <div className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[{ title: 'Reports', path: '' }]} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            <Link to="/custom-report">
              <Button variant="outlined" className="btn-outline-v1" size="small" endIcon={<AiFillCalendar />}>
                Custom Report
              </Button>
            </Link>
            {permissions?.scheduleReport?.isRead && (
              <Link to={`/schedule-report`}>
                <Button variant="outlined" className="btn-outline-v1" size="small" endIcon={<AiFillCalendar />}>
                  Schedule Report
                </Button>
              </Link>
            )}
          </Box>
        </Box>
      </Box>

      <Layout sidebarHead={<SidebarHead state={state} />} sidebarContent={<SidebarContent state={state} />}>
        {({ isSidebarOpen, isMobile }) => <ReportsContent state={state} isSidebarOpen={isSidebarOpen} isMobile={isMobile} />}
      </Layout>
    </div>
  );
};

export default ReportsCenter;
