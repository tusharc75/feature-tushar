import { Box } from '@mui/material';
import PhotoFilterIcon from '@mui/icons-material/PhotoFilter';
import DateRangeIcon from '@mui/icons-material/DateRange';
import { Link } from 'react-router-dom';
import Layout from 'src/pages/Reports/Layout';
import SidebarContent from 'src/pages/Reports/SidebarContent';
import SidebarHead from 'src/pages/Reports/SidebarHead';
import useReport from 'src/pages/Reports/useReport';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import ReportsContent from 'src/pages/Reports/ReportsContent';
import routes from 'src/components/Helpers/Routes';
import { useMemo } from 'react';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const ReportsCenter = () => {
  const state = useReport();
  const { permissions, selectedReport } = state;

  const routesList = useMemo(() => {
    const routeList: { title: string; path: string }[] = [];
    if (selectedReport) {
      routeList.push({ title: 'Reports', path: routes.reports.path }, { title: selectedReport.title, path: '' });
    } else {
      routeList.push({ title: 'Reports', path: '' });
    }
    return routeList;
  }, [selectedReport]);

  return (
    <div className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={routesList} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            <Link to="/custom-report">
              <ThemeButton iconForMobile={<PhotoFilterIcon />} startIcon={<PhotoFilterIcon />} mobileTooltip={`Custom Report`}>
                Custom Report
              </ThemeButton>
            </Link>
            {permissions?.scheduleReport?.isRead && (
              <Link to={`/schedule-report`}>
                <ThemeButton iconForMobile={<DateRangeIcon />} startIcon={<DateRangeIcon />} mobileTooltip={`Schedule Report`}>
                  Schedule Report
                </ThemeButton>
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
