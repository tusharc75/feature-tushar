import { useState, useEffect, useContext, useReducer } from 'react';
import { Box, Button, ButtonGroup, CircularProgress, Dialog, Grid, IconButton, TextField } from '@material-ui/core';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import SearchBox from '../Helpers/SearchBox';
import {
  gridLoadingTimeout,
  isObjectEmpty,
  packages,
  prepareDataForGrid,
  getLocalStorageArrayData,
  workOrder,
  employeeMaster,
  sidebarResource
} from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';
import routes from '../Helpers/Routes';
import styles from 'src/pages/Leads/Header.module.scss';
import CustomReactTable, { getStaticFields, useColumns, useTableReducer } from 'src/components/CustomReactTableNew';
import CommonSkeleton from '../Helpers/CommonSkeleton';
import { Autocomplete } from '@material-ui/lab';

let searchTimeout;

const AssignEmployeeDialog = ({ reference, referenceId = null, onSuccess, handleClose, ids, defaultCompetency = [], extraStaticFilter = [] }) => {
  const renderedFrom = `${routes.employeeMaster.title}_${reference}_selected`;
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer();
  const { dataRows, rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { getColumnData } = useColumns();

  const {
    state: { permissions, selectedEntity }
  }: any = useData();

  const [isAssigning, setAssigning] = useState(false);
  const [disableSaveButton, setDisableSaveButton] = useState(false);
  const [columns, setColumns] = useState(null);
  const [competencyOptions, setCompetencyOptions] = useState(null);
  const [selectedCompetency, setSelectedCompetency] = useState(defaultCompetency);

  useEffect(() => {
    fetchGridColumns();
    fetchCompetencyMaster();
  }, []);

  useEffect(() => {
    setDisableSaveButton(selectedRecords?.some((d) => d.qty === 0));
  }, [selectedRecords]);

  useEffect(() => {
    let millisec = Object.keys(search).length > 0 ? 600 : 5;
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    searchTimeout = setTimeout(() => {
      fetchData();
    }, millisec);
  }, [page, limit, filters, sorting, search, selectedEntity, showFilteredRecordsOnly, selectedCompetency]);

  const fetchCompetencyMaster = () => {
    axiosInstance()
      .get(`/sa-formbuilder/lookup?lookupResource=Competency Type`)
      .then(({ data: { data } }) => {
        setCompetencyOptions(data['Competency Type'] || []);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource?.employeeMaster}&view=true`)
      .then(({ data: { data } }) => {
        let columns = [];
        let rendererNames = [];
        data.forEach((o) => {
          let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.employeeMasterDetail.path);
          if (currentColumn !== null) {
            columns = [...columns, currentColumn?.columnData];
          }
        });
        columns = [...columns, ...getStaticFields()];
        setColumns(columns);
      });
  };

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    axiosInstance()
      .get(`${employeeMaster.api}${queryString}`)
      .then(({ data }) => {
        let rows = data.data.data.map((u) => {
          let finalObject = prepareDataForGrid(u);
          finalObject['isChecked'] = false;
          finalObject['id'] = u._id;
          return {
            ...finalObject
          };
        });
        dispatch({
          type: 'selection',
          selectedRecords: selectedRecords || []
        });
        dispatch({ type: 'initialize', data: rows, count: data?.data?.count });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const getQueryString = () => {
    const ignoreIds = ids && ids?.length > 0 ? ids : [];
    let deepFilter = `?page=${page}&limit=${limit}&ignoreIds=${JSON.stringify(ignoreIds)}`;
    if (selectedEntity) {
      deepFilter = `${deepFilter}&entity=${selectedEntity}`;
    }
    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || []).map((m) => m._id))}`;
    }

    const updatedFilters = [];
    if (selectedCompetency?.length > 0) {
      updatedFilters.push(...selectedCompetency.map((i) => ({ field: 'competencyType', term: i?.optionLabel })));
    }
    if (extraStaticFilter?.length) {
      extraStaticFilter?.forEach((e) => {
        updatedFilters.push(e);
      });
    }
    if (!isObjectEmpty(filters)) {
      Object.keys(filters).forEach((field) => {
        updatedFilters.push({
          field: field,
          term: filters[field].filter
        });
      });
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(updatedFilters))}&filterType=or`;
    } else {
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(updatedFilters))}&filterType=or`;
    }
    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }
    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURIComponent(search)}`;
    }
    return deepFilter;
  };

  const handleSubmit = async () => {
    onSuccess(selectedRecords);
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const onSaveEdit = (data, row) => {
    if (!data || !data?.qty) return;
    const selectedFromStorage = selectedRecords;
    if (!selectedFromStorage || selectedFromStorage.length === 0) return;
    const updatedRecords = selectedFromStorage.map((d) => {
      if (row?._id === d._id) {
        d.qty = parseInt(data.qty);
      }
      return d;
    });

    const rows = dataRows;

    rows?.forEach((d) => {
      if (row?._id === d._id) {
        d.qty = parseInt(data.qty);
      }
    });

    dispatch({ type: 'initialize', data: rows, count: rowCount });
    dispatch({ type: 'selection', selectedRecords: updatedRecords });
    setDisableSaveButton(selectedRecords?.some((d) => d.qty === 0));
  };

  return (
    <Dialog fullWidth maxWidth="md" fullScreen={true} open={true} onClose={handleClose} aria-labelledby="assign-roles-dialog">
      <CustomDialogHeader
        title={`Assign ${routes.employeeMaster.title}`}
        showManimizeMaximize={false}
        showRequiredLabel={false}
        onClose={handleClose}
      />
      <CustomDialogContent>
        {competencyOptions && columns ? (
          <>
            <div className="header-panel">
              <Grid container className={styles.filter_side_container}>
                <Grid item xs={12} md={6} className="d-flex align-items-center gap-1">
                  <Autocomplete
                    fullWidth
                    options={competencyOptions}
                    getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
                    onChange={(e, val) => {
                      setSelectedCompetency(val);
                    }}
                    multiple
                    value={selectedCompetency}
                    filterSelectedOptions={true}
                    renderInput={(params) => (
                      <TextField {...params} margin="dense" name="competencyType" label="Competency Type" variant="outlined" fullWidth />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6} className={styles.filter_side}>
                  <Box className={styles.filter_side_header} component="div">
                    <SearchBox onChange={handleSearch} className={styles.search_box_input} width="242px" size="small" value={search} />
                    <Button
                      disabled={isAssigning || disableSaveButton || selectedRecords?.length === 0}
                      onClick={handleSubmit}
                      color="primary"
                      size="small"
                      variant="contained"
                      endIcon={isAssigning && <CircularProgress color="inherit" size={18} />}
                    >
                      Add {selectedRecords?.length > 0 ? '(' + selectedRecords?.length + ')' : ''}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </div>

            <CustomReactTable
              height={'calc(100vh - 200px)'}
              columns={columns}
              state={state}
              dispatch={dispatch}
              renderedFrom={renderedFrom}
              onSaveEdit={onSaveEdit}
              refreshGrid={fetchData}
              showOnlyShowFilteredRecordSwitch={true}
              showFilters={true}
              resource={sidebarResource.employeeMaster}
            />
          </>
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomDialogContent>
    </Dialog>
  );
};

export default AssignEmployeeDialog;
