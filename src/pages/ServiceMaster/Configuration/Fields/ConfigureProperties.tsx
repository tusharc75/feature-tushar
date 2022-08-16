import React, { useCallback } from 'react';
import { Dialog, Button, Box, TextField, FormControlLabel, Checkbox, Grid } from '@material-ui/core';

import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { DndProvider } from 'react-dnd';
import { TouchBackend } from 'react-dnd-touch-backend';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { isMobile, isTablet } from 'react-device-detect';
import { FixedSizeList } from 'react-window';
import update from 'immutability-helper';
import { Autocomplete } from '@material-ui/lab';
import Options from '../AddField/option';

const ConfigureProperties = ({ close, field, setFields }: any) => {
  const [values, setValues] = React.useState(field);
  const stepOptions = [];
  const defaultOption = [{ step: 'Step 1' }];
  const [options, setOptions] = React.useState(stepOptions.length === 0 ? defaultOption : stepOptions);
  const [isUpdate, setUpdate] = React.useState(false);
  // const [isUpatingSteps, setIsUpatingSteps] = useState(false);

  //   React.useEffect(() => {
  //     setValues(field);
  //   }, [field]);

  const onSave = () => {
    setFields((prevState) =>
      prevState?.map((f) => {
        if (f.id === field.id) {
          return values;
        }

        return f;
      })
    );
    close();
  };

  const onChangeValue = (index, value) => {
    let data = [...options];
    data[index].step = value;
    setOptions([...data]);
  };

  const moveCard = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const dragCard = options[dragIndex];
      setOptions([
        ...update(options, {
          $splice: [
            [dragIndex, 1],
            [hoverIndex, 0, dragCard]
          ]
        })
      ]);
    },
    [options]
  );

  const AddRemoveValue = (type, index) => {
    let data = options;
    if (type === 'add') {
      data.splice(index + 1, 0, {
        step: 'Step ' + (data.length + 1)
      });
    } else {
      if (data.length !== 1) {
        data.splice(index, 1);
      }
    }
    setOptions(data);
    setUpdate(!isUpdate);
  };

  return (
    <Dialog open onClose={close} fullWidth maxWidth="md">
      <CustomDialogHeader title="Properties" onClose={close} />
      <CustomDialogContent>
        <Box mb={2}>
          <TextField
            fullWidth
            size="small"
            label="Field Label"
            variant="outlined"
            value={values.fieldLabel}
            onChange={(e) => setValues((prevState) => ({ ...prevState, fieldLabel: e.target.value }))}
          />
        </Box>
        {field['type'] === 'Dropdown' && <Options field={values} setFields={setValues} />}
        <Box mt={2}>
          <FormControlLabel
            control={
              <Checkbox
                name="required"
                //disabled={values['required'] ? true : false}
                checked={values?.required}
                onChange={(e) => {
                  setValues((prevState) => ({
                    ...prevState,
                    required: e.target.checked
                  }));
                }}
                color="primary"
              />
            }
            label="Required"
          />
        </Box>
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button variant="outlined" size="small" color="primary" onClick={onSave}>
          Save
        </Button>
        <Button variant="outlined" size="small" color="primary" onClick={close}>
          Close
        </Button>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default ConfigureProperties;
