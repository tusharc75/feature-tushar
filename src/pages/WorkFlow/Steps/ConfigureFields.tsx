import { useContext, useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Dialog } from '@material-ui/core';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { CustomDialogTransition, fieldLabelToFieldName } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import { FormBuilder } from '../../../components/FormBuilder';
import { map, uniq } from 'lodash';
import { useData } from 'src/StateProvider/Provider';
import routes from 'src/components/Helpers/Routes';

const ConfigureField = ({ id, step = null, handleClose, handleSucess }) => {

  const { state: { user } }: any = useData();

  const toastConfig = useContext(CustomToastContext);
  const [isSubmitting, setSubmitting] = useState(false);

  const [section, setSection] = useState([]);
  const [deleteField, setDeleteField] = useState([]);

  useEffect(() => {
    const _data = [];
    const _section = uniq(map(step?.fields, 'sectionName'));
    _section.forEach((element: any, index: number) => {
      _data.push({
        sectionId: index,
        sectionName: element,
        field: step?.fields?.filter((el: any) => el.sectionName === element)
      });
    });
    if (_data?.length === 0) {
      _data.push({
        sectionId: parseInt((Math.random() * 100000).toString()),
        sectionName: 'New Section 1',
        srno: 1,
        field: []
      });
    }
    setSection(_data);
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
          _field_data.fieldName = fieldLabelToFieldName(_field.fieldLabel);
        }
        _field_data.order = ++order;
        if (!_field_data.roleType) {
          _field_data.roleType = 0;
        }
        data.push(_field_data);
      });
    });
    const errorFields = [];
    const fieldNameMap: any = [];
    data?.forEach((e) => {
      if (fieldNameMap?.find((ele) => ele.fieldName === e.fieldName)) {
        errorFields.push(fieldNameMap?.find((ele) => ele.fieldName === e.fieldName)?.fieldLabel);
      } else {
        fieldNameMap.push({ fieldName: e.fieldName, fieldLabel: e.fieldLabel });
      }
    });
    if (errorFields?.length) {
      toastConfig.setToastConfig({
        open: true,
        type: 'error',
        message: `Field ${errorFields?.toString()} duplicate`
      });
      return false;
    }

    if (step?._id) {
      setSubmitting(true);
      axiosInstance()
        .put(`${routes.workFlow.path}/${id}/steps/fields`, { stepId: step?._id, fields: data })
        .then(({ data }) => {
          setSubmitting(false);
          handleSucess();
          toastConfig.setToastConfig({
            open: true,
            message: data.message,
            severity: 'success'
          });
        })
        .catch((err) => {
          setSubmitting(false);
          toastConfig.setToastConfig(err);
        });
    }
  };

  return (
    <Dialog open aria-labelledby="customized-dialog-title" onClose={handleClose} TransitionComponent={CustomDialogTransition} fullWidth fullScreen>
      <CustomDialogHeader showRequiredLabel={false} title={`Fields Configuration ${step?.stepName}`} onClose={handleClose} />
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
          brandId={user.user.brand}
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
export default ConfigureField;
