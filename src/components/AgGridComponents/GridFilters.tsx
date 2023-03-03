import React, { useState, useEffect, useRef } from 'react';
import { nanoid } from 'nanoid';
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
  Chip,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogActions,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Slide,
  Select
} from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { TransitionProps } from '@material-ui/core/transitions';
import { AiFillEdit } from 'react-icons/ai';
import { RiDeleteBin6Fill } from 'react-icons/ri';
import CloseIcon from '@material-ui/icons/Close';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../CustomDialog/CustomDialogFooter';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import FormTypes from '../Helpers/FormTypes';
import { dateFormat, dateTimeFormat } from 'src/constants/helpers';
import moment from 'moment';
import FormTypesSimple, { inputTypes } from 'src/components/Helpers/FromTypesSimple';
import CommonSkeleton from '../Helpers/CommonSkeleton';
import { KeyboardDatePicker } from '@material-ui/pickers';

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const GridFilters = ({ currentGridApi, columnApi, columns, tableSource, setOpen, resource }) => {

  const [isSaveFilterOpen, setIsSaveFilterOpen] = useState(false);

  const [allColumns, setAllColumns] = useState(null);


  const [savedFilters, setSavedFilters] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [colsWithFilterValue, setColsWithFilterValue] = useState([]);
  const [filterName, setFilterName] = useState(null);
  const [isFieldsDisabled, setIsFieldsDisabled] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isConfrimDialogOpen, setIsConfrimDialogOpen] = useState(false);
  const [filterValue, setFilterValue] = useState({});
  const [confrimDialogParam, setConfrimDialogParam] = useState({
    head: '',
    body: '',
    onConfirm: () => { }
  });
  const toastConfig = React.useContext(CustomToastContext);

  // <<<<<<<<<<<<<<<<<<<<<<<<< HELPER FUNCTIONS >>>>>>>>>>>>>>>>>>>>>>>>>
  const handleClose = () => {
    // applyFilter();
    setOpen(false);
  };
  const handleSaveDialogOpen = () => {
    if (isEditing) {
      updateFilter();
    } else {
      setIsSaveFilterOpen(true);
    }
  };
  const handleSaveDialogClose = () => {
    setIsSaveFilterOpen(false);
  };

  // <<<<<<<<<<<<<<<<<<<<<<<<< HELPER FUNCTIONS >>>>>>>>>>>>>>>>>>>>>>>>>

  useEffect(() => {
    fetchGridColumns();
    fetchGridFilters();
  }, []);

  useEffect(() => {
    setColsWithFilterValue(selectedFilter?.filterValue.colsWithFilterValue || []);
  }, [selectedFilter]);

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field?resource=${resource}`)
      .then(({ data: { data } }) => {
        setAllColumns(data?.map((e) => { return { ...e.fieldData } }));
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const fetchGridFilters = () => {
    axiosInstance()
      .get(`/user-resource-filter?resource=${resource}`)
      .then((filters) => {
        setSavedFilters(filters?.data?.data || []);
      })
      .catch((err) => {
        setSavedFilters([]);
        toastConfig.setToastConfig(err);
      });
  };

  const disableButtonandFields = () => {
    if (isEditing) {
      setIsFieldsDisabled(false);
      return;
    }
    if (!isEditing && !selectedFilter) {
      setIsFieldsDisabled(false);
      return;
    }
    if (selectedFilter && !isEditing) {
      setIsFieldsDisabled(true);
      return;
    }
  };

  useEffect(() => {
    disableButtonandFields();
  }, [selectedFilter, isEditing]);

  // <<<<<<<<<<<<<<<<<<<<<<<<< FORM FUNCTIONS >>>>>>>>>>>>>>>>>>>>>>>>>
  const formOnChange = (event, data, index) => {
    const prevData = [...colsWithFilterValue];
    const indexOfData = prevData.findIndex((item) => Object.keys(item)[0] === Object.keys(data)[0]);
    const dataKey = Object.keys(data)[0];
    if (indexOfData !== -1) {
      if (!data[dataKey] || data[dataKey] === '') {
        prevData.splice(indexOfData, 1);
      } else {
        prevData[indexOfData] = data;
      }
    } else {
      prevData.push(data);
    }
    setColsWithFilterValue(prevData);
  };

  const getFieldValue = (fieldName) => {
    const prevData = [...colsWithFilterValue];
    const indexOfData = prevData.findIndex((item) => Object.keys(item)[0] === fieldName);
    if (indexOfData === -1) {
      return null;
    }
    const key = Object.keys(prevData[indexOfData])[0];
    const data = prevData[indexOfData];
    return data[key];
  };

  // <<<<<<<<<<<<<<<<<<<<<<<<< FILTER FUNCTIONS >>>>>>>>>>>>>>>>>>>>>>>>>
  const createFilterModel = () => {
    const columns = [...colsWithFilterValue];
    const filterModel = {};

    columns.forEach((col) => {
      const key = Object.keys(col)[0];

      if (col.type === inputTypes.singleLine) {
        filterModel[key] = {
          filterType: 'text',
          type: 'contains',
          filter: col[key]
        };
      }
      if (col.type === inputTypes.dropDown) {
        filterModel[key] = {
          filterType: 'text',
          type: 'contains',
          filter: col[key]?.optionLabel
        };
      }
      if (col.type === inputTypes.dateTime) {
        if (key.toLocaleLowerCase().includes('start')) {
          filterModel[key] = {
            filterType: 'text',
            type: 'greaterThan',
            filter: moment(col[key]).format(dateTimeFormat)
          };
        } else if (key.toLocaleLowerCase().includes('end')) {
          filterModel[key] = {
            filterTo: null,
            type: 'lessThan',
            filter: moment(col[key]).format(dateTimeFormat)
          };
        } else {
          filterModel[key] = {
            filterType: 'text',
            type: 'greaterThan',
            filter: moment(col[key]).format(dateTimeFormat)
          };
        }
      }
      if (col.type === inputTypes.currency) {
        filterModel[key] = {
          filterType: 'text',
          type: 'contains',
          filter: col[key]?.currencyCode
        };
      }
      if (col.type === inputTypes.multiSelect) {
        filterModel[key] = {
          filterType: 'set',
          values: col[key]?.map((item) => item.optionLabel)
        };
      }
    });
    return filterModel;
  };

  const applyFilter = () => {
    currentGridApi.setFilterModel(createFilterModel());
    setIsEditing(false);
    setOpen(false);
    handleClose();
  };

  const saveFilter = async () => {
    const newFilter = {
      title: filterName,
      resource: resource,
      filterValue: { colsWithFilterValue }
    };
    await axiosInstance()
      .post(`/user-resource-filter/`, newFilter)
      .then((res) => {
        fetchGridFilters();
        toastConfig.setToastConfig({
          severity: 'success',
          message: 'Filter saved successfully'
        });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };
  const updateFilter = () => {
    if (!selectedFilter?._id) {
      toastConfig.setToastConfig({
        severity: 'error',
        message: 'Please select a filter to update'
      });
    }
    axiosInstance()
      .put(`/user-resource-filter`, selectedFilter)
      .then((res) => {
        fetchGridFilters();
        setSelectedFilter(selectedFilter);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: `Filter updated successfully`
        });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  // <<<<<<<<<<<<<<<<<<<<<<<<< FUNCTIONS FOR DELETE FILTER >>>>>>>>>>>>>>>>>>>>>>>>>
  const deleteFilter = (id) => {
    axiosInstance()
      .put(`/user-resource-filter/remove`, { ids: [id] })
      .then((res) => {
        fetchGridFilters();
        setSelectedFilter(null);
        setIsFieldsDisabled(false);
        setIsConfrimDialogOpen(false);
        toastConfig.setToastConfig({
          severity: 'success',
          message: 'Filter deleted successfully'
        });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const openDeleteConFirmation = (id, title) => {
    setConfrimDialogParam({
      head: 'Confrim',
      body: `Are you sure want to delete: ${title}`,
      onConfirm: () => deleteFilter(id)
    });
    setIsConfrimDialogOpen(true);
  };

  // <<<<<<<<<<<<<<<<<<<<<<<<< FUNCTIONS TO REMOVE FILTER >>>>>>>>>>>>>>>>>>>>>>>>>
  const handleClearSelectedFilter = () => {
    setSelectedFilter(null);
  };
  const handleClearSingleFilter = (colName) => {
    const oldFilters = [...colsWithFilterValue];
    const colIndex = oldFilters.findIndex((col) => Object.keys(col)[0] === colName);
    if (colIndex !== -1) {
      oldFilters.splice(colIndex, 1);
    }
    setColsWithFilterValue(oldFilters);
  };

  const [formValues, setFormValues] = React.useState({});
  const [statusTimeFrame, setStatusTimeFrame] = React.useState<any>('custom');
  const [statusPeriodDate, setStatusPeriodDate] = React.useState(null);
  const [betweenDate, setBetweenDate] = React.useState(null);

  const handleSelectFilter = (name, value) => {
    // let fieldProps: any = {};
    // if (!name?.includes('Date')) {
    //   fieldProps.type = resourceOptions[name].type;
    //   fieldProps.lookup = resourceOptions[name].lookup;
    // } else {
    //   fieldProps.type = 'date';
    //   fieldProps.lookup = false;
    // }

    // const newData: any = {
    //   type: fieldProps.type,
    //   lookup: fieldProps.lookup
    // };

    // if (Array.isArray(value)) {
    //   newData.value = resourceOptions[name].options?.filter((d) => value?.includes(d.optionValue));
    //   setSelectedData((prevState) => ({ ...prevState, [name]: newData }));
    // } else {
    //   newData.value = value;
    //   setSelectedData((prevState) => ({ ...prevState, [name]: newData }));
    // }
    setFormValues((prevState) => ({ ...prevState, [name]: value }));
  };

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
    <>
      <Dialog
        maxWidth={'md'}
        open={true}
        fullWidth
        TransitionComponent={Transition}
        onClose={handleClose}
        aria-describedby="Filter Dialog">
        <CustomDialogHeader
          title="Filters"
          onClose={handleClose}
          showRequiredLabel={false} />
        <CustomDialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Autocomplete
                fullWidth
                size="small"
                value={selectedFilter}
                onChange={(event: any, newValue: any) => {
                  setSelectedFilter(newValue);
                  setFilterValue(newValue);
                }}
                getOptionLabel={(option) => option.title}
                renderOption={(option) => (
                  <Box display={'flex'} alignItems={'center'} justifyContent={'space-between'} width={'100%'}>
                    <span onClick={() => setIsEditing(false)} style={{ width: 'calc(100% - 71px)' }}>
                      {option?.title}
                    </span>
                    <Box>
                      <IconButton
                        size="small"
                        style={{ marginRight: '20px' }}
                        onClick={() => {
                          setIsEditing(true);
                        }}
                      >
                        <AiFillEdit />
                      </IconButton>
                      <IconButton size="small" onClick={() => openDeleteConFirmation(option._id, option.title)}>
                        <RiDeleteBin6Fill />
                      </IconButton>
                    </Box>
                  </Box>
                )}
                id="controllable-states-demo"
                options={savedFilters}
                disabled={!savedFilters}
                renderInput={(params) => <TextField fullWidth {...params} label="Select a Filter Set" variant="outlined" />}
              />
            </Grid>
            {allColumns ? (
              allColumns?.map((field, index) => {
                return <React.Fragment key={field._id}>
                  {field.type !== 'date' && (
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
                            // const tempArray = [...selectedResources];
                            // let tempIndex = tempArray.findIndex((d) => d?.fieldName === field?.fieldName);
                            // tempArray[tempIndex].timeFrame = e.target.value;
                            // setSelectedResources(tempArray);
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
                        minDate={betweenDate && betweenDate[`from_${field.fieldName}`] ? betweenDate[`from_${field.fieldName}`] : new Date()}
                      />
                    </Grid>
                  )}
                </React.Fragment>
              })
            ) : (
              <Box p={2} height={500} bgcolor="white">
                <CommonSkeleton lenArray={[...Array(10).keys()]} />
              </Box>
            )}
          </Grid>
        </CustomDialogContent>
        <CustomDialogFooter>
          <Button
            onClick={() => {
              handleSaveDialogOpen();
            }}
            disabled={isFieldsDisabled}
            className="btn-outline-v1 light"
          >
            {isEditing ? 'Update Filter' : 'Save Filter'}
          </Button>
          <Button
            onClick={() => {
              applyFilter();
            }}
            size="small"
            color="primary"
            variant="contained"
          >
            Apply Now
          </Button>
        </CustomDialogFooter>
      </Dialog>

      {/* <<<<<<<<<<<<<<<<<<<<<<<<< SAVE DIALOG >>>>>>>>>>>>>>>>>>>>>>>>> */}
      <Dialog maxWidth={'md'} open={isSaveFilterOpen} onClose={handleSaveDialogClose} aria-describedby="Filter Dialog">
        <CustomDialogHeader title="Set Name to Filter" onClose={handleSaveDialogClose} />
        <CustomDialogContent style={{ minWidth: '375px' }}>
          <DialogContentText id="alert-dialog-slide-description">Set a name to your filter set</DialogContentText>
          <TextField value={filterName || ''} onChange={(e) => setFilterName(e.target.value)} fullWidth label={''} size="small" variant="outlined" />
        </CustomDialogContent>
        <CustomDialogFooter>
          <Button
            onClick={() => {
              handleSaveDialogClose();
            }}
            className="btn-outline-v1 light"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              // applyFilter();
              saveFilter();
              handleSaveDialogClose();
            }}
            color="primary"
            variant="contained"
            size="small"
          >
            Confirm
          </Button>
        </CustomDialogFooter>
      </Dialog>

      {/* <<<<<<<<<<<<<<<<<<<<<<<<< CONFIRM DIALOG >>>>>>>>>>>>>>>>>>>>>>>>> */}
      <ConfirmarionDialog
        open={isConfrimDialogOpen}
        setOpen={setIsConfrimDialogOpen}
        head={confrimDialogParam.head}
        body={confrimDialogParam.body}
        onConfirm={confrimDialogParam.onConfirm}
      />

      {/* <<<<<<<<<<<<<<<<<<<<<<<<< DISPLAY APPLIED FILTERS >>>>>>>>>>>>>>>>>>>>>>>>> */}
      <DisplayFilters
        gridApi={currentGridApi}
        selectedFilter={selectedFilter}
        colsWithFilterValue={colsWithFilterValue}
        handleClearSelectedFilter={handleClearSelectedFilter}
        handleClearSingleFilter={handleClearSingleFilter}
        handleOpen={() => setOpen(true)}
      />
    </>
  );
};

export default GridFilters;

// <<<<<<<<<<<<<<<<<<<<<<<<< CONFIRM DIALOG >>>>>>>>>>>>>>>>>>>>>>>>>
const ConfirmarionDialog = ({ head, body, onConfirm, open, setOpen }) => {
  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };
  return (
    <>
      <Dialog open={open} onClose={handleClose} aria-labelledby="alert-dialog-title" aria-describedby="alert-dialog-description">
        <DialogTitle id="alert-dialog-title" className=" white-bg">
          {head}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">{body}</DialogContentText>
        </DialogContent>
        <DialogActions className=" white-bg">
          <Button onClick={handleClose} size="small">
            Cancel
          </Button>
          <Button onClick={onConfirm} autoFocus size="small">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// <<<<<<<<<<<<<<<<<<<<<<<<< DISPLAY APPLIED FILTERS CHIP >>>>>>>>>>>>>>>>>>>>>>>>>
const DisplayFilters = ({ gridApi, selectedFilter, colsWithFilterValue, handleClearSelectedFilter, handleClearSingleFilter, handleOpen }) => {
  const [filters, setFilters] = useState(null);
  const [appliedFilter, setAppliedFilter] = useState(null);
  const [hiddenItems, setHiddenItems] = useState(0);
  const containerRef = useRef(null);

  const clearSingleFilter = (name) => {
    setFilters((prev) => prev.filter((item) => item.name !== name));
    handleClearSingleFilter(name);
    gridApi.destroyFilter(name);
  };

  const clearFilterAll = () => {
    handleClearSelectedFilter();
    gridApi.setFilterModel({});
    setAppliedFilter(null);
    setFilters(null);
  };

  const filterOutFilters = () => {
    const data = colsWithFilterValue?.map((item) => {
      const key = Object.keys(item)[0];
      if (item.type === inputTypes.singleLine) {
        return { title: item.name, value: item[key], name: key };
      }
      if (item.type === inputTypes.dropDown) {
        return { title: item.name, value: item[key]?.optionLabel, name: key };
      }
      if (item.type === inputTypes.currency) {
        return { title: item.name, value: item[key]?.currencyCode, name: key };
      }
      if (item.type === inputTypes.dateTime) {
        if (key.toLocaleLowerCase().includes('start')) {
          return { title: `${item.name}`, value: `After ${moment(item[key]).format(dateTimeFormat)}`, name: key };
        } else if (key.toLocaleLowerCase().includes('end')) {
          return { title: `${item.name}`, value: `Before ${moment(item[key]).format(dateTimeFormat)}`, name: key };
        } else {
          return { title: `${item.name}`, value: moment(item[key]).format(dateTimeFormat), name: key };
        }
      }
      if (item.type === inputTypes.multiSelect) {
        return { title: item.name, value: item[key]?.map((item) => item.optionLabel).join(), name: key };
      }
    });
    return data ? data : [];
  };

  useEffect(() => {
    setFilters(filterOutFilters());
    setAppliedFilter(selectedFilter);
  }, [colsWithFilterValue, selectedFilter]);

  useEffect(() => {
    setHiddenItems(0);
    if (containerRef?.current) {
      hideElementAndShowNumber(containerRef.current);
    }
  }, [colsWithFilterValue, selectedFilter]);

  const hideElementAndShowNumber = (container) => {
    const containerWidth = container?.clientWidth - 103;
    const childItems = [...container?.children];

    let tempChildWIdth = 0;
    let count = 0;
    childItems.forEach((item) => {
      const itemWidth = item.clientWidth;
      tempChildWIdth += itemWidth;
      if (tempChildWIdth > containerWidth) {
        item.style.display = 'none';
      }
    });
    childItems.forEach((item) => {
      if (item.style.display === 'none') setHiddenItems((prev) => prev + 1);
    });
  };

  return (
    <>
      {appliedFilter ? (
        <div className="chip-container">
          <Chip onClick={handleOpen} className={'filter-chip'} deleteIcon={<CloseIcon />} label={appliedFilter?.title} onDelete={clearFilterAll} />
        </div>
      ) : (
        filters?.length > 0 && (
          <div className="chip-container">
            <div className={'chip-group'} ref={containerRef}>
              {filters?.map((filter) => (
                <Chip
                  onClick={handleOpen}
                  className={'filter-chip'}
                  deleteIcon={<CloseIcon />}
                  label={`${filter?.title}=${filter?.value}`}
                  onDelete={() => clearSingleFilter(filter.name)}
                />
              ))}
            </div>
            {hiddenItems !== 0 && (
              <div style={{ cursor: 'pointer' }} onClick={handleOpen}>
                +{hiddenItems} more
              </div>
            )}
          </div>
        )
      )}
    </>
  );
};
