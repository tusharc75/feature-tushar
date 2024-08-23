import { useContext, useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Dialog } from '@material-ui/core';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { FormBuilder } from 'src/components/FormBuilder';
import { CustomDialogTransition, fieldLabelToFieldName, serviceMaster } from 'src/constants/helpers';
import axiosInstance from 'src/axios/axiosInstance';
import { map, uniq } from 'lodash';
import { useData } from 'src/StateProvider/Provider';
import { checkFormulaLoop } from 'src/constants/formulaUtility';

const ConfigureFields = ({ serviceId, handleClose, handleSucess, reference = '', fields = null }) => {
  const toastConfig = useContext(CustomToastContext);

  const { state: { user } }: any = useData();

  const [isSubmitting, setSubmitting] = useState(false);
  const [section, setSection] = useState([]);
  const [deleteField, setDeleteField] = useState([]);

  useEffect(() => {
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
      if (_data?.length === 0) {
        _data.push({
          sectionId: parseInt((Math.random() * 100000).toString()),
          sectionName: 'New Section 1',
          srno: 1,
          field: []
        });
      }
      setSection(_data);
    } else {
      axiosInstance()
        .get(`${serviceMaster.api}/service-fields/${serviceId}`)
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
          if (_data?.length === 0) {
            _data.push({
              sectionId: parseInt((Math.random() * 100000).toString()),
              sectionName: 'New Section 1',
              srno: 1,
              field: []
            });
          }
          setSection(_data);
        })
        .catch((err) => {
          toastConfig.setToastConfig(err);
        });
    }
  }, [serviceId]);

  const handleSave = async () => {
    setSubmitting(true);
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
    const result = checkFormulaLoop(data);
    if (result.error) {
      toastConfig.setToastConfig({
        open: true,
        type: 'error',
        message: result.message
      });
      return false;
    }
    if (reference === 'workOrder') {
      handleSucess(data);
      setSubmitting(false);
    } else {
      axiosInstance()
        .post(`${serviceMaster.api}/service-fields/${serviceId}`, data)
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

export default ConfigureFields;
