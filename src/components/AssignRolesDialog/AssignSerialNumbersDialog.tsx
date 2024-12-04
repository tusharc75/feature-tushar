import { Box, Button, Dialog, TextField } from '@material-ui/core';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import { ListingPageHeader } from '../PageHeaders';
import CommonSkeleton from '../Helpers/CommonSkeleton';
import CustomReactTable, { gridFilterParser, useColumns, useTableReducer } from '../CustomReactTable';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import NoDataCell from '../Helpers/NoDataCell';
import routes from '../Helpers/Routes';
import moment from 'moment';
import {
  CustomDialogTransition,
  dateFormat,
  gridLoadingTimeout,
  prepareDataForGrid,
  productInventory,
  transferInventory
} from 'src/constants/helpers';
import axiosInstance from 'src/axios/axiosInstance';
import { Autocomplete } from '@material-ui/lab';
import ManageTransferInventory from 'src/pages/TransferInventory/ManageTransferInventory';
import AddSerialNumber from 'src/pages/ProductInventory/SerialNumber/AddSerialNumber';
import HtmlTooltip from 'src/components/CustomTooltipTitle';

const AssignSerialNumbersDialog = ({
  selectedProducts = [],
  handleClose,
  handleSucess,
  referenceType,
  isAssigning,
  filterByPlant = null,
  ids,
  showWarehouseFilter = false,
  referenceData = null
}) => {
  const renderedFrom = `serialNumbers_Assign`;
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;

  const {
    state: { selectedEntity }
  }: any = useData();

  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [warehouseOption, setWarehouseOption] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(filterByPlant?.optionValue);
  const [showTransferInventoryDialog, setShowTransferInventoryDialog] = useState(false);
  const [serialNumberCount, setSerialNumberCount] = useState(0);
  const [addserialNumber, setAddserialNumber] = useState(false);

  const columns = [
    {
      accessor: 'serialNumber',
      Header: 'Serial Number',
      Cell: ({ row }) => (
        <>
          {row?.original?.serialNumber ? (
            <h5 className="text-truncate" title={row?.original?.serialNumber}>
              {row?.original?.serialNumber}
            </h5>
          ) : (
            <NoDataCell />
          )}
        </>
      )
    },
    {
      accessor: 'warehouse',
      Header: routes.warehouse.title,
      Cell: ({ row }) => (
        <>
          {row?.original?.warehouse ? (
            <h5 className="text-truncate" title={row?.original?.warehouse}>
              {row?.original?.warehouse}
            </h5>
          ) : (
            <NoDataCell />
          )}
        </>
      )
    },
    {
      accessor: 'status',
      Header: 'Status',
      Cell: ({ row }) => (
        <h5 className="text-truncate" title={row?.original?.status}>
          {row?.original?.status}
        </h5>
      )
    },
    {
      accessor: 'createdBy',
      Header: 'Created By',
      disableFilters: true,
      Cell: ({ row }) => (
        <>
          {row?.original?.createdBy ? (
            <h5 className="createBy" title={`${row?.original?.createdBy} • ${moment(row?.original?.createdByDate).format(dateFormat)}`}>
              {row?.original?.createdBy}
              <span className="createdAtTime badge-date">{moment(row?.original?.createdByDate)?.format(dateFormat)}</span>
            </h5>
          ) : (
            <NoDataCell />
          )}
        </>
      )
    }
  ];

  useEffect(() => {
    if (selectedProduct && selectedWarehouse) {
      fetchProductInventory();
    } else {
      setSerialNumberCount(0);
    }
  }, [selectedWarehouse, selectedProduct]);

  const fetchProductInventory = () => {
    let api = `${productInventory.api}/product/${selectedProduct}?warehouse=${selectedWarehouse}`;
    axiosInstance()
      .get(api)
      .then(({ data: { data } }) => {
        const count = data?.inventory - (data?.softHold || 0) - data?.serialNumber;
        if (count > 0) {
          setSerialNumberCount(count);
        } else {
          setSerialNumberCount(0);
        }
      })
      .catch((err) => { });
  };

  useEffect(() => {
    fetchData();
  }, [page, limit, filters, sorting, search, selectedEntity, showFilteredRecordsOnly, selectedProduct, selectedWarehouse]);

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    let queryString = getQueryString();
    axiosInstance()
      .get(`/product-inventory/serial-number${queryString}`)
      .then(({ data }) => {
        let rows = data.data.map((u) => {
          let finalObject = prepareDataForGrid(u);
          finalObject['isChecked'] = false;
          return {
            ...finalObject
          };
        });
        dispatch({
          type: 'selection',
          selectedRecords: selectedRecords || []
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
    if (!selectedProduct) {
      deepFilter = `${deepFilter}&products=${selectedProducts?.map((p) => p?.id).join(',')}`;
    } else {
      deepFilter = `${deepFilter}&products=${selectedProduct}`;
    }

    if (selectedWarehouse) {
      deepFilter = `${deepFilter}&warehouse=${selectedWarehouse}`;
    }

    const { filterByIds, deepFilters } = gridFilterParser(filters);
    deepFilters.push({
      field: 'status',
      term: 'available'
    });
    if (filterByIds?.length) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterByIds)}`;
    }
    if (deepFilters?.length) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(deepFilters))}`;
    }
    if (filterByIds?.length || deepFilters?.length) {
      deepFilter = `${deepFilter}&filterType=and`;
    }
    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }
    if (search) {
      deepFilter = `${deepFilter}&search=${search}`;
    }
    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || []).map((m) => m._id))}`;
    }
    return deepFilter;
  };

  useEffect(() => {
    axiosInstance()
      .get('/sa-formbuilder/lookup?lookupResource=Warehouse')
      .then(({ data: { data } }) => {
        setWarehouseOption(data['Warehouse']);
      });
  }, []);

  const handleAdd = () => {
    if (selectedProducts?.length) {
      const data = [];
      selectedProducts?.forEach((ele) => {
        let qty = ele.qty;
        while (qty) {
          const result = selectedRecords?.filter((f) => f.product === ele.id && !f.isCounted);
          if (result.length) {
            data.push({ ...ele, serialNumber: result[0]._id });
            result[0].isCounted = true;
          }
          qty--;
        }
      });
      handleSucess(data);
    } else {
      handleSucess(selectedRecords);
    }
  };

  useEffect(() => {
    let tempProducts = [];
    selectedProducts?.map((d) => {
      const alreadyAdded = tempProducts.find((obj) => obj.id === d.id);
      if (alreadyAdded) {
        alreadyAdded.qty = d?.qty + alreadyAdded.qty;
      } else {
        tempProducts.push({ id: d.id, name: d.productName, qty: d?.qty });
      }
    });
    tempProducts?.forEach((e) => {
      e.qty = e?.qty - selectedRecords?.filter((obj) => obj.product === e.id).length;
    });
    setProducts(tempProducts);
  }, [selectedRecords]);

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const leftSideContents = () => {
    return (
      <Box display={'flex'} width={'100%'} justifyContent={'space-between'}>
        <Box style={{ display: 'inline' }}>
          {products.length > 0
            ? products?.map((d) => (
              <Box
                m={0.5}
                p={1}
                border={1}
                className={`cursor-pointer rounded-sm ${selectedProduct === d.id ? 'bg-[var(--dark-secondary,_var(--primary))] text-white' : 'text-[var(--primary-text)]'
                  }`}
                borderColor="var(--common-border-color)"
                onClick={() => {
                  if (selectedProduct === d.id) {
                    setSelectedProduct(null);
                  } else {
                    setSelectedProduct(d.id);
                  }
                }}
                style={{ display: 'inline-block' }}
              >
                {d?.qty < 0 ? (
                  <span key={d.name} className="text-error">{`${d.name} (${d?.qty})`}</span>
                ) : d?.qty === 0 ? (
                  <span key={d.name} className="text-success">{`${d.name} (${d?.qty})`}</span>
                ) : (
                  <span key={d.name}>{`${d.name} (${d?.qty})`}</span>
                )}
              </Box>
            ))
            : null}
        </Box>
        {showWarehouseFilter && (
          <Box pt={1} width={'40%'}>
            <Autocomplete
              fullWidth
              options={warehouseOption}
              getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
              getOptionSelected={(option: any, val) => option.optionValue === val}
              value={
                warehouseOption.filter((data) => data.optionValue === selectedWarehouse).length
                  ? warehouseOption.filter((data) => data.optionValue === selectedWarehouse)[0]
                  : ''
              }
              disableClearable={true}
              onChange={(e, val) => {
                setSelectedWarehouse(val && val.optionValue ? val.optionValue : null);
                dispatch({ type: 'selection', selectedRecords: [] });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  margin="dense"
                  name="plant"
                  placeholder={routes.warehouse.title}
                  label={routes.warehouse.title}
                  variant="outlined"
                  fullWidth
                />
              )}
            />
          </Box>
        )}
      </Box>
    );
  };

  const rightSideContents = () => {
    return selectedWarehouse != filterByPlant?.optionValue && referenceType === 'Rental Job' ? (
      <>
        <Button
          style={{ minWidth: 'max-content' }}
          size="small"
          color="primary"
          onClick={() => {
            setShowTransferInventoryDialog(true);
          }}
          variant={'contained'}
          disabled={selectedRecords?.length === 0 || products?.some((d) => d?.qty < 0)}
        >
          {`Transfer to ${filterByPlant?.optionLabel}`}
          {selectedRecords?.length ? ' (' + selectedRecords?.length + ')' : ''}
        </Button>
      </>
    ) : null;
  };

  const leftSideContentsOfSearchFilter = () => {
    return (
      <>
        {!selectedProduct || !selectedWarehouse ? (
          <HtmlTooltip title={'Please Select Product'}>
            <span>
              <Button variant={'outlined'} color="primary" size="small" disabled={true}>
                Add New Serial Numbers
              </Button>
            </span>
          </HtmlTooltip>
        ) : serialNumberCount ? (
          <Button
            variant={'contained'}
            color="primary"
            size="small"
            onClick={() => {
              setAddserialNumber(true);
            }}
          >
            Add New Serial Numbers
          </Button>
        ) : null}
      </>
    );
  };

  const handleTransferSerialNumber = (transferInventoryId) => {
    axiosInstance()
      .put(`${transferInventory.api}/add-product-complete-transfer-product/${transferInventoryId}`, {
        products: products?.map((product) => ({
          product: product?.id,
          qty: selectedRecords?.filter((e) => e?.product === product?.id)?.length,
          serialNumber: selectedRecords?.filter((e) => e?.product === product?.id)?.map((e) => e?._id)
        }))
      })
      .then(({ data }) => {
        fetchData();
        setShowTransferInventoryDialog(false);
        handleAdd();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Dialog
      TransitionComponent={CustomDialogTransition}
      fullWidth
      maxWidth="md"
      fullScreen={true}
      open={true}
      onClose={handleClose}
      aria-labelledby="assign-roles-dialog"
    >
      <CustomDialogHeader title={`Assign Serial Numbers`} showManimizeMaximize={false} showRequiredLabel={false} onClose={handleClose} />
      <CustomDialogContent isFooterPresent={false}>
        <ListingPageHeader
          showSearchInMobile={true}
          searchValue={search}
          onSearch={handleSearch}
          isActionButtonVisible={false}
          leftSideContents={leftSideContents()}
          rightSideContents={rightSideContents()}
          leftSideContentsOfSearchFilter={leftSideContentsOfSearchFilter()}
          addButtonProps={{
            iconsEnabled: false,
            disabled: isAssigning || selectedRecords?.length === 0 || products?.some((d) => d?.qty < 0),
            loading: isAssigning,
            text: selectedRecords?.length > 0 ? `(${selectedRecords?.length})` : '',
            textAddShow: true
          }}
          addButtonOnclick={handleAdd}
          isAddButtonVisible={referenceType === 'Rental Job' ? selectedWarehouse === filterByPlant?.optionValue : true}
          setQueryString={false}
        />
        {products.length > 0 && products.some((s) => s.qty < 0) ? (
          <div className="text-error font-weight-bold">You have selected more Serial Numbers than required</div>
        ) : null}
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 250px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchData}
            showOnlyShowFilteredRecordSwitch={true}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
        {showTransferInventoryDialog && (
          <ManageTransferInventory
            onClose={() => {
              setShowTransferInventoryDialog(false);
            }}
            onSuccess={(data) => {
              handleTransferSerialNumber(data?._id);
            }}
            referenceType={referenceType}
            referenceData={{
              transferFromPlant: selectedWarehouse,
              transfertoPlant: filterByPlant?.optionValue,
              rentalJob: referenceData.rentalJob
            }}
          />
        )}
        {addserialNumber && (
          <AddSerialNumber
            product={selectedProduct}
            warehouse={selectedWarehouse}
            serialNumberCount={serialNumberCount}
            handleClose={() => setAddserialNumber(false)}
            handleSucess={() => {
              setAddserialNumber(false);
              fetchProductInventory();
              fetchData();
            }}
          />
        )}
      </CustomDialogContent>
    </Dialog>
  );
};

export default AssignSerialNumbersDialog;
