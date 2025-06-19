import { useContext } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import routes from 'src/components/Helpers/Routes';
import SendIcon from '@mui/icons-material/Send';

export default function RequestButton({ resource, id, entity, processStatus = null, fetchData = null }) {
  const toastConfig = useContext(CustomToastContext);

  const handleSendForDOA = () => {
    const data: any = {
      resource: resource,
      referenceId: id,
      entity: entity,
    }
    if (processStatus) {
      data.processStatus = processStatus;
    }
    axiosInstance().post(`${routes.resourceDoaRequest.path}`, data).then(({ data }) => {
      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: 'DOA Sent Successfully'
      });
      if (fetchData) {
        fetchData();
      }
    }).catch((err) => {
      toastConfig.setToastConfig(err);
    });
  };

  return (
    <ThemeButton
      buttonType='theme'
      startIcon={<SendIcon fontSize="small" />}
      onClick={handleSendForDOA}>
      Send for DOA
    </ThemeButton>
  );
}
