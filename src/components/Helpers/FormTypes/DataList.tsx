import { Box, CircularProgress, Grid, TextField } from '@mui/material';
import { Autocomplete } from '@mui/material';
import { debounce, uniqBy } from 'lodash';
import { useCallback, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import routes from '../Routes';

const DataList = ({ InfoLabel, fieldData, rest, values, type, label, name, getLabel, touched, errors, required, setFieldValue, fields }) => {
  const [options, setOptions] = useState([]);
  const [defaultOptions, setDefaultOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [inputValues, setInputValues] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);

  useEffect(() => {
    if (values[`${name}_dataList`] && values[name]) {
      let option: any = [];
      if (type === 'multiSelect') {
        if (values[`${name}_dataList`]?.length > 0 && values[name]?.length > 0) {
          option = values[`${name}_dataList`];
        }
      } else {
        option = [values[`${name}_dataList`]];
      }
      setDefaultOptions(option);
    }
    delete values[`${name}_dataList`];
  }, []);

  useEffect(() => {
    if (selectedOption) {
      if (type === 'multiSelect') {
        setDefaultOptions(selectedOption);
      } else {
        setDefaultOptions([selectedOption]);
      }
    }
  }, [selectedOption]);

  const fetchOptions = useCallback(
    debounce(async (searchKey: string = '', page: number = 0, _ids = []) => {
      try {
        if (searchKey !== '') {
          page = 0;
          setCurrentPage(0);
        }
        if (page === 0) {
          setCurrentPage(0);
          setOptions([]);
        }
        let query = `${routes?.dataList?.path}/data-list-items/${fieldData?.dataListId}?limit=25&page=${page}&search=${encodeURIComponent(
          searchKey
        )}`;
        if (_ids?.length > 0) {
          query = `${query}&ids=${JSON.stringify(_ids)}`;
        }
        const {
          data: {
            data: { data }
          }
        } = await axiosInstance().get(query);
        const option = data?.map((d) => ({ optionLabel: d?.title, optionValue: d?._id }));
        setOptions((currentOptions) => {
          return page === 0 ? [...option] : [...currentOptions, ...option];
        });
        if (page > 0 && option?.length > 0) {
          setCurrentPage(page);
        }
        setLoading(false);
      } catch (error) {
        console.error(error);
      }
    }, 1000),
    []
  );

  useEffect(() => {
    if (fieldData?.preFilters?.length > 0) {
      fetchOptions('', 0, fieldData?.preFilters);
    }
  }, [fieldData]);

  const handleInputChangeMulti = (event, value, reason) => {
    if (reason === 'input') {
      setInputValues(event.target.value);
      if (fieldData?.preFilters?.length === 0) {
        fetchOptions(event.target.value);
      }
    }
  };

  return (
    <Box key={fieldData?.dataListId}>
      <Grid container spacing={1} style={{ alignItems: 'center', flexWrap: 'nowrap' }}>
        <Grid item style={{ flexGrow: 1 }}>
          <InfoLabel
            info={fieldData?.tooltipMessage}
            isTooltip={fieldData?.isTooltip}
            warningTooltip={fieldData?.isWarningTooltip}
            warningMessage={fieldData?.warningTooltipMessage}
            doNotShowInfoTooltip={fieldData?.doNotShowInfoTooltip}
          >
            {type === 'multiSelect' ? (
              <Autocomplete
                {...rest}
                onOpen={() => {
                  if (fieldData?.preFilters?.length === 0) {
                    setLoading(true);
                    fetchOptions();
                  }
                }}
                inputValue={inputValues}
                onInputChange={handleInputChangeMulti}
                loading={loading}
                limitTags={2}
                multiple
                fullWidth
                disableCloseOnSelect={true}
                options={uniqBy([...options, ...defaultOptions], 'optionValue')}
                getOptionLabel={(option: any) => {
                  return option ? option?.optionLabel : '';
                }}
                value={
                  values[name]
                    ? uniqBy([...options, ...defaultOptions], 'optionValue')?.filter((data: any) => values[name].includes(data.optionValue))
                    : []
                }
                getOptionSelected={(option: any, val: any) => option.optionValue === val.optionValue}
                onChange={(e, val: any) => {
                  setFieldValue(name, val ? val.map((val) => val?.optionValue) : []);
                  setSelectedOption(val ? val : []);
                  setInputValues('');
                }}
                forcePopupIcon={true}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    label={getLabel(label)}
                    name={name}
                    error={touched[name] && Boolean(errors[name])}
                    helperText={touched[name] && errors[name]}
                    required={required}
                    style={{ whiteSpace: 'nowrap' }}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      )
                    }}
                  />
                )}
                ListboxProps={{
                  onScroll: (e) => {
                    if (e.target.scrollTop + e.target.clientHeight === e.target.scrollHeight && fieldData?.preFilters?.length === 0) {
                      setLoading(true);
                      fetchOptions('', currentPage + 1);
                    }
                  }
                }}
              />
            ) : (
              <Autocomplete
                {...rest}
                onInputChange={(event, value, reason) => {
                  if (reason === 'input' && fieldData?.preFilters?.length === 0) {
                    fetchOptions(value);
                  }
                }}
                onOpen={() => {
                  if (fieldData?.preFilters?.length === 0) {
                    setLoading(true);
                    fetchOptions();
                  }
                }}
                options={uniqBy([...options, ...defaultOptions], 'optionValue')}
                disabled={fieldData?.isUneditable || rest?.disabled}
                fullWidth
                loading={loading}
                getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
                getOptionSelected={(option: any, val) => option.optionValue === val}
                value={uniqBy([...options, ...defaultOptions], 'optionValue').find((data: any) => data.optionValue === values[name]) || ''}
                onChange={(e, val) => {
                  setFieldValue(name, val ? val?.optionValue : '');
                  setSelectedOption(val ? val : null);
                }}
                selectOnFocus
                clearOnBlur
                handleHomeEndKeys
                forcePopupIcon={true}
                size="small"
                renderInput={(params) => (
                  <TextField
                    {...params}
                    name={name}
                    label={getLabel(label)}
                    variant="outlined"
                    style={{ outline: '1px solid white' }}
                    error={touched[name] && Boolean(errors[name])}
                    helperText={touched[name] && errors[name]}
                    required={required}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      )
                    }}
                  />
                )}
                ListboxProps={{
                  onScroll: (e) => {
                    if (e.target.scrollTop + e.target.clientHeight === e.target.scrollHeight && fieldData?.preFilters?.length === 0) {
                      setLoading(true);
                      fetchOptions('', currentPage + 1);
                    }
                  }
                }}
              />
            )}
          </InfoLabel>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DataList;
