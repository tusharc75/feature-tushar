import { useState, useEffect, useContext, useReducer, Fragment } from 'react';
import { useHistory } from 'react-router-dom';
import { Chip, IconButton, Tooltip, Button, Box } from '@material-ui/core';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import queryString from 'query-string';
import ManageRepairJob from './ManageRepairJob';
import {
  customerAccount,
  supplierAccount,
  gridLoadingTimeout,
  repairJob,
  prepareDataForGrid,
  sidebarResource
} from '../../constants/helpers';
import CustomContainer from '../../components/CustomContainer';
import routes from './../../components/Helpers/Routes';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import MessageDialog from '../../components/Helpers/MessageDialog';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import { findAll, findOne, insertUpdate, objectStore } from '../../constants/indexdbhelper';
import { camelCase } from 'lodash';
import { CustomOfflineContext } from '../../StateProvider/OfflineContext/OfflineContext';
import CustomReactTable, { checkStaticField, getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTableNew';
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import { AddOutlined } from '@material-ui/icons';
import SearchBox from 'src/components/Helpers/SearchBox';
import styles from '../Leads/Header.module.scss';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

let repairJobTimeout;

const RepairJob = () => {

  const types = [
    {
      key: `My ${routes?.repairJob.title}`,
      value: 1
    },
    {
      key: `All ${routes?.repairJob.title}`,
      value: 2
    }
  ];

  const renderedFrom = camelCase(routes?.repairJob.title);

  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();
  let { type, referenceId, referenceType }: any = queryString.parse(history.location.search);
  const [selectedType, setSelectedType] = useState(type ? parseInt(type) : 1);
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
  const { state, dispatch } = useTableReducer();
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { isOffline } = useContext(CustomOfflineContext);
  const [columns, setColumns] = useState(null);
  const pageTitle = camelCase(`${routes.repairJob.title}`);


  const { getColumnData } = useColumns();

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = async () => {
    let data;
    if (isOffline) {
      data = await findOne(objectStore.resource, objectStore.repairJob);
    } else {
      const response = await axiosInstance().get(`/field?resource=Repair Job`);
      data = response?.data?.data;
      try {
        insertUpdate(objectStore.resource, objectStore.repairJob, data);
      } catch (ex) {
        console.error(`Repair Job: Error while storing data for Offline context. Error: ${ex.message}`);
      }
    }
    let columns = [];
    data.forEach((o) => {
      let currentColumn = getColumnData(pageTitle, o?.fieldData, routes.repairJobDetail.path, true);
      if (currentColumn !== null) {
        if (isOffline) {
          currentColumn.columnData['filter'] = false;
          currentColumn.columnData['sortable'] = false;
        }
        columns = [...columns, currentColumn?.columnData];
      }
      return o?.fieldData;
    });
    let staticFields = getStaticFields();
    staticFields.forEach((field) => {
      columns.push(checkStaticField(pageTitle, field));
    });
    setColumns([...columns, ActionsRenderer]);
  };

  //  Grid Variables - End
  const [locationKeys, setLocationKeys] = useState([]);
  useEffect(() => {
    return history.listen((location) => {
      const { type }: any = queryString.parse(history.location.search);
      if (history.action === 'PUSH') {
        setLocationKeys([location.key]);
      }
      if (history.action === 'POP') {
        if (locationKeys[1] === location.key) {
          setLocationKeys(([_, ...keys]) => keys);
          // Handle forward event
          setSelectedType(type ? parseInt(type) : 1);
        } else {
          setLocationKeys((keys) => [location.key, ...keys]);
          // Handle back event
          setSelectedType(type ? parseInt(type) : 1);
        }
      }
    });
  }, [locationKeys]);

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
      fetchData();
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
          <Tooltip title="Clone">
            <IconButton
              size="small"
              aria-label="Clone"
              onClick={() => {
                setShowManageRepairJobDialog({ open: true, isClone: true, idToClone: row.original._id });
              }}
            >
              <FileCopyIcon fontSize="small" color="primary" />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip className="cursor-stop" title="You do not have permission to clone/create">
            <IconButton aria-label="Clone" size="small">
              <FileCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </>
    )

  }

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

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    try {
      let data: any = [],
        count;
      if (!isOffline) {
        const response: any = await axiosInstance().get(`${repairJob.api}${queryString}`);
        data = response?.data?.data;
        count = response?.data?.count;
      } else {
        data = await findAll(objectStore.repairJob);
        count = data?.length || 0;
      }
      let rows = data.map((u) => {
        let finalObject: any = prepareDataForGrid(u, user);
        finalObject['isChecked'] = false;
        finalObject['canDelete'] = permissions?.repairJob?.isDelete && finalObject?.ownerId === user?.user?._id && u?.canDelete;
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
    const value = types.find((d) => d.key === type).value;
    setSelectedType(value);
    history.push(`?type=${value}`);
  };

  return (
    <div className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[routes.repairJob]} />
        <ImportExportLinks
          permissions={permissions.repairJob}
          module="repairJob"
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
        <div className="header-panel">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            <div className={'d-flex flex-wrap align-items-center gap-1 w-full'}>
              <ToggleButtonGroup
                size="small"
                className="ml-2 align-items-center gap-1 layout-for-mobile "
                value={types[selectedType - 1].key}
                exclusive
                onChange={onTypeChange}
              >
                {types.map((k, index) => {
                  return (
                    <ToggleButton value={k.key} key={index}>
                      {k.key}
                    </ToggleButton>
                  );
                })}
              </ToggleButtonGroup>
              {accountDetails.accountId && (
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
              )}
              {referenceType && <Chip className="ml-3" color="primary" label={`Rental Job : ${referenceType}`} onDelete={updateQueryParams} />}
            </div>
            <div className="flex flex-wrap gap-[8px]  justify-end">
              <SearchBox
                onChange={handleSearch}
                className={styles.search_box_input}
                value={search}
                size="small" />
              <div className="flex gap-[8px] flex-wrap items-center">
                {permissions?.repairJob?.isCreate && (
                  <Button
                    variant={'contained'}
                    color="primary"
                    size="small"
                    onClick={() => {
                      setShowManageRepairJobDialog({ open: true, isClone: false, idToClone: null });
                    }
                    }
                    className={`no-shadow`}
                    startIcon={<AddOutlined />}>
                    Add
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
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
            message={`Are you sure you want to delete ${deleteRecord?.repairJobName ? 'Repair Job' : 'Repair Jobs'}   ${deleteRecord.repairJobName || ''
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
            message={`Are you sure you want to delete Repair Job: ${singleRepairJobDelete.repairJobName}?`}
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
