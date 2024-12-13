import { Box, Button, IconButton, MenuItem } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import axios, { CancelTokenSource } from 'axios';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';
import { useData } from 'src/StateProvider/Provider';
import { IOTIcon } from 'src/assets/svg/svgIcons';
import axiosInstance from 'src/axios/axiosInstance';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import { useSetWalkmeData } from 'src/components/CustomIntro';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ImportExportLinks from 'src/components/Helpers/ImportExportLinks';
import MessageDialog from 'src/components/Helpers/MessageDialog';
import routes from 'src/components/Helpers/Routes';
import HideWhenOffline from 'src/components/HideWhenOffline';
import { ListingPageHeader } from 'src/components/PageHeaders';
import {
  CHILD_RESOURCE,
  checkIsAllowedToDelete,
  getDefaultMyRecordType,
  gridLoadingTimeout,
  prepareDataForGrid,
  rentalManagement,
  sidebarResource
} from 'src/constants/helpers';
import { findAll, findOne, insertUpdate, objectStore, setUpindexDB } from 'src/constants/indexdbhelper';
import { cloneDisable, deleteDisable } from 'src/constants/messageHelpers';
import { createRentalJobsFlow } from 'src/pages/RentalManagement/walkmeSteps';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import ManageRentalManagementDialog from './ManageRental';
import { rentalJobClearOffline, rentalJobOfflineUpdate } from './rentalOfflineHelper';

