import React, { useState, useEffect, useContext, useReducer, Fragment } from 'react';
import { Grid, Tooltip, IconButton } from '@material-ui/core';
import { Link, useHistory } from 'react-router-dom';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import LeadsHeader from './LeadsHeader';
import axiosInstance from '../../axios/axiosInstance';
import { useData } from '../../StateProvider/Provider';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import MessageDialog from '../../components/Helpers/MessageDialog';
import { leadDetailPage } from '../../routes/Lead';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { gridLoadingTimeout, isObjectEmpty, processFieldName } from '../../constants/helpers';
import ManageLeadDialog from './ManageLeadDialog/ManageLeadDialog';
import { HiUserGroup } from 'react-icons/hi';
import { lead } from '../../constants/helpers';
import NoDataCell from '../../components/Helpers/NoDataCell';
import GridDeleteIcon from '../../components/Helpers/GridDeleteIcon';
import { SiConvertio } from 'react-icons/si';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import CustomContainer from '../../components/CustomContainer';
import {
  CommonRenderer,
  CreatedByRenderer,
  UpdatedByRenderer,
  CommonRendererWithCopy
} from '../../components/AgGridComponents/CustomAgGridCellRenderers';
import CustomAgGrid, { reducer, intialState } from '../../components/AgGridComponents/CustomAgGrid';
import './style.scss';
import TransferEntityDialog from '../../components/AssignRolesDialog/TransferEntityDialog';
import FileCopyIcon from '@material-ui/icons/FileCopy';

const LeadTypes = [
  {
    key: 'All Leads',
    value: 1
  },
  {
    key: 'My Leads',
    value: 2
  }
];

