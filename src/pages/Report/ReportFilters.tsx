import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Container,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography
} from '@material-ui/core';
import { List } from '@material-ui/icons';
import { Autocomplete } from '@material-ui/lab';
import { KeyboardDatePicker } from '@material-ui/pickers';
import { startCase } from 'lodash';
import moment from 'moment';
import React, { useEffect } from 'react';
import AsyncDropdown from 'src/components/Helpers/FormTypes/AsyncDropdown';
import FormTypes from '../../components/Helpers/FormTypes';
import VirtualizedList from '../../components/VirtualizedList';
import { dateFormat } from '../../constants/helpers';

interface FiltersProps {
  resource: string;
  fetchReportData?: VoidFunction;
  loading?: boolean;
  setSelectedData?: any;
  betweenDate: any;
  setBetweenDate: any;
  resourceColumns: any[];
  filterOptions: any;
  setFilterOptions: any;
  selectedResources: any;
  setSelectedResources: any;
  resourceOptions: any;
  setResourceOptions: any;
  formValues: any;
  setFormValues: any;
  loadingColumns?: boolean;
  statusPeriod?: boolean;
  setStatusPeriod?: any;
  statusPeriodDate?: any;
  setStatusPeriodDate?: any;
  statusTimeFrame?: any;
  setStatusTimeFrame?: any;
  selectedData?: any;
  customReportData?: any;
  isCustomReport?: boolean;
  defaultResource?: any[];
  reportConfig?: any;
}

