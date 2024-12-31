import { useContext } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import { ThemeButton } from 'src/components/Helpers/Buttons';
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
    <ThemeButton buttonType='theme' onClick={handleSendForDOA}>
      Send for DOA
    </ThemeButton>
  );
}
