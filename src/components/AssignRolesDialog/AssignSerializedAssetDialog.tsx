import { useState, useEffect, useContext, useReducer, Fragment } from 'react';
import { Box, Button, ButtonGroup, CircularProgress, Dialog, Grid, IconButton } from '@material-ui/core';
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
  serviceMaster,
  workOrder,
  serializedAsset,
  INVENTORY_STATUS,
  COLOUR_MASTER
} from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';
import routes from '../Helpers/Routes';
import styles from 'src/pages/Leads/Header.module.scss';
import CustomAgGridEditable, { reducer, intialState } from '../AgGridComponents/CustomAgGridEditable';
import useColumns, { getStaticFields, getFrameworkComponents } from '../../constants/useColumns';
import CommonSkeleton from '../Helpers/CommonSkeleton';
import { Link } from 'react-router-dom';
import HtmlTooltip from '../CustomTooltipTitle';
import WarningIcon from '@material-ui/icons/Warning';

let searchTimeout;

const AssignSerializedAssetDialog = ({ reference, referenceId = null, onSuccess, handleClose, ids, extraStaticFilter = [], onSubmit }) => {
  const renderedFrom = `${routes.serializedAsset.title}_${reference}_selected`;
  const localStorageSelectedRecords = `${renderedFrom}_selected`;

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

  //   const defaultColumns = [
  //     { field: 'qty', headerName: 'Qty', show: true, cellRenderer: 'commonRenderer', cellEditor: 'numericCellEditor', editable: true }
  //   ];
  const { getColumnData } = useColumns();

  useEffect(() => {
    localStorage.removeItem(localStorageSelectedRecords);
    fetchGridColumns();
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
  }, [page, limit, filters, sorting, search, selectedEntity, showFilteredRecordsOnly]);

  const AssetNumberRenderer = (params) => (
    <Fragment>
      <Link className="link text-truncate" title={params.value} to={`${routes.serializedAssetDetail.path}/${params.data?._id}`}>
        {params.value}
      </Link>
      {params.data?.recertDate && new Date(params.data?.recertDate)?.getTime() <= new Date()?.getTime() && (
        <Box ml={1} pt={1}>
          <HtmlTooltip title="Asset needs to be recert">
            <WarningIcon style={{ fontSize: '14px' }} fontSize="small" color="error" />
          </HtmlTooltip>
        </Box>
      )}
    </Fragment>
  );

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field?resource=${serializedAsset.resource}&view=true`)
      .then(({ data: { data } }) => {
        // data?.some((o) => {
        //   if (o?.fieldData?.fieldName === 'status') {
        //     setAllowUpdateStatus(o?.isUpdate);
        //     return true;
        //   }
        // });
        let columns = [];
        let rendererNames = [];
        data.forEach((o) => {
          let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.serializedAssetDetail.path);
          if (currentColumn !== null) {
            columns = [...columns, currentColumn?.columnData];
            if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
              rendererNames.push(currentColumn?.rendererName);
            }
          }
        });
        columns?.forEach((e) => {
          if (e.field === 'assetNumber') {
            e.cellRenderer = 'assetNumberRenderer';
            e.cellStyle = (params) => {
              if (
                [INVENTORY_STATUS.lost, INVENTORY_STATUS.scrap, INVENTORY_STATUS.needRepair, INVENTORY_STATUS.needRecert].includes(
                  params?.data?.status
                )
              ) {
                return { backgroundColor: COLOUR_MASTER.lostAssets.background };
              }
              // if (params.data?.recertDate) {
              //   var a = moment(params.data?.recertDate);
              //   var b = moment();
              //   const days = a.diff(b, 'days')
              //   if (days <= 60 && days >= 30) {
              //     return { backgroundColor: "#ACF1C8" };
              //   }
              //   else if (days < 30 && days >= 15) {
              //     return { backgroundColor: "#FAE498" };
              //   }
              //   else if (days < 15 && days >= 0) {
              //     return { backgroundColor: "#FEB1B1" };
              //   }
              //   else if (days < 0) {
              //     return { backgroundColor: "#FEB1B1" };
              //   }
              // }
              return null;
            };
          }
        });
        let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
        tempFrameworkComponent = {
          ...tempFrameworkComponent,
          assetNumberRenderer: AssetNumberRenderer
        };
        setFrameWorkComponent({ ...tempFrameworkComponent });
        columns = [...columns, ...getStaticFields()];
        setColumns([...columns]);
      });
  };

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    const queryString = getQueryString();
    console.log(queryString);
    axiosInstance()
      .get(`${serializedAsset.api}${queryString}`)
      .then(({ data }) => {
        let rows = data.data.map((u) => {
          let finalObject = prepareDataForGrid(u);
          finalObject['isChecked'] = false;
          finalObject['id'] = u._id;
          finalObject['qty'] = 1;
          const qtyAdded = [...getLocalStorageArrayData(localStorageSelectedRecords)]?.filter((e) => e._id === u._id);
          if (qtyAdded.length) {
            finalObject['qty'] = qtyAdded[0].qty;
          }
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
    console.log(ids);
    const ignoreIds = ids && ids?.length > 0 ? ids : [];
    let deepFilter = `?page=${page}&limit=${limit}&ignoreIds=${JSON.stringify(ignoreIds)}`;
    if (selectedEntity) {
      deepFilter = `${deepFilter}&entity=${selectedEntity}&isNonSerializedAsset=0`;
    }
    if (showFilteredRecordsOnly) {
      const savedRecords = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : [];
      deepFilter = `${deepFilter}&getById=${JSON.stringify(savedRecords.map((m) => m._id))}`;
    }
    const updatedFilters = [];
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
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(updatedFilters))}&filterType=and`;
    } else {
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(updatedFilters))}&filterType=and`;
    }
    // if (isNonSerializedAsset) {
    //   deepFilter = `${deepFilter}&isNonSerializedAsset=1`;
    // } else {
    //   deepFilter = `${deepFilter}&isNonSerializedAsset=0`;
    // }
    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }
    if (search) {
      deepFilter = `${deepFilter}&search=${search}`;
    }
    return deepFilter;
  };

  //   const handleSubmit = async () => {
  //     setAssigning(true);
  //     if (reference === 'package') {
  //       axiosInstance()
  //         .post(`${packages.api}/material`, {
  //           ids: Array.isArray(referenceId) && referenceId.length ? referenceId : [referenceId],
  //           services: [...getLocalStorageArrayData(localStorageSelectedRecords)].map((d: any) => ({ service: d.id, qty: Number(d.qty) }))
  //         })
  //         .then(() => {
  //           onSuccess();
  //           setAssigning(false);
  //         })
  //         .catch((err) => {
  //           setAssigning(false);
  //           toastConfig.setToastConfig(err);
  //         });
  //     } else {
  //       onSuccess([...getLocalStorageArrayData(localStorageSelectedRecords)].map((d: any) => ({ service: d.id, qty: Number(d.qty) })));
  //     }
  //   };

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
        title={`Assign ${routes.serializedAsset.title}`}
        showManimizeMaximize={false}
        showRequiredLabel={false}
        onClose={handleClose}
      />
      <CustomDialogContent>
        <div className="header-panel">
          <Grid container className={styles.filter_side_container}>
            <Grid item xs={6} className="d-flex align-items-center gap-1"></Grid>
            <Grid item xs={6} className={styles.filter_side}>
              <Box className={styles.filter_side_header} component="div">
                <SearchBox onSearch={handleSearch} searchbox={styles.search_box_input} width="242px" size="small" value={search} />
                <Button
                  disabled={isAssigning || disableSaveButton || [...getLocalStorageArrayData(localStorageSelectedRecords)].length === 0}
                  onClick={() => {
                    onSubmit([...getLocalStorageArrayData(localStorageSelectedRecords)].map((d: any) => d._id));
                  }}
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
        {frameWorkComponent && Object.keys(frameWorkComponent).length > 0 ? (
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
        ) : (
          <Box p={2} height={500} bgcolor="white">
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomDialogContent>
    </Dialog>
  );
};

export default AssignSerializedAssetDialog;
