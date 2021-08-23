import { useState, FC, useEffect, useContext, useReducer, Fragment, useCallback } from "react";
import { Tooltip, IconButton, Grid, Dialog } from "@material-ui/core";
import { Delete as DeleteIcon } from "@material-ui/icons";
import { Link } from "react-router-dom";
import {
  CommonRenderer,
  CommonRendererWithCopy,
  CreatedByRenderer,
  UpdatedByRenderer
} from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import axiosInstance from "../../axios/axiosInstance";
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
import { userType, isObjectEmpty, gridLoadingTimeout } from './../../constants/helpers'
import ManageUserDialog from "./ManageUserDialog";
import { useHistory } from "react-router-dom";
import { uniqBy } from "lodash";
import CustomAgGrid, { reducer, intialState } from "../../components/AgGridComponents/CustomAgGrid";
import ImportExportLinks from "../../components/Helpers/ImportExportLinks";
import ApprovalProcessDialog from "./ApprovalProcessDialog";
import AssignEntityDialog from "../../components/AssignRolesDialog/AssignEntityDialog";
import DoaDialog from "../DoaSetup/ManageDoa/ManageDoaDialog";
import NoDataCell from "../../components/Helpers/NoDataCell";
import UserSetupDialog from "./UserSetupDialog";

let userTimeout: ReturnType<typeof setTimeout>;

