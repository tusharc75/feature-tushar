import { Box, Chip, IconButton } from '@material-ui/core';
import { Delete } from '@material-ui/icons';
import { camelCase } from 'lodash';
import queryString from 'query-string';
import { useContext, useEffect, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { deleteDisable } from 'src/constants/messageHelpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { CustomOfflineContext } from '../../StateProvider/OfflineContext/OfflineContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomContainer from '../../components/CustomContainer';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import MessageDialog from '../../components/Helpers/MessageDialog';
import {
  DELIVERY_FROM_TO_TYPE,
  deliveryTicket,
  getDefaultMyRecordType,
  gridLoadingTimeout,
  prepareDataForGrid,
  sidebarResource
} from '../../constants/helpers';
import { findAll, findOne, objectStore } from '../../constants/indexdbhelper';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import ManageDeliveryTicket from './ManageDeliveryTicket';
import axios, { CancelTokenSource } from 'axios';

let deliveryTicketTimeout;

const DeliveryTicket = () => {
  let renderedFrom = camelCase(sidebarResource?.deliveryTicket);
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  let { referenceId, referenceType }: any = queryString.parse(history.location.search);
  const {
    state: { user, selectedEntity, permissions, resources }
  }: any = useData();
  const types = [
    {
      key: `My ${resources?.deliveryTicket?.titlePlural}`,
      value: 1
    },
    {
      key: `All ${resources?.deliveryTicket?.titlePlural}`,
      value: 2
    }
  ];

  const { generateColumns } = useColumns();
  const [selectedType, setSelectedType] = useState(getDefaultMyRecordType(user.user, sidebarResource.deliveryTicket));
  const [renderCount, setRenderCount] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [deliveryPermissions, setdeliveryPermissions] = useState({
    isCreate: permissions?.deliveryTicket?.isCreate,
    isUpdate: permissions?.deliveryTicket?.isUpdate,
    isRead: permissions?.deliveryTicket?.isRead,
    isDelete: permissions?.deliveryTicket?.isDelete
  });
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] = useState(false);
  const [showManageDeliveryTicket, setShowManageDeliveryTicket] = useState(false);
  const [columns, setColumns] = useState(null);

  const { isOffline } = useContext(CustomOfflineContext);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = async () => {
    let data;
    if (isOffline) {
      data = await findOne(objectStore.resource, sidebarResource.deliveryTicket);
    } else {
      const response = await axiosInstance().get(
        `/field?resource=${sidebarResource.deliveryTicket}&entity=${selectedEntity}&view=true&showHiddenFields=true`
      );
      data = response?.data?.data;
    }
    data = data.filter(
      (e) => !['warehouse', 'customerAccount', 'supplierAccount', 'pickupFromType', 'deliveryToType'].includes(e?.fieldData?.fieldName)
    );
    const newColumns = generateColumns(renderedFrom, data, `${routes.deliveryTicket.path}/detail`, true);
    const columns = [...newColumns, ...getStaticFields(), ActionsRenderer];
    columns.forEach((column) => {
      if (column.accessor === 'pickupFrom') {
        column.cell = ({ row }) => (
          <>
            <Link
              className="link text-truncate"
              title={row.original[column.accessor]}
              target="_blank"
              to={
                row.original?.pickupFromType === DELIVERY_FROM_TO_TYPE.plant
                  ? `${routes.warehouseDetail.path}/${row.original.pickupFromId}`
                  : row.original?.pickupFromType === DELIVERY_FROM_TO_TYPE.customer
                    ? `${routes.customerAccountDetail.path}/${row.original?.pickupFromId}`
                    : `${routes.supplierAccountDetail.path}/${row.original?.pickupFromId}`
              }
            >
              {row.original[column.accessor]}
            </Link>
          </>
        );
      }
      if (column.accessor === 'deliveryTo') {
        column.cell = ({ row }) => (
          <>
            <Link
              className="link text-truncate"
              title={row.original[column.accessor]}
              target="_blank"
              to={
                row.original?.deliveryToType === DELIVERY_FROM_TO_TYPE.plant
                  ? `${routes.warehouseDetail.path}/${row.original.deliveryToId}`
                  : row.original?.deliveryToType === DELIVERY_FROM_TO_TYPE.customer
                    ? `${routes.customerAccountDetail.path}/${row.original?.deliveryToId}`
                    : `${routes.supplierAccountDetail.path}/${row.original?.deliveryToId}`
              }
            >
              {row.original[column.accessor]}
            </Link>
          </>
        );
      }
    });
    setColumns([...columns]);
  };

  const fetchData = async (cancelTokenSource?: CancelTokenSource) => {
    try {
      if (selectedEntity) {
        dispatch({ type: 'loading', loading: true });
        let data: any = [],
          count;
        if (!isOffline) {
          const queryString = getQueryString();
          const response: any = await axiosInstance().get(`${deliveryTicket.api}${queryString}`, { cancelToken: cancelTokenSource?.token });
          data = response?.data?.data;
          count = response?.data?.count;
        } else {
          data = await findAll(objectStore.deliveryTicket);
          count = data?.length || 0;
        }
        let rows = data.map((u) => {
          let res = {
            ...prepareDataForGrid(u, user)
          };
          res['isChecked'] = false;
          return res;
        });
        dispatch({ type: 'initialize', data: rows, count: count });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      }
    } catch (error) {
      dispatch({ type: 'loading', loading: false });
      toastConfig.setToastConfig(error);
    }
  };

  useEffect(() => {
    if (permissions && permissions?.deliveryTicket) {
      setdeliveryPermissions(permissions?.deliveryTicket);
    }
    return () => {
      setdeliveryPermissions(null);
    };
  }, [permissions]);

  useEffect(() => {
    let millisec = Object.keys(search).length > 0 ? 600 : 5;
    if (deliveryTicketTimeout) {
      clearTimeout(deliveryTicketTimeout);
    }
    deliveryTicketTimeout = setTimeout(() => {
      fetchData();
    }, millisec);
  }, [search]);

  useEffect(() => {
    if (renderCount > 0) {
      const cancelTokenSource = axios.CancelToken.source();
      fetchData(cancelTokenSource);
      return () => cancelTokenSource.cancel();
    } else setRenderCount((preCount) => preCount + 1);
  }, [page, limit, filters, sorting, selectedEntity, isOffline, selectedType, showFilteredRecordsOnly]);

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
        <HtmlTooltip title={row?.original?.canDelete && deliveryPermissions?.isDelete ? 'Delete' : deleteDisable}>
          <span>
            <IconButton
              size="small"
              aria-label="Delete"
              disabled={row?.original?.canDelete ? false : true}
              onClick={() => {
                setDeleteRecord(row.original);
                setIsConformDialogVisible(true);
              }}
            >
              <Delete fontSize="small" color={row?.original?.canDelete ? 'error' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
      </>
    )
  };

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}`;

    if (isExport) {
      deepFilter = `?`;
    }

    if (selectedType === 1) {
      deepFilter = deepFilter + `&myRecords=1`;
    }

    if (selectedEntity) {
      deepFilter = `${deepFilter}&entity=${selectedEntity}`;
    }

    const { filterByIds, deepFilters } = gridFilterParser(filters);

    if (referenceId) {
      filterByIds.push({ field: 'rentalJob', term: referenceId });
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

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const showConfirmBox = () => {
    if (selectedRecords.find((d) => d.canDelete === false)) {
      setShowDeleteWarningConfirmBox(true);
    } else {
      setIsConformDialogVisible(true);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    let recordsToDelete = [];
    if (deleteRecord?._id) {
      recordsToDelete.push(deleteRecord?._id);
    } else {
      recordsToDelete = selectedRecords.map((o) => o._id);
    }
    if (recordsToDelete.length > 0) {
      axiosInstance()
        .put(`${deliveryTicket.api}/remove?entity=${selectedEntity}`, {
          ids: recordsToDelete
        })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          dispatch({ type: 'selection', selectedRecords: [] });
          fetchData();
          setIsConformDialogVisible(false);
          setDeleteRecord(null);
          setDeleteLoading(false);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setIsConformDialogVisible(false);
          setDeleteLoading(false);
        });
    }
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
    fetchData();
  };

  const onTypeChange = (event, type) => {
    dispatch({ type: 'pageChange', page: 0 });
  };

  return (
    <>
      <section className="main-container-v1">
        <div className="headerbox-v1">
          <CustomBreadCrumbs routes={[{ ...routes.deliveryTicket, title: resources?.deliveryTicket?.titlePlural }]} />
          <ImportExportLinks
            permissions={deliveryPermissions}
            module={resources?.deliveryTicket?.titlePlural}
            api={deliveryTicket.api}
            afterImportCompleted={fetchData}
            isExportAllOrSomeFeature={true}
            onlyExport={true}
            total={rowCount}
            recordsToExport={selectedRecords?.length}
            ids={selectedRecords?.map((obj) => obj._id)}
            onExportToExcelSuccess={fetchData}
            additionalParams={getQueryString(true)}
          />
        </div>

        {/* Tables Begins Here */}
        <CustomContainer>
          <ListingPageHeader
            toggleButtonList={types}
            onToggle={onTypeChange}
            selectedType={selectedType}
            setSelectedType={setSelectedType}
            leftSideContents={
              referenceType ? <Chip className="ml-3" color="primary" label={`Rental : ${referenceType}`} onDelete={updateQueryParams} /> : null
            }
            searchValue={search}
            onSearch={handleSearch}
            isActionButtonVisible={false}
            isAddButtonVisible={false}
          />

          {columns ? (
            <CustomReactTable
              height={'calc(100vh - 200px)'}
              columns={columns}
              state={state}
              dispatch={dispatch}
              renderedFrom={renderedFrom}
              refreshGrid={fetchData}
              showOnlyShowFilteredRecordSwitch={true}
              showFilters={!isOffline}
              resource={sidebarResource.deliveryTicket}
            />
          ) : (
            <Box p={2} height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
          {showDeleteWarningConfirmBox ? (
            <MessageDialog
              open={showDeleteWarningConfirmBox}
              message={`You are trying to delete records which you do not have permission to delete, Please remove those records from selection and try again.`}
              onClose={() => setShowDeleteWarningConfirmBox(false)}
            />
          ) : null}
          {isConfirmDialogVisible ? (
            <ConfirmationDialog
              open={isConfirmDialogVisible}
              message={`Are you sure you want to delete ${deleteRecord?.ticketName ? 'Delivery Ticket' : resources?.deliveryTicket?.titleSingular}   ${
                deleteRecord.ticketName || ''
              } ?`}
              onClose={() => {
                setDeleteRecord(null);
                setIsConformDialogVisible(false);
              }}
              okBtnLoading={deleteLoading}
              onOk={handleDelete}
            />
          ) : null}

          {showManageDeliveryTicket ? (
            <ManageDeliveryTicket
              onClose={() => setShowManageDeliveryTicket(false)}
              onSuccess={() => {
                fetchData();
                setShowManageDeliveryTicket(false);
              }}
            />
          ) : null}
        </CustomContainer>
      </section>
    </>
  );
};

export default DeliveryTicket;
