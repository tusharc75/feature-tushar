import { useState, useEffect, useContext, useReducer, Fragment } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { Chip, Grid, IconButton, Tooltip, Fab } from '@material-ui/core';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { FaRegistered } from 'react-icons/fa';
import queryString from 'query-string';
import ManageRepairJobDialog from './ManageRepairJob';
import { isObjectEmpty, customerAccount, supplierAccount, gridLoadingTimeout, repairJob, prepareDataForGrid, getLocalStorageArrayData } from '../../constants/helpers';
import CustomContainer from '../../components/CustomContainer';
import routes from './../../components/Helpers/Routes';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import MessageDialog from '../../components/Helpers/MessageDialog';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import CustomAgGrid, { reducer, intialState } from '../../components/AgGridComponents/CustomAgGrid';
import RepairJobHeader from './RepairJobHeader';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import { isMobile, isTablet } from 'react-device-detect';
import CustomSwipableList from "../../components/SwipableListComponents/CustomSwipableList";
import useColumns, { getStaticFields, getFrameworkComponents, checkStaticField } from '../../constants/useColumns';
import { findAll, findOne, insertUpdate, objectStore } from '../../constants/indexdbhelper';
import { camelCase } from 'lodash'
import { CustomOfflineContext } from '../../StateProvider/OfflineContext/OfflineContext';
import { FaSuitcase, SiStatuspage, FaWarehouse, GiAutoRepair, GrStatusInfo, BsFillPersonFill, GiCargoShip, FaShippingFast, RiSpaceShipFill } from "react-icons/all"


let repairJobTimeout;
const RepairJobType = [
  {
    key: 'All Repair Job',
    value: 1
  },
  {
    key: 'My Repair Job',
    value: 2
  }
];

