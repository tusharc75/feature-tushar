import React, { useState, useEffect, useContext, Fragment } from 'react';
import { Box, TextField, Grid, Button, IconButton, Dialog, FormControl, InputLabel, MenuItem, Select } from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { AiFillEdit } from 'react-icons/ai';
import { RiDeleteBin6Fill } from 'react-icons/ri';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../CustomDialog/CustomDialogFooter';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import FormTypes from '../Helpers/FormTypes';
import { dateFormat } from 'src/constants/helpers';
import moment from 'moment';
import CommonSkeleton from '../Helpers/CommonSkeleton';
import { KeyboardDatePicker } from '@material-ui/pickers';
import MomentUtils from '@date-io/moment';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import SaveFilterDialog from './SaveFilterDialog';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import { isEmpty } from 'lodash';

function GridFilter({
  resource,
  currentGridApi,
  handleClose,
  setSelectedFilter,
  selectedFilter,
  currentFomValue,
  setCurrentFomValue
}) {
  const toastConfig = useContext(CustomToastContext);

  const [coloums, setColoums] = useState(null);
  const [formValues, setFormValues] = useState({});

  const [userFilters, setUserFilters] = useState([]);
  const [selectedUserFilter, setSelectedUserFilter] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [isSaveFilter, setIsSaveFilter] = useState({ open: false, data: null });
  const [isFilterDeleteConfirm, setIsFilterDeleteConfirm] = useState({ open: false, ids: null });

  const [statusTimeFrame, setStatusTimeFrame] = useState<any>({});
  const [betweenDate, setBetweenDate] = useState(null);

  useEffect(() => {
    fetchColumns();
    fetchUserFilters();
    setFormValues(currentFomValue || {});
    setSelectedUserFilter(selectedFilter);
  }, []);

  const FILTER_NOT_APPLIED = [
    'fileUpload',
    'multiFileUpload',
    'imageUpload',
    'multiImageUpload',
    'richTextEditor',
    'signature',
    'colorPicker',
    'number',
    'decimal'
  ];

  const fetchColumns = () => {
    axiosInstance()
      .get(`/field?resource=${resource}`)
      .then(({ data: { data } }) => {
        const coloum = data?.filter((e) => !FILTER_NOT_APPLIED.includes(e?.fieldData?.type));
        const modifiedColumn = coloum?.map((col: any) => {
          const d = col.fieldData;
          if (d?.type === 'dropDown') {
            d.type = 'multiSelect';
          }
          return d;
        });
        setColoums(modifiedColumn);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const fetchUserFilters = () => {
    axiosInstance()
      .get(`/user-resource-filter?resource=${resource}`)
      .then(({ data: { data } }) => {
        setUserFilters(data);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleSelectFilter = (name, value) => {
    setFormValues((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleDuration = (timeFrameTemp, field) => {
    switch (timeFrameTemp) {
      case '1-month':
        setStatusTimeFrame({ ...statusTimeFrame, [field.fieldName]: '1-month' });
        formValues[`from_${field.fieldName}`] = new Date(moment().subtract('1', 'month').calendar());
        formValues[`to_${field.fieldName}`] = new Date();
        setBetweenDate((prevState) => ({
          ...prevState,
          [`from_${field.fieldName}`]: new Date(moment().subtract('1', 'month').calendar()),
          [`to_${field.fieldName}`]: new Date()
        }));
        break;
      case '3-months':
        setStatusTimeFrame({ ...statusTimeFrame, [field.fieldName]: '3-months' });
        formValues[`from_${field.fieldName}`] = new Date(moment().subtract('3', 'months').calendar());
        formValues[`to_${field.fieldName}`] = new Date();
        setBetweenDate((prevState) => ({
          ...prevState,
          [`from_${field.fieldName}`]: new Date(moment().subtract('3', 'months').calendar()),
          [`to_${field.fieldName}`]: new Date()
        }));
        break;
      case '6-months':
        setStatusTimeFrame({ ...statusTimeFrame, [field.fieldName]: '6-months' });
        formValues[`from_${field.fieldName}`] = new Date(moment().subtract('6', 'months').calendar());
        formValues[`to_${field.fieldName}`] = new Date();
        setBetweenDate((prevState) => ({
          ...prevState,
          [`from_${field.fieldName}`]: new Date(moment().subtract('6', 'months').calendar()),
          [`to_${field.fieldName}`]: new Date()
        }));
        break;
      case '1-year':
        setStatusTimeFrame({ ...statusTimeFrame, [field.fieldName]: '1-year' });
        formValues[`from_${field.fieldName}`] = new Date(moment().subtract('1', 'year').calendar());
        formValues[`to_${field.fieldName}`] = new Date();
        setBetweenDate((prevState) => ({
          ...prevState,
          [`from_${field.fieldName}`]: new Date(moment().subtract('1', 'year').calendar()),
          [`to_${field.fieldName}`]: new Date()
        }));
        break;
      default:
        setStatusTimeFrame({ ...statusTimeFrame, [field.fieldName]: 'custom' });
        formValues[`from_${field.fieldName}`] = null;
        formValues[`to_${field.fieldName}`] = null;
        setBetweenDate((prevState) => ({
          ...prevState,
          [`from_${field.fieldName}`]: null,
          [`to_${field.fieldName}`]: null
        }));
        break;
    }
  };


  const createFilterModel = () => {
    const filterModel = {};
    const colNames = Object.keys(formValues);

    for (let i = 0; i < coloums.length; i++) {
      const col = coloums[i];
      const fieldName = col?.fieldName;

      if (
        !(colNames.includes(fieldName) || colNames.includes(`from_${fieldName}`) || colNames.includes(`to_${fieldName}`)) &&
        (col.type !== 'dateTime' || col.type !== 'date')
      ) {
        continue;
      }

      if (['singleLine', 'multiLine', 'email', 'mobileNumber']?.includes(col.type) && formValues[fieldName]) {
        filterModel[fieldName] = {
          filterType: 'text',
          type: 'contains',
          filter: formValues[fieldName]
        };
      }
      else if (['multiSelect', 'dropDown'].includes(col.type) && col.lookup && formValues[fieldName]) {
        const options = coloums?.find((item) => item.fieldName == fieldName)?.option || []
        if (col.type === 'multiSelect' && formValues[fieldName]?.length === 0) {
          return
        }
        filterModel[fieldName] = {
          filterType: 'text',
          operator: 'OR',
          condition1: {
            filterType: 'text',
            type: 'contains',
            filter: options?.filter((e) => formValues[fieldName]?.includes(e?.optionValue))
          },
          condition2: {
            filterType: 'text',
            type: 'contains',
            filter: 'dummy'
          }
        };
      }
      else if (['multiSelect', 'dropDown'].includes(col.type) && formValues[fieldName]) {
        filterModel[fieldName] = {
          filterType: 'text',
          type: 'contains',
          filter: formValues[fieldName],
        };
      }
      else if (['dateTime', 'date'].includes(col.type)) {
        const from = `from_${fieldName}`;
        const to = `to_${fieldName}`;

        const fromDate = formValues[from] ? formValues[from] : null;
        const toDate = formValues[to] ? formValues[to] : null;

        if (fromDate || toDate) {
          filterModel[fieldName] = {
            filterType: 'date',
            type: 'contains',
            filter: {
              from: fromDate ? moment(new Date(fromDate)).format('MM/DD/YYYY') : null,
              to: toDate ? moment(new Date(toDate)).format('MM/DD/YYYY') : null
            }
          };
        }
      }
      else if (col.type === 'checkBox') {
        if (formValues[fieldName] === true || formValues[fieldName] === false) {
          filterModel[fieldName] = {
            filterType: 'text',
            type: 'contains',
            filter: formValues[fieldName] === true ? 'Yes' : 'No'
          };
        }
      }
    }
    return filterModel;
  };

  const handleApplyFilter = () => {
    setCurrentFomValue(formValues || {});
    currentGridApi.setFilterModel(createFilterModel());
    setSelectedFilter(selectedUserFilter || null);
    handleClose();
  };

  const handleDeleteUserFilter = () => {
    axiosInstance()
      .put(`/user-resource-filter/remove`, { ids: isFilterDeleteConfirm.ids })
      .then(({ data }) => {
        fetchUserFilters();
        setIsFilterDeleteConfirm({ open: false, ids: null });
        setSelectedUserFilter(null);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  return (
    <MuiPickersUtilsProvider utils={MomentUtils}>
      <Dialog
        maxWidth={'md'}
        open={true}
        fullWidth
        onClose={(e, reason) => {
          if (reason !== 'backdropClick') {
            handleClose();
          }
        }}
        aria-describedby="Filter Dialog"
      >
        <CustomDialogHeader title={`Filters`} onClose={handleClose} showRequiredLabel={false} />
        <CustomDialogContent>
          <Box pt={2} pb={2}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Autocomplete
                  fullWidth
                  size="small"
                  value={selectedUserFilter}
                  onChange={(event: any, newValue: any) => {
                    setSelectedUserFilter(newValue || null);
                    setFormValues(newValue?.filterValue || {});
                  }}
                  getOptionLabel={(option) => option.title}
                  renderOption={(option) => (
                    <Box display={'flex'} alignItems={'center'} justifyContent={'space-between'} width={'100%'}>
                      <span onClick={() => setIsEditing(false)} style={{ width: 'calc(100% - 71px)' }}>
                        {option?.title}
                      </span>
                      <Box>
                        <IconButton size="small" style={{ marginRight: '20px' }}>
                          <AiFillEdit />
                        </IconButton>
                        <IconButton size="small" onClick={() => setIsFilterDeleteConfirm({ open: true, ids: [option._id] })}>
                          <RiDeleteBin6Fill />
                        </IconButton>
                      </Box>
                    </Box>
                  )}
                  id="controllable-states-demo"
                  options={userFilters}
                  renderInput={(params) => <TextField {...params} fullWidth label="Select a Filter Set" variant="outlined" />}
                />
              </Grid>
            </Grid>
          </Box>
          <Box pt={2} pb={2}>
            <Grid container spacing={2}>
              {coloums ? (
                coloums?.map((field) => {
                  if (
                    !statusTimeFrame[field.fieldName] &&
                    (field.type === 'date' || field.type === 'dateTime') &&
                    !formValues[`from_${field.fieldName}`] &&
                    formValues[`to_${field.fieldName}`]
                  ) {
                    handleDuration('custom', field);
                  }
                  return (
                    <Fragment key={field._id}>
                      {field.type === 'date' || field.type === 'dateTime' ? (
                        <Fragment>
                          <Grid item xs={12} sm={6}>
                            <FormControl fullWidth size="small" variant="outlined">
                              <InputLabel id={field.fieldName}>Select Duration</InputLabel>
                              <Select
                                labelId={field.fieldName}
                                id={`time-${field.fieldName}`}
                                defaultValue={'custom'}
                                value={statusTimeFrame[field.fieldName] ?? 'custom'}
                                onChange={(e) => {
                                  handleDuration(e.target.value, field);
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
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <KeyboardDatePicker
                              autoOk
                              disabled={!(statusTimeFrame[field.fieldName] === 'custom' || !(field.fieldName in statusTimeFrame))}
                              fullWidth
                              size="small"
                              variant="inline"
                              inputVariant="outlined"
                              name={`from_${field.fieldName}`}
                              label={`From ${field.fieldLabel}`}
                              value={formValues[`from_${field.fieldName}`] ? formValues[`from_${field.fieldName}`] : null}
                              maxDate={new Date()}
                              onChange={(date: any) => {
                                setBetweenDate((prevState) => ({ ...prevState, [`from_${field.fieldName}`]: date }));
                                handleSelectFilter(`from_${field.fieldName}`, date);
                              }}
                              format={dateFormat}
                              InputLabelProps={{
                                shrink: true
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <KeyboardDatePicker
                              autoOk
                              fullWidth
                              disabled={!(statusTimeFrame[field.fieldName] === 'custom' || !(field.fieldName in statusTimeFrame))}
                              size="small"
                              variant="inline"
                              inputVariant="outlined"
                              name={`to_${field.fieldName}`}
                              label={`To ${field.fieldLabel}`}
                              value={formValues[`to_${field.fieldName}`] ? formValues[`to_${field.fieldName}`] : null}
                              maxDate={new Date()}
                              onChange={(date: any) => {
                                setBetweenDate((prevState) => ({ ...prevState, [`to_${field.fieldName}`]: date }));
                                handleSelectFilter(`to_${field.fieldName}`, date);
                              }}
                              format={dateFormat}
                              InputLabelProps={{
                                shrink: true
                              }}
                              minDate={betweenDate && betweenDate[`from_${field.fieldName}`] ? betweenDate[`from_${field.fieldName}`] : new Date()}
                            />
                          </Grid>
                        </Fragment>
                      ) : (
                        <Grid item xs={12} sm={6} md={6}>
                          <FormTypes
                            disabled={false}
                            values={formValues}
                            errors={{}}
                            touched={{}}
                            label={field.fieldLabel}
                            name={field.fieldName}
                            type={field.type}
                            options={field.option}
                            setFieldValue={handleSelectFilter}
                            required={false}
                            fullWidth
                            size="small"
                          />
                        </Grid>
                      )}
                    </Fragment>
                  );
                })
              ) : (
                <Box p={2} height={500}>
                  <CommonSkeleton lenArray={[...Array(10).keys()]} />
                </Box>
              )}
            </Grid>
          </Box>
        </CustomDialogContent>
        <CustomDialogFooter>
          <Button
            onClick={() => {
              setIsSaveFilter({ open: true, data: selectedUserFilter });
            }}
            disabled={isEmpty(formValues) ? true : false}
            size="small"
            color="primary"
            variant="contained"
          >
            {selectedUserFilter ? 'Update Filter' : 'Save Filter'}
          </Button>
          <Button onClick={handleApplyFilter} size="small" color="primary" variant="contained">
            Apply Now
          </Button>
        </CustomDialogFooter>
      </Dialog>
      {isFilterDeleteConfirm.open && (
        <ConfirmationDialog
          open={true}
          message={`Are you sure you want to delete ?`}
          onClose={() => setIsFilterDeleteConfirm({ open: false, ids: null })}
          onOk={handleDeleteUserFilter}
        />
      )}
      {isSaveFilter.open && (
        <SaveFilterDialog
          handleClose={() => {
            setIsSaveFilter({ open: false, data: null });
          }}
          resource={resource}
          handleSucess={() => {
            setIsSaveFilter({ open: false, data: null });
            setFormValues({});
            fetchUserFilters();
            setSelectedUserFilter(null);
          }}
          filterData={isSaveFilter.data}
          filterValue={formValues}
        />
      )}
    </MuiPickersUtilsProvider>
  );
}

export default GridFilter;
