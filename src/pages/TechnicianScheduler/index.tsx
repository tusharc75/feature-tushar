import { Box } from '@mui/material';
import { useData } from 'src/StateProvider/Provider';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import Timeline from 'src/pages/TechnicianScheduler/Vis';

function TechnicianScheduler() {
  const {
    state: { resources }
  }: any = useData();

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[{ title: resources?.technicianScheduler?.titlePlural }]} />
        </Box>
      </Box>
      <Box className="detail-container-v1">
        <Timeline />
      </Box>
    </Box>
  );
}

export default TechnicianScheduler;
