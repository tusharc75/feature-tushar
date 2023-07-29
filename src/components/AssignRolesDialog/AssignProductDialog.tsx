import { useState, useEffect, useContext, useReducer } from 'react';
import { Box, Button, ButtonGroup, CircularProgress, Dialog, Grid, IconButton } from '@material-ui/core';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import SearchBox from '../Helpers/SearchBox';
import {
  gridLoadingTimeout,
  isObjectEmpty,
  product,
  packages,
  prepareDataForGrid,
  getLocalStorageArrayData,
  serviceMaster,
  workOrder
} from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';
import routes from '../Helpers/Routes';
import styles from 'src/pages/Leads/Header.module.scss';
import { AddOutlined, RemoveOutlined } from '@material-ui/icons';
import CustomAgGridEditable, { reducer, intialState } from '../AgGridComponents/CustomAgGridEditable';
import useColumns, { getStaticFields, getFrameworkComponents } from '../../constants/useColumns';
import CommonSkeleton from '../Helpers/CommonSkeleton';

const options = [
  {
    key: `All ${routes.product.title}`,
    value: 1
  },
  {
    key: `Selected ${routes.product.title}`,
    value: 2
  }
];

let searchTimeout;
const AssignProductDialog = ({
  productsDialogOpen,
  productId,
  onSuccess,
  handleCloseDialog,
  assignedProducts,
  reference = 'product',
  serialized = null
}) => {
  const renderedFrom = `${routes.product.title}_${reference}_selected`;
  const localStorageSelectedRecords = `${renderedFrom}_selected`;
  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();

  const toastConfig = useContext(CustomToastContext);
  const [isAssigning, setAssigning] = useState(false);
  const [disableSaveButton, setDisableSaveButton] = useState(false);
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const [selectedType, setSelectedType] = useState(1);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const [frameWorkComponent, setFrameWorkComponent] = useState(null);
  const [columns, setColumns] = useState([]);

  const defaultColumns = [
    { field: 'qty', headerName: 'Qty', show: true, cellRenderer: 'commonRenderer', cellEditor: 'numericCellEditor', editable: true }
  ];

  const [filter, setFilter] = useState(`All ${routes.product.title}`);
  const [isProductType, setIsProductType] = useState(false);
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
      fetchProduct();
    }, millisec);
  }, [page, limit, filters, sorting, search, selectedEntity, selectedType, showFilteredRecordsOnly]);

  const fetchGridColumns = () => {
    axiosInstance()
      .get('/field?resource=Product&view=true')
      .then(({ data: { data } }) => {
        const productTypes = data.find((e) => e.fieldData.fieldName === 'productType');
        if (productTypes) {
          setIsProductType(true);
        } else {
          setIsProductType(false);
        }
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
        columns = [...columns, ...getStaticFields()];
        setColumns([...defaultColumns, ...columns]);
      });
  };

  const fetchProduct = () => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    const queryString = getQueryString();
    axiosInstance()
      .get(`${product.api}${queryString}`)
      .then(({ data }) => {
        let rows = data.data.map((u) => {
          let finalObject = prepareDataForGrid(u);
          finalObject['isChecked'] = false;
          finalObject['id'] = u._id;
          finalObject['qty'] = 1;
          finalObject['unitMain'] = u?.unit;
          finalObject['pricingMethodMain'] = u?.pricingMethod;
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
    const ignoreIds = assignedProducts && assignedProducts?.length > 0 ? assignedProducts : [];
    let deepFilter = `?page=${page}&limit=${limit}&filterProducts=${selectedType}&ignoreIds=${JSON.stringify(ignoreIds)}`;

    if (selectedEntity) {
      deepFilter = `${deepFilter}&entity=${selectedEntity}`;
    }

    if (showFilteredRecordsOnly) {
      const savedRecords = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : [];
      deepFilter = `${deepFilter}&getById=${JSON.stringify(savedRecords.map((m) => m._id))}`;
    }
    const updatedFilters = [];
    if (isProductType) {
      updatedFilters.push({
        field: 'productType',
        term: 'Part'
      });
    }
    if (reference === 'purchaseOrder') {
      if (!user?.user?.brandPolicy?.showSerializedProduct) {
        updatedFilters.push({ field: 'serializedProduct', term: 'No' });
      }
    } else {
      if (serialized != null) {
        updatedFilters.push({
          field: 'serializedProduct',
          term: `${serialized === true ? 'Yes' : 'No'}`
        });
      }
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
    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }
    if (search) {
      deepFilter = `${deepFilter}&search=${search}`;
    }
    return deepFilter;
  };

  const handleAssignProduct = async () => {
    setAssigning(true);
    if (reference === 'product') {
      const dataObj = [...getLocalStorageArrayData(localStorageSelectedRecords)]
        .filter((d) => d.qty > 0)
        .map((d) => {
          return {
            childProduct: d.id,
            qty: Number(d.qty)
          };
        });
      await axiosInstance()
        .post(`/product/${productId}/bom`, dataObj)
        .then(({ data }) => {
          setAssigning(false);
          onSuccess();
        })
        .catch((error) => {
          setAssigning(false);
          toastConfig.setToastConfig(error);
        });
    } else if (reference === 'serviceMaster') {
      const productObj = [...getLocalStorageArrayData(localStorageSelectedRecords)]
        .filter((d) => d.qty > 0)
        .map((d) => {
          return {
            product: d.id,
            qty: Number(d.qty)
          };
        });
      await axiosInstance()
        .post(`${serviceMaster.api}/product/${productId}`, productObj)
        .then(({ data }) => {
          setAssigning(false);
          onSuccess();
        })
        .catch((error) => {
          setAssigning(false);
          toastConfig.setToastConfig(error);
        });
    } else if (reference === 'package') {
      axiosInstance()
        .post(`${packages.api}/material`, {
          ids: Array.isArray(productId) && productId.length ? productId : [productId],
          products: [...getLocalStorageArrayData(localStorageSelectedRecords)].map((d: any) => ({ product: d.id, qty: Number(d.qty) }))
        })
        .then(() => {
          setAssigning(false);
          onSuccess();
        })
        .catch((err) => {
          setAssigning(false);
          toastConfig.setToastConfig(err);
        });
    } else {
      onSuccess([...getLocalStorageArrayData(localStorageSelectedRecords)]);
      setAssigning(false);
    }
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const handleFilter = (event, newFilter) => {
    if (newFilter !== null) {
      setFilter(newFilter);
      setSelectedType(options.find((d) => d.key === newFilter).value);
    }
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
    <Dialog fullWidth maxWidth="md" fullScreen={true} open={productsDialogOpen} onClose={handleCloseDialog} aria-labelledby="assign-roles-dialog">
      <CustomDialogHeader
        title={`Add ${routes.product.title}`}
        showManimizeMaximize={false}
        showRequiredLabel={false}
        onClose={handleCloseDialog}
      />
      <CustomDialogContent>
        <>
          <div className="header-panel">
            <Grid container className={styles.filter_side_container}>
              <Grid item xs={6} className="d-flex align-items-center gap-1">
                {/* {
                                    options && <ToggleButtonGroup size="small" className="ml-2"
                                        value={filter}
                                        exclusive
                                        onChange={handleFilter}>
                                        {options.map((k, index) => {
                                            return (
                                                <ToggleButton value={k.key} key={index}>{k.key}
                                                </ToggleButton>
                                            );
                                        })}
                                    </ToggleButtonGroup>
                                } */}
              </Grid>
              <Grid item xs={6} className={styles.filter_side}>
                <Box className={styles.filter_side_header} component="div">
                  <SearchBox onChange={handleSearch} className={styles.search_box_input} width="242px" size="small" value={search} />
                  <Button
                    disabled={isAssigning || disableSaveButton || [...getLocalStorageArrayData(localStorageSelectedRecords)].length === 0}
                    onClick={handleAssignProduct}
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
              refreshGrid={fetchProduct}
              renderedFrom={renderedFrom}
            />
          ) : (
            <Box p={2} height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </>
      </CustomDialogContent>
    </Dialog>
  );
};

export default AssignProductDialog;
