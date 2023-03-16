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
import { CommonRenderer } from 'src/components/AgGridComponents/CustomAgGridCellRenderers';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CheckboxRenderer } from '../../../components/AgGridComponents/CustomAgGridCellRenderers';
import routes from 'src/components/Helpers/Routes';

interface Props {
  plantId: string;
  close: () => any;
  isAdding?: boolean;
  submit: (p: any[]) => any;
  renderedFrom: string;
  existingProducts: any[];
}

const AddInventory = ({ plantId, close, isAdding, submit, renderedFrom, ignoreIds }) => {

  const localStorageSelectedRecords = `${renderedFrom}_selected`;
  const toastConfig = useContext(CustomToastContext);
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, showFilteredRecordsOnly } = state;
  const [columns, setColumns] = useState(null)

  const { state: { user } }: any = useData();

  useEffect(() => {
    removeLocalStorage(localStorageSelectedRecords)
    fetchFields();
  }, []);

  useEffect(() => {
    fetchProductInventory();
  }, [page, limit, filters, sorting, search, showFilteredRecordsOnly]);

  const fetchFields = async () => {
    const column = [];
    const productResult = await axiosInstance().get('/field?resource=Product&view=true')
    const productFields = productResult?.data?.data?.filter((e) => ["productName", "productNumber", "serializedProduct"].includes(e?.fieldData?.fieldName));
    productFields?.forEach((e) => {
      if (e?.fieldData?.fieldName === "productName") {
        column.push({ field: "productName", primaryField: true, headerName: e?.fieldData?.fieldLabel, show: true, disabled: true, cellRenderer: "nameRenderer" })
      }
      if (e?.fieldData?.fieldName === "productNumber") {
        column.push({ field: "productNumber", headerName: e?.fieldData?.fieldLabel, show: true, cellRenderer: "commonRenderer" })
      }
      if (e?.fieldData?.fieldName === "serializedProduct") {
        column.push({ field: "serializedProduct", headerName: e?.fieldData?.fieldLabel, show: true, cellRenderer: "checkboxRenderer" })
      }
    })
    column.push({
      field: 'qty',
      headerName: 'Quantity',
      show: true,
      disabled: false,
      cellRenderer: 'commonRenderer',
      cellEditor: 'numericCellEditor',
      editable: true,
      filter: false
    });
    column.push({
      field: 'inventory',
      headerName: 'Inventory',
      show: true,
      disabled: false,
      cellRenderer: 'commonRenderer',
      cellEditor: 'numericCellEditor',
      editable: false,
      filter: false
    });
    setColumns([...column])
  }

  const fetchProductInventory = () => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    const queryString = getQueryString();
    axiosInstance()
      .get(`${productInventory.api}?wareHouse=${plantId}&${queryString}`)
      .then(({ data: { data, count } }) => {
        const selectedProducts = getLocalStorageArrayData(localStorageSelectedRecords);
        let rows = data?.map((u: any) => {
          const selectedData = selectedProducts.find((d: any) => d._id === u._id);
          let finalObject = prepareDataForGrid(u);
          finalObject['productId'] = u._id;
          finalObject['inventory'] = u?.inventory ? (u?.inventory - (u?.softHold || 0)) : 0;
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

    if (ignoreIds?.length) {
      deepFilter = deepFilter + `&ignoreIds=${JSON.stringify(ignoreIds)}`
    }

    const updatedFilters = [];
    if (!user?.user?.brandPolicy?.showSerializedProduct) {
      updatedFilters.push({ field: 'serializedProduct', term: 'No' });
    }
    
    if (!isObjectEmpty(filters)) {
      Object.keys(filters).forEach((field) => {
        updatedFilters.push({
          field: replaceFieldName(field),
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

  const NameRenderer = (params) => (
    <Link className="link" title={params.value} to={`${routes.productDetail.path}/${params.data.productId}`}>
      {params.value}
    </Link>
  );

  const frameworkComponents = {
    checkboxRenderer: CheckboxRenderer,
    nameRenderer: NameRenderer,
    commonRenderer: CommonRenderer
  };

  const replaceFieldName = (field) => {
    switch (field) {
      case 'productName':
        return 'productName';
      case 'plant':
        return 'plant';
      case 'createdBy':
        return 'createdBy.user.concatedName';
      case 'updatedBy':
        return 'updatedBy.user.concatedName';
      default:
        return field;
    }
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
              onSearch={handleSearch}
              searchbox={styles.search_box_input}
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
                Add
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
            frameworkComponents={frameworkComponents}
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
        )
          : <Box p={2} height={500} bgcolor="white">
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        }
      </CustomDialogContent>
    </Dialog>
  );
};

export default AddInventory;
