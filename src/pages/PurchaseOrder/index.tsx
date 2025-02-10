import { Box, Chip, MenuItem, TextField } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import Autocomplete from '@mui/material/Autocomplete';
import { camelCase } from 'lodash';
import queryString from 'query-string';
import { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import ImportExportLinks from 'src/components/Helpers/ImportExportLinks';
import routes from 'src/components/Helpers/Routes';
import { ListingPageHeader } from 'src/components/PageHeaders';
import {
  checkIsAllowedToDelete,
  getDefaultMyRecordType,
  gridLoadingTimeout,
  prepareDataForGrid,
  purchaseOrder,
  sidebarResource
} from 'src/constants/helpers';
import { cloneDisable, deleteDisable } from 'src/constants/messageHelpers';
import ManagePurchaseOrder from './ManagePurchaseOrder';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import axios, { CancelTokenSource } from 'axios';
import { useSetWalkmeData } from 'src/components/CustomIntro';
import { createPurchaseOrderFlow } from './walkmeSteps';
import CustomContent from 'src/pages/PurchaseOrder/CustomContent';

const PurchaseOrder = () => {
  let renderedFrom = camelCase(sidebarResource.purchaseOrder);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const {
    state: { user, permissions, selectedEntity, resources }
  }: any = useData();

  const PurchaseOrderType = [
    {
      key: `My ${resources?.purchaseOrder?.titlePlural}`,
      value: 1
    },
    {
      key: `All ${resources?.purchaseOrder?.titlePlural}`,
      value: 2
    }
  ];

  let { referenceId, referenceType }: any = queryString.parse(history.location.search);
  const [selectedType, setSelectedType] = useState(getDefaultMyRecordType(user.user, sidebarResource.purchaseOrder));
  const [showManagePurchaseOrderDialog, setShowManagePurchaseOrderDialog] = useState({ open: false, isClone: false, idToClone: null });
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [columns, setColumns] = useState(null);
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const [fromSalesOrder, setFromSalesOrder] = useState(history.location?.state?.salesOrder);
  const [warehouseOptions, setWarehouseOptions] = useState([]);
  const [warehouse, setWarehouse] = useState(null);
  const { setWalkmeData } = useSetWalkmeData();

  const { generateColumns } = useColumns();

  useEffect(() => {
    fetchGridColumns();
    setWalkmeData([createPurchaseOrderFlow(resources?.purchaseOrder?.titleSingular)]);
  }, []);

  useEffect(() => {
    getPlants();
  }, [selectedEntity]);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchPurchaseOrder(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, [page, limit, filters, sorting, search, selectedEntity, fromSalesOrder, selectedType, showFilteredRecordsOnly, warehouse]);

  const getPlants = () => {
    axiosInstance()
      .get(`/sa-formbuilder/lookup?lookupResource=Warehouse`)
      .then(({ data: { data } }) => {
        setWarehouseOptions(data['Warehouse']);
      });
  };

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource.purchaseOrder}`)
      .then(({ data: { data } }) => {
        let newColumns = generateColumns(renderedFrom, data, routes.purchaseOrderDetail.path, true);
        let extraColumn = [
          {
            accessor: 'totalPrice',
            Header: 'Total Price',
            width: 150,
            disableFilters: true,
            disableSortBy: true,
            Cell: ({ row }) => (
              <>
                {row?.original?.totalPrice ? (
                  <h5 className="text-truncate" title={row?.original?.totalPrice}>
                    {row?.original?.totalPrice}
                  </h5>
                ) : (
                  <NoDataCell />
                )}
              </>
            )
          }
        ];
        setColumns([...newColumns, ...extraColumn, ...getStaticFields(), ActionsRenderer]);
      });
  };

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 100,
    width: 110,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (
      <>
        <HtmlTooltip title={permissions?.purchaseOrder?.isCreate ? 'Clone' : cloneDisable}>
          <span>
            <IconButton
              size="small"
              aria-label="Clone"
              disabled={permissions?.purchaseOrder?.isCreate ? false : true}
              onClick={() => {
                setShowManagePurchaseOrderDialog({ open: true, isClone: true, idToClone: row.original._id });
              }}
            >
              <FileCopyIcon fontSize="small" color={permissions?.purchaseOrder?.isCreate ? 'primary' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
        <HtmlTooltip title={row?.original?.canDelete ? 'Delete' : deleteDisable}>
          <span>
            <IconButton
              size="small"
              aria-label="Delete"
              disabled={row?.original?.canDelete ? false : true}
              onClick={() => {
                setDeleteRecord(row.original);
                setShowDeleteConfirmBox(true);
              }}
            >
              <DeleteIcon fontSize="small" color={row?.original?.canDelete ? 'error' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
      </>
    )
  };

  const fetchPurchaseOrder = (cancelTokenSource?: CancelTokenSource | undefined) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    axiosInstance()
      .get(`${purchaseOrder.api}${queryString}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data, count } }) => {
        let rows = data?.map((u) => {
          let finalObject: any = prepareDataForGrid(u, user);
          finalObject['isChecked'] = selectedRecords.some((s) => s._id === u._id);
          finalObject['canDelete'] =
            permissions?.purchaseOrder?.isDelete &&
            checkIsAllowedToDelete(user, sidebarResource.purchaseOrder, finalObject?.ownerId) &&
            u?.canDelete &&
            !u?.deleted;
          return finalObject;
        });
        dispatch({ type: 'initialize', data: rows, count: count });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      })
      .finally(() => {
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      });
  };

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}`;
    if (isExport) {
      deepFilter = `?`;
    }
    if (selectedType === 1) {
      deepFilter = deepFilter + `&myRecords=1`;
    }

    const { filterByIds, deepFilters } = gridFilterParser(filters);

    if (warehouse && warehouse !== '') {
      filterByIds.push({ field: 'warehouse', term: warehouse });
    }
    if (referenceId) {
      filterByIds.push({ field: 'rentalJob', term: referenceId });
    }
    if (fromSalesOrder) {
      filterByIds.push({ field: 'salesOrder', term: fromSalesOrder?._id });
    }

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
      deepFilter = `${deepFilter}&search=${encodeURIComponent(search)}`;
    }
    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || [])?.map((m) => m._id))}`;
    }
    return deepFilter;
  };

  const handleDelete = () => {
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords.map((d) => d._id);
    }
    axiosInstance()
      .put(`${purchaseOrder.api}/remove`, { ids: ids })
      .then(() => {
        dispatch({ type: 'selection', selectedRecords: [] });
        fetchPurchaseOrder();
        setShowDeleteConfirmBox(false);
        setDeleteRecord(null);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handlePurchaseOrderTypeSel = (filterValues) => {
    dispatch({ type: 'pageChange', page: 0 });
    if (referenceId && referenceType) {
      history.push(`?type=${filterValues}&referenceType=${referenceType}&referenceId=${referenceId}`);
    } else {
      history.push(`?type=${filterValues}`);
    }
  };

  const handleFilter = (event, newFilter) => {
    if (newFilter != null) {
      handlePurchaseOrderTypeSel(PurchaseOrderType.find((d) => d.key === newFilter).value);
    }
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const updateQueryParams = () => {
    const queryParams = new URLSearchParams(history.location.search);
    queryParams.delete('referenceId');
    queryParams.delete('referenceType');
    referenceId = queryParams.get('referenceId');
    referenceType = queryParams.get('referenceType');
    history.replace({
      search: queryParams.toString()
    });
    fetchPurchaseOrder();
  };

  const ActionMenuItems = () => {
    return (
      <>
        <MenuItem
          disabled={selectedRecords.every((e) => e.canDelete) ? false : true}
          onClick={() => {
            if (selectedRecords.length === 1) {
              setDeleteRecord(selectedRecords[0]);
            } else {
              setDeleteRecord(null);
            }
            setShowDeleteConfirmBox(true);
          }}
        >
          {`Delete (${selectedRecords.length})`}
        </MenuItem>
      </>
    );
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ ...routes.purchaseOrder, title: resources?.purchaseOrder?.titlePlural }]} />
        <ImportExportLinks
          permissions={permissions?.purchaseOrder}
          module={resources?.purchaseOrder?.titlePlural}
          api={purchaseOrder.api}
          afterImportCompleted={() => {
            fetchPurchaseOrder();
          }}
          isExportAllOrSomeFeature={true}
          total={rowCount}
          recordsToExport={selectedRecords?.length}
          ids={selectedRecords?.map((obj) => obj._id)}
          onExportToExcelSuccess={() => {
            fetchPurchaseOrder();
          }}
          additionalParams={getQueryString(true)}
          asyncExport={true}
          resource={sidebarResource.purchaseOrder}
        />
      </div>
      <CustomContainer>
        <ListingPageHeader
          toggleButtonList={PurchaseOrderType}
          onToggle={handleFilter}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          leftSideContents={
            <LeftSideContents
              {...{
                warehouseOptions,
                warehouse,
                dispatch,
                setWarehouse,
                resources,
                referenceType,
                updateQueryParams,
                fromSalesOrder,
                setFromSalesOrder
              }}
            />
          }
          searchValue={search}
          onSearch={handleSearch}
          // rightSideContents
          isActionButtonVisible={true}
          actionButtonProps={{ disabled: selectedRecords.length ? false : true }}
          actionMenuItems={<ActionMenuItems />}
          // addButtonProps
          addButtonOnclick={() => {
            setShowManagePurchaseOrderDialog({ open: true, isClone: false, idToClone: null });
          }}
          isAddButtonVisible={permissions?.purchaseOrder?.isCreate}
          setQueryString={false}
        />

        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchPurchaseOrder}
            showOnlyShowFilteredRecordSwitch={true}
            showFilters={true}
            resource={sidebarResource.purchaseOrder}
            setWholeRowsCellColor={(rowData) => (rowData.deleted ? 'error' : '')}
            expanderWithCustomContent={true}
            // customContent={({ row }) => <CustomContent row={row} />}
            customContent={CustomContent}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomContainer>
      {showManagePurchaseOrderDialog.open && (
        <ManagePurchaseOrder
          isClone={showManagePurchaseOrderDialog.isClone}
          purchaseOrderId={showManagePurchaseOrderDialog.idToClone}
          onClose={() => setShowManagePurchaseOrderDialog({ open: false, isClone: false, idToClone: null })}
          onSuccess={() => {
            setShowManagePurchaseOrderDialog({ open: false, isClone: false, idToClone: null });
            fetchPurchaseOrder();
          }}
          currency={user?.entity?.find((d) => d._id === selectedEntity)?.currency}
        />
      )}
      {showDeleteConfirmBox && (
        <ConfirmationDialog
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete the ${deleteRecord ? `${resources?.purchaseOrder?.titleSingular?.toLowerCase()} : ${deleteRecord?.purchaseOrderNumber}` : `selected ${resources?.purchaseOrder?.titlePlural?.toLowerCase()}`} ?`}
          onClose={() => {
            setDeleteRecord(null);
            setShowDeleteConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
    </section>
  );
};

export default PurchaseOrder;

const LeftSideContents = ({
  warehouseOptions,
  warehouse,
  dispatch,
  setWarehouse,
  resources,
  referenceType,
  updateQueryParams,
  fromSalesOrder,
  setFromSalesOrder
}) => {
  return (
    <>
      <Autocomplete
        style={{ minWidth: '200px', flexGrow: 1 }}
        className="md:max-w-[250px]"
        options={warehouseOptions}
        getOptionLabel={(option: any) => option.optionLabel || ''}
        isOptionEqualToValue={(option: any, val) => option.optionValue === val}
        value={
          warehouseOptions.filter((data) => data.optionValue === warehouse).length
            ? warehouseOptions.filter((data) => data.optionValue === warehouse)[0]
            : null
        }
        onChange={(e, val) => {
          dispatch({ type: 'selection', selectedRecords: [] });
          setWarehouse(val && val.optionValue ? val.optionValue : '');
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            margin="none"
            size="small"
            name="plant"
            label={`${resources?.warehouse?.titleSingular}`}
            variant="outlined"
            fullWidth
          />
        )}
      />
      {referenceType && <Chip className="ml-3" color="primary" label={`Rental Job : ${referenceType}`} onDelete={updateQueryParams} />}
      {fromSalesOrder && (
        <Chip
          className="ml-3"
          color="primary"
          label={`Sales Order : ${fromSalesOrder?.salesOrderNo}`}
          onDelete={() => {
            setFromSalesOrder(null);
          }}
        />
      )}
    </>
  );
};
