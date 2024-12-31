import React from 'react';
import { Dialog } from '@mui/material';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import { CustomDialogTransition, fieldLabelToFieldName } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { uniq, map } from 'lodash';
import { useData } from 'src/StateProvider/Provider';
import { FormBuilder } from '../..';
import { checkFormulaLoop } from 'src/constants/formulaUtility';

const SubFieldsDialog = ({ handleClose, fields = [], setFieldValue }) => {
  const {
    state: { user }
  }: any = useData();

  const toastConfig = React.useContext(CustomToastContext);

  const [section, setSection] = React.useState([]);
  const [deleteField, setDeleteField] = React.useState([]);

  const fetchFieldsData = async () => {
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
  };

  React.useEffect(() => {
    fetchFieldsData();
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
    setFieldValue('subFields', data);
    handleClose();
  };

  return (
    <Dialog open aria-labelledby="customized-dialog-title" onClose={handleClose} TransitionComponent={CustomDialogTransition} fullWidth fullScreen>
      <CustomDialogHeader showRequiredLabel={false} title="Fields Configuration" onClose={handleClose} />
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
        <ThemeButton buttonType='transparent' onClick={handleClose}>
          Close
        </ThemeButton>
        <ThemeButton buttonType='theme' onClick={handleSave}>
          Save
        </ThemeButton>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default SubFieldsDialog;
