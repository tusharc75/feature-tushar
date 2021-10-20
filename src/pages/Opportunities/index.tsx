import { useState, useEffect, useContext, useReducer } from 'react';
import { Grid, Chip } from '@material-ui/core';
import { Link } from 'react-router-dom';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import { displayDate } from '../../services/util';
import OpportunitiesHeader from './OpportunitiesHeader';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import MessageDialog from '../../components/Helpers/MessageDialog';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { GiHiveMind } from 'react-icons/gi';
import ManageOpportunityDialog from './ManageOpportunityDialog/ManageOpportunityDialog';
import { opportunity, isObjectEmpty, customerAccount, supplierAccount, gridLoadingTimeout } from '../../constants/helpers';
import NoDataCell from '../../components/Helpers/NoDataCell';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import CustomContainer from '../../components/CustomContainer';
import { useHistory } from 'react-router-dom';
import GridDeleteIcon from '../../components/Helpers/GridDeleteIcon';
import CustomAgGrid, { reducer, intialState } from '../../components/AgGridComponents/CustomAgGrid';
import './style.scss';
import TransferEntityDialog from '../../components/AssignRolesDialog/TransferEntityDialog';
import Tooltip from "@material-ui/core/Tooltip"
import IconButton from "@material-ui/core/IconButton"
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { prepareDataForGrid } from "../../constants/helpers"
import { getColumnData, getStaticFields, getFrameworkComponents, checkStaticField } from "../../constants/columns"

let opportunityTimeout;
const OpportunityTypes = [
  {
    key: 'All Opportunities',
    value: 1
  },
  {
    key: 'My Opportunities',
    value: 2
  }
];

