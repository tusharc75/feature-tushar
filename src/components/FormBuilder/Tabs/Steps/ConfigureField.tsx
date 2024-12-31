import { useContext, useEffect, useState } from 'react';
import { Box, Dialog } from '@mui/material';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { CustomDialogTransition, fieldLabelToFieldName } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import { FormBuilder } from '../../../../components/FormBuilder';
import { map, uniq } from 'lodash';
import { useData } from 'src/StateProvider/Provider';
import { checkFormulaLoop } from 'src/constants/formulaUtility';

const ConfigureField = ({ step = null, handleClose, handleSucess }) => {
  const {
    state: { user }
  }: any = useData();

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
    const result = checkFormulaLoop(data);
    if (result.error) {
      toastConfig.setToastConfig({
        open: true,
        type: 'error',
        message: result.message
      });
      return false;
    }
    handleSucess(data);
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
      <CustomDialogHeader showRequiredLabel={false} title={`Fields Configuration`} onClose={handleClose} />
      <CustomDialogContent>
        <Box display="flex" justifyContent="flex-end">
          <Box pb={1}>
            <label htmlFor="importFieldStepsFormBuilder" className="mr-3 cursor-pointer">
              Import Fields
              <input
                onClick={(e: any) => (e.target.value = null)}
                id="importFieldStepsFormBuilder"
                name="importFieldStepsFormBuilder"
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
        <ThemeButton buttonType="transparent" onClick={handleClose}>
          Close
        </ThemeButton>
        <ThemeButton
          buttonType="theme"
          disabled={isSubmitting}
          onClick={handleSave}
          isLoading={isSubmitting}
        >
          Save
        </ThemeButton>
      </CustomDialogFooter>
    </Dialog>
  );
};
export default ConfigureField;
