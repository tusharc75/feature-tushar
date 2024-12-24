import { useState, useEffect, useContext } from 'react';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import axiosInstance from '../../../axios/axiosInstance';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';

export const Currency = ({ values, setFieldValue, refrence, touched, errors }) => {
  const toastConfig = useContext(CustomToastContext);
  const [currency, setCurrency] = useState([]);

  useEffect(() => {
    axiosInstance()
      .get(`/converter?type=currency`)
      .then(({ data: { data } }) => {
        setCurrency(data.currency);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }, []);

  return (
    <Box>
      <Autocomplete
        multiple
        disableCloseOnSelect={true}
        id="tags-filled"
        options={refrence !== 'formAdd' ? [...['CUR'], ...currency] : currency}
        value={values['displayCurrency'] ? values['displayCurrency'] : []}
        renderTags={(value: string[], getTagProps) =>
          value.map((option: string, index: number) => <Chip variant="outlined" label={option} {...getTagProps({ index })} />)
        }
        onChange={(e, value) => setFieldValue('displayCurrency', value)}
        renderInput={(params) => (
          <TextField
            {...params}
            margin="dense"
            variant="outlined"
            name="displayCurrency"
            label="Currency"
            placeholder="Currency"
            error={touched['displayCurrency'] && Boolean(errors['displayCurrency'])}
            helperText={touched['displayCurrency'] && errors['displayCurrency']}
          />
        )}
      />
    </Box>
  );
};
