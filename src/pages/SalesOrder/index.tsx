import { Box, IconButton, MenuItem } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { camelCase } from 'lodash';
import queryString from 'query-string';
import { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { cloneDisable, deleteDisable } from 'src/constants/messageHelpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomContainer from '../../components/CustomContainer';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import MessageDialog from '../../components/Helpers/MessageDialog';
import {
  customerAccount,
  getDefaultMyRecordType,
  gridLoadingTimeout,
  prepareDataForGrid,
  salesOrder,
  sidebarResource,
  supplierAccount
} from '../../constants/helpers';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import ManageSalesOrderDialog from './ManageSalesOrderDialog';
import axios, { CancelTokenSource } from 'axios';

const SalesOrder = () => {
  const renderedFrom = camelCase(routes?.salesOrder.title);
  const toastConfig = useContext(CustomToastContext);

  const types = [
    {
      key: `My ${routes?.salesOrder.title}`,
      value: 1
    },
    {
      key: `All ${routes?.salesOrder.title}`,
      value: 2
    }
  ];

  const history = useHistory();
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { generateColumns, checkStaticField } = useColumns();

  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();

  const [selectedType, setSelectedType] = useState(getDefaultMyRecordType(user.user, sidebarResource.salesOrder));
  const [columns, setColumns] = useState(null);
  const [renderCount, setRenderCount] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState<any>({});
  const [showManageSalesOrderDialog, setShowManageSalesOrderDialog] = useState({ open: false, isClone: false, idToClone: null });
  const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] = useState(false);
  const [singleSalesOrderDelete, setSingleSalesOrderDelete] = useState({
    id: null,
    show: false,
    salesOrderName: ''
  });
  const [accountDetails, setAccountDetails] = useState({
    accountId: history.location?.state?.accountId,
    accountName: history.location?.state?.accountName,
    resource: history.location?.state?.resource
  });
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=Sales Order`);
    data = response?.data?.data;
    let newColumns = generateColumns(renderedFrom, data, routes.salesOrderDetail.path, true);
    let staticFields = getStaticFields();
    staticFields.forEach((field) => {
      newColumns.push(checkStaticField(routes.projectSales.title, field));
    });
    setColumns([...newColumns, ActionsRenderer]);
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
        <HtmlTooltip title={permissions?.salesOrder?.isCreate ? 'Clone' : cloneDisable}>
          <span>
            <IconButton
              size="small"
              aria-label="Clone"
              disabled={permissions?.salesOrder?.isCreate ? false : true}
              onClick={() => {
                setShowManageSalesOrderDialog({ open: true, isClone: true, idToClone: row?.original?._id });
              }}
            >
              <FileCopyIcon fontSize="small" color={permissions?.salesOrder?.isCreate ? 'primary' : 'disabled'} />
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
                setSingleSalesOrderDelete({
                  show: true,
                  id: row?.original?._id,
                  salesOrderName: `${row?.original?.salesOrderNo}`
                });
              }}
            >
              <DeleteIcon fontSize="small" color={row?.original?.canDelete ? 'error' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
      </>
    )
  };

  useEffect(() => {
    if (renderCount > 0) {
      const cancelTokenSource = axios.CancelToken.source();
      fetchData(cancelTokenSource);
      return () => cancelTokenSource.cancel();
    } else setRenderCount((preCount) => preCount + 1);
  }, [search, page, limit, selectedType, filters, sorting, accountDetails, selectedEntity, showFilteredRecordsOnly]);

  const handleSingleDeleteSalesOrder = async () => {
    dispatch({ type: 'loading', loading: true });

    axiosInstance()
      .put(`${salesOrder.api}/remove`, {
        ids: [singleSalesOrderDelete.id]
      })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchData();
        dispatch({ type: 'loading', loading: false });
        setSingleSalesOrderDelete({ id: null, show: false, salesOrderName: '' });
      })
      .catch((error) => {
        dispatch({ type: 'loading', loading: false });
        toastConfig.setToastConfig(error);
      });
  };

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}`;
    if (selectedType === 1) {
      deepFilter = deepFilter + `&myRecords=1`;
    }
    if (isExport) {
      deepFilter = `?`;
    }
    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || []).map((m) => m._id))}`;
    }

    const { filterByIds, deepFilters } = gridFilterParser(filters);

    if (accountDetails.accountId) {
      if (accountDetails.resource === customerAccount.accountResource) {
        filterByIds.push({
          field: 'customerAccount',
          term: accountDetails.accountId
        });
      } else if (accountDetails.resource === supplierAccount.accountResource) {
        filterByIds.push({
          field: 'supplierAccountName',
          term: { $in: [accountDetails.accountId] }
        });
      }
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

    return deepFilter;
  };

  const fetchData = async (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();

    axiosInstance()
      .get(`${salesOrder.api}${queryString}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data, count } }) => {
        let rows = data.map((u) => {
          let finalObject: any = prepareDataForGrid(u, user);
          finalObject['isChecked'] = false;
          finalObject['canDelete'] = permissions?.salesOrder?.isDelete && u?.canDelete;
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

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const onTypeChange = (event, type) => {
    dispatch({ type: 'pageChange', page: 0 });
  };

  const showConfirmBox = (row) => {
    if (row) {
      setIsConformDialogVisible(true);
      if (row && row._id) {
        setDeleteRecord(row);
      }
    } else {
      if (selectedRecords.find((d) => d.canDelete === false)) {
        setShowDeleteWarningConfirmBox(true);
      } else {
        setIsConformDialogVisible(true);
      }
    }
  };

  const handleDeleteSalesOrder = async () => {
    setDeleteLoading(true);
    let recordsToDelete = [];
    if (deleteRecord?._id) {
      recordsToDelete.push(deleteRecord?._id);
    } else {
      recordsToDelete = selectedRecords.map((o) => o._id);
    }
    if (recordsToDelete.length > 0) {
      axiosInstance()
        .put(`${salesOrder.api}/remove`, {
          ids: recordsToDelete
        })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          dispatch({ type: 'selection', selectedRecords: [] });
          setIsConformDialogVisible(false);
          setDeleteLoading(false);
          if (deleteRecord) setDeleteRecord({});
          fetchData();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setIsConformDialogVisible(false);
          setDeleteLoading(false);
        });
    }
  };

  const ActionMenuItems = () => {
    return (
      <>
        <MenuItem
          disabled={selectedRecords.every((e) => e.canDelete) ? false : true}
          onClick={() => {
            showConfirmBox(null);
          }}
        >
          {`Delete (${selectedRecords?.length})`}
        </MenuItem>
      </>
    );
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[routes.salesOrder]} />
        <ImportExportLinks
          permissions={permissions?.salesOrder}
          module={routes.salesOrder.title}
          api={salesOrder.api}
          afterImportCompleted={() => {
            fetchData();
          }}
          isExportAllOrSomeFeature={true}
          total={rowCount}
          recordsToExport={selectedRecords?.length}
          ids={selectedRecords?.map((obj) => obj._id)}
          onExportToExcelSuccess={() => {
            fetchData();
          }}
          additionalParams={getQueryString(true)}
        />
      </div>
      <CustomContainer>
        <ListingPageHeader
          toggleButtonList={types}
          onToggle={onTypeChange}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          // leftSideContents
          searchValue={search}
          onSearch={handleSearch}
          // rightSideContents
          isActionButtonVisible={true}
          actionButtonProps={{ disabled: selectedRecords?.length ? false : true }}
          actionMenuItems={<ActionMenuItems />}
          // addButtonProps
          addButtonOnclick={() => {
            setShowManageSalesOrderDialog({ open: true, isClone: false, idToClone: null });
          }}
          isAddButtonVisible={true}
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
            showFilters={true}
            resource={sidebarResource.salesOrder}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomContainer>

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
          message={`Are you sure you want to delete ${routes?.salesOrder?.title?.toLowerCase()} ${deleteRecord?.salesOrderName || ''} ?`}
          onClose={() => {
            setDeleteRecord(null);
            setIsConformDialogVisible(false);
          }}
          okBtnLoading={deleteLoading}
          onOk={handleDeleteSalesOrder}
        />
      ) : null}

      {singleSalesOrderDelete.show && (
        <ConfirmationDialog
          open={singleSalesOrderDelete.show}
          message={`Are you sure you want to delete Sales Order: ${singleSalesOrderDelete.salesOrderName}?`}
          onClose={() =>
            setSingleSalesOrderDelete({
              id: null,
              show: false,
              salesOrderName: ''
            })
          }
          onOk={handleSingleDeleteSalesOrder}
        />
      )}

      {showManageSalesOrderDialog.open && (
        <ManageSalesOrderDialog
          isClone={showManageSalesOrderDialog.isClone}
          open={showManageSalesOrderDialog.open}
          salesOrderId={showManageSalesOrderDialog.idToClone}
          onClose={() => setShowManageSalesOrderDialog({ open: false, isClone: false, idToClone: null })}
          onSuccess={() => {
            fetchData();
            setShowManageSalesOrderDialog({ open: false, isClone: false, idToClone: null });
          }}
        />
      )}
    </section>
  );
};

export default SalesOrder;
