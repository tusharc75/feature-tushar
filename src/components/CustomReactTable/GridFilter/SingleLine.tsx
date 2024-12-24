import { CircularProgress, TextField } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { debounce, startCase } from 'lodash';
import { useCallback, useContext, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';

const SingleLine = ({ resource, errors, touched, value, fieldLabel, onChange, fieldName, required = false, fieldData, allFields }) => {
  const { setToastConfig } = useContext(CustomToastContext);

  const {
    state: { selectedEntity }
  } = useData();

  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const fetchOptions = useCallback(
    debounce(async (searchKey: string = '', page: number = 0) => {
      try {
        let _resource = resource;
        let _fieldName = fieldName;
        if (fieldData?.type === 'lookUpDisplay') {
          _fieldName = fieldData?.lookUpFieldDisplay;
          const lookUpField = allFields?.find((e) => e.fieldName === fieldData?.lookUpField);
          if (lookUpField) {
            _resource = lookUpField.lookupResource;
          }
        }
        if (searchKey !== '') {
          page = 0;
          setCurrentPage(0);
        }
        if (page === 0) {
          setCurrentPage(0);
          setOptions([]);
        }
        const query = `sa-field/fieldName/options?resource=${_resource}&limit=25&page=${page}&entity=${selectedEntity}&fieldName=${_fieldName}&search=${searchKey}`;
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
        multiple={true}
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
        value={value}
        getOptionLabel={(option: any) => option || ''}
        isOptionEqualToValue={(option, val) => option === val}
        onChange={onChange}
        renderInput={(params) => (
          <TextField
            {...params}
            label={fieldLabel}
            name={fieldName}
            required={required}
            error={touched && Boolean(errors[fieldName])}
            helperText={touched && errors[fieldName]}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              )
            }}
            margin="none"
            size={'small'}
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

export default SingleLine;