const RentalManagement = () => {
  const { setWalkmeData } = useSetWalkmeData();
  const renderedFrom = camelCase(sidebarResource?.rentalManagement);
  const toastConfig = useContext(CustomToastContext);
  const { isOffline } = useContext(CustomOfflineContext);
  const {
    state: { user, permissions, selectedEntity, resources }
  }: any = useData();

  const types = [
    {
      key: `My ${resources?.rentalManagement?.titlePlural}`,
      value: 1
    },
    {
      key: `All ${resources?.rentalManagement?.titlePlural}`,
      value: 2
    }
  ];

  const history = useHistory();

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { generateColumns, checkStaticField } = useColumns();

  const [renderCount, setRenderCount] = useState(0);
  const [selectedType, setSelectedType] = useState(getDefaultMyRecordType(user.user, sidebarResource.rentalManagement));
  const [columns, setColumns] = useState(null);
  const [showManageRentalManagementDialog, setShowManageRentalManagementDialog] = useState({ open: false, isClone: false, idToClone: null });
  const [singleRentalManagementDelete, setSingleRentalManagementDelete] = useState({
    id: null,
    show: false,
    rentalJobName: ''
  });
  const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] = useState(false);
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState<any>({});
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    setUpindexDB();
    fetchGridColumns();
  }, []);

  useEffect(() => {
    if (renderCount > 0) {
      const cancelTokenSource = axios.CancelToken.source();
      fetchData(cancelTokenSource);
      return () => cancelTokenSource.cancel();
    } else setRenderCount((preCount) => preCount + 1);
  }, [search, page, limit, selectedType, filters, sorting, selectedEntity, showFilteredRecordsOnly]);

  const extraColumns = [
    {
      accessor: 'subleaseAssets',
      Header: 'Sublease Assets',
      minWidth: 100,
      width: 100,
      disableFilters: true,
      disableSortBy: true,
      Cell: ({ row }) => <div>{row?.original?.subleaseAssets ? 'Yes' : 'No'}</div>
    }
  ];

  const fetchGridColumns = async () => {
    let data;
    if (isOffline) {
      data = await findOne(objectStore.resource, sidebarResource.rentalManagement);
    } else {
      const response = await axiosInstance().get(`/field?resource=${sidebarResource.rentalManagement}&entity=${selectedEntity}&view=true`);
      data = response?.data?.data;
      setWalkmeData([createRentalJobsFlow(data, resources)]);
      try {
        insertUpdate(objectStore.resource, sidebarResource.rentalManagement, data);
      } catch (e) {
        console.error(`Rental Offline: ${e.message}`);
      }
    }

    let newColumns = generateColumns(renderedFrom, data, routes.rentalManagementDetail.path, true);

    newColumns?.forEach((o) => {
      if (o.accessor === 'rentalJobName') {
        o.cell = ({ row }) => (
          <div>
            <Link
              className="link text-truncate"
              title={row?.original?.rentalJobName}
              to={`${routes.rentalManagement.path}/detail/${row?.original?._id}`}
            >
              {row?.original?.rentalJobName}
            </Link>
          </div>
        );
      } else {
        if (isOffline) {
          o['disableFilters'] = true;
          o['disableSortBy'] = true;
        }
      }
    });

    let staticFields: any = getStaticFields();
    if (permissions?.sublease) {
      staticFields = [...extraColumns, ...staticFields];
    }
    staticFields.forEach((field) => {
      newColumns.push(checkStaticField(renderedFrom, field));
    });
    setColumns([...newColumns, ActionsRenderer]);
  };

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 100,
    width: 100,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (
      <>
        <HideWhenOffline>
          {permissions?.iotChart?.isRead && (
            <HtmlTooltip title={`View ${resources?.iotChart?.titlePlural}`} placement="top" arrow enterTouchDelay={0}>
              <span>
                <IconButton
                  color="inherit"
                  size="small"
                  onClick={() => {
                    history.push(`${routes.iotChart.path}?referenceData=${row?.original?.shippingAddressId}`);
                  }}
                >
                  <IOTIcon size={20} />
                </IconButton>
              </span>
            </HtmlTooltip>
          )}
          <HtmlTooltip title={permissions?.rentalManagement?.isCreate ? 'Clone' : cloneDisable} placement="top" arrow enterTouchDelay={0}>
            <span>
              <IconButton
                size="small"
                aria-label="Clone"
                disabled={permissions?.rentalManagement?.isCreate ? false : true}
                onClick={() => {
                  setShowManageRentalManagementDialog({ open: true, isClone: true, idToClone: row?.original?._id });
                }}
              >
                <FileCopyIcon fontSize="small" color={permissions?.rentalManagement?.isCreate ? 'primary' : 'disabled'} />
              </IconButton>
            </span>
          </HtmlTooltip>
          <HtmlTooltip title={row?.original.canDelete ? 'Delete' : deleteDisable} placement="top" arrow enterTouchDelay={0}>
            <span>
              <IconButton
                size="small"
                aria-label="Delete"
                disabled={row?.original.canDelete ? false : true}
                onClick={() => {
                  setSingleRentalManagementDelete({
                    show: true,
                    id: row?.original?._id,
                    rentalJobName: `${row?.original?.rentalJobName}`
                  });
                }}
              >
                <DeleteIcon fontSize="small" color={row?.original.canDelete ? 'error' : 'disabled'} />
              </IconButton>
            </span>
          </HtmlTooltip>
        </HideWhenOffline>
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

    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || []).map((m) => m._id))}`;
    }

    const { filterByIds, deepFilters } = gridFilterParser(filters);

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

    try {
      let data: any = [],
        count;
      if (!isOffline) {
        const response: any = await axiosInstance().get(`${rentalManagement.api}${queryString}`, { cancelToken: cancelTokenSource?.token });
        data = response?.data?.data;
        count = response?.data?.count;
      } else {
        data = await findAll(objectStore.rentalManagement);
        count = data?.length || 0;
      }
      let rows = data.map((u) => {
        let finalObject: any = prepareDataForGrid(u, user);
        finalObject['isChecked'] = selectedRecords.some((s) => s._id === u._id);
        finalObject['canDelete'] =
          permissions?.rentalManagement?.isDelete &&
          u?.material?.length === 0 &&
          checkIsAllowedToDelete(user, sidebarResource.rentalManagement, finalObject?.ownerId);
        return finalObject;
      });
      dispatch({ type: 'initialize', data: rows, count: count });
    } catch (error) {
      toastConfig.setToastConfig(error);
    } finally {
      const timeout = setTimeout(() => {
        dispatch({ type: 'loading', loading: false });
      }, gridLoadingTimeout);
      return () => clearTimeout(timeout);
    }
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const handleAddOffline = async () => {
    const data: any = [];
    selectedRecords.forEach((element) => {
      data.push(element._id);
    });
    await rentalJobOfflineUpdate(data);
    axiosInstance()
      .get(`/field/child?resource=${CHILD_RESOURCE.rentalManagementProduct}`)
      .then(({ data: { data } }) => {
        insertUpdate(objectStore.resource, CHILD_RESOURCE.rentalManagementProduct, data);
      });
    axiosInstance()
      .get(`/field/child?resource=${CHILD_RESOURCE.rentalManagementCost}`)
      .then(({ data: { data } }) => {
        insertUpdate(objectStore.resource, CHILD_RESOURCE.rentalManagementCost, data);
      });
    axiosInstance()
      .get(`/field?resource=${sidebarResource.deliveryTicket}&showHiddenFields=true`)
      .then(({ data: { data } }) => {
        insertUpdate(objectStore.resource, sidebarResource.deliveryTicket, data);
      });
    axiosInstance()
      .get(`/field?resource=${sidebarResource.serializedAsset}&view=true`)
      .then(({ data: { data } }) => {
        insertUpdate(objectStore.resource, sidebarResource.serializedAsset, data);
      });
    axiosInstance()
      .get(`/field?resource=${sidebarResource.product}&view=true`)
      .then(({ data: { data } }) => {
        insertUpdate(objectStore.resource, sidebarResource.product, data);
      });

    dispatch({ type: 'selection', selectedRecords: [] });
  };

  const handleRemoveoffline = async (ids: any[] = []) => {
    await rentalJobClearOffline(ids);
  };

  const handleSingleDelete = async () => {
    dispatch({ type: 'loading', loading: true });
    axiosInstance()
      .put(`${rentalManagement.api}/remove`, {
        ids: [singleRentalManagementDelete.id]
      })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchData();
        dispatch({ type: 'loading', loading: false });
        setSingleRentalManagementDelete({ id: null, show: false, rentalJobName: '' });
      })
      .catch((error) => {
        dispatch({ type: 'loading', loading: false });
        toastConfig.setToastConfig(error);
      });
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    let recordsToDelete = [];
    if (deleteRecord?._id) {
      recordsToDelete.push(deleteRecord?._id);
    } else {
      recordsToDelete = selectedRecords?.map((o) => o._id);
    }
    if (recordsToDelete.length > 0) {
      axiosInstance()
        .put(`${rentalManagement.api}/remove`, {
          ids: recordsToDelete
        })
        .then(({ data }) => {
          dispatch({ type: 'selection', selectedRecords: [] });
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
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

  const showConfirmBox = (row) => {
    if (row) {
      setIsConformDialogVisible(true);
      if (row && row._id) {
        setDeleteRecord(row);
      }
    } else {
      if (selectedRecords?.find((d) => d.canDelete === false)) {
        setShowDeleteWarningConfirmBox(true);
      } else {
        setIsConformDialogVisible(true);
      }
    }
  };

  const LeftSideButtons = () => {
    return (
      <>
        {permissions?.planning?.isRead && (
          <>
            <Button
              className={'toggleButton-v1'}
              onClick={() => {
                history.push({
                  pathname: routes.planning.path,
                  state: 'Rental Job'
                });
              }}
            >
              Planned Rental
            </Button>
          </>
        )}
        {permissions?.planningView?.isRead && (
          <Button
            className={'toggleButton-v1'}
            onClick={() => {
              history.push({
                pathname: routes.planningView.path,
                state: {
                  resource: sidebarResource?.rentalManagement
                }
              });
            }}
          >
            <span>{`Calendar`}</span>
          </Button>
        )}
      </>
    );
  };

  const ActionMenuItems = () => {
    return (
      <>
        {selectedRecords?.length > 0 && (
          <MenuItem
            disabled={selectedRecords.every((e) => e.canDelete) ? false : true}
            onClick={() => {
              showConfirmBox(null);
            }}
          >
            {`Delete (${selectedRecords?.length})`}
          </MenuItem>
        )}
        <MenuItem disabled={!selectedRecords.length} onClick={() => handleAddOffline()}>
          {`Add ${resources?.rentalManagement?.titlePlural} Offline`}
        </MenuItem>
        <MenuItem
          disabled={!selectedRecords.length}
          onClick={() => handleRemoveoffline(selectedRecords?.map((e) => e._id))}
        >{`Clear Offline Data (${selectedRecords.length})`}</MenuItem>
        <MenuItem onClick={() => handleRemoveoffline()}>Clear All Offline Data</MenuItem>
      </>
    );
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ ...routes?.rentalManagement, title: resources?.rentalManagement?.titlePlural }]} />
        <ImportExportLinks
          permissions={permissions?.rentalManagement}
          module={resources?.rentalManagement?.titlePlural}
          api={rentalManagement.api}
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
          onToggle={() => dispatch({ type: 'pageChange', page: 0 })}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          leftSideContents={<LeftSideButtons />}
          searchValue={search}
          onSearch={handleSearch}
          isActionButtonVisible={true}
          actionMenuItems={<ActionMenuItems />}
          isAddButtonVisible={permissions?.rentalManagement?.isCreate && permissions?.rentalManagement?.isUpdate}
          addButtonOnclick={() => {
            setShowManageRentalManagementDialog({ open: true, isClone: false, idToClone: null });
          }}
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
            resource={sidebarResource.rentalManagement}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}

        {showDeleteWarningConfirmBox && (
          <MessageDialog
            open={showDeleteWarningConfirmBox}
            message={`You are trying to delete records which you do not have permission to delete, Please remove those records from selection and try again.`}
            onClose={() => setShowDeleteWarningConfirmBox(false)}
          />
        )}

        {isConfirmDialogVisible && (
          <ConfirmationDialog
            open={isConfirmDialogVisible}
            message={`Are you sure you want to delete selected ${resources?.rentalManagement?.titleSingular?.toLowerCase()} ?`}
            onClose={() => {
              if (deleteRecord) setDeleteRecord({});
              setIsConformDialogVisible(false);
            }}
            okBtnLoading={deleteLoading}
            onOk={handleDelete}
          />
        )}

        {singleRentalManagementDelete.show && (
          <ConfirmationDialog
            open={singleRentalManagementDelete.show}
            message={`Are you sure you want to delete this ${resources?.rentalManagement?.titleSingular?.toLowerCase()} ${singleRentalManagementDelete ? (singleRentalManagementDelete?.id ? singleRentalManagementDelete?.rentalJobName : '') : ''
              }?`}
            onClose={() =>
              setSingleRentalManagementDelete({
                id: null,
                show: false,
                rentalJobName: ''
              })
            }
            onOk={handleSingleDelete}
          />
        )}

        {showManageRentalManagementDialog.open && (
          <ManageRentalManagementDialog
            isClone={showManageRentalManagementDialog.isClone}
            open={showManageRentalManagementDialog.open}
            rentalManagementId={showManageRentalManagementDialog.idToClone}
            onClose={() => setShowManageRentalManagementDialog({ open: false, isClone: false, idToClone: null })}
            onSuccess={() => {
              if (!isOffline) {
                fetchData();
              }
              setShowManageRentalManagementDialog({ open: false, isClone: false, idToClone: null });
            }}
          />
        )}
      </CustomContainer>
    </section>
  );
};

export default RentalManagement;
