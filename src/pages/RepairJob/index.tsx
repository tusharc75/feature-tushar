import { Box, Chip, IconButton } from '@material-ui/core';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import axios, { CancelTokenSource } from 'axios';
import { camelCase } from 'lodash';
import queryString from 'query-string';
import { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { CustomOfflineContext } from '../../StateProvider/OfflineContext/OfflineContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomContainer from '../../components/CustomContainer';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import MessageDialog from '../../components/Helpers/MessageDialog';
import {
  checkIsAllowedToDelete,
  customerAccount,
  getDefaultMyRecordType,
  gridLoadingTimeout,
  prepareDataForGrid,
  repairJob,
  sidebarResource,
  supplierAccount
} from '../../constants/helpers';
import { findAll, findOne, insertUpdate, objectStore } from '../../constants/indexdbhelper';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import ManageRepairJob from './ManageRepairJob';
import { useSetWalkmeData } from 'src/components/CustomIntro';
import { createRepairJobFlow } from './walkmeSteps';

let repairJobTimeout;

const RepairJob = () => {
  const renderedFrom = camelCase(sidebarResource?.repairJob);

  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const {
    state: { user, permissions, selectedEntity, resources }
  }: any = useData();

  const types = [
    {
      key: `My ${resources?.repairJob?.titlePlural}`,
      value: 1
    },
    {
      key: `All ${resources?.repairJob?.titlePlural}`,
      value: 2
    }
  ];

  let { referenceId, referenceType }: any = queryString.parse(history.location.search);
  const [selectedType, setSelectedType] = useState(getDefaultMyRecordType(user.user, sidebarResource.repairJob));
  const [renderCount, setRenderCount] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState<any>({});
  const [showManageRepairJobDialog, setShowManageRepairJobDialog] = useState({ open: false, isClone: false, idToClone: null });
  const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] = useState(false);
  const [singleRepairJobDelete, setSingleRepairJobDelete] = useState({
    id: null,
    show: false,
    repairJobName: ''
  });
  const [accountDetails, setAccountDetails] = useState({
    accountId: history.location?.state?.accountId,
    accountName: history.location?.state?.accountName,
    resource: history.location?.state?.resource
  });
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { isOffline } = useContext(CustomOfflineContext);
  const [columns, setColumns] = useState(null);
  const pageTitle = camelCase(`${resources?.repairJob?.titlePlural}`);
  const { setWalkmeData } = useSetWalkmeData();

  const { generateColumns, checkStaticField } = useColumns();

  useEffect(() => {
    fetchGridColumns();
    setWalkmeData([createRepairJobFlow(resources)]);
  }, []);

  const fetchGridColumns = async () => {
    let data;
    if (isOffline) {
      data = await findOne(objectStore.resource, sidebarResource.repairJob);
    } else {
      const response = await axiosInstance().get(`/field?resource=Repair Job`);
      data = response?.data?.data;
      try {
        insertUpdate(objectStore.resource, sidebarResource.repairJob, data);
      } catch (ex) {
        console.error(`Repair Job: Error while storing data for Offline context. Error: ${ex.message}`);
      }
    }
    let newColumns = generateColumns(pageTitle, data, routes.repairJobDetail.path, true);
    if (isOffline) {
      newColumns?.forEach((o) => {
        o['filter'] = false;
        o['sortable'] = false;
      });
    }
    let staticFields = getStaticFields();
    staticFields.forEach((field) => {
      newColumns.push(checkStaticField(pageTitle, field));
    });
    setColumns([...newColumns, ActionsRenderer]);
  };

  useEffect(() => {
    let millisec = Object.keys(search).length > 0 ? 600 : 5;
    if (repairJobTimeout) {
      clearTimeout(repairJobTimeout);
    }
    repairJobTimeout = setTimeout(() => {
      fetchData();
    }, millisec);
  }, [search]);

  useEffect(() => {
    if (renderCount > 0) {
      const cancelTokenSource = axios.CancelToken.source();
      fetchData(cancelTokenSource);
      return () => cancelTokenSource.cancel();
    } else setRenderCount((preCount) => preCount + 1);
  }, [page, limit, selectedType, filters, sorting, accountDetails, selectedEntity, showFilteredRecordsOnly]);

  const handleSingleDeleteRepairJob = async () => {
    dispatch({ type: 'loading', loading: true });
    axiosInstance()
      .put(`${repairJob.api}/remove`, {
        ids: [singleRepairJobDelete.id]
      })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchData();
        dispatch({ type: 'loading', loading: false });
        setSingleRepairJobDelete({ id: null, show: false, repairJobName: '' });
      })
      .catch((error) => {
        dispatch({ type: 'loading', loading: false });
        toastConfig.setToastConfig(error);
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
        {permissions.repairJob?.isCreate ? (
          <HtmlTooltip title="Clone">
            <IconButton
              size="small"
              aria-label="Clone"
              onClick={() => {
                setShowManageRepairJobDialog({ open: true, isClone: true, idToClone: row.original._id });
              }}
            >
              <FileCopyIcon fontSize="small" color="primary" />
            </IconButton>
          </HtmlTooltip>
        ) : (
          <HtmlTooltip className="cursor-stop" title="You do not have permission to clone/create">
            <IconButton aria-label="Clone" size="small">
              <FileCopyIcon fontSize="small" />
            </IconButton>
          </HtmlTooltip>
        )}
      </>
    )
  };

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}`;
    if (selectedType === 1) {
      deepFilter = deepFilter + `&myRecords=1`;
    }
    if (isExport) {
      deepFilter = `?`;
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
      deepFilter = `${deepFilter}&getById=${JSON.stringify(selectedRecords.map((m) => m._id))}`;
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
        const response: any = await axiosInstance().get(`${repairJob.api}${queryString}`, { cancelToken: cancelTokenSource?.token });
        data = response?.data?.data;
        count = response?.data?.count;
      } else {
        data = await findAll(objectStore.repairJob);
        count = data?.length || 0;
      }
      let rows = data.map((u) => {
        let finalObject: any = prepareDataForGrid(u, user);
        finalObject['isChecked'] = false;
        finalObject['canDelete'] =
          permissions?.repairJob?.isDelete && checkIsAllowedToDelete(user, sidebarResource.repairJob, finalObject?.ownerId) && u?.canDelete;
        return finalObject;
      });
      dispatch({ type: 'initialize', data: rows, count: count });
      setTimeout(() => {
        dispatch({ type: 'loading', loading: false });
      }, gridLoadingTimeout);
    } catch (error) {
      dispatch({ type: 'loading', loading: false });
      toastConfig.setToastConfig(error);
    }
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const handleDeleteRepairJob = async () => {
    setDeleteLoading(true);
    let recordsToDelete = [];
    if (deleteRecord?._id) {
      recordsToDelete.push(deleteRecord?._id);
    } else {
      recordsToDelete = selectedRecords.map((o) => o._id);
    }
    if (recordsToDelete.length > 0) {
      axiosInstance()
        .put(`${repairJob.api}/remove`, {
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

  const LeftSideContent = () => {
    return (
      <>
        {accountDetails.accountId ? (
          <Chip
            className="ml-3"
            color="primary"
            label={`Account: ${accountDetails.accountName}`}
            onDelete={() => {
              setAccountDetails({
                accountId: null,
                accountName: null,
                resource: null
              });
            }}
          />
        ) : null}
        {referenceType ? <Chip className="ml-3" color="primary" label={`Rental Job : ${referenceType}`} onDelete={updateQueryParams} /> : null}
      </>
    );
  };

  return (
    <div className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ ...routes.repairJob, title: resources?.repairJob?.titlePlural }]} />
        <ImportExportLinks
          permissions={permissions.repairJob}
          module={resources?.repairJob?.titlePlural}
          api={repairJob.api}
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
          leftSideContents={<LeftSideContent />}
          searchValue={search}
          onSearch={handleSearch}
          // rightSideContents
          isActionButtonVisible={false}
          // actionButtonProps
          // actionMenuItems
          // addButtonProps
          addButtonOnclick={() => {
            setShowManageRepairJobDialog({ open: true, isClone: false, idToClone: null });
          }}
          isAddButtonVisible={permissions?.repairJob?.isCreate}
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
            resource={sidebarResource.repairJob}
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
            message={`Are you sure you want to delete ${deleteRecord?.repairJobName ? resources?.repairJob?.titleSingular : resources?.repairJob?.titlePlural}   ${
              deleteRecord.repairJobName || ''
            }?`}
            onClose={() => {
              if (deleteRecord) setDeleteRecord({});
              setIsConformDialogVisible(false);
            }}
            okBtnLoading={deleteLoading}
            onOk={handleDeleteRepairJob}
          />
        ) : null}

        {singleRepairJobDelete.show ? (
          <ConfirmationDialog
            open={singleRepairJobDelete.show}
            message={`Are you sure you want to delete ${resources?.repairJob?.titleSingular}: ${singleRepairJobDelete.repairJobName}?`}
            onClose={() =>
              setSingleRepairJobDelete({
                id: null,
                show: false,
                repairJobName: ''
              })
            }
            onOk={handleSingleDeleteRepairJob}
          />
        ) : null}
      </CustomContainer>
      {showManageRepairJobDialog.open && (
        <ManageRepairJob
          isClone={showManageRepairJobDialog.isClone}
          repairJobId={showManageRepairJobDialog.idToClone}
          onClose={() => setShowManageRepairJobDialog({ open: false, isClone: false, idToClone: null })}
          onSuccess={(data) => {
            history.push(`${routes.repairJobDetail.path}/${data._id}`);
            setShowManageRepairJobDialog({ open: false, isClone: false, idToClone: null });
          }}
        />
      )}
    </div>
  );
};

export default RepairJob;
