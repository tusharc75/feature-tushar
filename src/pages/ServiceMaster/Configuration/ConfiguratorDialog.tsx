import React from 'react';
import { Dialog, Button, CircularProgress } from '@material-ui/core';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import axiosInstance from 'src/axios/axiosInstance';
import Configurator from './Configurator';
import { serviceMaster } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const ConfiguratorDialog = (props: any) => {
  const { close, id, configuration, fetchConfiguration } = props;
  const { api } = serviceMaster;
  const { setToastConfig } = React.useContext(CustomToastContext);
  const [fields, setFields] = React.useState<any>([]);
  const [isSubmitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    setFields(configuration);
  }, [configuration]);

  const handleSave = async () => {
    if (!id) return;

    try {
      setSubmitting(true);
      const { data } = await axiosInstance().post(`${api}/configure-fields`, {
        serviceId: id,
        configureFields: fields
      });

      if (data) {
        setSubmitting(false);
        close();
        setToastConfig({
          message: 'Successfully created',
          type: 'success',
          open: true
        });
        fetchConfiguration();
      }
    } catch (error) {
      setSubmitting(false);
      setToastConfig(error);
    }
  };
  return (
    <Dialog open onClose={close} fullScreen>
      <CustomDialogHeader title="Configurator" onClose={close} />
      <CustomDialogContent>
        <DndProvider backend={HTML5Backend}>
          <Configurator fields={fields} setFields={setFields} />
        </DndProvider>
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button
          variant="contained"
          size="small"
          color="primary"
          disabled={isSubmitting}
          onClick={handleSave}
          endIcon={isSubmitting && <CircularProgress size={18} color="inherit" />}
        >
          Save
        </Button>
        <Button disabled={isSubmitting} variant="outlined" size="small" color="primary" onClick={close}>
          Close
        </Button>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default ConfiguratorDialog;