let leadTimeout;
const Leads = () => {
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { user, selectedEntity, permissions }
  }: any = useData();
  const { leadResource, leadApi } = lead;
  const [selectedType, setSelectedType] = useState(1);
  const [isOpen, setIsOpen] = useState({ open: false, isClone: false, idToClone: null });
  const [renderCount, setRenderCount] = useState(0);
  const [okButtonLoading, setOkButtonLoading] = useState(false);
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState({ id: null, name: null });
  const [leadsPermissions, setLeadsPermissions] = useState({
    isCreate: permissions[leadResource]?.isCreate,
    isUpdate: permissions[leadResource]?.isUpdate,
    isRead: permissions[leadResource]?.isRead,
    isDelete: permissions[leadResource]?.isDelete
  });
  const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] = useState(false);
  const [showTransferEntityDialog, setShowTransferEntityDialog] = useState(false);

  //  Grid Variables - Start
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

  const columnState = JSON.parse(localStorage.getItem(leadResource));

  // const [showGridFilters, setShowGridFilters] = useState(true)
  const [columns, setColumns] = useState([
    { field: 'concatedName', headerName: 'Name', show: true, disabled: true, cellRenderer: 'nameRenderer' },
    { field: 'relatedOpportunity', headerName: 'Related Opportunity', show: true, cellRenderer: 'relatedOpportunityRenderer' },
    { field: 'title', headerName: 'Title', show: true, cellRenderer: 'commonRenderer' },
    { field: 'company', headerName: 'Company', show: true, cellRenderer: 'commonRenderer' },
    { field: 'createdBy', headerName: 'Created By', show: true, cellRenderer: 'createdByRenderer' },
    { field: 'updatedBy', headerName: 'Updated By', show: true, cellRenderer: 'updatedByRenderer' },
    { field: 'phone', headerName: 'Phone', show: true, cellRenderer: 'commonRendererWithCopy' },
    { field: 'mobile', headerName: 'Mobile', show: true, cellRenderer: 'commonRendererWithCopy' },
    { field: 'email', headerName: 'Email', show: true, cellRenderer: 'commonRendererWithCopy' },
    { field: 'owner', headerName: 'Owner Alies', show: true, cellRenderer: 'commonRenderer' }
  ]);

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

  const [convertLeadToOpportunityConfirmationDialog, setConvertLeadToOpportunityConfirmationDialog] = useState({
    open: false,
    id: null,
    leadName: null,
    message: null
  });
  const hasPermissionToConvertInOpportunity = user?.user?.permissions?.convertLeadToOpportunity;

  useEffect(() => {
    if (permissions && permissions[leadResource]) {
      setLeadsPermissions(permissions[leadResource]);
    }
  }, [permissions]);

  useEffect(() => {
    let millisec = Object.keys(search).length > 0 ? 600 : 5;
    if (leadTimeout) {
      clearTimeout(leadTimeout);
    }

    leadTimeout = setTimeout(() => {
      fetchLeads();
    }, millisec);
  }, [search]);

  useEffect(() => {
    if (renderCount > 0) {
      fetchLeads();
    } else setRenderCount((preCount) => preCount + 1);
  }, [page, limit, selectedType, filters, sorting, selectedEntity]);

  const NameRenderer = (params) => (
    <Link className="link" to={`${leadDetailPage.path}/${params.data._id}`} title={params.value}>
      {params.value}
    </Link>
  );

  const RelatedOpportunityRenderer = (params) => (
    <>
      {params.value ? (
        <Link className="link" to={`${routes.opportunityDetail.path}/${params.data.relatedOpportunityId}`} title={params.value}>
          {params.value}
        </Link>
      ) : (
        <NoDataCell />
      )}
    </>
  );

  const ActionsRenderer = (params) => (
    <>
      <Tooltip
        className={leadsPermissions.isCreate ? "" : "cursor-stop"}
        title={leadsPermissions.isCreate ? "Clone" : "You do not have permission to clone/create"} >
        <IconButton
          size="small"
          aria-label="Clone"
          onClick={() => {
            setIsOpen({ open: true, isClone: true, idToClone: params.data._id })
          }}>
          <FileCopyIcon fontSize="small" color="primary" />
        </IconButton>
      </Tooltip>
      {hasPermissionToConvertInOpportunity && generateLeadToOpportunityButton(params.data)}

      <GridDeleteIcon
        hasDeletePermission={leadsPermissions.isDelete}
        ownerId={params.data.ownerId}
        userId={user?.user?._id}
        onDelete={() => showConfirmBox(params.data)}
        entity="lead"
      />
    </>
  );

  const frameworkComponents = {
    nameRenderer: NameRenderer,
    relatedOpportunityRenderer: RelatedOpportunityRenderer,
    commonRenderer: CommonRenderer,
    commonRendererWithCopy: CommonRendererWithCopy,
    createdByRenderer: CreatedByRenderer,
    updatedByRenderer: UpdatedByRenderer,
    actionsRenderer: ActionsRenderer
  };

  const replaceFieldName = (field) => {
    switch (field) {
      case 'createdBy':
        return 'createdBy.user.concatedName';

      case 'updatedBy':
        return 'updatedBy.user.concatedName';

      case 'relatedOpportunity':
        return 'staticData.opportunity.opportunityName';

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

      default:
        return field;
    }
  };

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}&filterLeads=${selectedType}`;

    if (selectedEntity) {
      deepFilter = `${deepFilter}&entity=${selectedEntity}`;
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

  const fetchLeads = () => {
    if (selectedEntity) {
      const queryString = getQueryString();
      dispatch({ type: 'loading', loading: true });

      if (gridApi) {
        gridApi.setRowData([]);
      }

      axiosInstance()
        .get(`${leadApi}${queryString}`)
        .then(({ data: { data, count } }) => {
          let rows = data.map((u) => {
            const { owner, collaborator, createdBy, updatedBy, staticData, ...restProperties } = u;

            let res = {
              ...restProperties,
              id: u._id,

              owner: u.owner?.optionLabel,
              ownerId: u.owner?.optionValue,
              isAllowedToUpdate: [...(u.collaborator ?? []), u.owner].some((d) => d?.optionValue === user?.user?._id),

              convertedToOpportunity: u.staticData && u.staticData.convertedToOpportunity,
              relatedOpportunity: u.staticData && u.staticData.convertedToOpportunity && u.staticData.opportunity?.opportunityName,
              relatedOpportunityId: u.staticData && u.staticData.convertedToOpportunity && u.staticData.opportunity?._id,

              createdBy: u.createdBy?.user?.concatedName,
              createdByDate: u.createdBy?.date,
              updatedBy: u.updatedBy?.user?.concatedName,
              updatedByDate: u.updatedBy?.date
            };
            return res;
          });

          dispatch({ type: 'initialize', data: rows, count: count });
          setTimeout(() => {
            dispatch({ type: 'loading', loading: false });
          }, gridLoadingTimeout);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          dispatch({ type: 'loading', loading: false });
        });
    }
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const handleLeadTypeSel = (filteredValue) => {
    setSelectedType(filteredValue);
  };

  const handleTransferEntityDialog = () => {
    setShowTransferEntityDialog(true);
  };

  const handleCreate = () => {
    setIsOpen({ open: true, isClone: false, idToClone: null });
  };

  const handleClose = () => {
    setIsOpen({ open: false, isClone: false, idToClone: null });
    fetchLeads();
  };

  const generateLeadToOpportunityButton = ({ _id, concatedName, convertedToOpportunity, [processFieldName]: leadProcess, isAllowedToUpdate }) => {
    let dontHavePermissions = [];

    if (!permissions['customerAccount'].isCreate) {
      dontHavePermissions.push('Customer Account');
    }
    if (!permissions['customerContact'].isCreate) {
      dontHavePermissions.push('Customer Contact');
    }
    if (!permissions['opportunity'].isCreate) {
      dontHavePermissions.push('Opportunity');
    }

    const isCurrentLeadStatusQualified = leadProcess && leadProcess.toLowerCase() === 'qualified';

    return dontHavePermissions.length > 0 ? (
      <>
        <Tooltip
          className="cursor-stop"
          title={`To convert lead to opportunity, you must need create permission of ${dontHavePermissions.join(', ')}`}
        >
          <IconButton aria-label="Convert to opportunity">
            <SiConvertio size={18} />
          </IconButton>
        </Tooltip>
      </>
    ) : convertedToOpportunity ? (
      <>
        <Tooltip className="cursor-stop" title="This lead is already converted to opportunity">
          <IconButton aria-label="Convert to opportunity">
            <SiConvertio size={18} />
          </IconButton>
        </Tooltip>
      </>
    ) : !isAllowedToUpdate ? (
      <>
        <Tooltip className="cursor-stop" title="You are not allowed to convert as you are neither owner nor collaborator">
          <IconButton aria-label="Convert to opportunity">
            <SiConvertio size={18} />
          </IconButton>
        </Tooltip>
      </>
    ) : !isCurrentLeadStatusQualified ? (
      <>
        <Tooltip className="cursor-stop" title="To covert this lead to opportunity, Lead status must be qualified">
          <IconButton aria-label="Convert to opportunity">
            <SiConvertio size={18} />
          </IconButton>
        </Tooltip>
      </>
    ) : (
      <Tooltip title="Convert to opportunity">
        <IconButton
          aria-label="Convert to opportunity"
          onClick={() => {
            setConvertLeadToOpportunityConfirmationDialog({
              open: true,
              id: _id,
              leadName: concatedName,
              message: `Are you sure you want to convert ${concatedName} to opportunity?`
            });
          }}
        >
          <SiConvertio size={18} className="text-primary" />
        </IconButton>
      </Tooltip>
    );
  };

  const showConfirmBox = (row) => {
    if (row) {
      setIsConformDialogVisible(true);
      if (row) {
        setDeleteRecord({ id: row._id, name: row.concatedName });
      }
    } else {
      if (selectedRecords.find((d) => d.ownerId !== user.user._id)) {
        setShowDeleteWarningConfirmBox(true);
      } else {
        setIsConformDialogVisible(true);
      }
    }
  };

  const handleDeleteLeads = async () => {
    if (deleteRecord.id || selectedRecords.length > 0) {
      setOkButtonLoading(true);

      axiosInstance()
        .put(`${leadApi}/remove?entity=${selectedEntity}`, { ids: deleteRecord.id ? [deleteRecord.id] : selectedRecords.map((d) => d._id) })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          setIsConformDialogVisible(false);
          setOkButtonLoading(false);
          if (deleteRecord.id) {
            setDeleteRecord({ id: null, name: null });
          }
          fetchLeads();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setIsConformDialogVisible(false);
          setOkButtonLoading(false);
        });
    }
  };

  const convertLeadToOpportunity = () => {
    const ids = convertLeadToOpportunityConfirmationDialog.id ? [convertLeadToOpportunityConfirmationDialog.id] : selectedRecords.map((m) => m._id);

    axiosInstance()
      .post(`${leadApi}/to-opportunity`, { ids: ids })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setConvertLeadToOpportunityConfirmationDialog({
          open: false,
          id: null,
          leadName: null,
          message: null
        });
        if (convertLeadToOpportunityConfirmationDialog.id) {
          history.push(`${routes.opportunityDetail.path}/${data.data[0]}`);
        } else {
          fetchLeads();
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setOkButtonLoading(false);
      });
  };

  return (
    <Fragment>
      <Grid container className="headerbox">
        <Grid item md={4} sm={11} xs={10}>
          <CustomBreadCrumbs routes={[routes.lead]} />
        </Grid>
        <Grid item md={8} sm={1} xs={2}>
          <ImportExportLinks
            permissions={leadsPermissions}
            module="lead(s)"
            api={leadApi}
            afterImportCompleted={() => {
              fetchLeads();
            }}
          />
        </Grid>
      </Grid>

      <CustomContainer>
        <div className="header-panel">
          <LeadsHeader
            userId={user?.user?._id}
            selectedType={selectedType}
            onTypeChange={handleLeadTypeSel}
            options={LeadTypes}
            onSearch={handleSearch}
            searchVal={search}
            leadPermissions={leadsPermissions}
            onCreate={handleCreate}
            showConfirmBox={showConfirmBox}
            icon={<HiUserGroup className="headerLogo" />}
            heading={routes.lead.title}
            allowToConvertLeadToOpportunity={
              permissions['customerAccount'].isCreate && permissions['customerContact'].isCreate && permissions['opportunity'].isCreate
            }
            selectedLeads={selectedRecords}
            showLeadToOpportunityConfirmationDialog={() => {
              setConvertLeadToOpportunityConfirmationDialog({
                open: true,
                id: null,
                leadName: null,
                message: `Are you sure you want to convert selected leads to opportunity?`
              });
            }}
            showTransferEntityDialog={handleTransferEntityDialog}
          />
        </div>

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
          actionWidth={150}
          loading={loading}
          renderedFrom={leadResource}
        />

        {isOpen?.open && (
          <ManageLeadDialog
            open={isOpen?.open}
            onSuccess={handleClose}
            onClose={() => {
              setIsOpen({ open: false, isClone: false, idToClone: null });
            }}
            isNew={true}
            dataToUpdate={null}
            leadApi={leadApi}
            isClone={isOpen?.isClone}
            leadId={isOpen?.idToClone}
          />
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
            message={`Are you sure you want to delete Lead ${deleteRecord.name || ''}?`}
            onClose={() => {
              if (deleteRecord.id) setDeleteRecord({ id: null, name: null });
              setIsConformDialogVisible(false);
            }}
            okBtnLoading={okButtonLoading}
            onOk={handleDeleteLeads}
          />
        ) : null}

        {convertLeadToOpportunityConfirmationDialog.open ? (
          <ConfirmationDialog
            open={convertLeadToOpportunityConfirmationDialog.open}
            message={convertLeadToOpportunityConfirmationDialog.message}
            onClose={() => {
              setConvertLeadToOpportunityConfirmationDialog({
                open: false,
                id: null,
                leadName: null,
                message: null
              });
            }}
            okBtnLoading={okButtonLoading}
            onOk={convertLeadToOpportunity}
          />
        ) : null}
        {showTransferEntityDialog && (
          <TransferEntityDialog
            TransferEntityDialogOpen={showTransferEntityDialog}
            onSuccess={() => {
              fetchLeads();
              setShowTransferEntityDialog(false);
            }}
            handleCloseDialog={() => {
              setShowTransferEntityDialog(false);
            }}
            selectedRecs={selectedRecords.map((r) => r._id)}
            entities={user.entity.filter((e) => e._id !== selectedEntity)}
            type="leads"
            api="lead"
          />
        )}
      </CustomContainer>
    </Fragment>
  );
};

export default Leads;
