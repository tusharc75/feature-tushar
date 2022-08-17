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
import { camelCase } from 'lodash';

const ConfiguratorDialog = ({ handleClose, handleSucess, id, configuration }) => {

  const toastConfig = React.useContext(CustomToastContext);
  const [fields, setFields] = React.useState<any>([]);
  const [isSubmitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    setFields(configuration);
  }, [configuration]);

  const handleSave = async () => {
    const configureFields = fields;
    configureFields?.forEach((_field: any) => {
      if (!isNaN(_field._id)) {
        _field.fieldName = camelCase(_field.fieldLabel.replace(/[^a-zA-Z0-9]/g, ''));
      }
    })
    axiosInstance().post(`${serviceMaster.api}/configure-fields`, {
      serviceId: id,
      configureFields: configureFields
    })
      .then(({ data }) => {
        handleSucess()
        toastConfig.setToastConfig({
          open: true,
          message: data.message,
          severity: 'success'
        });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  return (
    <Dialog open onClose={handleClose} fullScreen>
      <CustomDialogHeader
        showRequiredLabel={false}
        title="Fields Configuration"
        onClose={handleClose} />
      <CustomDialogContent>
        <DndProvider backend={HTML5Backend}>
          <Configurator fields={fields} setFields={setFields} />
        </DndProvider>
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button disabled={isSubmitting} variant="outlined" size="small" color="primary" onClick={handleClose}>
          Close
        </Button>
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
      </CustomDialogFooter>
    </Dialog>
  );
};

export default ConfiguratorDialog;
