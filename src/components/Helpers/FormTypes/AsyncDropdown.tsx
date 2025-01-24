import { CircularProgress, TextField } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { debounce } from 'lodash';
import { useCallback, useContext, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
interface Props {
  resource: string;
  multiple: boolean;
  errors: any;
  touched: any;
  value: any;
  fieldLabel: string;
  fieldName: string;
  required: boolean;
  onChange: (_: React.SyntheticEvent, value: any) => void;
}

const AsyncDropDown = ({ resource, multiple, errors, touched, value, fieldLabel, onChange, fieldName, required = false }: Props) => {
  const {
    state: { selectedEntity }
  } = useData();
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const { setToastConfig } = useContext(CustomToastContext);

  const fetchOptions = useCallback(
    debounce(async (searchKey: string = '', page: number = 0) => {
      try {
        if (searchKey !== '') {
          page = 0;
          setCurrentPage(0);
        }
        if (page === 0) {
          setCurrentPage(0);
          setOptions([]);
        }
        let query = `sa-field/options?resource=${resource}&limit=25&page=${page}&entity=${selectedEntity}&search=${searchKey}`;
        const response = await axiosInstance().get(query);
        let data = response?.data?.data;

        setOptions((currentOptions) => {
          return page === 0 ? [...data] : [...currentOptions, ...data];
        });
        if (page > 0 && data?.length > 0) {
          setCurrentPage(page);
        }
        setLoading(false);
      } catch (error) {
        setToastConfig(error);
      }
    }, 1000),
    []
  );

  return (
    <>
      <Autocomplete
        multiple={multiple}
        fullWidth
        onOpen={() => {
          setOptions([]);
          setLoading(true);
          fetchOptions('', 0);
        }}
        onInputChange={(event, value, reason) => {
          if (reason === 'input') {
            fetchOptions(value);
          }
        }}
        loading={loading}
        options={options}
        autoHighlight
        value={value ? value : multiple ? [] : ''}
        getOptionLabel={(option: any) => option?.optionLabel}
        isOptionEqualToValue={(option, val) => option?.optionValue === val?.optionValue}
        onChange={onChange}
        renderInput={(params) => (
          <TextField
            {...params}
            label={fieldLabel}
            name={fieldName}
            required={required}
            error={touched && Boolean(errors[fieldName])}
            helperText={touched && errors[fieldName]}
            size="small"
            slotProps={{
              input: {
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                )
              },
            }}
            margin="none"
            variant="outlined"
          />
        )}
        ListboxProps={{
          onScroll: (e: any) => {
            if (e.target.scrollTop + e.target.clientHeight >= e.target.scrollHeight - 1) {
              setLoading(true);
              fetchOptions('', currentPage + 1);
            }
          }
        }}
      />
    </>
  );
};

export default AsyncDropDown;
