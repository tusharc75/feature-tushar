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
import CustomAgGridEditable, { reducer, intialState } from '../AgGridComponents/CustomAgGridEditable';
import useColumns, { getStaticFields, getFrameworkComponents } from '../../constants/useColumns';
import CommonSkeleton from '../Helpers/CommonSkeleton';
import { Autocomplete } from '@material-ui/lab';

let searchTimeout;

const AssignEmployeeDialog = ({ reference, referenceId = null, onSuccess, handleClose, ids, defaultCompetency = [], extraStaticFilter = [] }) => {

  const renderedFrom = `${routes.employeeMaster.title}_${reference}_selected`;
  const localStorageSelectedRecords = `${renderedFrom}_selected`;

  console.log(defaultCompetency)

  const {
    state: { permissions, selectedEntity }
  }: any = useData();

  const toastConfig = useContext(CustomToastContext);
  const [isAssigning, setAssigning] = useState(false);
  const [disableSaveButton, setDisableSaveButton] = useState(false);

  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const [frameWorkComponent, setFrameWorkComponent] = useState(null);
  const [columns, setColumns] = useState([]);
  const { getColumnData } = useColumns();
  const [competencyOptions, setCompetencyOptions] = useState(null);
  const [selectedCompetency, setSelectedCompetency] = useState(defaultCompetency)

  useEffect(() => {
    localStorage.removeItem(localStorageSelectedRecords);
    fetchGridColumns();
    fetchCompetencyMaster();
  }, []);

  useEffect(() => {
    setDisableSaveButton([...getLocalStorageArrayData(localStorageSelectedRecords)].some((d) => d.qty === 0));
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
    axiosInstance().get(`/sa-formbuilder/lookup?lookupResource=Competency Master`).then(({ data: { data } }) => {
      setCompetencyOptions(data["Competency Master"] || []);
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
            if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
              rendererNames.push(currentColumn?.rendererName);
            }
          }
        });
        let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
        tempFrameworkComponent = {
          ...tempFrameworkComponent
        };
        setFrameWorkComponent({ ...tempFrameworkComponent });
        columns = [...columns, ...getStaticFields()];
        setColumns(columns);
      });
  };

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
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
        const savedRecords = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : [];
        dispatch({
          type: 'selection',
          selectedRecords: savedRecords
        });
        dispatch({ type: 'initialize', data: rows, count: data.count });
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
      const savedRecords = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : [];
      deepFilter = `${deepFilter}&getById=${JSON.stringify(savedRecords.map((m) => m._id))}`;
    }

    const updatedFilters = [];
    if (selectedCompetency?.length > 0) {
      updatedFilters.push(...selectedCompetency.map((i) => ({ field: 'competency', term: i.optionLabel })));
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
      deepFilter = `${deepFilter}&search=${search}`;
    }
    return deepFilter;
  };

  const handleSubmit = async () => {
    onSuccess([...getLocalStorageArrayData(localStorageSelectedRecords)]);
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const onCellValueChanged = (row) => {
    if (!row || !row?.data) return;
    const { data } = row;
    const selectedFromStorage = [...getLocalStorageArrayData(localStorageSelectedRecords)];
    if (!selectedFromStorage || selectedFromStorage.length === 0) return;
    const updatedRecords = selectedFromStorage.map((d) => {
      if (data._id === d._id) {
        d.qty = data.qty;
      }
      return d;
    });
    localStorage.setItem(localStorageSelectedRecords, JSON.stringify(updatedRecords));
    setDisableSaveButton([...getLocalStorageArrayData(localStorageSelectedRecords)]?.some((d) => d.qty === 0));
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
        {competencyOptions && frameWorkComponent && Object.keys(frameWorkComponent).length > 0 ? (
          <>
            <div className="header-panel">
              <Grid container className={styles.filter_side_container}>
                <Grid item xs={6} className="d-flex align-items-center gap-1">
                  <Autocomplete
                    fullWidth
                    options={competencyOptions}
                    getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
                    onChange={(e, val) => {
                      setSelectedCompetency(val)
                    }}
                    multiple
                    value={selectedCompetency}
                    filterSelectedOptions={true}
                    renderInput={(params) => <TextField {...params} margin="dense" name="competency" label="Competency" variant="outlined" fullWidth />}
                  />
                </Grid>
                <Grid item xs={6} className={styles.filter_side}>
                  <Box className={styles.filter_side_header} component="div">
                    <SearchBox onSearch={handleSearch} searchbox={styles.search_box_input} width="242px" size="small" value={search} />
                    <Button
                      disabled={isAssigning || disableSaveButton || [...getLocalStorageArrayData(localStorageSelectedRecords)].length === 0}
                      onClick={handleSubmit}
                      color="primary"
                      size="small"
                      variant="contained"
                      endIcon={isAssigning && <CircularProgress color="inherit" size={18} />}
                    >
                      Add{' '}
                      {[...getLocalStorageArrayData(localStorageSelectedRecords)].length > 0
                        ? '(' + [...getLocalStorageArrayData(localStorageSelectedRecords)].length + ')'
                        : ''}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </div>
            <CustomAgGridEditable
              columns={columns}
              dataRows={dataRows}
              frameworkComponents={frameWorkComponent}
              setGridApi={setGridApi}
              dispatch={dispatch}
              rowCount={rowCount}
              limit={limit}
              pageSizes={pageSizes}
              page={page}
              allowAction={false}
              loading={loading}
              allowSelection={true}
              onCellValueChanged={onCellValueChanged}
              showOnlyShowFilteredRecordSwitch={true}
              refreshGrid={fetchData}
              renderedFrom={renderedFrom}
            />
          </>
        ) : (
          <Box p={2} height={500} bgcolor="white">
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomDialogContent>
    </Dialog>
  );
};

export default AssignEmployeeDialog;
