import { Box, Dialog } from '@mui/material';
import { map, uniq } from 'lodash';
import React from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { FormBuilder } from 'src/components/FormBuilder';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { checkFormulaLoop } from 'src/constants/formulaUtility';
import { CustomDialogTransition, fieldLabelToFieldName } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const FieldDialog = ({ handleClose, handleSuccess, surveyId, notEditable = false }) => {
  const toastConfig = React.useContext(CustomToastContext);
  const [isSubmitting, setSubmitting] = React.useState(false);
  const [section, setSection] = React.useState([]);
  const [deleteField, setDeleteField] = React.useState([]);

  React.useEffect(() => {
    axiosInstance()
      .get(`surveys/fields/${surveyId}`)
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
  }, []);

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
    const result = checkFormulaLoop(data);
    if (result.error) {
      toastConfig.setToastConfig({
        open: true,
        type: 'error',
        message: result.message
      });
      return false;
    }
    axiosInstance()
      .post(`surveys/fields/${surveyId}`, { fields: data })
      .then(({ data }) => {
        handleSuccess();
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
    <Dialog open aria-labelledby="customized-dialog-title" onClose={handleClose} TransitionComponent={CustomDialogTransition} fullWidth fullScreen>
      <CustomDialogHeader showRequiredLabel={false} title="Fields Configuration" onClose={handleClose} />
      <CustomDialogContent>
        {!notEditable && (
          <Box display="flex" justifyContent="flex-end">
            <Box>
              <label htmlFor="importField" className="mr-3 cursor-pointer">
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
              <label className="mr-3 cursor-pointer" onClick={handleExportFields}>
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
      <CustomDialogFooter>

        <ThemeButton
          buttonType='transparent'
          onClick={handleClose}
        >
          Cancel
        </ThemeButton>
        {notEditable ? null : (
          <ThemeButton
            buttonType='theme'
            disabled={isSubmitting}
            onClick={handleSave}
            isLoading={isSubmitting}
          >
            Save
          </ThemeButton>
        )}
      </CustomDialogFooter>
    </Dialog>
  );
};

export default FieldDialog;
