import { useState, useEffect, useContext, useReducer } from 'react';
import { Link } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import { Box, Dialog, Button, CircularProgress, Typography } from '@material-ui/core';
import SearchBox from 'src/components/Helpers/SearchBox';
import styles from 'src/pages/Leads/Header.module.scss';
import { reducer, intialState } from 'src/components/AgGridComponents/CustomAgGrid';
import CustomAgGridEditable from 'src/components/AgGridComponents/CustomAgGridEditable';
import { isObjectEmpty, gridLoadingTimeout, getLocalStorageArrayData, removeLocalStorage, productInventory } from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';
import { prepareDataForGrid } from 'src/constants/helpers';
import { isMobile } from 'react-device-detect';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import useColumns, { getFrameworkComponents, getStaticFields } from 'src/constants/useColumns';

const AddInventory = ({ warehouse, storageLocation, close, isAdding, submit, renderedFrom, ignoreIds }) => {
  const localStorageSelectedRecords = `${renderedFrom}_selected`;
  const toastConfig = useContext(CustomToastContext);
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, showFilteredRecordsOnly } = state;
  const [columns, setColumns] = useState(null);
  const [frameWorkComponent, setFrameWorkComponent] = useState(null);
  const { getColumnData } = useColumns();

  const {
    state: { user }
  }: any = useData();

  useEffect(() => {
    removeLocalStorage(localStorageSelectedRecords);
    fetchFields();
  }, []);

  useEffect(() => {
    fetchProductInventory();
  }, [page, limit, filters, sorting, search, showFilteredRecordsOnly]);

  const fetchFields = async () => {
    const productResult = await axiosInstance().get('/field?resource=Product&view=true');
    const data = productResult?.data?.data;
    let columns = [];
    let rendererNames = [];
    data.forEach((o) => {
      let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.productDetail.path);
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
    columns.unshift(
      {
        field: 'qty',
        headerName: 'Quantity',
        show: true,
        disabled: false,
        cellRenderer: 'commonRenderer',
        cellEditor: 'numericCellEditor',
        editable: true,
        filter: false
      },
      {
        field: 'inventory',
        headerName: 'Inventory',
        show: true,
        disabled: false,
        cellRenderer: 'commonRenderer',
        cellEditor: 'numericCellEditor',
        editable: false,
        filter: false
      }
    );
    setColumns([...columns, ...getStaticFields()]);
  };

  const fetchProductInventory = () => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    const queryString = getQueryString();
    axiosInstance()
      .get(`${productInventory.api}?wareHouse=${warehouse}&${queryString}`)
      .then(({ data: { data, count } }) => {
        const selectedProducts = getLocalStorageArrayData(localStorageSelectedRecords);
        let rows = data?.map((u: any) => {
          const selectedData = selectedProducts.find((d: any) => d._id === u._id);
          let finalObject = prepareDataForGrid(u);
          finalObject['productId'] = u._id;
          finalObject['inventory'] = u?.inventory ? u?.inventory - (u?.softHold || 0) : 0;
          finalObject['qty'] = selectedData ? selectedData.qty : finalObject['inventory'] ? 1 : 0;
          finalObject['hideSelection'] = finalObject['inventory'] ? false : true;
          return {
            ...finalObject
          };
        });
        if (selectedProducts.length > 0 && showFilteredRecordsOnly) {
          rows = selectedProducts;
        }
        dispatch({ type: 'initialize', data: rows, count: count });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const getQueryString = () => {
    let deepFilter = `page=${page}&limit=${limit}`;

    if (storageLocation) {
      deepFilter = deepFilter + `&storageLocation=${storageLocation}`;
    }

    if (ignoreIds?.length) {
      deepFilter = deepFilter + `&ignoreIds=${JSON.stringify(ignoreIds)}`;
    }

    const updatedFilters = [];
    if (!user?.user?.brandPolicy?.showSerializedProduct) {
      updatedFilters.push({ field: 'serializedProduct', term: 'No' });
    }

    if (!isObjectEmpty(filters)) {
      Object.keys(filters).forEach((field) => {
        updatedFilters.push({
          field: field,
          term: filters[field].filter
        });
      });
    }

    if (updatedFilters?.length) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(updatedFilters))}`;
    }

    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${JSON.stringify(getLocalStorageArrayData(localStorageSelectedRecords)?.map((m) => m._id))}`;
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }

    if (search) {
      deepFilter = `${deepFilter}&search=${search}`;
    }

    return `${deepFilter}&filterType=and`;
  };

  const handleClickSave = () => {
    const _data = getLocalStorageArrayData(localStorageSelectedRecords)?.map((d) => ({
      product: d.productId,
      qty: Number(d.qty)
    }));
    submit(_data);
  };

  const onCellValueChanged = ({ data }) => {
    if (Number(data.qty) > Number(data.inventory)) {
      toastConfig.setToastConfig({
        type: 'warning',
        message: "Qty can't be greater then inventory",
        open: true
      });
    }
    const newRecords = getLocalStorageArrayData(localStorageSelectedRecords)?.map((d: any) => {
      if (data?._id === d?._id) {
        return data;
      }
      return d;
    });
    localStorage.setItem(localStorageSelectedRecords, JSON.stringify(newRecords));
    dispatch({ type: 'selection', selectedRecords: newRecords });
  };

  let disableSave =
    getLocalStorageArrayData(localStorageSelectedRecords)?.length === 0 ||
    getLocalStorageArrayData(localStorageSelectedRecords)?.filter((d: any) => Number(d.qty) === 0).length > 0 ||
    getLocalStorageArrayData(localStorageSelectedRecords)?.filter((d: any) => Number(d.qty) > Number(d.inventory)).length > 0 ||
    isAdding;

  return (
    <Dialog open fullScreen fullWidth onClose={close}>
      <CustomDialogHeader title="Add Product" onClose={close} showRequiredLabel={false} />
      <CustomDialogContent>
        <Box
          display={'flex'}
          mb={1}
          flexDirection={isMobile ? 'column' : 'row'}
          justifyContent="space-between"
          alignItems={isMobile ? 'flex-start' : 'center'}
        >
          <div style={{ order: isMobile ? 2 : 1 }}>
            {getLocalStorageArrayData(localStorageSelectedRecords)?.filter((d: any) => d.qty === 0).length > 0 && (
              <Typography variant="body2" color="error">
                Enter quantity before you save
              </Typography>
            )}
            {getLocalStorageArrayData(localStorageSelectedRecords)?.filter((d: any) => Number(d.qty) > Number(d.inventory)).length > 0 && (
              <Typography variant="body2" color="error">
                Quantity should be less then inventory
              </Typography>
            )}
          </div>
          <Box order={isMobile ? 1 : 2} display="flex" justifyContent={'space-between'} minWidth={isMobile ? '100%' : '300px'}>
            <SearchBox
              onChange={handleSearch}
              className={styles.search_box_input}
              width={'245px'}
              style={isMobile ? { flex: 1 } : {}}
              size="small"
              value={search}
            />
            <Box mx={1} />
            <Box>
              <Button
                startIcon={isAdding && <CircularProgress size={18} color="inherit" />}
                disabled={disableSave}
                onClick={handleClickSave}
                variant="contained"
                color="primary"
                size="small"
              >
                Add{' '}
                {[...getLocalStorageArrayData(localStorageSelectedRecords)].length > 0
                  ? '(' + [...getLocalStorageArrayData(localStorageSelectedRecords)].length + ')'
                  : ''}
              </Button>
            </Box>
          </Box>
        </Box>
        {columns ? (
          <CustomAgGridEditable
            allowSelection={true}
            allowAction={false}
            columns={columns}
            dataRows={dataRows}
            frameworkComponents={frameWorkComponent}
            setGridApi={setGridApi}
            dispatch={dispatch}
            rowCount={rowCount}
            limit={limit}
            pageSizes={pageSizes}
            page={page}
            onCellValueChanged={onCellValueChanged}
            showOnlyShowFilteredRecordSwitch={true}
            actionWidth={150}
            loading={loading}
            renderedFrom={renderedFrom}
            refreshGrid={fetchProductInventory}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomDialogContent>
    </Dialog>
  );
};

export default AddInventory;
