import { useState, useEffect } from 'react';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Autocomplete from '@mui/material/Autocomplete';
import { Checkbox, FormControlLabel } from '@mui/material';
import { useData } from 'src/StateProvider/Provider';

export const Entity = ({ values, setFieldValue, touched, errors }) => {
  const {
    state: { user }
  }: any = useData();

  const [entityOptions, setEntityOptions] = useState([]);

  useEffect(() => {
    setEntityOptions(user?.entity?.map((e) => ({ optionLabel: e?.entityName, optionValue: e?._id })));
  }, []);

  return (
    <Box>
      <Box>
        <FormControlLabel
          control={
            <Checkbox
              name="isFieldEntityWise"
              checked={values['isFieldEntityWise']}
              onChange={(e) => {
                setFieldValue('isFieldEntityWise', e.target.checked);
                setFieldValue('fieldEntity', []);
              }}
              color="primary"
            />
          }
          label="Show Entity Wise "
        />
      </Box>
      <Box>
        {values['isFieldEntityWise'] && (
          <Autocomplete
            id="entity-dependent-on-field"
            multiple={true}
            options={entityOptions}
            disabled={!values['isFieldEntityWise']}
            getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
            isOptionEqualToValue={(option: any, val) => option?.optionValue === val?.optionValue}
            value={
              values['fieldEntity']?.length > 0
                ? entityOptions.filter((option) => values['fieldEntity'].includes(option.optionValue))?.map((option) => option)
                : []
            }
            onChange={(e, val) => {
              setFieldValue(
                'fieldEntity',
                val.map((option) => option.optionValue)
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                margin="dense"
                size="small"
                variant="outlined"
                label="Entites"
                error={touched && errors && touched['fieldEntity'] && Boolean(errors['fieldEntity'])}
                helperText={touched && errors && touched['fieldEntity'] && errors['fieldEntity']}
              />
            )}
          />
        )}
      </Box>
    </Box>
  );
};
