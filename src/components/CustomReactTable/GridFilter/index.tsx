import MomentUtils from '@date-io/moment';
import { Box, Button, Dialog, FormControl, Grid, IconButton, InputLabel, MenuItem, Select, TextField, useMediaQuery } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { KeyboardDatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import { isEmpty } from 'lodash';
import moment from 'moment';
import { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { AiFillEdit } from 'react-icons/ai';
import { RiDeleteBin6Fill } from 'react-icons/ri';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import SingleLine from 'src/components/CustomReactTable/GridFilter/SingleLine';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import AsyncDropdown from 'src/components/Helpers/FormTypes/AsyncDropdown';
import { CustomDialogTransition, dateFormat, sidebarResource } from 'src/constants/helpers';
import CustomDialogContent from '../../CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../CustomDialog/CustomDialogHeader';
import CommonSkeleton from '../../Helpers/CommonSkeleton';
import ConfirmationDialog from '../../Helpers/ConfirmationDialog';
import FormTypes from '../../Helpers/FormTypes';
import { createFilterModel, fetchFieldOptions } from '../utils';
import SaveFilterDialog from './SaveFilterDialog';
import NumberInput from 'src/components/CustomReactTable/GridFilter/NumberInput';
import { useUserTempFilters } from 'src/components/CustomReactTable/GridFilter/utils';

function GridFilter({ resource, handleClose, setSelectedFilter, selectedFilter, currentFomValue, setCurrentFomValue, customFilters, dispatch }) {
  const isMobileView = useMediaQuery('(max-width:768px)');
  const toastConfig = useContext(CustomToastContext);
  const [formValues, setFormValues] = useState({});
  const [coloums, setColoums] = useState(null);
  const [userFilters, setUserFilters] = useState([]);
  const [selectedUserFilter, setSelectedUserFilter] = useState(null);
  const { setTempFilter } = useUserTempFilters();

  const [isSaveFilter, setIsSaveFilter] = useState({ open: false, data: null });
  const [isFilterDeleteConfirm, setIsFilterDeleteConfirm] = useState({ open: false, ids: null });

  const [statusTimeFrame, setStatusTimeFrame] = useState<any>({});
  const [betweenDate, setBetweenDate] = useState(null);

  useEffect(() => {
    fetchAllColumns();
    fetchUserFilters();

    if (selectedFilter) {
      setFormValues(selectedFilter?.filterValue || {});
    } else {
      setFormValues(currentFomValue || {});
    }
    setSelectedUserFilter(selectedFilter);
  }, []);

  const fetchAllColumns = async () => {
    try {
      const columns = await fetchFieldOptions({ resource, sidebarResource, toastConfig });
      setColoums(columns);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
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
    const isArray = Array.isArray(value);
    const isString = typeof value === 'string';
    const isNumber = typeof value === 'number';
    const isObject = typeof value === 'object';

    if ((isArray && value.length === 0) || (isString && !value) || (isObject && !isArray && !value) || (isNumber && (isNaN(value) || !value))) {
      setFormValues((prevState) => {
        const newState = { ...prevState };
        delete newState[name];
        return newState;
      });
    } else {
      setFormValues((prevState) => ({ ...prevState, [name]: value }));
    }
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

  const handleApplyFilter = () => {
    const filters = createFilterModel(formValues, coloums);
    setCurrentFomValue(formValues || {});
    dispatch({ type: 'filter', filters });
    setSelectedFilter(selectedUserFilter || null);
    setTempFilter(resource, { formValues: formValues || {}, filters });
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

  const validate = (formValues = {}) => {
    //if (isEmpty(formValues)) return false;
    const field = coloums?.filter((c) => c?.type === 'date' || c?.type === 'dateTime');
    let isValid = true;
    field?.forEach((f) => {
      if (formValues[`to_${f?.fieldName}`]) {
        const minDate =
          betweenDate && betweenDate[`from_${f?.fieldName}`]
            ? betweenDate[`from_${f?.fieldName}`]
            : formValues[`from_${f?.fieldName}`]
              ? formValues[`from_${f?.fieldName}`]
              : new Date();

        if (new Date(minDate).getTime() > new Date(formValues[`to_${f?.fieldName}`]).getTime()) {
          isValid = false;
        }
      }
    });

    return isValid;
  };

  return (
    <MuiPickersUtilsProvider utils={MomentUtils}>
      <Dialog
        maxWidth={'md'}
        open={true}
        TransitionComponent={CustomDialogTransition}
        fullScreen={isMobile || isMobileView}
        fullWidth
        onClose={(e, reason) => {
          if (reason !== 'backdropClick') {
            handleClose();
          }
        }}
        aria-describedby="Filter Dialog"
      >
        <CustomDialogHeader title={`Filters`} onClose={handleClose} showRequiredLabel={false} />
        <CustomDialogContent isFooterPresent>
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
                      <span style={{ width: 'calc(100% - 71px)' }}>{option?.title}</span>
                      <Box>
                        <HtmlTooltip title={'Edit'} placement="top" arrow enterTouchDelay={0}>
                          <IconButton size="small" style={{ marginRight: '20px' }}>
                            <AiFillEdit />
                          </IconButton>
                        </HtmlTooltip>
                        <HtmlTooltip title={'Delete'} placement="top" arrow enterTouchDelay={0}>
                          <IconButton size="small" onClick={() => setIsFilterDeleteConfirm({ open: true, ids: [option._id] })}>
                            <RiDeleteBin6Fill />
                          </IconButton>
                        </HtmlTooltip>
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
                              onChange={(date: any) => {
                                setBetweenDate((prevState) => ({ ...prevState, [`to_${field.fieldName}`]: date }));
                                handleSelectFilter(`to_${field.fieldName}`, date);
                              }}
                              format={dateFormat}
                              InputLabelProps={{
                                shrink: true
                              }}
                              minDate={
                                betweenDate && betweenDate[`from_${field.fieldName}`]
                                  ? betweenDate[`from_${field.fieldName}`]
                                  : formValues[`from_${field.fieldName}`]
                                    ? formValues[`from_${field.fieldName}`]
                                    : new Date()
                              }
                            />
                          </Grid>
                        </Fragment>
                      ) : (
                        <Grid item xs={12} sm={6} md={6}>
                          {field?.lookup && field.lookupResource ? (
                            <AsyncDropdown
                              key={field?._id}
                              resource={field.lookupResource}
                              errors={{}}
                              touched={{}}
                              multiple={true}
                              value={formValues[field.fieldName] ?? []}
                              onChange={(_, value) => {
                                handleSelectFilter(field?.fieldName, value);
                              }}
                              fieldName={field.fieldName}
                              fieldLabel={field.fieldLabel}
                              required={false}
                            />
                          ) : field?.type === 'singleLine' || field?.type === 'lookUpDisplay' ? (
                            <SingleLine
                              key={field?._id}
                              resource={resource}
                              errors={{}}
                              touched={{}}
                              value={formValues[field.fieldName] ?? []}
                              onChange={(_, value) => {
                                handleSelectFilter(field?.fieldName, value);
                              }}
                              fieldName={field.fieldName}
                              fieldLabel={field.fieldLabel}
                              required={false}
                              fieldData={field}
                              allFields={coloums}
                            />
                          ) : field?.type === 'decimal' || field?.type === 'number' ? (
                            <NumberInput
                              key={field?._id}
                              errors={{}}
                              touched={{}}
                              value={formValues[field.fieldName] ?? []}
                              onChange={(_, value) => {
                                handleSelectFilter(field?.fieldName, value);
                              }}
                              fieldName={field.fieldName}
                              fieldLabel={field.fieldLabel}
                              required={false}
                            />
                          ) : (
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
                              fromFilter={true}
                              fieldData={{ decimalPlaces: field?.decimalPlaces }}
                            />
                          )}
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
            // variant="outlined"
            className="yellow-button"
          >
            {selectedUserFilter ? 'Update Filter' : 'Save Filter'}
          </Button>
          <Button
            disabled={!validate(formValues) ? true : false}
            onClick={handleApplyFilter}
            size="small"
            className="no-shadow"
            color="primary"
            variant="contained"
          >
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
          columns={coloums}
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
