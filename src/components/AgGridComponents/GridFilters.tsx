import React, { useState, useEffect, useRef } from 'react';
import { nanoid } from 'nanoid';
import {
  Button,
  Dialog,
  DialogActions,
  TextField,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Slide,
  Box,
  IconButton,
  Grid,
  Chip
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
import { dateTimeFormat } from 'src/constants/helpers';
import moment from 'moment';
import FormTypesSimple, { inputTypes } from 'src/components/Helpers/FromTypesSimple';
import CommonSkeleton from '../Helpers/CommonSkeleton';

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const GridFilters = ({ currentGridApi, columnApi, columns, tableSource, open, setOpen, resource }) => {
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
    onConfirm: () => {}
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
      .then((columns) => {
        setAllColumns(columns?.data?.data || []);
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

  return (
    <div className="table-filter-v1">
      {/* <<<<<<<<<<<<<<<<<<<<<<<<< FILTER DIALOG >>>>>>>>>>>>>>>>>>>>>>>>> */}
      <Dialog maxWidth={'md'} open={open} TransitionComponent={Transition} onClose={handleClose} aria-describedby="Filter Dialog">
        {/* <DialogTitle className="white-bg">Filters</DialogTitle> */}
        <CustomDialogHeader title="Filters" onClose={handleClose} showRequiredLabel={false} />
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
                const value = getFieldValue(field.fieldData?.fieldName);
                return (
                  <Grid item xs={12} sm={6} md={4}>
                    <FormTypesSimple key={index} index={index} field={field.fieldData} value={value} onChange={formOnChange} />
                  </Grid>
                );
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
    </div>
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
