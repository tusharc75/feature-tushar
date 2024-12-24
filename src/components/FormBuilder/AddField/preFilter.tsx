import { CircularProgress, TextField } from '@mui/material';
import { Autocomplete } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { getLookupOption } from '../helper';
import { debounce, isEmpty, uniqBy } from 'lodash';
import routes from 'src/components/Helpers/Routes';
import axiosInstance from 'src/axios/axiosInstance';

const PreFilter = ({ dataList = false, dataListId = null, lookupResource = null, values, setFieldValue }) => {
  const [options, setOptions] = useState([]);
  const [defaultOptions, setDefaultOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [inputValues, setInputValues] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);
  const [prefilterFields, setPrefilterFields] = useState(null);

  const [lookupOptionsMap, setLookupOptionsMap] = useState({});

  useEffect(() => {
    fetchPrefilterFieldLookupOptions();
  }, [prefilterFields, values]);

  const fetchPrefilterFieldLookupOptions = async () => {
    if (prefilterFields?.length > 0 && values['lookupPreFilterFields']?.length > 0) {
      const optionsMap = {};

      for (const field of values['lookupPreFilterFields']) {
        const preFilterField = prefilterFields?.find((e) => e.optionValue === field.fieldName);
        if (preFilterField?.lookupResource && !lookupOptionsMap[field.fieldName]) {
          const lookupOptions = await getLookupOption(null, preFilterField.lookupResource);
          optionsMap[field.fieldName] = lookupOptions;
        }
      }

      setLookupOptionsMap({ ...lookupOptionsMap, ...optionsMap });
    }
  };

  const fetchLookupOptions = async () => {
    const options = await getLookupOption(null, lookupResource);
    setOptions(options);
  };

  const fetchLookupFieldOptions = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/field?resource=${lookupResource}&view=true`);
      const lookupOptions = data
        ?.filter((ele) => ele.fieldData?.lookup)
        ?.map((e) => {
          return {
            optionValue: e?.fieldData?.fieldName,
            optionLabel: e?.fieldData?.fieldLabel,
            lookupResource: e?.fieldData?.lookupResource
          };
        });
      setPrefilterFields(lookupOptions);
    } catch (e) {
      console.error(e);
    }
  };

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
        let query = `${routes?.dataList?.path}/data-list-items/${dataListId}?limit=25&page=${page}&search=${encodeURIComponent(searchKey)}`;
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

  const handleInputChangeMulti = (event, value, reason) => {
    if (reason === 'input') {
      setInputValues(event.target.value);
      fetchOptions(event.target.value);
    }
  };

  useEffect(() => {
    if (selectedOption) {
      // setDefaultOptions(uniqBy([...selectedOption, ...defaultOptions], 'optionValue'))
      setDefaultOptions(selectedOption);
    }
  }, [selectedOption]);

  useEffect(() => {
    if (lookupResource) {
      fetchLookupOptions();
      fetchLookupFieldOptions();
    }
  }, [lookupResource]);

  useEffect(() => {
    if (dataListId && dataList && values['preFilters']?.length) {
      fetchFieldvalue();
    }
  }, [dataListId]);

  const fetchFieldvalue = async () => {
    const query: any = [
      {
        resource: dataListId,
        fieldName: 'dataListField',
        _id: values['preFilters'],
        dataList: true
      }
    ];
    const response = await axiosInstance().get(`/sa-formbuilder/resource/fieldLabel?data=${JSON.stringify(query)}`);
    setDefaultOptions(response?.data?.data['dataListField']);
  };

  return dataList ? (
    <Autocomplete
      onOpen={() => {
        setLoading(true);
        fetchOptions();
      }}
      inputValue={inputValues}
      onInputChange={handleInputChangeMulti}
      loading={loading}
      limitTags={5}
      multiple
      fullWidth
      disableCloseOnSelect={true}
      options={uniqBy([...options, ...defaultOptions], 'optionValue')}
      getOptionLabel={(option: any) => {
        return option ? option?.optionLabel : '';
      }}
      value={
        values['preFilters']
          ? uniqBy([...options, ...defaultOptions], 'optionValue')?.filter((data: any) => values['preFilters'].includes(data.optionValue))
          : []
      }
      getOptionSelected={(option: any, val: any) => option.optionValue === val.optionValue}
      onChange={(e, val: any) => {
        setFieldValue('preFilters', val ? val.map((val) => val?.optionValue) : []);
        setInputValues('');
        setSelectedOption(val ? val : []);
      }}
      forcePopupIcon={true}
      renderInput={(params) => (
        <TextField
          {...params}
          margin="dense"
          size={'small'}
          variant="outlined"
          label="Pre Filters"
          name="preFilters"
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
          if (e.target.scrollTop + e.target.clientHeight === e.target.scrollHeight) {
            setLoading(true);
            fetchOptions('', currentPage + 1);
          }
        }
      }}
    />
  ) : (
    <>
      <Autocomplete
        fullWidth
        disableCloseOnSelect={true}
        id="preFilters"
        options={options}
        getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
        onChange={(e, val) => {
          setFieldValue('preFilters', val && val?.length > 0 ? val?.map((v) => v?.optionValue) : []);
        }}
        multiple
        size={'small'}
        value={
          options?.filter((o) => values['preFilters']?.includes(o?.optionValue))?.length > 0
            ? options?.filter((o) => values['preFilters']?.includes(o?.optionValue))
            : []
        }
        filterSelectedOptions={true}
        renderInput={(params) => (
          <TextField
            {...params}
            margin="dense"
            size={'small'}
            name="preFilters"
            label="Pre Filters"
            placeholder="Pre Filters"
            variant="outlined"
            fullWidth
          />
        )}
      />
      {prefilterFields?.length > 0 ? (
        <Autocomplete
          fullWidth
          disableCloseOnSelect={true}
          id="lookupPreFilterFields"
          options={prefilterFields ?? []}
          getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
          onChange={(e, val) => {
            const updatedValues = val?.map((v) => {
              return {
                fieldName: v.optionValue,
                value: values['lookupPreFilterFields']?.find((ele) => ele.fieldName === v.optionValue)?.value ?? []
              };
            });
            setFieldValue('lookupPreFilterFields', updatedValues);
          }}
          multiple
          size={'small'}
          value={
            prefilterFields?.filter((o) => values['lookupPreFilterFields']?.map((ele) => ele.fieldName)?.includes(o?.optionValue))?.length > 0
              ? prefilterFields?.filter((o) => values['lookupPreFilterFields']?.map((ele) => ele.fieldName)?.includes(o?.optionValue))
              : []
          }
          filterSelectedOptions={true}
          renderInput={(params) => (
            <TextField
              {...params}
              margin="dense"
              size={'small'}
              name="lookupPreFilterFields"
              label="Lookup Pre Filter Fields"
              placeholder="Lookup Pre Filter Fields"
              variant="outlined"
              fullWidth
            />
          )}
        />
      ) : null}
      <div className="mt-2 flex flex-col gap-2">
        {values['lookupPreFilterFields']?.length > 0 && !isEmpty(lookupOptionsMap)
          ? values['lookupPreFilterFields']?.map((field, index) => {
              const preFilterField = prefilterFields?.find((e) => e.optionValue === field.fieldName);
              return (
                <Autocomplete
                  fullWidth
                  disableCloseOnSelect={true}
                  id={`lookupPreFilterFields_${index + 1}`}
                  options={lookupOptionsMap[field.fieldName] ?? []}
                  getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
                  onChange={(e, val) => {
                    const updatedValues = values['lookupPreFilterFields']?.map((ele) => {
                      if (ele.fieldName === field.fieldName) {
                        ele.value = val?.map((e) => e?.optionValue);
                      }
                      return ele;
                    });
                    setFieldValue('lookupPreFilterFields', updatedValues);
                  }}
                  multiple
                  size={'small'}
                  value={lookupOptionsMap[field.fieldName]?.filter((ele) => [...field?.value].includes(ele.optionValue)) ?? []}
                  filterSelectedOptions={true}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      margin="dense"
                      size={'small'}
                      name={preFilterField.optionValue}
                      label={preFilterField.optionLabel}
                      placeholder={preFilterField.optionLabel}
                      variant="outlined"
                      fullWidth
                    />
                  )}
                />
              );
            })
          : null}
      </div>
    </>
  );
};

export default PreFilter;
