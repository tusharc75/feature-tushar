import { IconButton, TextField } from '@material-ui/core';
import Box from '@material-ui/core/Box/Box';
import Grid from '@material-ui/core/Grid/Grid';
import { camelCase, capitalize } from 'lodash';
import { Link } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import DurationFilter from 'src/components/DurationFilter';
import { useAppTheme } from 'src/constants/AppConfig';
import {
  PRODUCT_SERIAL_NUMBER_STATUS,
  dateTimeFormat,
  gridLoadingTimeout,
  isObjectEmpty,
  prepareDataForGrid,
  productInventory,
  sidebarResource
} from 'src/constants/helpers';
import CustomReactTable, { gridFilterParser, useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import routes from '../../../components/Helpers/Routes';
import RevertQtyDialog from './RevertQtyDialog';
import moment from 'moment';
import { useContext, useEffect, useState } from 'react';
import { Autocomplete } from '@material-ui/lab';
import { Autorenew } from '@material-ui/icons';
import { FiExternalLink } from 'react-icons/fi';

const History = ({ product, warehouse, storageLocation }) => {
  const renderedFrom = `${camelCase(routes.productInventory.title)}_history`;
  const toastConfig = useContext(CustomToastContext);
  const [themeColor] = useAppTheme();
  const isDarkTheme = themeColor === 'dark';

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, limit, filters, sorting } = state;

  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();

  const [isRevertConfirmation, setIsRevertConfirmation] = useState({ open: false, _id: '', product: '' });
  const [revertLoading, setRevertLoading] = useState(false);
  const [warehouseOptions, setWarehouseOptions] = useState(null);
  const [storageLocationOptions, setStorageLocationOptions] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(warehouse && warehouse?.split(',')?.length === 1 ? warehouse : 'All');
  const [selectedStorageLocation, setSelectedStorageLocation] = useState(storageLocation);
  const [revertQtyDialog, setRevertQtyDialog] = useState({
    open: false,
    productName: '',
    product: '',
    qty: 0,
    revertedQty: 0,
    ledgerId: '',
    serialNumber: []
  });
  const [duration, setDuration] = useState({
    from: new Date(moment().subtract('1', 'year').calendar()),
    to: new Date()
  });

  useEffect(() => {
    getWarehouse();
  }, []);

  useEffect(() => {
    if (warehouseOptions) {
      fetchRecords();
    }
  }, [page, limit, filters, sorting, selectedEntity, selectedWarehouse, selectedStorageLocation, warehouseOptions, duration]);

  const fetchRecords = async () => {
    dispatch({ type: 'loading', loading: true });

    const queryString = getQueryString();

    const response = await axiosInstance().get(`/history/product-ledger/${queryString}`);
    let rows = response?.data?.data?.map((u) => {
      let finalObject: any = prepareDataForGrid(u, user);
      finalObject.type = capitalize(u.type);
      finalObject.serialNumber = u.serialNumber || [];
      return finalObject;
    });
    dispatch({ type: 'initialize', data: rows, count: response?.data?.count });
    setTimeout(() => {
      dispatch({ type: 'loading', loading: false });
    }, gridLoadingTimeout);
  };

  const getQueryString = () => {
    let deepFilter = `${product}?page=${page}&limit=${limit}`;

    if (selectedWarehouse) {
      let tempWarehouse =
        selectedWarehouse === 'All'
          ? warehouseOptions
            ?.filter((d) => d.optionValue !== 'All')
            .map((d) => d.optionValue)
            .toString()
          : selectedWarehouse;

      deepFilter = `${deepFilter}&warehouse=${tempWarehouse}`;
    }

    if (selectedStorageLocation) {
      deepFilter = `${deepFilter}&storageLocation=${selectedStorageLocation}`;
    }
    const { filterByIds, deepFilters } = gridFilterParser(filters);
    if (filterByIds?.length) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterByIds)}`;
    }

    if (duration) {
      deepFilters.push({
        field: 'date',
        term: {
          from: moment(duration?.from).format('MM/DD/YYYY'),
          to: moment(duration?.to).format('MM/DD/YYYY')
        }
      });
    }
    if (deepFilters?.length > 0) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(deepFilters))}`;
    }
    if (filterByIds?.length || deepFilters?.length) {
      deepFilter = `${deepFilter}&filterType=and`;
    }
    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }
    return deepFilter;
  };

  const getWarehouse = () => {
    axiosInstance()
      .get('/sa-formbuilder/lookup?lookupResource=Warehouse,Storage Location')
      .then(({ data: { data } }) => {
        setWarehouseOptions([{ optionLabel: 'All', optionValue: 'All' }, ...data.Warehouse]);
        setStorageLocationOptions(data['Storage Location'] || []);
      });
  };

  const curr = user?.user?.brandCurrency || '';

  const columns = [
    {
      accessor: 'date',
      Header: 'Date',
      disableFilters: true,
      disabled: true,
      disableSortBy: true,
      Cell: ({ row }) => (
        <div>
          {row?.original?.date ? (
            <h5 className="text-truncate" title={moment(row?.original?.date)?.format(dateTimeFormat)}>
              {moment(row?.original?.date)?.format(dateTimeFormat)}
            </h5>
          ) : (
            <NoDataCell />
          )}
        </div>
      )
    },
    {
      accessor: 'referenceType',
      Header: 'Reference Type',
      disableSortBy: true,
      Cell: ({ row }) => (
        <div>
          {row?.original?.referenceType ? (
            <h5 className="text-truncate" title={row?.original?.referenceType}>
              {row?.original?.referenceType}
            </h5>
          ) : (
            <NoDataCell />
          )}
        </div>
      )
    },
    {
      accessor: 'reference',
      Header: 'Reference',
      disableFilters: true,
      disableSortBy: true,
      Cell: ({ row }) => (
        <div>
          <p title={row.original.reference}>{row.original.reference}</p>
          {row?.original?.reference ? (
            <IconButton
              size="small"
              onClick={() => {
                if(row?.original?.referenceType === sidebarResource.purchaseOrder){
                  window.open(`${routes.purchaseOrderDetail.path}/${row?.original?.referenceId}`);
                }
                else if(row?.original?.referenceType === sidebarResource.transferInventory){
                  window.open(`${routes.transferInventoryDetail.path}/${row?.original?.referenceId}`);
                }
                else if(row?.original?.referenceType === sidebarResource.transferAsset){
                  window.open(`${routes.transferAssetDetail.path}/${row?.original?.referenceId}`);
                }
                else if(row?.original?.referenceType === sidebarResource.salesOrder){
                  window.open(`${routes.salesOrderDetail.path}/${row?.original?.referenceId}`);
                }
                else if(row?.original?.referenceType === sidebarResource.bulkAssetCreation){
                  window.open(`${routes.bulkAssetCreationDetail.path}/${row?.original?.referenceId}`);
                }
                else if(row?.original?.referenceType === sidebarResource.serializedAsset){
                  window.open(`${routes.serializedAssetDetail.path}/${row?.original?.referenceId}`);
                }
                else if(row?.original?.referenceType === 'Rental Job'){
                  window.open(`${routes.rentalManagementDetail.path}/${row?.original?.referenceId}`);
                }
                else if(row?.original?.referenceType === sidebarResource.workOrder){
                  window.open(`${routes.workOrderDetail.path}/${row?.original?.referenceId}`);
                }
                else if(row?.original?.referenceType === sidebarResource.fieldTicket){
                  window.open(`${routes.fieldTicketDetail.path}/${row?.original?.referenceId}`);
                }
                else if(row?.original?.referenceType === sidebarResource.subcontractAssembly){
                  window.open(`${routes.subcontractAssemblyDetail.path}/${row?.original?.referenceId}`);
                }
                else if(row?.original?.referenceType === sidebarResource.productInventory){
                  <h5 className="text-truncate">Manual Entry</h5>
                }
              }}
            >
            <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
          </IconButton>
          ):(
            <NoDataCell />
          )}
        </div>
      )
    },
    {
      accessor: 'type',
      Header: 'Type',
      disableSortBy: true,
      Cell: ({ row }) => (
        <div>
          {row?.original?.type ? (
            <h5 className="text-truncate" title={row?.original?.type}>
              {row?.original?.type}
            </h5>
          ) : (
            <NoDataCell />
          )}
        </div>
      )
    },
    {
      accessor: 'qty',
      Header: 'Credit/Debit',
      disableFilters: true,
      disableSortBy: true,
      disabled: true,
      Cell: ({ row }) => (
        <div
          style={{
            backgroundColor:
              row?.original?.type === 'Credit'
                ? isDarkTheme
                  ? 'hsl(120 73% 40% / 1)'
                  : '#90ee90'
                : row?.original?.type === 'Debit'
                  ? isDarkTheme
                    ? 'hsl(1 100% 65% / 1)'
                    : '#FFCCCB'
                  : ''
          }}
        >
          {row?.original?.qty ? (
            <h5 className="text-truncate" title={row?.original?.qty}>
              {row?.original?.type === 'Debit' ? `-${row?.original?.qty}` : row?.original?.qty}
            </h5>
          ) : (
            <NoDataCell />
          )}
        </div>
      )
    },
    ...(!user?.user?.brandPolicy?.hideInventoryCount
      ? [
        {
          accessor: 'finalInventory',
          Header: 'Final Quantity',
          disableFilters: true,
          disableSortBy: true,
          Cell: ({ row }) => (
            <div>
              {row?.original?.finalInventory ? (
                <h5 className="text-truncate" title={row?.original?.finalInventory}>
                  {row?.original?.finalInventory}
                </h5>
              ) : (
                <NoDataCell />
              )}
            </div>
          )
        }
      ]
      : []),
    {
      accessor: 'price',
      Header: `Cost ${curr}`,
      disableFilters: true,
      Cell: ({ row }) => (
        <div>
          {row?.original?.price ? (
            <h5 className="text-truncate" title={row?.original?.price}>
              {row?.original?.price}
            </h5>
          ) : (
            <NoDataCell />
          )}
        </div>
      )
    },
    {
      accessor: 'totalPrice',
      Header: `Amount ${curr}`,
      disableFilters: true,
      Cell: ({ row }) => (
        <div>
          {row?.original?.totalPrice ? (
            <h5 className="text-truncate" title={row?.original?.totalPrice}>
              {row?.original?.totalPrice}
            </h5>
          ) : (
            <NoDataCell />
          )}
        </div>
      )
    },
    ...(selectedWarehouse && selectedWarehouse !== 'All'
      ? [
        {
          accessor: 'finalAvgPrice',
          Header: `Final Average Cost ${curr}`,
          disableFilters: true,
          disableSortBy: true,
          Cell: ({ row }) => (
            <div>
              {row?.original?.finalAvgPrice ? (
                <h5 className="text-truncate" title={row?.original?.finalAvgPrice}>
                  {row?.original?.finalAvgPrice}
                </h5>
              ) : (
                <NoDataCell />
              )}
            </div>
          )
        }
      ]
      : []),
    {
      accessor: 'warehouse',
      Header: routes.warehouse.title,
      disableFilters: true,
      disableSortBy: true,
      Cell: ({ row }) => (
        <div>
          <p title={row.original.warehouse}>{row.original.warehouse}</p>
            {
              <IconButton
              size="small"
              onClick={() => {
                  window.open(`${routes.warehouseDetail.path}/${row?.original?.warehouseId}`);
              }}
            >
              <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
            </IconButton>
            }
        </div>
      )
    },
    ...(user?.user?.brandPolicy?.storageLocation
      ? [
        {
          accessor: 'storageLocation',
          Header: 'Storage Location',
          disableFilters: true,
          disableSortBy: true,
          Cell: ({ row }) => (
            <div>
              <p title={row.original.storageLocation}>{row.original.storageLocation}</p>
              {
                <IconButton
                size="small"
                onClick={() => {
                    window.open(`${routes.storageLocationDetail.path}/${row?.original?.storageLocationId}`);
                }}
              >
                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
              </IconButton>
              }
            </div>
          )
        }
      ]
      : []),
    {
      accessor: 'supplierPartNumber',
      Header: 'Supplier Part Number',
      disableSortBy: true,
      Cell: ({ row }) => (
        <div>
          {row?.original?.supplierPartNumber ? (
            <h5 className="text-truncate" title={row?.original?.supplierPartNumber}>
              {row?.original?.supplierPartNumber}
            </h5>
          ) : (
            <NoDataCell />
          )}
        </div>
      )
    },
    {
      accessor: 'comment',
      Header: 'Comment',
      disableSortBy: true,
      Cell: ({ row }) => (
        <div>
          {row?.original?.comment ? (
            <h5 className="text-truncate" title={row?.original?.comment}>
              {row?.original?.comment}
            </h5>
          ) : (
            <NoDataCell />
          )}
        </div>
      )
    },
    {
      accessor: 'serialNumber',
      Header: 'Serial Number',
      disableFilters: true,
      disableSortBy: true,
      Cell: ({ row }) => (
        <div>
          {row?.original?.serialNumber?.length ? (
            <h5 className="text-truncate" title={row?.original['serialNumber']?.map((e) => e?.optionLabel)?.join(', ')}>
              {row?.original['serialNumber']?.map((e) => e?.optionLabel).join(', ')}
            </h5>
          ) : (
            <NoDataCell />
          )}
        </div>
      )
    },
    {
      accessor: 'user',
      Header: 'Transacted By',
      disableSortBy: true,
      Cell: ({ row }) => (
        <div>
          <p title={row.original.user}>{row.original.user}</p>
            {
              <IconButton
              size="small"
              onClick={() => {
                  window.open(`${routes.userDetail.path}/${row?.original?.userId}`);
              }}
            >
              <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
            </IconButton>
            }
        </div>
      )
    },
    {
      accessor: 'transactionDate',
      Header: 'Actual Transaction Date',
      disableFilters: true,
      disableSortBy: true,
      Cell: ({ row }) => (
        <div>
          {row?.original?.transactionDate ? (
            <h5 className="text-truncate" title={moment(row?.original?.transactionDate)?.format(dateTimeFormat)}>
              {moment(row?.original?.transactionDate)?.format(dateTimeFormat)}
            </h5>
          ) : (
            <NoDataCell />
          )}
        </div>
      )
    },
    {
      accessor: 'action',
      Header: 'Actions',
      minWidth: 100,
      width: 110,
      sticky: 'right',
      Cell: ({ row }) => (
        <div>
          {(['Product Inventory', 'Reverted'].includes(row?.original?.referenceType) && !row?.original?.reverted) ||
            ([sidebarResource.workOrder, sidebarResource.fieldTicket].includes(row?.original?.referenceType) &&
              row?.original?.type?.toLowerCase() === 'debit' &&
              row?.original?.qty - (row?.original?.revertedQty || 0) > 0) ? (
            <Box pl={1}>
              <HtmlTooltip title="Revert">
                <span>
                  <IconButton
                    size="small"
                    aria-label="revert"
                    onClick={() => {
                      if ([sidebarResource.workOrder, sidebarResource.fieldTicket].includes(row?.original?.referenceType)) {
                        setRevertQtyDialog({
                          open: true,
                          productName: '',
                          product: row?.original?.product,
                          qty: row?.original?.qty,
                          revertedQty: row?.original?.revertedQty || 0,
                          ledgerId: row?.original?._id,
                          serialNumber: row?.original?.serialNumber || []
                        });
                      } else {
                        setIsRevertConfirmation({ open: true, _id: row?.original?._id, product: row?.original?.product });
                      }
                    }}
                  >
                    <Autorenew fontSize="small" color="primary" />
                  </IconButton>
                </span>
              </HtmlTooltip>
            </Box>
          ) : null}
        </div>
      )
    }
  ];

  const handleRevert = () => {
    setRevertLoading(true);
    let data = { comment: 'Reverted' };
    axiosInstance()
      .put(`${productInventory.api}/${isRevertConfirmation.product}/ledger-revert/${isRevertConfirmation._id}`, data)
      .then(({ data: { data } }) => {
        setRevertLoading(false);
        setIsRevertConfirmation({ open: false, _id: '', product: '' });
        dispatch({ type: 'initialize', data: [], count: 0 });
        fetchRecords();
      })
      .catch((error) => {
        setRevertLoading(false);
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <>
      {warehouseOptions ? (
        <div className="md:pr-[82px]">
          <Grid container spacing={2} justifyContent="space-between">
            <Grid item md={3} sm={6} xs={12}>
              <Autocomplete
                options={warehouseOptions}
                getOptionLabel={(option: any) => option.optionLabel}
                disableClearable
                getOptionSelected={(option: any, val) => option.optionValue === val}
                value={
                  warehouseOptions.filter((data) => data.optionValue === selectedWarehouse).length
                    ? warehouseOptions.filter((data) => data.optionValue === selectedWarehouse)[0]
                    : ''
                }
                onChange={(e, val) => {
                  if (val !== null) {
                    setSelectedWarehouse(val && val.optionValue ? val.optionValue : '');
                    setSelectedStorageLocation(null);
                  }
                }}
                renderInput={(params) => (
                  <TextField {...params} margin="dense" name="plant" label={routes.warehouse.title} variant="outlined" fullWidth />
                )}
              />
            </Grid>
            <Grid item md={3} sm={6} xs={12}>
              {user?.user?.brandPolicy?.storageLocation && (
                <Autocomplete
                  options={storageLocationOptions.filter((item) => item.warehouse === selectedWarehouse)}
                  getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
                  getOptionSelected={(option: any, val) => option.optionValue === val}
                  value={
                    storageLocationOptions.filter((data) => data.optionValue === selectedStorageLocation).length
                      ? storageLocationOptions.filter((data) => data.optionValue === selectedStorageLocation)[0]
                      : ''
                  }
                  onChange={(e, val) => {
                    setSelectedStorageLocation(val?.optionValue);
                  }}
                  renderInput={(params) => (
                    <TextField {...params} margin="dense" name="storageLocation" label="Storage Location" variant="outlined" fullWidth />
                  )}
                />
              )}
            </Grid>
            <Grid item md={6} sm={12} xs={12}>
              <Box mt={1}>
                <DurationFilter label={''} defaultTimeFrame="1-year" duration={duration} setDuration={setDuration} />
              </Box>
            </Grid>
          </Grid>
        </div>
      ) : (
        <div className="min-h-[50px]" />
      )}
      <Grid item xs={12} md={12} sm={12}>
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 300px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchRecords}
            hideSelection={true}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Grid>
      {isRevertConfirmation.open && (
        <ConfirmationDialog
          open={true}
          message={`Are you sure you want to revert ?`}
          onClose={() => {
            setIsRevertConfirmation({ open: false, _id: '', product: '' });
          }}
          okBtnLoading={revertLoading}
          onOk={handleRevert}
        />
      )}
      {revertQtyDialog.open && (
        <RevertQtyDialog
          referenceType={sidebarResource.productInventory}
          productName={revertQtyDialog.productName}
          product={revertQtyDialog.product}
          qty={revertQtyDialog.qty}
          revertedQty={revertQtyDialog.revertedQty}
          ledgerId={revertQtyDialog.ledgerId}
          onClose={() => {
            setRevertQtyDialog({ open: false, productName: '', product: '', qty: 0, revertedQty: 0, ledgerId: '', serialNumber: [] });
          }}
          onSuccess={() => {
            setRevertQtyDialog({ open: false, productName: '', product: '', qty: 0, revertedQty: 0, ledgerId: '', serialNumber: [] });
            dispatch({ type: 'initialize', data: [], count: 0 });
            fetchRecords();
          }}
          serialNumber={
            revertQtyDialog.serialNumber
              ?.map((s) => {
                if (s.status === PRODUCT_SERIAL_NUMBER_STATUS.unAvailable) {
                  return s;
                }
              })
              ?.filter(Boolean) || []
          }
        />
      )}
    </>
  );
};

export default History;
