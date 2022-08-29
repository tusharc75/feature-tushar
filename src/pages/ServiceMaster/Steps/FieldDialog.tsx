import React from 'react';
import { Dialog, Button, CircularProgress } from '@material-ui/core';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import axiosInstance from 'src/axios/axiosInstance';
import { serviceMaster } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { camelCase } from 'lodash';
import { FormBuilder } from '../../../components/FormBuilder';
import { uniq, map } from 'lodash';

const FieldDialog = ({ handleClose, handleSucess, serviceId, steps, stepId }) => {

  const toastConfig = React.useContext(CustomToastContext);
  const [isSubmitting, setSubmitting] = React.useState(false);

  const [section, setSection] = React.useState([]);
  const [deleteField, setDeleteField] = React.useState([]);

  React.useEffect(() => {
    axiosInstance().get(`${serviceMaster.api}/fields/${serviceId}/${stepId}`).then(({ data: { data } }) => {
      const _data = [];
      const _section = uniq(map(data, 'sectionName'));
      _section.forEach((element: any, index: number) => {
        _data.push({
          sectionId: index,
          sectionName: element,
          field: data?.filter((el: any) => el.sectionName === element)
        });
      });
      setSection(_data);
    })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  }, []);

  const handleSave = async () => {
    let data = [];
    let order = 0;
    section.forEach((_section) => {
      _section.field.forEach((_field) => {
        let _field_data = _field;
        _field_data._id = _field_data._id.toString();
        _field_data.sectionName = _section.sectionName;
        if (!isNaN(_field._id)) {
          _field_data.fieldName = camelCase(_field.fieldLabel.replace(/[^a-zA-Z0-9]/g, ''));
        }
        _field_data.order = ++order;
        if (!_field_data.roleType) {
          _field_data.roleType = 0;
        }
        data.push(_field_data);
      });
    });
    axiosInstance().post(`${serviceMaster.api}/fields/${serviceId}/${stepId}`, { fields: data }).then(({ data }) => {
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
        <FormBuilder
          section={section}
          setSection={setSection}
          deleteField={deleteField}
          setDeleteField={setDeleteField}
          isCustomField={false}
          extraFields={[]}
          module="form-builder"
          resource={null}
        />
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

export default FieldDialog;
