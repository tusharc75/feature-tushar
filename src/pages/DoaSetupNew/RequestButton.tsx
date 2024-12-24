import { Button } from '@mui/material';
import { useContext } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';

export default function RequestButton({ resource, id, entity, processStatus, fetchParentData = null }) {
  const toastConfig = useContext(CustomToastContext);

  const handleSendForDOA = () => {
    axiosInstance()
      .post(`${routes.resourceDoaRequest.path}`, {
        resource: resource,
        referenceId: id,
        entity: entity,
        processStatus: processStatus
      })
      .then(({ data }) => {
        if (fetchParentData) {
          fetchParentData();
        }
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: 'DOA Sended Successfully'
        });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  return (
    <Button variant="contained" size="small" color="primary" onClick={handleSendForDOA}>
      Send for DOA
    </Button>
  );
}