const User: FC = () => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions },
  }: any = useData();
  const history = useHistory();
  const [openUserSetupDialog, setOpenUserSetupDialog] = useState(false)
  const [showApprovalProcessDialog, setShowApprovalProcessDialog] = useState(false);
  const [globalRolesDialogOpen, setGlobalRolesDialogOpen] = useState(false);
  const [regionalRolesDialogOpen, setRegionalRolesDialogOpen] = useState(false);
  const [doaDialogOpen, setDoaDialogOpen] = useState(false);
  const [renderCount, setRenderCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [deleteRec, setDeleteRec] = useState<any>({});
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [unAssignLoading, setUnAssignLoading] = useState(false);
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
  const columnState = JSON.parse(localStorage.getItem("userPage"));
  const columns = [
    {
      field: "concatedName", headerName: "Name", show: true, disabled: true, cellRenderer: "nameRenderer",
    },
    { field: "email", headerName: "Email", show: true, cellRenderer: "emailRenderer" },
    { field: "status", headerName: "Status", show: true, filter: false, sortable: false, cellRenderer: "statusRenderer" },
    {
      field: "companyWideRole", headerName: "Company Wide Role(s)", filter: false, show: true,
      cellRenderer: "companyWideRoleRenderer", width: 300
    },
    {
      field: "regionalWideRole", headerName: "Region Wide Functional Role(s)", filter: false, sortable: false, show: true,
      cellRenderer: "regionalWideRoleRenderer", width: 350
    },
    { field: "createdBy", headerName: "Created By", show: true, cellRenderer: "createdByRenderer" },
    { field: "updatedBy", headerName: "Updated By", show: true, cellRenderer: "updatedByRenderer" },
  ];
  if (columnState) {
    columns.forEach((item) => {
      columnState.forEach((d) => {
        if (d.colId === item.field) {
          item.show = !d.hide;
        }
      });
    });
  }

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
              <IconButton aria-label="Delete">
                <DeleteIcon fontSize="small" />
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
    let deepFilter = `?page=${page}&limit=${limit}&withoutRoleLookup=true`;

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

      Object.keys(filters).forEach(field => {
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

  const fetchUsers = useCallback(() => {
    const queryString = getQueryString();
    dispatch({ type: "loading", loading: true });

    if (gridApi) {
      gridApi.setRowData([]);
    }

    axiosInstance()
      .get(`/user${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data.map((u) => {
          const { createdBy, updatedBy, role, entities, permissions, ...restProperties } = u;

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
            restRegionalWideRoles: restRegionalWideRoles,
            doaSetup: permissions?.doaSetup
          };
          return res;
        });

        if (userList.length === 0) {
          let tempUsers = [{ id: "self", name: "Self" }]
          rows.map((user: any) => (
            tempUsers.push({
              id: user.id,
              name: user.concatedName,
            })))

          setUserList(tempUsers)
        }

        dispatch({ type: "initialize", data: rows, count: count });
        setTimeout(() => {
          dispatch({ type: "loading", loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        dispatch({ type: "loading", loading: false });
        toastConfig.setToastConfig(error);
      });
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (renderCount > 0) {
      fetchUsers();
    } else setRenderCount((preCount) => preCount + 1);
  }, [page, limit, filters, sorting, entityRoleRedirectDetails, fetchUsers, renderCount]);


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

  const unAssignUsersFromEntity = () => {
    setIsConformDialogVisible(true);

    let recs = selectedRecords.map((o) => o.id)

    if (recs && recs.length > 0 && entityRoleRedirectDetails.id) {
      let dataObj = {
        "users": recs,
        "entity": entityRoleRedirectDetails.id
      }
      axiosInstance()
        .put(`/user/unassign-users`, dataObj)
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: "success",
            message: data.message,
          });
          setIsConformDialogVisible(false);
          fetchUsers();
          setUserList([])
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setIsConformDialogVisible(false);
        });
    }
  }

  return (
    <>
      {
        isOpen && (
          <ManageUserDialog open={isOpen} close={handleClose} onSuccess={() => { setUserList([]); fetchUsers() }}
            userId={null} dataToUpdate={null} isNew={true} />
          // <CreateUser open={isOpen} close={handleClose} fetchData={fetchUsers} />
        )
      }
      {
        openUserSetupDialog && (
          <UserSetupDialog
            open={openUserSetupDialog}
            close={() => setOpenUserSetupDialog(false)}
            userIds={selectedRecords.map((d) => d._id)}
            onSuccess={() => {
              setOpenUserSetupDialog(false)
              fetchUsers()
            }}
            fetchUsers={() => fetchUsers()}
            userList={userList}
            selectedRecords={selectedRecords}
          />
        )
      }
      {globalRolesDialogOpen && (
        <Dialog
          fullWidth
          maxWidth="xs"
          open={globalRolesDialogOpen}
          onClose={handleGlobalRolesCloseDialog}
          aria-labelledby="assign-roles-dialog"
        >
          <AssignRolesDialog
            rolesDialogOpen={globalRolesDialogOpen}
            handleCloseDialog={handleGlobalRolesCloseDialog}
            userIds={selectedRecords.map((d) => d._id)}
            assignedRoles={null}
            onSuccess={() => {
              handleGlobalRolesCloseDialog();
              fetchUsers();
            }}
          />
        </Dialog>
      )}
      {
        showApprovalProcessDialog &&
        <Dialog
          fullWidth
          maxWidth="sm"
          open={showApprovalProcessDialog}
          onClose={() => setShowApprovalProcessDialog(false)}
          aria-labelledby="set-approval-dialog"
        >
          <ApprovalProcessDialog
            openApprovalProcessDialog={showApprovalProcessDialog}
            hasPermissionToUpdateApprovalProcess={permissions.user.isUpdate && user?.user?.userType === userType.brandAdmin}
            onSuccess={() =>
              setShowApprovalProcessDialog(false)
            }
            handleCloseDialog={() => setShowApprovalProcessDialog(false)}
            userIds={selectedRecords.map((user) => user._id)}
          />
        </Dialog>
      }
      {regionalRolesDialogOpen && (
        <Dialog
          fullWidth
          maxWidth="xs"
          open={regionalRolesDialogOpen}
          onClose={handleRegionalRolesCloseDialog}
          aria-labelledby="assign-roles-dialog"
        >
          <AssignEntityDialog
            entitiesDialogOpen={regionalRolesDialogOpen}
            handleCloseDialog={handleRegionalRolesCloseDialog}
            type="entity"
            ids={selectedRecords.map((d) => d._id)}
            assignedEntity={[]}
            regionalRole={false}
            onSuccess={() => {
              handleRegionalRolesCloseDialog();
              fetchUsers();
            }}
          />
        </Dialog>
      )}
      {doaDialogOpen && (
        <Dialog
          open={doaDialogOpen}
          onClose={handleDOACloseDialog}
          scroll="body"
          maxWidth="md"
          fullWidth
        >
          <DoaDialog
            userList={userList.filter(user => !selectedRecords.some(item => item?._id === user?.id))}
            doa={[]}
            doaCurrency={null}
            userSelected={selectedRecords.map((d) => d._id)}
            open={doaDialogOpen}
            from={"UserListPage"}
            onSuccess={handleDOACloseDialog}
            onClose={handleDOACloseDialog}
          />
        </Dialog>
      )}
      <Fragment>
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
              permissions={permissions.user}
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
              approvalProcessActionDisabled={selectedRecords.length === 0 || !(user?.user?.userType === userType.brandAdmin)}
              canDelete={selectedRecords.length === 0}
              entityRoleRedirectDetails={entityRoleRedirectDetails}
              onEntityRoleRedirectDetailRemove={() => {
                setEntityRoleRedirectDetails({ id: null, name: null, type: null, text: null });
              }}
              unAssignUsersFromEntity={() => {
                setIsConformDialogVisible(true);
                setUnAssignLoading(true)
              }}
              openUserSetupDialog={() => {
                setOpenUserSetupDialog(true);
              }}
              assignDoaDisabled={selectedRecords.length === 0 || selectedRecords?.some((item => item.doaSetup === false))}
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
            loading={loading}
            renderedFrom="userPage"
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
            message={
              unAssignLoading ?
                `Are you sure you want to un-assign user from entity ${entityRoleRedirectDetails.name || ""}?`
                : `Are you sure you want to delete user ${deleteRec.name || ""}?`}
            onClose={() => {
              if (deleteRec) setDeleteRec({});
              setIsConformDialogVisible(false);
            }}
            okBtnLoading={deleteLoading}
            onOk={
              unAssignLoading ?
                unAssignUsersFromEntity
                : handleDeleteUser}
          />
        ) : null}
      </Fragment>
    </>
  );
};

export default User;