const Opportunities = () => {
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const {
    state: { user, selectedEntity, permissions }
  }: any = useData();
  const { opportunityResource, opportunityApi } = opportunity;
  const [selectedType, setSelectedType] = useState(1);
  const [renderCount, setRenderCount] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState<any>({});
  const [opportunityPermissions, setOpportunityPermissions] = useState({
    isCreate: permissions[opportunityResource]?.isCreate,
    isUpdate: permissions[opportunityResource]?.isUpdate,
    isRead: permissions[opportunityResource]?.isRead,
    isDelete: permissions[opportunityResource]?.isDelete
  });
  const [showCreateOpportunityDialog, setShowCreateOpportunityDialog] = useState({ open: false, isClone: false, idToClone: null });
  const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] = useState(false);
  const [singleOpportunityDelete, setSingleOpportunityDelete] = useState({
    id: null,
    show: false,
    opportunityName: ''
  });
  const [accountDetails, setAccountDetails] = useState({
    accountId: history.location?.state?.accountId,
    accountName: history.location?.state?.accountName,
    resource: history.location?.state?.resource
  });
  const [showTransferEntityDialog, setShowTransferEntityDialog] = useState(false);
  const [frameWorkComponent, setFrameWorkComponent] = useState({})
  const [columns, setColumns] = useState([])

  //  Grid Variables - Start
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;
  const columnState = JSON.parse(localStorage.getItem(opportunityResource));

  if (columnState) {
    columns.map((item) => {
      columnState.map((d) => {
        if (d.colId === item.field) {
          item.show = !d.hide;
        }
      });
    });
  }

  //  Grid Variables - End
  useEffect(() => {
    fetchGridColumns()
  }, [])

  const fetchGridColumns = async () => {

    const response = await axiosInstance()
      .get(`/field?resource=Opportunity&entity=${selectedEntity}`)

    let data = response?.data?.data

    let columns = []
    let rendererNames = []
    data.forEach(o => {
      let currentColumn = getColumnData(opportunityResource, o?.fieldData, routes.opportunityDetail.path)
      if (currentColumn !== null) {
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
    setFrameWorkComponent({ ...tempFrameworkComponent })
    let staticFields = getStaticFields()
    staticFields.forEach(field => {
      columns.push(checkStaticField(routes.projectSales.title, field))
    })
    setColumns([...columns])
  }

  useEffect(() => {
    if (permissions && permissions[opportunityResource]) {
      setOpportunityPermissions(permissions[opportunityResource]);
    }

    return () => {
      setOpportunityPermissions(null);
    };
  }, [permissions]);

  useEffect(() => {
    let millisec = Object.keys(search).length > 0 ? 600 : 5;
    if (opportunityTimeout) {
      clearTimeout(opportunityTimeout);
    }

    opportunityTimeout = setTimeout(() => {
      fetchOpportunities();
    }, millisec);
    // eslint-disable-next-line
  }, [search]);

  useEffect(() => {
    if (renderCount > 0) {
      fetchOpportunities();
    } else setRenderCount((preCount) => preCount + 1);
  }, [page, limit, selectedType, filters, sorting, selectedEntity, accountDetails]);

  const handleSingleDeleteOpportunity = async () => {
    dispatch({ type: 'loading', loading: true });

    axiosInstance()
      .put(`${opportunityApi}/remove?entity=${selectedEntity}`, {
        ids: [singleOpportunityDelete.id]
      })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchOpportunities();
        dispatch({ type: 'loading', loading: false });
        setSingleOpportunityDelete({ id: null, show: false, opportunityName: '' });
      })
      .catch((error) => {
        dispatch({ type: 'loading', loading: false });
        toastConfig.setToastConfig(error);
      });
  };

  const OpportunityNameRenderer = (params) => (
    <Link className="link" title={params.value} to={`${routes.opportunityDetail.path}/${params.data._id}`}>
      {params.value}
    </Link>
  );

  const CustomerAccountNameRenderer = (params) => (
    <Link className="link" title={params.value} to={`${routes.customerAccount.path}/detail/${params.data.customerAccountId}`}>
      {params.value}
    </Link>
  );

  const SupplierAccountNameRenderer = (params) =>
    params.value ? (
      <>
        <h5 className="createBy d-flex">
          <Link className="link" title={params.value} to={`${routes.supplierAccount.path}/detail/${params.data.supplierAccountId}`}>
            {params.value}
          </Link>
          {params.data.restSupplierAccounts.length > 0 && (
            <span className="createdAtTime badge-date">{`+${params.data.restSupplierAccounts.length} more..`}</span>
          )}
        </h5>
      </>
    ) : (
      <NoDataCell />
    );

  const ActionsRenderer = (params) => (
    <>
      <Tooltip
        className={opportunityPermissions?.isCreate ? "" : "cursor-stop"}
        title={opportunityPermissions?.isCreate ? "Clone" : "You do not have permission to clone/create"} >
        <IconButton
          size="small"
          aria-label="Clone"
          onClick={() => {
            setShowCreateOpportunityDialog({ open: true, isClone: true, idToClone: params.data._id })
          }}
        >
          <FileCopyIcon fontSize="small" color="primary" />
        </IconButton>
      </Tooltip>

      <GridDeleteIcon
        hasDeletePermission={opportunityPermissions.isDelete}
        ownerId={params.data.ownerId}
        userId={user?.user?._id}
        onDelete={() =>
          setSingleOpportunityDelete({
            show: true,
            id: params.data._id,
            opportunityName: `${params.data.opportunityName}`
          })
        }
        entity="opportunity"
      />
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

      case 'customerAccountName':
        return 'customerAccountName.optionLabel';

      case 'supplierAccountName':
        return 'supplierAccountName.optionLabel';

      default:
        return field;
    }
  };

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}&filterOpportunities=${selectedType}`;

    if (selectedEntity) {
      deepFilter = `${deepFilter}&entity=${selectedEntity}`;
    }

    if (accountDetails.accountId) {
      if (accountDetails.resource === customerAccount.accountResource) {
        deepFilter = `${deepFilter}&filterById=${JSON.stringify([
          { field: replaceFieldName('customerAccountName'), term: accountDetails.accountId }
        ])}`;
      } else if (accountDetails.resource === supplierAccount.accountResource) {
        deepFilter = `${deepFilter}&filterById=${JSON.stringify([
          { field: replaceFieldName('supplierAccountName'), term: { $in: [accountDetails.accountId] } }
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
      deepFilter = `${deepFilter}&deepFilter=${JSON.stringify(updatedFilters)}&filterType=and`;
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${replaceFieldNameForSorting(sorting[0].colId)}&orderBy=${sorting[0].sort}`;
    }

    if (search) {
      deepFilter = `${deepFilter}&search=${search}`;
    }

    return deepFilter;
  };

  const fetchOpportunities = async () => {
    if (selectedEntity) {
      const queryString = getQueryString();
      dispatch({ type: 'loading', loading: true });

      if (gridApi) {
        gridApi.setRowData([]);
      }

      axiosInstance()
        .get(`${opportunityApi}${queryString}`)
        .then(({ data: { data, count } }) => {
          let rows = data.map((u) => {

            let finalObject = prepareDataForGrid(u);
            let res = {
              ...finalObject,
              canDelete: u.owner?.optionValue === user?.user._id,
              stage: u.stage,
              closeDate: u?.closeDate ? displayDate(u.closeDate) : '',
            };
            return res;
          });

          dispatch({ type: 'initialize', data: rows, count: count });
          setTimeout(() => {
            dispatch({ type: 'loading', loading: false });
          }, gridLoadingTimeout);
        })
        .catch((error) => {
          dispatch({ type: 'loading', loading: false });
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const handleOpportunityTypeChange = (filterValues) => {
    setSelectedType(filterValues);
  };

  const handleTransferEntityDialog = () => {
    setShowTransferEntityDialog(true);
  };

  const onSuccess = () => {
    setShowCreateOpportunityDialog({ open: false, isClone: false, idToClone: null });
    fetchOpportunities();
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
    setShowCreateOpportunityDialog({ open: true, isClone: false, idToClone: null });
  };

  const handleDeleteOpportunity = async () => {
    setDeleteLoading(true);
    let recordsToDelete = [];
    if (deleteRecord?._id) {
      recordsToDelete.push(deleteRecord?._id);
    } else {
      recordsToDelete = selectedRecords.map((o) => o._id);
    }
    if (recordsToDelete.length > 0) {
      axiosInstance()
        .put(`${opportunityApi}/remove?entity=${selectedEntity}`, {
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
          fetchOpportunities();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setIsConformDialogVisible(false);
          setDeleteLoading(false);
        });
    }
  };

  return (
    <>
      <Grid container className="headerbox">
        <Grid item md={4} sm={11} xs={10}>
          <CustomBreadCrumbs routes={[routes.opportunity]} />
        </Grid>
        <Grid item md={8} sm={1} xs={2}>
          <Grid container direction="row">
            <Grid item xs={12} sm={12}>
              <Grid container justify="flex-end">
                <ImportExportLinks
                  permissions={opportunityPermissions}
                  module="opportunities"
                  api={opportunityApi}
                  afterImportCompleted={() => {
                    fetchOpportunities();
                  }}
                  isExportAllOrSomeFeature={true}
                  total={rowCount}
                  recordsToExport={selectedRecords.length}
                  ids={selectedRecords.length ? selectedRecords.map((obj) => obj._id) : []}
                  onExportToExcelSuccess={() => {
                    if (gridApi) gridApi.deselectAll()
                    else fetchOpportunities()
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
          <OpportunitiesHeader
            selectedRecords={selectedRecords}
            onTypeChange={handleOpportunityTypeChange}
            options={OpportunityTypes}
            onSearch={handleSearch}
            search={search}
            opportunityPermissions={opportunityPermissions}
            onCreate={clickCreateNew}
            showConfirmBox={showConfirmBox}
            canDelete={selectedRecords.length === 0}
            icon={<GiHiveMind className="headerLogo" />}
            heading={routes.opportunity.title}
            showTransferEntityDialog={handleTransferEntityDialog}
          >
            {accountDetails.accountId && (
              <Chip
                className="ml-3"
                color="primary"
                label={`${accountDetails.resource === customerAccount.accountResource ? 'Customer' : 'Supplier'} Account: ${accountDetails.accountName
                  }`}
                onDelete={() => {
                  setAccountDetails({ accountId: null, accountName: null, resource: null });
                }}
              />
            )}
          </OpportunitiesHeader>
        </div>

        {
          Object.keys(frameWorkComponent).length > 0 ?
            <CustomAgGrid
              columns={columns}
              dataRows={dataRows}
              frameworkComponents={frameWorkComponent}
              setGridApi={setGridApi}
              dispatch={dispatch}
              rowCount={rowCount}
              limit={limit}
              pageSizes={pageSizes}
              page={page}
              actionWidth={100}
              loading={loading}
              renderedFrom={opportunityResource}
              refreshGrid={fetchOpportunities}
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
            message={`Are you sure you want to delete ${deleteRecord?.opportunityName ? 'Opportunity' : 'Opportunities'}   ${deleteRecord.opportunityName || ''
              }?`}
            onClose={() => {
              if (deleteRecord) setDeleteRecord({});
              setIsConformDialogVisible(false);
            }}
            okBtnLoading={deleteLoading}
            onOk={handleDeleteOpportunity}
          />
        ) : null}
        {/* {
            showCreateOpportunityDialog && <ManageOpportunityMain
              open={showCreateOpportunityDialog}
              onClose={() => setShowCreateOpportunityDialog(false)}
              onSuccess={() => {
                setShowCreateOpportunityDialog(false);
                fetchOpportunities()
              }}
            />
          } */}
        {singleOpportunityDelete.show ? (
          <ConfirmationDialog
            open={singleOpportunityDelete.show}
            message={`Are you sure you want to delete contact: ${singleOpportunityDelete.opportunityName}?`}
            onClose={() =>
              setSingleOpportunityDelete({
                id: null,
                show: false,
                opportunityName: ''
              })
            }
            onOk={handleSingleDeleteOpportunity}
          />
        ) : null}
      </CustomContainer>

      {showCreateOpportunityDialog?.open && (
        <ManageOpportunityDialog
          open={showCreateOpportunityDialog?.open}
          onSuccess={onSuccess}
          onClose={() => {
            setShowCreateOpportunityDialog({ open: false, isClone: false, idToClone: null });
          }}
          isNew={true}
          dataToUpdate={null}
          resource={null}
          isRedirectTodetailPage={true}
          isClone={showCreateOpportunityDialog?.isClone}
          opportunityId={showCreateOpportunityDialog?.idToClone}
        />
      )}
      {showTransferEntityDialog && (
        <TransferEntityDialog
          TransferEntityDialogOpen={showTransferEntityDialog}
          onSuccess={() => {
            onSuccess();
            setShowTransferEntityDialog(false);
          }}
          handleCloseDialog={() => {
            setShowTransferEntityDialog(false);
          }}
          selectedRecs={selectedRecords.map((r) => r._id)}
          entities={user.entity.filter((e) => e._id !== selectedEntity)}
          type="opportunities"
          api="opportunity"
        />
      )}
    </>
  );
};

export default Opportunities;
