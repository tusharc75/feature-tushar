import React from 'react';
import { Dialog, Button, Box, CircularProgress, Grid } from '@material-ui/core';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import axiosInstance from 'src/axios/axiosInstance';
import { serviceMaster } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { camelCase } from 'lodash';
import { FormBuilder } from '../../../components/FormBuilder';
import { uniq, map } from 'lodash';
import { CustomDialogTransition } from '../../../constants/helpers';

const FieldDialog = ({
  handleClose,
  handleSucess,
  serviceId,
  steps,
  stepIds,
  reference = '',
  fields = null,
  notEditable = false,
}) => {

  const toastConfig = React.useContext(CustomToastContext);
  const [isSubmitting, setSubmitting] = React.useState(false);

  const [section, setSection] = React.useState([]);
  const [deleteField, setDeleteField] = React.useState([]);

  React.useEffect(() => {
    if (reference === 'workOrder') {
      const _data = [];
      const _section = uniq(map(fields, 'sectionName'));
      _section.forEach((element: any, index: number) => {
        _data.push({
          sectionId: index,
          sectionName: element,
          field: fields?.filter((el: any) => el.sectionName === element)
        });
      });
      setSection(_data);
    }
    else {
      axiosInstance()
        .get(`${serviceMaster.api}/fields/${serviceId}/${stepIds[0]}`)
        .then(({ data: { data } }) => {
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
    }
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
    if (reference === 'workOrder') {
      handleSucess(data);
    }
    else {
      axiosInstance()
        .post(`${serviceMaster.api}/fields/${serviceId}`, { stepIds: stepIds, fields: data })
        .then(({ data }) => {
          handleSucess();
          toastConfig.setToastConfig({
            open: true,
            message: data.message,
            severity: 'success'
          });
        })
        .catch((err) => {
          toastConfig.setToastConfig(err);
        });
    }
  };

  const handleExportFields = () => {
    var dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(section));
    var dlAnchorElem = document.getElementById('downloadAnchorElem');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', 'step_fields.json');
    dlAnchorElem.click();
  };

  const handleImportFields = (e) => {
    e.preventDefault();
    var files = e.target.files,
      f = files[0];
    var reader = new FileReader();
    reader.onload = function (e) {
      var data: any = e.target.result;
      setSection(JSON.parse(data));
    };
    reader.readAsBinaryString(f);
  };

  return (
    <Dialog open aria-labelledby="customized-dialog-title" onClose={handleClose} TransitionComponent={CustomDialogTransition} fullWidth fullScreen>
      <CustomDialogHeader showRequiredLabel={false} title="Fields Configuration" onClose={handleClose} />
      <CustomDialogContent>
        {!notEditable && (
          <Box display="flex" justifyContent="flex-end">
            <Box>
              <label htmlFor="importField" className="cursor-pointer mr-3">
                Import Fields
                <input
                  onClick={(e: any) => (e.target.value = null)}
                  id="importField"
                  name="importField"
                  onChange={handleImportFields}
                  style={{
                    opacity: '0',
                    display: 'none',
                    zIndex: -1
                  }}
                  type="file"
                />
              </label>
              <label className="cursor-pointer mr-3" onClick={handleExportFields}>
                Export Fields
              </label>
              <a id="downloadAnchorElem" style={{ display: 'none' }}></a>
            </Box>
          </Box>
        )}
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
      {!notEditable && (
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
      )}
    </Dialog>
  );
};

export default FieldDialog;
