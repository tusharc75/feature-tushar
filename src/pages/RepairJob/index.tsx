import { useState, useEffect, useContext, useReducer, Fragment } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { Chip, Grid, IconButton, Tooltip, Fab } from '@material-ui/core';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { FaRegistered } from 'react-icons/fa';
import queryString from 'query-string';
import ManageRepairJobDialog from './ManageRepairJob';
import { isObjectEmpty, customerAccount, supplierAccount, gridLoadingTimeout, repairJob } from '../../constants/helpers';
import CustomContainer from '../../components/CustomContainer';
import routes from './../../components/Helpers/Routes';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import MessageDialog from '../../components/Helpers/MessageDialog';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import { CommonRenderer, CreatedByRenderer, DateRenderer, UpdatedByRenderer } from '../../components/AgGridComponents/CustomAgGridCellRenderers';
import GridDeleteIcon from '../../components/Helpers/GridDeleteIcon';
import CustomAgGrid, { reducer, intialState } from '../../components/AgGridComponents/CustomAgGrid';
import NoDataCell from '../../components/Helpers/NoDataCell';
import RepairJobHeader from './RepairJobHeader';

import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import { isMobile, isTablet } from 'react-device-detect';
import CustomSwipableList from "../../components/SwipableListComponents/CustomSwipableList";
import AddIcon from "@material-ui/icons/Add"

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
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows } = state;
  const [isAllChecked, setIsAllChecked] = useState(false);
  const columns = [
    {
      field: 'repairJobName',
      headerName: 'Repair Job Name',
      show: true,
      disabled: true,
      cellRenderer: 'repairJobNameRenderer',
      primaryField: 'true'
    },
    {
      field: 'status',
      headerName: 'Status',
      show: true,
      disabled: false,
      cellRenderer: 'commonRenderer'
    },
    {
      field: 'productInventory',
      headerName: 'Product Inventory',
      show: true,
      disabled: false,
      cellRenderer: 'commonRenderer'
    },
    {
      field: 'repairPerson',
      headerName: 'Repair Person',
      show: true,
      disabled: false,
      cellRenderer: 'repairPersonRenderer'
    },
    {
      field: 'typeOfRepair',
      headerName: 'Type Of Repair',
      show: true,
      disabled: false,
      cellRenderer: 'commonRenderer'
    },
    {
      field: 'createdBy',
      headerName: 'Created By',
      show: true,
      cellRenderer: 'createdByRenderer'
    },
    {
      field: 'updatedBy',
      headerName: 'Updated By',
      show: true,
      cellRenderer: 'updatedByRenderer'
    },
    {
      field: 'owner',
      headerName: 'Repair Job Owner',
      show: true,
      cellRenderer: 'OwnerRenderer'
    }
  ];
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
    // eslint-disable-next-line
  }, [search]);

  useEffect(() => {
    if (renderCount > 0) {
      fetchRepairJobs();
    } else setRenderCount((preCount) => preCount + 1);
  }, [page, limit, selectedType, filters, sorting, accountDetails, selectedEntity]);

  const handleSingleDeleteRepairJob = async () => {
    dispatch({ type: 'loading', loading: true });

    axiosInstance()
      .put(`${repairJob.repairJobApi}/remove`, {
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

  const RepairJobNameRenderer = (params) => (
    <>
      <Link className="text-truncate link" title={params.value} to={`${routes.repairJob.path}/detail/${params.data._id}`}>
        {params.value}
      </Link>
    </>
  );

  const RepairPersonRenderer = (params) => (
    <>
      {params.value ? (
        <Link className="link" title={params.value} to={`${routes.user.path}/detail/${params.data.repairPersonId}`}>
          {params.value}
        </Link>
      ) : (
        <NoDataCell />
      )}
    </>
  );

  // const ProductInventoryRenderer = (params) => (
  //   <>
  //     {params.value ? (
  //       <Link className="link" to={`${routes.opportunityDetail.path}/${params.data.relatedOpportunityId}`} title={params.value}>
  //         {params.value}
  //       </Link>
  //     ) : (
  //       <NoDataCell />
  //     )}
  //   </>
  // );

  const OwnerRenderer = (params) => (
    <>
      {params.value ? (
        <Link className="link" to={`${routes.userDetail.path}/${params.data.ownerId}`} title={params.owner}>
          {params.value}
        </Link>
      ) : (
        <NoDataCell />
      )}
    </>
  );

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

  const frameworkComponents = {
    repairJobNameRenderer: RepairJobNameRenderer,
    repairPersonRenderer: RepairPersonRenderer,
    // productInventoryRenderer: ProductInventoryRenderer,
    ownerRenderer: OwnerRenderer,
    createdByRenderer: CreatedByRenderer,
    updatedByRenderer: UpdatedByRenderer,
    actionsRenderer: ActionsRenderer,
    commonRenderer: CommonRenderer,
    dateRenderer: DateRenderer
  };

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

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}&filterRepairJobs=${selectedType}`;
    if (accountDetails.accountId) {
      if (accountDetails.resource === customerAccount.accountResource) {
        deepFilter = `${deepFilter}&filterById=${JSON.stringify([
          {
            field: replaceFieldName('customerAccount'),
            term: accountDetails.accountId
          }
        ])}`;
      } else if (accountDetails.resource === supplierAccount.accountResource) {
        deepFilter = `${deepFilter}&filterById=${JSON.stringify([
          {
            field: replaceFieldName('supplierAccountName'),
            term: { $in: [accountDetails.accountId] }
          }
        ])}`;
      }
    }

    if (!isObjectEmpty(filters)) {
      const updatedFilters = [];

      Object.keys(filters).forEach((field) => {
        updatedFilters.push({
          field: replaceFieldName(field),
          term: filters[field].filter
        });
      });
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(updatedFilters))}&filterType=and`;
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${replaceFieldNameForSorting(sorting[0].colId)}&orderBy=${sorting[0].sort}`;
    }

    if (search) {
      deepFilter = `${deepFilter}&search=${search}`;
    }

    return deepFilter;
  };

  const fetchRepairJobs = async () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();

    if (gridApi) {
      gridApi.setRowData([]);
    }

    axiosInstance()
      .get(`${repairJob.repairJobApi}${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data.map((u) => {
          const { owner, collaborator, createdBy, updatedBy, customerAccount, ...restProperties } = u;

          let res = {
            ...restProperties,
            id: u._id,
            productInventory: u.productInventory?.map((p) => p.optionLabel).join(', '),
            repairPerson: u.repairPerson?.optionLabel,
            repairPersonId: u.repairPerson?.optionValue,
            owner: u.createdBy?.user?.concatedName,
            ownerId: u.createdBy?.user?._id,
            createdBy: u.createdBy?.user?.concatedName,
            createdByDate: u.createdBy?.date,
            updatedBy: u.updatedBy?.user?.concatedName,
            updatedByDate: u.updatedBy?.date,

            canDelete: u.createdBy?.user?._id === user?.user._id,
            isChecked: false,
            allowedToEdit: permissions?.repairJob?.isUpdate
          };
          return res;
        });

        if (appendRows) {
          dispatch({ type: "initialize", data: [...dataRows, ...rows], count: count });
        } else {
          dispatch({ type: "initialize", data: rows, count: count });
        }

        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        dispatch({ type: 'loading', loading: false });
        toastConfig.setToastConfig(error);
      });
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
        .put(`${repairJob.repairJobApi}/remove`, {
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
                  api={repairJob.repairJobApi}
                  afterImportCompleted={() => { }}
                  isExportAllOrSomeFeature={true}
                  total={rowCount}
                  recordsToExport={selectedRecords.length}
                  ids={selectedRecords.length ? selectedRecords.map((obj) => obj._id) : []}
                  onExportToExcelSuccess={() => {
                    if (gridApi) gridApi.deselectAll()
                    else fetchRepairJobs()
                  }}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Tables Begins Here */}
      <CustomContainer>
        <div className="header-panel">
          <RepairJobHeader
            selectedType={selectedType}
            selectedRecords={selectedRecords}
            onTypeChange={handleRepairJobTypeSel}
            options={RepairJobType}
            onSearch={handleSearch}
            searchVal={search}
            RepairJobPermissions={permissions.repairJob}
            onCreate={clickCreateNew}
            showConfirmBox={showConfirmBox}
            canDelete={selectedRecords.length === 0}
            icon={<FaRegistered className="headerLogo" />}
            heading={routes.repairJob.title}
            showTransferEntityDialog={handleTransferEntityDialog}
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
          </RepairJobHeader>
        </div>
        {isMobile ?
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
                label: "Status: ",
                field: "status",
              },
              {
                label: "Status: ",
                field: "typeOfRepair",
              }
            ]}
            onCreate={false}
            showClone={false}
            onClone={() => { }}
            renderedFrom='repairJobPage'
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
            renderedFrom='repairJobPage'
            refreshGrid={fetchRepairJobs}
          />
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
          open={showManageRepairJobDialog.open}
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
