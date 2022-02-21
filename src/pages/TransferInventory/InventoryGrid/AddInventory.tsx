import { useState, useEffect, useContext, useReducer } from 'react';
import { Link } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import { Box, Dialog, Button, CircularProgress } from '@material-ui/core';
import SearchBox from 'src/components/Helpers/SearchBox';
import styles from 'src/pages/Leads/Header.module.scss';
import { reducer, intialState } from 'src/components/AgGridComponents/CustomAgGrid';
import CustomAgGridEditable from 'src/components/AgGridComponents/CustomAgGridEditable';
import { isObjectEmpty, gridLoadingTimeout } from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';
import { prepareDataForGrid } from 'src/constants/helpers';
import { isMobile } from 'react-device-detect';
import { CommonRenderer } from 'src/components/AgGridComponents/CustomAgGridCellRenderers';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';

interface Props {
  plantId: string;
  close: () => any;
  isAdding?: boolean;
  submit: (p: any[]) => any;
}

const AddInventory = (props: Props) => {
  const { plantId, close, isAdding, submit } = props;
  const toastConfig = useContext(CustomToastContext);
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows } = state;
  const {
    state: { permissions }
  }: any = useData();

  useEffect(() => {
    fetchProductInventory();
  }, [page, limit, filters, sorting, search]);

  let columns = [
    { field: 'productName', headerName: 'Product Description', show: true, cellRenderer: 'productNameRenderer' },
    {
      field: 'inventory',
      headerName: 'Inventory',
      show: true,
      disabled: false,
      cellRenderer: 'commonRenderer',
      cellEditor: 'numericCellEditor',
      editable: true
    },
    {
      field: 'minInventory',
      headerName: 'Min Inventory',
      show: true,
      disabled: false,
      cellRenderer: 'commonRenderer',
      cellEditor: 'numericCellEditor',
      editable: true
    }
  ];

  const fetchProductInventory = () => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    const queryString = getQueryString();
    axiosInstance()
      .get(`/product-inventory?wareHouse=${plantId}&${queryString}`)
      .then(({ data }) => {
        let rows = data.data?.map((u, user) => {
          let finalObject = prepareDataForGrid(u);
          finalObject['productId'] = u._id;

          return {
            ...finalObject
          };
        });
        dispatch({ type: 'initialize', data: rows, count: data.count });
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
    if (!isObjectEmpty(filters)) {
      const updatedFilters = [];
      Object.keys(filters).forEach((field) => {
        updatedFilters.push({
          field: replaceFieldName(field),
          term: filters[field].filter
        });
      });
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(updatedFilters))}`;
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
    const _data = selectedRecords.map((d) => ({
      product: d.productId,
      qty: isNaN(d?.inventory) ? 0 : Number(d?.inventory)
    }));
    submit(_data);
  };

  const ProductNameRenderer = (params) => (
    <Link className="link" title={params.value} to={`/product/detail/${params.data._id}`}>
      {params.value}
    </Link>
  );

  const frameworkComponents = {
    commonRenderer: CommonRenderer,
    productNameRenderer: ProductNameRenderer
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

  return (
    <Dialog open fullScreen fullWidth onClose={close}>
      <CustomDialogHeader title="Add Inventory" onClose={close} />
      <CustomDialogContent>
        <Box display={'flex'} mb={1} justifyContent="flex-end" alignItems="center">
          <SearchBox
            onSearch={handleSearch}
            searchbox={styles.search_box_input}
            width={isMobile ? '200px' : '242px'}
            style={isMobile ? { flex: 1 } : {}}
            size="small"
            value={search}
          />
          <Box mx={1} />

          <Button
            startIcon={isAdding && <CircularProgress size={18} color="inherit" />}
            disabled={selectedRecords.length === 0 || isAdding}
            onClick={handleClickSave}
            variant="contained"
            color="primary"
          >
            Save
          </Button>
        </Box>

        {columns.length > 0 && (
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
            onCellValueChanged={() => {}}
            actionWidth={150}
            loading={loading}
            renderedFrom={'transferInventory_addInventory'}
            refreshGrid={fetchProductInventory}
          />
        )}
      </CustomDialogContent>
    </Dialog>
  );
};

export default AddInventory;
