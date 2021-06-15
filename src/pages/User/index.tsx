import React, { useState, FC, useEffect, useContext, useReducer } from "react";
import { Tooltip, IconButton, Grid, Chip } from "@material-ui/core";
import { Delete as DeleteIcon } from "@material-ui/icons";
import { Link } from "react-router-dom";
import {
  CommonRenderer,
  CommonRendererWithCopy,
  CreatedByRenderer,
  UpdatedByRenderer
} from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import axiosInstance from "../../axios/axiosInstance";
import Layout from "../../components/Layout";
import routes from "./../../components/Helpers/Routes";
import CustomBreadCrumbs from "./../../components/CustomBreadCrumbs";
import Header from "./Header";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import MessageDialog from "../../components/Helpers/MessageDialog";
import { useData } from "../../StateProvider/Provider";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import { FaUserCheck, FaUserAltSlash } from "react-icons/fa";
import AssignRolesDialog from "../../components/AssignRolesDialog/AssignRolesDialog";
import CustomContainer from "../../components/CustomContainer";
import AccountCircleIcon from '@material-ui/icons/AccountCircle';
import { userType, gridPageSizes, isObjectEmpty } from './../../constants/helpers'
import ManageUserDialog from "./ManageUserDialog";
import { useHistory } from "react-router-dom";
import { startCase, uniqBy } from "lodash";
import CustomAgGrid, { reducer, intialState } from "../../components/AgGridComponents/CustomAgGrid";
import ImportExportLinks from "../../components/Helpers/ImportExportLinks";
import ApprovalProcessDialog from "./ApprovalProcessDialog";
import AssignEntityDialog from "../../components/AssignRolesDialog/AssignEntityDialog";
import DoaDialog from "../DoaSetup/ManageDoa/ManageDoaDialog";
import NoDataCell from "../../components/Helpers/NoDataCell";

let userTimeout: ReturnType<typeof setTimeout>;