const ReportFilters = (props: FiltersProps) => {
  const {
    resource,
    resourceColumns,
    fetchReportData,
    loading,
    setSelectedData,
    setBetweenDate,
    betweenDate,
    filterOptions,
    setFilterOptions,
    selectedResources,
    setSelectedResources,
    resourceOptions,
    setResourceOptions,
    formValues,
    setFormValues,
    loadingColumns,
    statusPeriod,
    setStatusPeriod,
    statusPeriodDate,
    statusTimeFrame,
    setStatusTimeFrame,
    setStatusPeriodDate,
    selectedData,
    customReportData,
    defaultResource = [],
    reportConfig
  } = props;

  const [isStatusPeriod, setIsStatusPeriod] = React.useState(false);
  const [errors, setErrors] = React.useState({});
  const [dataLoading, setLoading] = React.useState(false);
  const [error, setError] = React.useState({});

  React.useEffect(() => {
    if (!customReportData) return;
    setLoading(true);

    let newData: any = { ...customReportData };

    if (newData?.filters.length > 0) {
      const filters = filterOptions.filter((filter) => newData.filters.findIndex((item) => item.term === filter.fieldName) > -1);

      const dateFields = filterOptions.filter((filter) => newData.filters.findIndex((item) => item.term.split('_')[1] === filter.fieldName) > -1);

      const filterData = newData.filters.reduce(
        (acc, val) => ({
          ...acc,
          [val.term]: val.value
        }),
        {}
      );

      const selectedFiltersData = filters.reduce(
        (acc, val) => ({
          ...acc,
          [val.fieldName]: {
            type: val.type,
            lookup: val.lookup,
            value: val.option.filter((option) => filterData[val.fieldName].includes(option.optionValue))
          }
        }),
        {}
      );

      setSelectedData(selectedFiltersData);
      const dateFilterData = {};
      newData.filters
        .filter((item) => item.term.includes('from_') || item.term.includes('to_'))
        .forEach(({ term, value }) => {
          dateFilterData[term] = value;
        });

      setBetweenDate(dateFilterData);
      newData.filters = [...filters, ...dateFields];
      setFormValues(filterData);
    }
    setSelectedResources(newData.filters);
    setLoading(false);
  }, [customReportData, filterOptions, resourceColumns]);

  React.useEffect(() => {
    if (!resourceColumns && resourceColumns.length === 0) return;
    const optionsData: any = {};
    const filteredData = [...resourceColumns]
      .filter(
        (d: any) =>
          d.isRead &&
          (d.fieldData.type === 'dropDown' ||
            d.fieldData.type === 'multiSelect' ||
            d.fieldData.type === 'date' ||
            d.fieldData.type === 'checkBox' ||
            d.fieldData.type === 'singleLine')
      )
      .map((d: any) => {
        if (d.fieldData.type === 'dropDown' || d.fieldData.type === 'multiSelect') {
          optionsData[d.fieldData.fieldName] = {
            options: d.fieldData.option,
            type: d.fieldData.type,
            lookup: Boolean(d.fieldData?.lookup)
          };
        }
        if (d.fieldData.type === 'date') {
          d.fieldData['timeFrame'] = 'custom';
        }
        return d.fieldData;
      });
    setResourceOptions(optionsData);
    setFilterOptions([{ fieldLabel: 'All', fieldName: 'all', _id: '0' }, ...filteredData]);
  }, [resourceColumns]);

  const setDefaultResource = (val = []) => {
    setSelectedResources([
      ...filterOptions?.filter((f) => defaultResource.includes(f?.fieldName)),
      ...val?.filter((f) => !defaultResource.includes(f?.fieldName))
    ]);
  };

  useEffect(() => {
    if (!selectedResources?.length) setDefaultResource();
  }, [filterOptions]);

  const handleSelectFilter = (type, name, value) => {
    let fieldProps: any = {};

    if (type === 'dropDown' || type === 'multiSelect') {
      fieldProps.type = resourceOptions[name].type;
      fieldProps.lookup = resourceOptions[name].lookup;
    } else if (type === 'checkBox') {
      fieldProps.type = 'checkBox';
      fieldProps.lookup = false;
    } else if (type === 'singleLine') {
      fieldProps.type = 'singleLine';
      fieldProps.lookup = false;
    } else {
      fieldProps.type = 'date';
      fieldProps.lookup = false;
    }

    const newData: any = {
      type: fieldProps.type,
      lookup: fieldProps.lookup
    };

    if (Array.isArray(value)) {
      if (!fieldProps.lookup) {
        newData.value = resourceOptions[name].options?.filter((d) => value?.includes(d.optionValue));
      } else {
        newData.value = value;
      }
      setSelectedData((prevState) => ({ ...prevState, [name]: newData }));
    } else {
      newData.value = value;
      setSelectedData((prevState) => ({ ...prevState, [name]: newData }));
    }
    setFormValues((prevState) => ({ ...prevState, [name]: value }));
    if (error[name] && value) {
      setError((prev) => {
        delete prev[name];
        return prev;
      });
    }
  };

  useEffect(() => {
    setIsStatusPeriod(
      resource?.includes('Serialized Asset') &&
        Boolean(selectedResources.find((res) => res.fieldName === 'status')) &&
        formValues?.hasOwnProperty('status') &&
        formValues.status.length > 0
    );
  }, [selectedResources, formValues]);

  useEffect(() => {
    if (!statusPeriod) {
      setStatusPeriodDate((prevState) => {
        let keys = prevState ? Object.keys(prevState) : [];
        keys.forEach((key) => {
          if (key?.includes('to') || key?.includes('from')) {
            if (!selectedResources?.map((d) => d.fieldName)?.includes(key.split('_')[1])) {
              delete prevState[key];
            }
          }
        });
        return prevState;
      });
    }
  }, [statusPeriod]);

  useEffect(() => {
    const allDateData = { ...betweenDate, ...statusPeriodDate };
    const dateKeys = Object.keys(allDateData);
    const dateProperties = dateKeys.map((key) => key.split('_')[1]);

    dateProperties.forEach((key) => {
      let err = { ...errors };

      const from = new Date(allDateData[`from_${key}`]).getTime();
      const to = new Date(allDateData[`to_${key}`]).getTime();

      if (from > to || to < from) {
        err[key] = `Please select valid date range`;
      } else {
        if (errors[key]) {
          setErrors((prev) => {
            delete prev[key];
            return prev;
          });
        }
      }
      setErrors(err);
    });
  }, [betweenDate, statusPeriodDate]);

  const handleDuration = (timeFrameTemp, field, isStatus = false) => {
    switch (timeFrameTemp) {
      case 'custom':
        setStatusTimeFrame('custom');
        isStatus
          ? setStatusPeriodDate((prevState) => ({
              ...prevState,
              [`from_statusPeriod`]: '',
              [`to_statusPeriod`]: ''
            }))
          : setBetweenDate((prevState) => ({
              ...prevState,
              [`from_${field.fieldName}`]: '',
              [`to_${field.fieldName}`]: ''
            }));

        break;

      case '1-month':
        setStatusTimeFrame('1-month');
        isStatus
          ? setStatusPeriodDate((prevState) => ({
              ...prevState,
              [`from_statusPeriod`]: new Date(moment().subtract('1', 'month').calendar()),
              [`to_statusPeriod`]: new Date()
            }))
          : setBetweenDate((prevState) => ({
              ...prevState,
              [`from_${field.fieldName}`]: new Date(moment().subtract('1', 'month').calendar()),
              [`to_${field.fieldName}`]: new Date()
            }));

        break;
      case '3-months':
        setStatusTimeFrame('3-months');
        isStatus
          ? setStatusPeriodDate((prevState) => ({
              ...prevState,
              [`from_statusPeriod`]: new Date(moment().subtract('3', 'months').calendar()),
              [`to_statusPeriod`]: new Date()
            }))
          : setBetweenDate((prevState) => ({
              ...prevState,
              [`from_${field.fieldName}`]: new Date(moment().subtract('3', 'months').calendar()),
              [`to_${field.fieldName}`]: new Date()
            }));
        break;

      case '6-months':
        setStatusTimeFrame('6-months');
        isStatus
          ? setStatusPeriodDate((prevState) => ({
              ...prevState,
              [`from_statusPeriod`]: new Date(moment().subtract('6', 'months').calendar()),
              [`to_statusPeriod`]: new Date()
            }))
          : setBetweenDate((prevState) => ({
              ...prevState,
              [`from_${field.fieldName}`]: new Date(moment().subtract('6', 'months').calendar()),
              [`to_${field.fieldName}`]: new Date()
            }));
        break;

      case '1-year':
        setStatusTimeFrame('1-year');
        isStatus
          ? setStatusPeriodDate((prevState) => ({
              ...prevState,
              [`from_statusPeriod`]: new Date(moment().subtract('1', 'year').calendar()),
              [`to_statusPeriod`]: new Date()
            }))
          : setBetweenDate((prevState) => ({
              ...prevState,
              [`from_${field.fieldName}`]: new Date(moment().subtract('1', 'year').calendar()),
              [`to_${field.fieldName}`]: new Date()
            }));
        break;

      default:
        setStatusTimeFrame('custom');
        break;
    }
    if (timeFrameTemp !== 'custom') {
      if (field) {
        setError((prev) => {
          delete prev[`from_${field?.fieldName}`];
          delete prev[`to_${field?.fieldName}`];
          return prev;
        });
      }
    }
  };

  const validate = (formValues: any) => {
    const error: any = {};
    let resources = defaultResource;
    if (reportConfig?.defaultColumn) {
      if (!betweenDate?.from_date) {
        error['from_date'] = 'From date is required';
      }
      if (!betweenDate?.to_date) {
        error['to_date'] = 'To date is required';
      }
      resources = defaultResource.filter((field: any) => field !== 'date');
      resources?.forEach((field: any) => {
        if (!formValues[field]) {
          error[field] = `${startCase(field)} is required`;
        }
      });
    }
    setError(error);
    return error;
  };

  return (
    <Container maxWidth="sm">
      <Box height={'100%'} my={2}>
        <Box textAlign="center" mb={2}>
          {Object.keys(errors).length > 0 && Object.keys(errors).map((key) => <Typography color="error">{errors[key]}</Typography>)}
        </Box>
        <Autocomplete
          loading={loadingColumns || dataLoading}
          loadingText="Please wait..."
          options={filterOptions}
          limitTags={4}
          disableListWrap
          ListboxComponent={VirtualizedList as React.ComponentType<React.HTMLAttributes<HTMLElement>>}
          disableCloseOnSelect
          multiple
          value={selectedResources ?? []}
          onChange={(_, val, reason) => {
            if (val.filter((f) => f.fieldName === 'all').length > 0) {
              setSelectedResources(filterOptions);
            } else {
              const addedField = val?.find((v)=> selectedResources?.some((s)=> s.fieldName!==v.fieldName));
              if(addedField.fieldName==='dayWise'){
                handleSelectFilter('checkBox','dayWise',true);
              }
              setDefaultResource(val);
            }
            if (reason === 'remove-option' && selectedData) {
              const selectedKeys = val.map((f) => f?.fieldName);
              setSelectedData((prev) => {
                const dataKeys = Object?.keys(prev);
                if (dataKeys && dataKeys.length) {
                  dataKeys.forEach((key) => {
                    if (!selectedKeys?.includes(key)) {
                      delete prev[key];
                    }
                  });
                }
                return prev;
              });

              setFormValues((prev) => {
                const dataKeys = Object?.keys(prev);
                if (dataKeys && dataKeys.length) {
                  dataKeys.forEach((key) => {
                    if (!selectedKeys?.includes(key)) {
                      delete prev[key];
                    }
                  });
                }
                return prev;
              });
            }

            if (reason === 'remove-option' && betweenDate) {
              const selectedKeys = val.map((f) => f?.fieldName);
              setBetweenDate((prevState) => {
                let keys = prevState ? Object.keys(prevState) : [];
                keys.forEach((key) => {
                  if (key?.includes('to') || key?.includes('from')) {
                    if (!selectedKeys?.includes(key.split('_')[1])) {
                      delete prevState[key];
                    }
                  }
                });
                return prevState;
              });
            }
          }}
          fullWidth
          getOptionSelected={(option, val) => option.fieldName === val.fieldName}
          getOptionLabel={(option) => option.fieldLabel}
          renderInput={(params) => (
            <TextField
              {...params}
              variant="outlined"
              label="Select Filter"
              size="small"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loadingColumns ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                )
              }}
            />
          )}
        />
        <Box py={2}>
          <div className="w-full-chip grid grid-cols-1 gap-3 md:grid-cols-2">
            {selectedResources.length > 0 ? (
              selectedResources.map((field: any) => (
                <React.Fragment key={field._id}>
                  {field.fieldName !== 'all' && field.type !== 'date' && (
                    <div>
                      {field?.lookup && field.lookupResource ? (
                        <AsyncDropdown
                          resource={field.lookupResource}
                          errors={error}
                          touched={error}
                          multiple={
                            reportConfig?.defaultColumn ? (reportConfig?.notMultiSelectFields?.includes(field.fieldName) ? false : true) : true
                          }
                          value={formValues[field.fieldName]}
                          onChange={(_, value) => {
                            handleSelectFilter(field?.type, field?.fieldName, value);
                          }}
                          fieldName={field.fieldName}
                          fieldLabel={field.fieldLabel}
                          required={reportConfig?.defaultColumn ? field?.required : false}
                        />
                      ) : (
                        <FormTypes
                          values={formValues}
                          errors={error}
                          touched={error}
                          label={field.fieldLabel}
                          name={field.fieldName}
                          type={
                            field.type === 'dropDown'
                              ? reportConfig?.defaultColumn
                                ? reportConfig?.notMultiSelectFields?.includes(field.fieldName)
                                  ? field.type
                                  : 'multiSelect'
                                : 'multiSelect'
                              : field.type
                          }
                          options={field.option}
                          setFieldValue={(name, value) => {
                            handleSelectFilter(field?.type, name, value);
                          }}
                          required={reportConfig?.defaultColumn ? field?.required : false}
                          fullWidth
                          size="small"
                          fromFilter={true}
                        />
                      )}
                    </div>
                  )}
                  {field.type === 'date' && (
                    <div>
                      <FormControl fullWidth size="small" variant="outlined">
                        <InputLabel id={field.fieldName}>Select Duration</InputLabel>
                        <Select
                          labelId={field.fieldName}
                          id={`time-${field.fieldName}`}
                          value={statusTimeFrame}
                          onChange={(e) => {
                            handleDuration(e.target.value, field);
                            const tempArray = [...selectedResources];
                            let tempIndex = tempArray.findIndex((d) => d?.fieldName === field?.fieldName);
                            tempArray[tempIndex].timeFrame = e.target.value;
                            setSelectedResources(tempArray);
                          }}
                          label="Select Duration"
                        >
                          <MenuItem value={'1-year'}>Last 1 Year</MenuItem>
                          <MenuItem value={'6-months'}>Last 6 Months</MenuItem>
                          <MenuItem value={'3-months'}>Last 3 Months</MenuItem>
                          <MenuItem value={'1-month'}>Last 1 Month</MenuItem>
                          <MenuItem value={'custom'}>Custom</MenuItem>
                        </Select>
                      </FormControl>
                    </div>
                  )}
                  {field.type === 'date' && (
                    <div>
                      <KeyboardDatePicker
                        autoOk
                        disabled={statusTimeFrame !== 'custom'}
                        fullWidth
                        size="small"
                        variant="inline"
                        inputVariant="outlined"
                        name={`from_${field.fieldName}`}
                        label={`From ${field.fieldLabel}`}
                        value={betweenDate && betweenDate[`from_${field.fieldName}`] ? betweenDate[`from_${field.fieldName}`] : null}
                        onChange={(date: any) => {
                          setBetweenDate((prevState) => ({ ...prevState, [`from_${field.fieldName}`]: date }));
                          if (error[`from_${field.fieldName}`]) {
                            setError((prev) => {
                              delete prev[`from_${field.fieldName}`];
                              return prev;
                            });
                          }
                        }}
                        format={dateFormat}
                        InputLabelProps={{
                          shrink: true
                        }}
                        required={reportConfig?.defaultColumn ? field?.required : false}
                        error={error && error[`from_${field.fieldName}`] && Boolean(error[`from_${field.fieldName}`])}
                        helperText={error && Boolean(error[`from_${field.fieldName}`]) && error[`from_${field.fieldName}`]}
                      />
                    </div>
                  )}
                  {field.type === 'date' && (
                    <div>
                      <KeyboardDatePicker
                        autoOk
                        fullWidth
                        disabled={statusTimeFrame !== 'custom'}
                        size="small"
                        variant="inline"
                        inputVariant="outlined"
                        name={`to_${field.fieldName}`}
                        label={`To ${field.fieldLabel}`}
                        value={betweenDate && betweenDate[`to_${field.fieldName}`] ? betweenDate[`to_${field.fieldName}`] : null}
                        onChange={(date: any) => {
                          setBetweenDate((prevState) => ({ ...prevState, [`to_${field.fieldName}`]: date }));
                          if (error[`to_${field.fieldName}`]) {
                            setError((prev) => {
                              delete prev[`to_${field.fieldName}`];
                              return prev;
                            });
                          }
                        }}
                        format={dateFormat}
                        InputLabelProps={{
                          shrink: true
                        }}
                        minDate={betweenDate && betweenDate[`from_${field.fieldName}`] ? betweenDate[`from_${field.fieldName}`] : new Date()}
                        required={reportConfig?.defaultColumn ? field?.required : false}
                        error={error && error[`to_${field.fieldName}`] && Boolean(error[`to_${field.fieldName}`])}
                        helperText={error && Boolean(error[`to_${field.fieldName}`]) && error[`to_${field.fieldName}`]}
                      />
                    </div>
                  )}
                </React.Fragment>
              ))
            ) : (
              <Box className=" col-span-1 md:col-span-2">
                <Typography>No filters selected</Typography>
              </Box>
            )}
            {isStatusPeriod && (
              <>
                <div className="col-span-1 md:col-span-2">
                  <FormControlLabel
                    control={<Checkbox checked={statusPeriod} onChange={(e) => setStatusPeriod((state: boolean) => !state)} name="statusPeriod" />}
                    label="Status Period"
                  />
                </div>
                {statusPeriod && (
                  <>
                    <FormControl fullWidth size="small" variant="outlined">
                      <InputLabel id="statusPeriod">Select Duration</InputLabel>
                      <Select
                        labelId="statusPeriod"
                        id="time-duration"
                        value={statusTimeFrame}
                        onChange={(e) => {
                          handleDuration(e.target.value, null, true);
                          setStatusTimeFrame(e.target.value);
                        }}
                        label="Select Duration"
                      >
                        <MenuItem value={'1-year'}>Last 1 Year</MenuItem>
                        <MenuItem value={'6-months'}>Last 6 Months</MenuItem>
                        <MenuItem value={'3-months'}>Last 3 Months</MenuItem>
                        <MenuItem value={'1-month'}>Last 1 Month</MenuItem>
                        <MenuItem value={'custom'}>Custom</MenuItem>
                      </Select>
                    </FormControl>
                    <KeyboardDatePicker
                      autoOk
                      fullWidth
                      disabled={statusTimeFrame !== 'custom'}
                      size="small"
                      variant="inline"
                      inputVariant="outlined"
                      name={`from_statusPeriod`}
                      label={`From Status Period`}
                      value={statusPeriodDate && statusPeriodDate[`from_statusPeriod`] ? statusPeriodDate[`from_statusPeriod`] : null}
                      onChange={(date: any) => {
                        setStatusPeriodDate((prevState) => ({ ...prevState, [`from_statusPeriod`]: date }));
                      }}
                      format={dateFormat}
                      InputLabelProps={{
                        shrink: true
                      }}
                    />
                    <KeyboardDatePicker
                      autoOk
                      fullWidth
                      size="small"
                      variant="inline"
                      disabled={statusTimeFrame !== 'custom'}
                      inputVariant="outlined"
                      name={`to_statusPeriod`}
                      label={`To Status Period`}
                      value={statusPeriodDate && statusPeriodDate[`to_statusPeriod`] ? statusPeriodDate[`to_statusPeriod`] : null}
                      onChange={(date: any) => {
                        setStatusPeriodDate((prevState) => ({ ...prevState, [`to_statusPeriod`]: date }));
                      }}
                      format={dateFormat}
                      InputLabelProps={{
                        shrink: true
                      }}
                    />
                  </>
                )}
              </>
            )}
          </div>
        </Box>
        <Box mt={2}>
          {/* {!isCustomReport && (
            <Box height={'100%'} mb={2}>
              <Autocomplete
                options={reportList}
                value={selectedReportView}
                noOptionsText="No views were found"
                onChange={(_, val) => {
                  setSelectedReportView(val);
                }}
                fullWidth
                renderOption={(option) => (
                  <React.Fragment>
                    <Box display={'flex'} width="100%" justifyContent="space-between">
                      {option.name}
                      {isDeleting ? (
                        <CircularProgress size={18} color="inherit" />
                      ) : (
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowConfirmDialog({ open: true, id: option._id, name: option.name });
                          }}
                        >
                          <Delete color="error" />
                        </IconButton>
                      )}
                    </Box>
                  </React.Fragment>
                )}
                getOptionLabel={(option) => option.name}
                renderInput={(params) => <TextField {...params} variant="outlined" label="Select View" size="small" />}
              />
            </Box>
          )} */}
          <Button
            onClick={() => {
              const error = validate(formValues);
              if (Object.keys(error).length > 0) return;
              fetchReportData();
            }}
            startIcon={loading ? <CircularProgress color="inherit" size={18} /> : <List />}
            color="primary"
            variant="contained"
            size="small"
            disableElevation
            fullWidth
            disabled={loading || loadingColumns}
          >
            Show
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default ReportFilters;
