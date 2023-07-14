import { Box, } from '@material-ui/core';
import { useState } from 'react';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import Roadmap from './Roadmap';
import ServiceOrder from './ServiceOrder';

function TechnicianScheduler() {

  const [filter, setFilter] = useState({ view: 'Technician View', resource: '', fieldTicket: '' });

  const [assignTechnicianDialog, setAssignTechnicianDialog] = useState({ open: false, data: null });
  const [refresh, setRefresh] = useState(false);

  const [selectedRecords, setSelectedRecords] = useState([]);

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[{ title: routes.technicianScheduler.title }]} />
        </Box>
      </Box>
      <Box className="detail-container-v1">
        <Roadmap
          filter={filter}
          selectedRecords={selectedRecords}
          refresh={refresh}
          handleAssignTechnician={(data) => {
            setAssignTechnicianDialog({ open: true, data: data });
          }} />
        <ServiceOrder
          setSelectedRecords={setSelectedRecords}
          selectedRecords={selectedRecords}
          assignTechnicianDialog={assignTechnicianDialog}
          handleSucess={() => {
            setRefresh(!refresh)
            setAssignTechnicianDialog({ open: false, data: null });
          }}
          handleClose={() => {
            setAssignTechnicianDialog({ open: false, data: null });
          }}
        />
      </Box>
    </Box>
  );
}

export default TechnicianScheduler;