const User: FC = () => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions },
  }: any = useData();
  const history = useHistory();
  const [showApprovalProcessDialog, setShowApprovalProcessDialog] = useState(false);
  const [globalRolesDialogOpen, setGlobalRolesDialogOpen] = useState(false);
  const [regionalRolesDialogOpen, setRegionalRolesDialogOpen] = useState(false);
  const [doaDialogOpen, setDoaDialogOpen] = useState(false);
  const [renderCount, setRenderCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [deleteRec, setDeleteRec] = useState<any>({});
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
  const [
    showDeleteWarningConfirmBox,
    setShowDeleteWarningConfirmBox,
  ] = useState(false);
  const [entityRoleRedirectDetails, setEntityRoleRedirectDetails] = useState({
    id: history.location?.state?.id,
    name: history.location?.state?.name,
    type: history.location?.state?.type,
    text: history.location?.state?.text,
  });
  const [userList, setUserList] = useState<any[]>([]);
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

  const columns = [
    {
      field: "concatedName", headerName: "Name", show: true, disabled: true, cellRenderer: "nameRenderer",
    },
    { field: "status", headerName: "Status", show: true, filter: false, sortable: false, cellRenderer: "statusRenderer" },
    {
      field: "companyWideRole", headerName: "Company Wide Role(s)", filter: false, show: true,
      cellRenderer: "companyWideRoleRenderer", width: 300
    },
    {
      field: "regionalWideRole", headerName: "Region Wide Functional Role(s)", filter: false, sortable: false, show: true,
      cellRenderer: "regionalWideRoleRenderer", width: 350
    },
    { field: "email", headerName: "Email", show: true, cellRenderer: "emailRenderer" },
    { field: "createdBy", headerName: "Created By", show: true, cellRenderer: "createdByRenderer" },
    { field: "updatedBy", headerName: "Updated By", show: true, cellRenderer: "updatedByRenderer" },
  ];

  const NameRenderer = params => (<div className="d-flex align-items-center">
    <Link
      title={params.value}
      className="link"
      to={`${routes.userDetail.path}/${params.data.id}`}
    >
      {params.value}
    </Link>
    {params.data.isBrandAdmin ? <Tooltip title="Brand Admin">
      <AccountCircleIcon color="primary" className="ml-2" fontSize="small" />
    </Tooltip> : ""}
  </div>
  );

  const StatusRenderer = params => <div style={{ width: 150 }}>
    {params.value ? (
      <Tooltip title="Inactive">
        <IconButton>
          <FaUserAltSlash className="text-error" />
        </IconButton>
      </Tooltip>
    ) : (
      <Tooltip title="Active">
        <IconButton>
          <FaUserCheck className="text-success" />
        </IconButton>
      </Tooltip>
    )}{" "}
  </div>;

  const CompanyWideRoleRenderer = params => params.value ? (
    <>
      <h5 className="createBy d-flex">
        <Link className="link" title={params.value}
          to={`${routes.roleDetail.path}/${params.data.companyWideRoleId}`}
        >
          {params.value}
        </Link>
        {
          params.data.restCompanyWideRoles.length > 0 &&
          <span className="createdAtTime badge-date">
            {`+${params.data.restCompanyWideRoles.length} more..`}
          </span>
        }
      </h5>
    </>
  ) : <NoDataCell />

  const RegionalWideRoleRenderer = params => params.value ? (
    <>
      <h5 className="createBy d-flex">
        <Link className="link" title={params.value}
          to={`${routes.roleDetail.path}/${params.data.regionalWideRoleId}`}
        >
          {params.value}
        </Link>
        {
          params.data.restRegionalWideRoles.length > 0 &&
          <span className="createdAtTime badge-date">
            {`+${params.data.restRegionalWideRoles.length} more..`}
          </span>
        }
      </h5>
    </>
  ) : <NoDataCell />

  const ActionsRenderer = params =>
    user?.user._id === params.data.id ? (
      <p title="There is no action for currently logged in user">
        No Actions
      </p>
    ) : (
      <>
        {permissions.user.isDelete ? (

          params.data.isBrandAdmin ? (
            <Tooltip
              className="cursor-stop"
              title="Brand Admin Can not be Deleted"
            >
              <IconButton size="small" aria-label="Delete">
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          ) :
            (<Tooltip
              title="Delete"
            >
              <IconButton
                aria-label="Delete"
                onClick={() => showConfirmBox(params.data)}
              >
                <DeleteIcon fontSize="small" color='error' />
              </IconButton>
            </Tooltip>)
        ) : (
          <Tooltip
            className="cursor-stop"
            title="You do not have permission to delete user"
          >
            <IconButton aria-label="Delete">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </>
    );

  const frameworkComponents = {
    nameRenderer: NameRenderer,
    statusRenderer: StatusRenderer,
    emailRenderer: CommonRendererWithCopy,
    createdByRenderer: CreatedByRenderer,
    companyWideRoleRenderer: CompanyWideRoleRenderer,
    regionalWideRoleRenderer: RegionalWideRoleRenderer,
    updatedByRenderer: UpdatedByRenderer,
    actionsRenderer: ActionsRenderer,
    commonRenderer: CommonRenderer
  };

  const replaceFieldName = (field) => {
    switch (field) {
      case "createdBy":
        return "createdBy.user.concatedName";

      case "updatedBy":
        return "updatedBy.user.concatedName";

      default:
        return field;
    }
  }

  const replaceFieldNameForSorting = (field) => {
    const updatedField = replaceFieldName(field);

    if (field !== updatedField) return updatedField;

    switch (field) {
      case "companyWideRole":
        return "role.name";

      default:
        return field;
    }
  }

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}`;

    if (entityRoleRedirectDetails?.id) {
      switch (entityRoleRedirectDetails?.type) {
        case "entity":
          deepFilter = `${deepFilter}&filterById=${JSON.stringify([{ field: "entities.entity", term: entityRoleRedirectDetails?.id }])}`
          break;

        case "globalRole":
          deepFilter = `${deepFilter}&filterById=${JSON.stringify([{ field: "role", term: entityRoleRedirectDetails?.id }])}`
          break;

        case "regionalRole":
          deepFilter = `${deepFilter}&filterById=${JSON.stringify([{ field: "entities.role", term: entityRoleRedirectDetails?.id }])}`
          break;
      }
    }

    if (!isObjectEmpty(filters)) {
      const updatedFilters = [];

      Object.keys(filters).map(field => {
        updatedFilters.push({
          field: replaceFieldName(field),
          term: filters[field].filter
        })
      });
      deepFilter = `${deepFilter}&deepFilter=${JSON.stringify(updatedFilters)}&filterType=and`
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${replaceFieldNameForSorting(sorting[0].colId)}&orderBy=${sorting[0].sort}`
    }

    if (search) {
      deepFilter = `${deepFilter}&search=${search}`;
    }
    return deepFilter;
  };

  useEffect(() => {
    let millisec = Object.keys(search).length > 0 ? 600 : 5;
    if (userTimeout) {
      clearTimeout(userTimeout);
    }

    userTimeout = setTimeout(() => {
      fetchUsers();
    }, millisec);
    // eslint-disable-next-line
  }, [search]);

  useEffect(() => {
    if (renderCount > 0) {
      fetchUsers();
    } else setRenderCount((preCount) => preCount + 1);
  }, [page, limit, filters, sorting, entityRoleRedirectDetails]);

  const fetchUsers = () => {
    const queryString = getQueryString();
    dispatch({ type: "loading", loading: true });

    if (gridApi) {
      gridApi.setRowData([]);
      gridApi.showLoadingOverlay();
    }

    axiosInstance()
      .get(`/user${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data.map((u) => {
          const { createdBy, updatedBy, role, entities, ...restProperties } = u;

          const [firstCompanyWideRole, ...restCompanyWideRoles] = role;
          const allRegionalWideRoles = uniqBy(entities.map(d => d.role).flat(), "_id") as any[];

          const [firstRegionalWideRole, ...restRegionalWideRoles] = allRegionalWideRoles;

          let res = {
            ...restProperties,
            id: u._id,
            concatedName: u.concatedName,
            email: u.email,
            createdByDate: u.createdBy?.date,
            createdBy: u.createdBy?.user?.concatedName,
            updatedBy: u.updatedBy?.user?.concatedName,
            updatedByDate: u.updatedBy?.date,
            status: u.blocked ? u.blocked : false,
            isBrandAdmin: u.userType === userType.brandAdmin,
            companyWideRoleId: firstCompanyWideRole?._id ?? "",
            companyWideRole: firstCompanyWideRole?.name ?? "",
            restCompanyWideRoles: restCompanyWideRoles,
            regionalWideRoleId: firstRegionalWideRole?._id ?? "",
            regionalWideRole: firstRegionalWideRole?.name ?? "",
            restRegionalWideRoles: restRegionalWideRoles
          };
          return res;
        });

        if (userList.length === 0) {
          let tempUsers = [{ id: "self", name: "Self" }]
          tempUsers.push()
          rows.map((user: any) => (
            tempUsers.push({
              id: user.id,
              name: user.concatedName,
            })))

          setUserList(tempUsers)
        }

        dispatch({ type: "initialize", data: rows, count: count });
      })
      .catch((error) => {
        dispatch({ type: "loading", loading: false });
        toastConfig.setToastConfig(error);
      });
    // eslint-disable-next-line
  };

  const showConfirmBox = (row) => {
    if (row) {
      setIsConformDialogVisible(true);
      if (row && row.id) {
        setDeleteRec(row);
      }
    } else {
      if (selectedRecords.some((d) => (d.id === user?.user._id || d.isBrandAdmin))) {
        setShowDeleteWarningConfirmBox(true);
      } else {
        setIsConformDialogVisible(true);
      }
    }
  };

  const handleDeleteUser = async () => {
    setDeleteLoading(true);
    let recs = [];
    if (deleteRec?.id) {
      recs.push(deleteRec?.id);
    } else {
      recs = selectedRecords.map((o) => o.id)
    }

    if (recs && recs.length > 0) {
      axiosInstance()
        .put(`/user/remove`, { ids: [...recs] })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: "success",
            message: data.message,
          });
          setIsConformDialogVisible(false);
          setDeleteLoading(false);
          if (deleteRec) setDeleteRec({});
          fetchUsers();
          setUserList([])
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setIsConformDialogVisible(false);
          setDeleteLoading(false);
        });
    }
  };

  const handleSearch = (e) => {
    dispatch({ type: "search", search: e.target.value });
  };

  const handleCreate = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleGlobalRolesOpenDialog = () => {
    setGlobalRolesDialogOpen(true);
  };

  const handleGlobalRolesCloseDialog = () => {
    setGlobalRolesDialogOpen(false);
  };
  const handleRegionalRolesOpenDialog = () => {
    setRegionalRolesDialogOpen(true);
  };

  const handleRegionalRolesCloseDialog = () => {
    setRegionalRolesDialogOpen(false);
  };

  const handleDOAOpenDialog = () => {
    setDoaDialogOpen(true);
  };

  const handleDOACloseDialog = () => {
    setDoaDialogOpen(false);
  };
  return (
    <>
      {console.log(selectedRecords)}
      {
        isOpen && (
          <ManageUserDialog open={isOpen} close={handleClose} onSuccess={() => { setUserList([]); fetchUsers() }}
            userId={null} dataToUpdate={null} isNew={true} />
          // <CreateUser open={isOpen} close={handleClose} fetchData={fetchUsers} />
        )
      }
      {globalRolesDialogOpen && (
        <AssignRolesDialog
          rolesDialogOpen={globalRolesDialogOpen}
          handleCloseDialog={handleGlobalRolesCloseDialog}
          userIds={selectedRecords.map((d) => d._id)}
          assignedRoles={null}
          onSuccess={() => {
            handleGlobalRolesCloseDialog();
          }}
        />
      )}
      {
        showApprovalProcessDialog &&
        <ApprovalProcessDialog
          openApprovalProcessDialog={showApprovalProcessDialog}
          hasPermissionToUpdateApprovalProcess={permissions}
          onSuccess={() =>
            setShowApprovalProcessDialog(false)
          }
          handleCloseDialog={() => setShowApprovalProcessDialog(false)}
          userIds={selectedRecords.map((user) => user._id)}
        />
      }
      {regionalRolesDialogOpen && (
        <AssignEntityDialog
          entitiesDialogOpen={regionalRolesDialogOpen}
          handleCloseDialog={handleRegionalRolesCloseDialog}
          type="entity"
          ids={selectedRecords.map((d) => d._id)}
          assignedEntity={[]}
          regionalRole={false}
          onSuccess={() => {
            handleRegionalRolesCloseDialog();
          }}
        />
      )}
      {doaDialogOpen && (
        <DoaDialog
          userList={userList}
          doa={[]}
          doaCurrency={null}
          userSelected={selectedRecords.map((d) => d._id)}
          open={doaDialogOpen}
          onSuccess={handleDOACloseDialog}
          onClose={handleDOACloseDialog}
        />
      )}
      <Layout>
        <Grid container className="headerbox">
          <Grid item md={4} sm={11} xs={10}>
            <CustomBreadCrumbs routes={[routes.user]} />
          </Grid>
          <Grid
            item
            md={8}
            sm={1}
            xs={2}>
            <ImportExportLinks
              module="user(s)"
              api={"/user"}
              afterImportCompleted={() => {
                fetchUsers();
                setUserList([])
              }}
            />
          </Grid>
        </Grid>
        <CustomContainer>
          <div className="header-panel">
            <Header
              onSearch={handleSearch}
              searchVal={search}
              userPermissions={permissions.user}
              onCreate={handleCreate}
              showConfirmBox={showConfirmBox}
              openApprovalProcessDialog={() => setShowApprovalProcessDialog(true)}
              openGlobalRolesDialog={handleGlobalRolesOpenDialog}
              openRegionalRolesDialog={handleRegionalRolesOpenDialog}
              openDOADialog={handleDOAOpenDialog}
              rolesActionDisabled={selectedRecords.length === 0}
              canDelete={selectedRecords.length === 0}
              entityRoleRedirectDetails={entityRoleRedirectDetails}
              onEntityRoleRedirectDetailRemove={() => {
                setEntityRoleRedirectDetails({ id: null, name: null, type: null, text: null });
              }}
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
            actionWidth={110}
          />

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
            message={`Are you sure, you want to delete user ${deleteRec.name || ""
              }?`}
            onClose={() => {
              if (deleteRec) setDeleteRec({});
              setIsConformDialogVisible(false);
            }}
            okBtnLoading={deleteLoading}
            onOk={handleDeleteUser}
          />
        ) : null}
      </Layout>
    </>
  );
};

export default User;
