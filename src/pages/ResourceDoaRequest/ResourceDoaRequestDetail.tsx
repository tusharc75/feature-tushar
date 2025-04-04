import { Box } from '@mui/material';
import { useContext } from 'react';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import { DOA_STATUS } from 'src/constants/helpers';
import ShowDoa from 'src/pages/DoaSetupNew/ShowDoa';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';

const ResourceDoaRequestDetail = () => {
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { user, resources }
  }: any = useData();

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[{ ...routes.resourceDoaRequest, title: resources?.resourceDoaRequest?.titlePlural }, { title: `abc` }]} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1"></Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <ShowDoa status={DOA_STATUS.pending} data={{}} />
      </Box>
    </Box>
  );
};

export default ResourceDoaRequestDetail;
