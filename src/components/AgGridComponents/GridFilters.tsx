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

  const [savedFilters, setSavedFilters] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [colsWithFilterValue, setColsWithFilterValue] = useState(null);
  const [filterName, setFilterName] = useState(null);
  const [isFieldsDisabled, setIsFieldsDisabled] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isConfrimDialogOpen, setIsConfrimDialogOpen] = useState(false);
  const [confrimDialogParam, setConfrimDialogParam] = useState({
    head: '',
    body: '',
    onConfirm: () => {}
  });
  const toastConfig = React.useContext(CustomToastContext);

  // <<<<<<<<<<<<<<<<<<<<<<<<< HELPER FUNCTIONS >>>>>>>>>>>>>>>>>>>>>>>>>
  const handleClose = () => {
    setOpen(false);
    // applyFilter();
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
  const createEmptyColWithFilterValue = () => {
    return columns?.map((item) => ({ name: item.field, title: item.headerName, value: '' }));
  };
  const updateColWithFilterValue = (name, value) => {
    const data = colsWithFilterValue?.map((item) => {
      if (item.name === name) return { ...item, value: value };
      else return item;
    });
    setColsWithFilterValue(data);
    return data;
  };
  useEffect(() => {
    fetchGridFilters();
  }, []);

  useEffect(() => {
    const allCol = createEmptyColWithFilterValue();
    setColsWithFilterValue(allCol);
    // setSavedFilters(() => getFiltersFromLocalStorage());
    // fetchGridFilters();
  }, [columns]);

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
      setColsWithFilterValue(() => createEmptyColWithFilterValue());
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
  const updateColumnValue = (index, value) => {
    setColsWithFilterValue((prev) => {
      const newList = [...prev];
      newList[index].value = value;
      return newList;
    });
  };

  // <<<<<<<<<<<<<<<<<<<<<<<<< FILTER FUNCTIONS >>>>>>>>>>>>>>>>>>>>>>>>>
  const createFilterModel = () => {
    const filterModel = {};
    colsWithFilterValue?.forEach((col) => {
      if (col.value !== '') {
        const key = col.name;
        filterModel[key] = {
          filterType: 'text',
          type: 'contains',
          filter: col.value
        };
      }
    });
    return filterModel;
  };
  const applyFilter = () => {
    const filterModel = createFilterModel();
    currentGridApi.setFilterModel(filterModel);
    setIsEditing(false);
    setOpen(false);
    handleClose();
  };
  const saveFilter = async () => {
    // const oldSavedFilters = savedFilters ? savedFilters : [];
    const newFilter = {
      title: filterName,
      resource: resource,
      filterValue: createFilterModel()
    };
    await axiosInstance()
      .post(`/user-resource-filter/`, newFilter)
      .then((res) => {
        fetchGridFilters();
        // setSelectedFilter(res.data);
        toastConfig.setToastConfig({
          severity: 'success',
          message: 'Filter saved successfully'
        });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
    // console.log([...oldSavedFilters, newFilter]);
    // setSelectedFilter(newFilter);
    // setSavedFilters([...oldSavedFilters, newFilter]);
    // saveToLocalStorage([...oldSavedFilters, newFilter]);
    // setFilterName('');
  };
  const updateFilter = () => {
    if (!selectedFilter?._id) {
      toastConfig.setToastConfig({
        severity: 'error',
        message: 'Please select a filter to update'
      });
    }
    // fetchGridFilters();
    // const oldSavedFilters = savedFilters ? savedFilters : [];
    // const newFilterValue = createFilterModel();
    const updatedFilterValue = {
      ...selectedFilter,
      filterValue: createFilterModel()
    };
    axiosInstance()
      .put(`/user-resource-filter`, updatedFilterValue)
      .then((res) => {
        fetchGridFilters();
        setSelectedFilter(updatedFilterValue);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: `Filter updated successfully`
        });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
    // const newFilters = oldSavedFilters.map((item) => {
    //   if (item._id === selectedFilter._id) {
    //     const obj = { ...item };
    //     obj.filterValue = newFilterValue;
    //     return obj;
    //   } else return item;
    // });
    // setSavedFilters(updatedFilterValue);

    // saveToLocalStorage(updatedFilterValue);
    // applyFilter();
    // setIsEditing(false);
    // setOpen(false);
  };
  const onFliterSelect = (newValue) => {
    if (!newValue) return;

    let filterCols = [];
    for (const key in newValue?.filterValue) {
      let obj = {
        name: key,
        value: newValue?.filterValue[key].filter
      };
      filterCols.push(obj);
    }
    const emptyCols = createEmptyColWithFilterValue();
    const key = 'name';
    let updatedColumns = emptyCols.map((el) => {
      const found = filterCols.find((s) => s[key] === el[key]);
      if (found) {
        el = Object.assign(el, found);
      }
      return el;
    });
    setColsWithFilterValue(updatedColumns);
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
    // const oldSavedFilters = savedFilters ? savedFilters : [];
    // let newFilters = oldSavedFilters.filter((filter) => filter._id !== id);
    // setSavedFilters(newFilters);
    // setSelectedFilter(null);
    // saveToLocalStorage(newFilters);
    // setIsFieldsDisabled(false);
    // setIsConfrimDialogOpen(false);
  };
  const openDeleteConFirmation = (id, title) => {
    setConfrimDialogParam({
      head: 'Confrim',
      body: `Are you sure want to delete: ${title}`,
      onConfirm: () => deleteFilter(id)
    });
    setIsConfrimDialogOpen(true);
  };

  // <<<<<<<<<<<<<<<<<<<<<<<<< LOCAL STORAGE FUNCTIONS >>>>>>>>>>>>>>>>>>>>>>>>>
  // const saveToLocalStorage = (data) => {
  //   const dataToSave = JSON.stringify(data);
  //   localStorage.setItem(`${tableSource}TableFilters`, dataToSave);
  // };
  // const getFiltersFromLocalStorage = () => {
  //   let data = localStorage.getItem(`${tableSource}TableFilters`);
  //   data = JSON.parse(data);
  //   return data;
  // };

  // <<<<<<<<<<<<<<<<<<<<<<<<< FUNCTIONS TO REMOVE FILTER >>>>>>>>>>>>>>>>>>>>>>>>>
  const handleClearSelectedFilter = () => {
    setSelectedFilter(null);
  };
  const handleClearSingleFilter = (colName) => {
    updateColWithFilterValue(colName, '');
  };

  return (
    <div className="table-filter-v1">
      {/* <<<<<<<<<<<<<<<<<<<<<<<<< FILTER DIALOG >>>>>>>>>>>>>>>>>>>>>>>>> */}
      <Dialog maxWidth={'md'} open={open} TransitionComponent={Transition} onClose={handleClose} aria-describedby="Filter Dialog">
        {/* <DialogTitle className="white-bg">Filters</DialogTitle> */}
        <CustomDialogHeader title="Filters" onClose={handleClose} />
        <CustomDialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Autocomplete
                fullWidth
                size="small"
                value={selectedFilter}
                onChange={(event: any, newValue: any) => {
                  setSelectedFilter(newValue);
                  onFliterSelect(newValue);
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
            {colsWithFilterValue?.map((cols, index) => (
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  disabled={isFieldsDisabled}
                  fullWidth
                  label={cols.title}
                  size="small"
                  value={cols.value}
                  onChange={(e) => updateColumnValue(index, e.target.value)}
                  variant="outlined"
                />
              </Grid>
            ))}
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
            className={'btn-primary-v1 light'}
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
            className={'btn-primary-v1'}
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
    const data = colsWithFilterValue?.filter((item) => item.value !== '');
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
                  label={`${filter.title}=${filter.value}`}
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
