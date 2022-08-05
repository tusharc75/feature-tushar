import React, { useEffect } from 'react';
import {
  Box,
  Container,
  TextField,
  Grid,
  Button,
  CircularProgress,
  Typography,
  IconButton,
  FormControlLabel,
  Checkbox,
  FormControl,
  InputLabel,
  MenuItem,
  Select
} from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { Delete, List } from '@material-ui/icons';
import { KeyboardDatePicker } from '@material-ui/pickers';
import { startCase } from 'lodash';

import VirtualizedList from '../../components/VirtualizedList';
import { getObjKeys, dateFormat } from '../../constants/helpers';
import FormTypes from '../../components/Helpers/FormTypes';
import ConfirmDialog from '../../components/Helpers/ConfirmationDialog';
import axiosInstance from '../../axios/axiosInstance';
import moment from 'moment';

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
  setSelectedReportView: any;
  selectedReportView: any;
  reportList: any;
  setReportList: any;
  statusPeriod?: boolean;
  setStatusPeriod?: any;
  statusPeriodDate?: any;
  setStatusPeriodDate?: any;
  statusTimeFrame?: any;
  setStatusTimeFrame?: any;
  selectedData?: any;
  customReportData?: any;
  isCustomReport?: boolean;
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
    setSelectedReportView,
    selectedReportView,
    reportList,
    setReportList,
    statusPeriod,
    setStatusPeriod,
    statusPeriodDate,
    statusTimeFrame,
    setStatusTimeFrame,
    setStatusPeriodDate,
    selectedData,
    customReportData,
    isCustomReport
  } = props;
  const [showConfirmDialog, setShowConfirmDialog] = React.useState({ open: false, id: null, name: '' });
  const [isDeleting, setDeleting] = React.useState(false);
  const [isStatusPeriod, setIsStatusPeriod] = React.useState(false);
  const [errors, setErrors] = React.useState({});
  const [dataLoading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!customReportData) return;
    setLoading(true);

    const initializeData = () => {
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

        newData.filters = [...filters, ...dateFields];
        setBetweenDate(dateFilterData);
        setFormValues(filterData);
      }
      if (newData?.column.length > 0) {
        const column = resourceColumns.filter((filter) => newData.column.includes(filter.fieldData.fieldName));
        newData.column = column.map(({ fieldData }) => fieldData);
      }
      setSelectedResources(newData.filters);
      setLoading(false);
    };
    initializeData();
  }, [customReportData, filterOptions, resourceColumns]);

  React.useEffect(() => {
    if (!resourceColumns && resourceColumns.length === 0) return;
    const optionsData: any = {};
    const filteredData = [...resourceColumns]
      .filter((d: any) => d.isRead && (d.fieldData.type === 'dropDown' || d.fieldData.type === 'multiSelect' || d.fieldData.type === 'date'))
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

  const handleSelectFilter = (name, value) => {
    let fieldProps: any = {};
    if (!name?.includes('Date')) {
      fieldProps.type = resourceOptions[name].type;
      fieldProps.lookup = resourceOptions[name].lookup;
    } else {
      fieldProps.type = 'date';
      fieldProps.lookup = false;
    }

    const newData: any = {
      type: fieldProps.type,
      lookup: fieldProps.lookup
    };

    if (Array.isArray(value)) {
      newData.value = resourceOptions[name].options?.filter((d) => value?.includes(d.optionValue));
      setSelectedData((prevState) => ({ ...prevState, [name]: newData }));
    } else {
      newData.value = value;
      setSelectedData((prevState) => ({ ...prevState, [name]: newData }));
    }
    setFormValues((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleRemoveOption = () => {
    setReportList((prevState) => {
      return prevState.filter((item) => item._id !== showConfirmDialog.id);
    });
    setDeleting(true);
    axiosInstance()
      .put(`report-colum-setting/remove`, {
        ids: [showConfirmDialog.id]
      })
      .then(() => {
        setDeleting(false);
        if (selectedReportView?._id === showConfirmDialog.id) {
          setSelectedReportView(null);
        }
        setShowConfirmDialog({ open: false, id: null, name: '' });
      })
      .catch((err) => {
        setDeleting(false);
        setShowConfirmDialog({ open: false, id: null, name: '' });
      });
  };

  useEffect(() => {
    setBetweenDate((prevState) => {
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
    setIsStatusPeriod(
      resource?.includes('Serialized Asset') &&
        Boolean(selectedResources.find((res) => res.fieldName === 'status')) &&
        formValues?.hasOwnProperty('status') &&
        formValues.status.length > 0
    );
  }, [selectedResources, formValues]);

  useEffect(() => {
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
  }, [statusPeriod]);

  useEffect(() => {
    const allDateData = { ...betweenDate, ...statusPeriodDate };
    const dateKeys = Object.keys(allDateData);
    const dateProperties = dateKeys.map((key) => key.split('_')[1]);

    dateProperties.forEach((key) => {
      let err = { ...errors };

      const from = new Date(allDateData[`from_${key}`]).getTime();
      const to = new Date(allDateData[`to_${key}`]).getTime();

      if (from >= to || to <= from) {
        err[key] = `From ${startCase(key)} should be less then To ${startCase(key)}`;
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
        break;
    }
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
              setSelectedResources(val);
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
          }}
          fullWidth
          getOptionSelected={(option, val) => option.fieldName === val.fieldName}
          getOptionLabel={(option) => option.fieldLabel}
          renderInput={(params) => <TextField {...params} variant="outlined" label="Select Filter" size="small" />}
        />
        <Box py={2}>
          <Grid container spacing={2} alignItems="center">
            {selectedResources.length > 0 ? (
              selectedResources.map((field: any) => (
                <React.Fragment key={field._id}>
                  {field.fieldName !== 'all' && field.type !== 'date' && (
                    <Grid item xs={12} sm={6} md={6}>
                      <FormTypes
                        values={formValues}
                        errors={{}}
                        touched={{}}
                        label={field.fieldLabel}
                        name={field.fieldName}
                        type={field.type === 'dropDown' ? 'multiSelect' : field.type}
                        options={field.option}
                        setFieldValue={handleSelectFilter}
                        required={false}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                  )}

                  {field.type === 'date' && (
                    <Grid item xs={12} sm={6}>
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
                        >
                          <MenuItem value={'1-year'}>Last 1 Year</MenuItem>
                          <MenuItem value={'6-months'}>Last 6 Months</MenuItem>
                          <MenuItem value={'3-months'}>Last 3 Months</MenuItem>
                          <MenuItem value={'1-month'}>Last 1 Month</MenuItem>
                          <MenuItem value={'custom'}>Custom</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  )}
                  {field.type === 'date' && (
                    <Grid item xs={12} sm={6}>
                      <KeyboardDatePicker
                        autoOk
                        disabled={field.timeFrame !== 'custom'}
                        fullWidth
                        size="small"
                        variant="inline"
                        inputVariant="outlined"
                        name={`from_${field.fieldName}`}
                        label={`From ${field.fieldLabel}`}
                        value={betweenDate && betweenDate[`from_${field.fieldName}`] ? betweenDate[`from_${field.fieldName}`] : null}
                        onChange={(date: any) => {
                          setBetweenDate((prevState) => ({ ...prevState, [`from_${field.fieldName}`]: date }));
                        }}
                        format={dateFormat}
                        InputLabelProps={{
                          shrink: true
                        }}
                      />
                    </Grid>
                  )}
                  {field.type === 'date' && (
                    <Grid item xs={12} sm={6}>
                      <KeyboardDatePicker
                        autoOk
                        fullWidth
                        disabled={field.timeFrame !== 'custom'}
                        size="small"
                        variant="inline"
                        inputVariant="outlined"
                        name={`to_${field.fieldName}`}
                        label={`To ${field.fieldLabel}`}
                        value={betweenDate && betweenDate[`to_${field.fieldName}`] ? betweenDate[`to_${field.fieldName}`] : null}
                        onChange={(date: any) => {
                          setBetweenDate((prevState) => ({ ...prevState, [`to_${field.fieldName}`]: date }));
                        }}
                        format={dateFormat}
                        InputLabelProps={{
                          shrink: true
                        }}
                      />
                    </Grid>
                  )}
                </React.Fragment>
              ))
            ) : (
              <Box textAlign="center" width="100%">
                <Typography>No filters selected</Typography>
              </Box>
            )}
            {isStatusPeriod && (
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Checkbox checked={statusPeriod} onChange={(e) => setStatusPeriod((state: boolean) => !state)} name="statusPeriod" />}
                  label="Status Period"
                />
              </Grid>
            )}

            {isStatusPeriod && statusPeriod && (
              <Grid item xs={12} sm={6}>
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
                  >
                    <MenuItem value={'1-year'}>Last 1 Year</MenuItem>
                    <MenuItem value={'6-months'}>Last 6 Months</MenuItem>
                    <MenuItem value={'3-months'}>Last 3 Months</MenuItem>
                    <MenuItem value={'1-month'}>Last 1 Month</MenuItem>
                    <MenuItem value={'custom'}>Custom</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
            {isStatusPeriod && statusPeriod && (
              <Grid item xs={12} sm={6}>
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
              </Grid>
            )}
            {isStatusPeriod && statusPeriod && (
              <Grid item xs={12} sm={6}>
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
              </Grid>
            )}
          </Grid>
        </Box>
        <Box mt={2}>
          {!resource?.includes('Purchase Order Type') && !isCustomReport && (
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
          )}
          <Button
            onClick={fetchReportData}
            startIcon={loading ? <CircularProgress color="inherit" size={18} /> : <List />}
            color="primary"
            variant="contained"
            size="small"
            disableElevation
            fullWidth
            disabled={loading}
          >
            Show
          </Button>
        </Box>
      </Box>
      {showConfirmDialog.open && (
        <ConfirmDialog
          onClose={() => setShowConfirmDialog({ open: false, id: null, name: '' })}
          onOk={() => handleRemoveOption()}
          open={true}
          okBtnLoading={isDeleting}
          message={
            <>
              Are you sure you want to delete view{' '}
              <Box component={'span'} px={1} bgcolor="#eee">
                {showConfirmDialog.name}
              </Box>
              ?
            </>
          }
        />
      )}
    </Container>
  );
};

export default ReportFilters;