const RepairJob = () => {
  const renderedFrom = camelCase(routes?.repairJob.title)
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();
  const { type }: any = queryString.parse(history.location.search);
  const [selectedType, setSelectedType] = useState(type ? parseInt(type) : 1);
  const [renderCount, setRenderCount] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showTransferEntityDialog, setShowTransferEntityDialog] = useState(false);
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
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows, showFilteredRecordsOnly } = state;
  const [isAllChecked, setIsAllChecked] = useState(false);
  const [frameworkComponents, setFrameworkComponents] = useState({});
  const { isOffline, offlineGridData, updateOfflineGridData, offlineFieldsData, updateFieldsData } = useContext(CustomOfflineContext);
  const [columns, setColumns] = useState([]);
  const pageTitle = camelCase(`${routes.repairJob.title}`)
  const localStorageSelectedRecords = `${renderedFrom}_selected`

  const { getColumnData } = useColumns();

  const [fromRental, setFromRental] = useState(history.location?.state?.rental);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = async () => {
    let data
    if (isOffline) {
      data = await findOne(objectStore.resource, objectStore.repairJob)
    }
    else {
      const response = await axiosInstance().get(`/field?resource=Repair Job`)
      data = response?.data?.data
      try {
        insertUpdate(objectStore.resource, objectStore.repairJob, data);
      } catch (ex) {
        console.error(`Repair Job: Error while storing data for Offline context. Error: ${ex.message}`)
      }
    }
    let columns = []
    let rendererNames = []
    data.forEach(o => {
      let currentColumn = getColumnData(pageTitle, o?.fieldData, routes.repairJobDetail.path)
      if (currentColumn !== null) {
        if (isOffline) {
          currentColumn.columnData["filter"] = false
          currentColumn.columnData["sortable"] = false
        }
        columns = [...columns, currentColumn?.columnData]
        if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
          rendererNames.push(currentColumn?.rendererName)
        }
      }
      return o?.fieldData
    })
    let tempFrameworkComponent = getFrameworkComponents(rendererNames, true)
    tempFrameworkComponent = {
      ...tempFrameworkComponent,
      actionsRenderer: ActionsRenderer
    }
    setFrameworkComponents({ ...tempFrameworkComponent })
    let staticFields = getStaticFields()
    staticFields.forEach(field => {
      columns.push(checkStaticField(pageTitle, field))
    })
    setColumns([...columns])
  };

  //  Grid Variables - End
  const [locationKeys, setLocationKeys] = useState([])
  useEffect(() => {
    return history.listen(location => {
      const { type }: any = queryString.parse(history.location.search);
      if (history.action === 'PUSH') {
        setLocationKeys([location.key])
      }
      if (history.action === 'POP') {
        if (locationKeys[1] === location.key) {
          setLocationKeys(([_, ...keys]) => keys)
          // Handle forward event
          setSelectedType(type ? parseInt(type) : 1)

        } else {
          setLocationKeys((keys) => [location.key, ...keys])
          // Handle back event
          setSelectedType(type ? parseInt(type) : 1)

        }
      }
    })
  }, [locationKeys,])


  useEffect(() => {
    let millisec = Object.keys(search).length > 0 ? 600 : 5;
    if (repairJobTimeout) {
      clearTimeout(repairJobTimeout);
    }
    repairJobTimeout = setTimeout(() => {
      fetchRepairJobs();
    }, millisec);
  }, [search]);

  useEffect(() => {
    if (renderCount > 0) {
      fetchRepairJobs();
    } else setRenderCount((preCount) => preCount + 1);
  }, [page, limit, selectedType, filters, sorting, accountDetails, fromRental, selectedEntity, showFilteredRecordsOnly]);

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
        fetchRepairJobs();
        dispatch({ type: 'loading', loading: false });
        setSingleRepairJobDelete({ id: null, show: false, repairJobName: '' });
      })
      .catch((error) => {
        dispatch({ type: 'loading', loading: false });
        toastConfig.setToastConfig(error);
      });
  };

  const ActionsRenderer = (params) => (
    <>
      {permissions.repairJob?.isCreate ? (
        <Tooltip title="Clone">
          <IconButton
            size="small"
            aria-label="Clone"
            onClick={() => {
              setShowManageRepairJobDialog({ open: true, isClone: true, idToClone: params.data._id });
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

      {/* <GridDeleteIcon
        hasDeletePermission={permissions.repairJob?.isDelete}
        ownerId={params.data.ownerId}
        userId={user?.user?._id}
        onDelete={() =>
          setSingleRepairJobDelete({
            show: true,
            id: params.data._id,
            repairJobName: `${params.data.repairJobName}`
          })
        }
        entity="repair job"
      /> */}
    </>
  );

  const replaceFieldName = (field) => {
    switch (field) {
      case 'createdBy':
        return 'createdBy.user.concatedName';

      case 'updatedBy':
        return 'updatedBy.user.concatedName';

      default:
        return field;
    }
  };

  const replaceFieldNameForSorting = (field) => {
    const updatedField = replaceFieldName(field);

    if (field !== updatedField) return updatedField;

    switch (field) {
      case 'owner':
        return 'owner.optionLabel';

      case 'customerAccount':
        return 'customerAccount.optionLabel';

      case 'supplierAccountName':
        return 'supplierAccountName.optionLabel';

      default:
        return field;
    }
  };

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}&filterRepairJobs=${selectedType}`;
    if (isExport) {
      deepFilter = `filterRepairJobs=${selectedType}`;
    }
    let filterById = [];
    if (accountDetails.accountId) {
      if (accountDetails.resource === customerAccount.accountResource) {
        filterById.push({
          field: replaceFieldName('customerAccount'),
          term: accountDetails.accountId
        });
      } else if (accountDetails.resource === supplierAccount.accountResource) {
        filterById.push({
          field: replaceFieldName('supplierAccountName'),
          term: { $in: [accountDetails.accountId] }
        });
      }
    }
    if (fromRental) {
      filterById.push({ field: "rentalJob", term: fromRental?._id });
    }
    if (filterById.length) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterById)}`
    }
    if (!isObjectEmpty(filters)) {
      const updatedFilters = [];
      Object.keys(filters).forEach((field) => {
        updatedFilters.push({
          field: replaceFieldName(field),
          term: filters[field].filter
        });
      });
      deepFilter = `${deepFilter}&deepFilter=${encodeURI(JSON.stringify(updatedFilters))}&filterType=and`;
    }
    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${replaceFieldNameForSorting(sorting[0].colId)}&orderBy=${sorting[0].sort}`;
    }
    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURI(search)}`;
    }
    if (showFilteredRecordsOnly) {
      const savedRecords = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : [];
      deepFilter = `${deepFilter}&getById=${JSON.stringify(savedRecords.map(m => m._id))}`;
    }
    return deepFilter;
  };

  const fetchRepairJobs = async () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    if (gridApi) {
      gridApi.setRowData([]);
    }
    try {
      let data: any = [], count;
      if (!isOffline) {
        const response: any = await axiosInstance().get(`${repairJob.api}${queryString}`);
        data = response?.data?.data;
        count = response?.data?.count;
      }
      else {
        data = await findAll(objectStore.repairJob);
        count = data?.length || 0;
      }
      let rows = data.map((u) => {
        let finalObject = prepareDataForGrid(u, user);
        finalObject["isChecked"] = false;
        finalObject["allowedToEdit"] = permissions?.repairJob?.isUpdate;
        finalObject["owerCollaboratorInitialsOrImages"] = [];
        if (finalObject["owner"])
          finalObject["owerCollaboratorInitialsOrImages"].push({ initials: finalObject["owner"] }); finalObject["owerCollaboratorInitialsOrImages"].forEach((f) => {
            if (f.initials) {
              f.initials = f.initials.split(" ").map((i) => i[0]).join("");
            }
          })
        return finalObject;
      });
      if (appendRows) {
        dispatch({ type: "initialize", data: [...dataRows, ...rows], count: count });
      } else {
        dispatch({ type: "initialize", data: rows, count: count });
      }
      setTimeout(() => {
        dispatch({ type: "loading", loading: false });
      }, gridLoadingTimeout);
    } catch (error) {
      dispatch({ type: "loading", loading: false });
      toastConfig.setToastConfig(error);
    }
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const handleRepairJobTypeSel = (filterValues) => {
    setSelectedType(filterValues);
    history.push(`?type=${filterValues}`)
  };

  const handleTransferEntityDialog = () => {
    setShowTransferEntityDialog(true);
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

  const clickCreateNew = () => {
    setShowManageRepairJobDialog({ open: true, isClone: false, idToClone: null });
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
          setIsConformDialogVisible(false);
          setDeleteLoading(false);
          if (deleteRecord) setDeleteRecord({});
          fetchRepairJobs();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setIsConformDialogVisible(false);
          setDeleteLoading(false);
        });
    }
  };

  return (
    <Fragment>
      <Grid container className="headerbox">
        <Grid item md={4} sm={11} xs={10}>
          <CustomBreadCrumbs routes={[routes.repairJob]} />
        </Grid>
        <Grid item md={8} sm={1} xs={2}>
          <Grid container direction="row">
            <Grid item xs={12} sm={12}>
              <Grid container justify="flex-end">
                <ImportExportLinks
                  permissions={permissions.repairJob}
                  module="repairJob"
                  api={repairJob.api}
                  afterImportCompleted={() => { fetchRepairJobs() }}
                  isExportAllOrSomeFeature={true}
                  total={rowCount}
                  recordsToExport={getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length}
                  ids={
                    getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length
                      ? getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.map((obj) => obj._id)
                      : []
                  }
                  onExportToExcelSuccess={() => {
                    if (gridApi) gridApi.deselectAll()
                    else fetchRepairJobs()
                  }}
                  additionalParams={getQueryString(true)}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      <CustomContainer>
        <div className="header-panel">
          <RepairJobHeader
            selectedType={selectedType}
            selectedRecords={selectedRecords}
            onTypeChange={handleRepairJobTypeSel}
            options={RepairJobType}
            onSearch={handleSearch}
            columns={columns}
            dispatch={dispatch}
            searchVal={search}
            RepairJobPermissions={permissions.repairJob}
            onCreate={clickCreateNew}
            showConfirmBox={showConfirmBox}
            canDelete={selectedRecords.length === 0}
            icon={<FaRegistered className="headerLogo" />}
            heading={routes.repairJob.title}
            showTransferEntityDialog={handleTransferEntityDialog}
            filters={filters}
          // showCloneRepairJobDialog={() => {
          //   handleShowCloneRepairJobDialog()
          // }}
          >
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
            {fromRental && (
              <Chip
                className="ml-3"
                color="primary"
                label={`Rental Job : ${fromRental?.rentalJobName}`}
                onDelete={() => {
                  setFromRental(null);
                }}
              />
            )}
          </RepairJobHeader>
        </div>
        {
          Object.keys(frameworkComponents).length > 0 ?
            isMobile && !isTablet ?
              <CustomSwipableList
                allowSelection={true}
                allowSwipe={true}
                permissions={permissions.repairJob}
                primaryField={columns?.find(d => d.primaryField)}
                onClick={(data) => {
                  history.push(`${routes.repairJobDetail.path}/${data._id}`)
                }}
                dataRows={dataRows}
                selectedRecords={selectedRecords}
                dispatch={dispatch}
                onEdit={(data) => {
                  history.push(`${routes.repairJobDetail.path}/${data._id}?openEdit=true`)
                }}
                extraParamsToCheckDelete={true}
                onDelete={(data) => {
                  setDeleteRecord(data._id);
                  setIsConformDialogVisible(true);
                }}
                rowCount={rowCount}
                page={page}
                loading={loading}
                chips={[
                  {
                    icon: <SiStatuspage />,
                    label: "Status: ",
                    field: "status",
                  }
                ]}
                onCreate={false}
                showClone={true}
                onClone={(data) => { setShowManageRepairJobDialog({ open: true, isClone: true, idToClone: data._id }); }}
                renderedFrom={renderedFrom}
              /> :
              <CustomAgGrid
                columns={columns}
                dataRows={dataRows}
                frameworkComponents={frameworkComponents}
                setGridApi={setGridApi}
                dispatch={dispatch}
                rowCount={rowCount}
                limit={limit}
                pageSizes={pageSizes}
                page={page}
                actionWidth={100}
                loading={loading}
                renderedFrom={renderedFrom}
                refreshGrid={fetchRepairJobs}
                showOnlyShowFilteredRecordSwitch={true}
              /> : null
        }

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
        <ManageRepairJobDialog
          isClone={showManageRepairJobDialog.isClone}
          repairJobId={showManageRepairJobDialog.idToClone}
          onClose={() => setShowManageRepairJobDialog({ open: false, isClone: false, idToClone: null })}
          onSuccess={(data) => {
            history.push(`${routes.repairJobDetail.path}/${data._id}`);
            setShowManageRepairJobDialog({ open: false, isClone: false, idToClone: null });
          }}
        />
      )}
    </Fragment>
  );
};

export default RepairJob;
