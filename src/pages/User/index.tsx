import { useState, FC, useEffect, useContext, useReducer, Fragment } from "react";
import { Tooltip, IconButton, Grid, Dialog, Typography } from "@material-ui/core";
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
import { FaUserCheck, FaUserAltSlash, FaSuitcase, IoCreateSharp, MdEmail } from "react-icons/all";
import AssignRolesDialog from "../../components/AssignRolesDialog/AssignRolesDialog";
import CustomContainer from "../../components/CustomContainer";
import AccountCircleIcon from '@material-ui/icons/AccountCircle';
import { userType, isObjectEmpty, gridLoadingTimeout, prepareDataForGrid, getLocalStorageArrayData } from './../../constants/helpers'
import ManageUserDialog from "./ManageUserDialog";
import { useHistory } from "react-router-dom";
import { camelCase, uniqBy } from "lodash";
import CustomAgGrid, { reducer, intialState } from "../../components/AgGridComponents/CustomAgGrid";
import ImportExportLinks from "../../components/Helpers/ImportExportLinks";
import ApprovalProcessDialog from "./ApprovalProcessDialog";
import AssignEntityDialog from "../../components/AssignRolesDialog/AssignEntityDialog";
import NoDataCell from "../../components/Helpers/NoDataCell";
import UserSetupDialog from "./UserSetupDialog";
import FileCopyIcon from '@material-ui/icons/FileCopy';
import ResourceTransferDialog from "../../components/ResourceTransferDialog"
import { isMobile, isTablet } from 'react-device-detect';
import CustomSwipableList from "../../components/SwipableListComponents/CustomSwipableList";
import useColumns, { getStaticFields, getFrameworkComponents } from "../../constants/useColumns"


let userTimeout: ReturnType<typeof setTimeout>;

const User: FC = () => {
  const renderedFrom = camelCase(routes?.user.title)
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions },
  }: any = useData();
  const history = useHistory();
  const [openUserSetupDialog, setOpenUserSetupDialog] = useState(false)
  const [showApprovalProcessDialog, setShowApprovalProcessDialog] = useState(false);
  const [globalRolesDialogOpen, setGlobalRolesDialogOpen] = useState(false);
  const [regionalRolesDialogOpen, setRegionalRolesDialogOpen] = useState(false);
  const [renderCount, setRenderCount] = useState(0);
  const [isOpen, setIsOpen] = useState({ open: false, isClone: false, idToClone: null });
  const [showBrandAssignConfirmation, setShowBrandAssignConfirmation] = useState(false)
  const [brandAssigningLoading, setBrandAssigningLoading] = useState(false);
  const [showBrandUnAssignConfirmation, setShowBrandUnAssignConfirmation] = useState(false)
  const [brandUnAssigningLoading, setBrandUnAssigningLoading] = useState(false);
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
  const columnState = JSON.parse(localStorage.getItem(renderedFrom));
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteUser, setDeleteUser] = useState<any>({})
  const [allUsers, setAllUsers] = useState([])
  const [entityAccess, setEntityAccess] = useState([])
  const [roleAccessOfLoggedInUser, setRoleAccessOfLoggedInUser] = useState([])
  const localStorageSelectedRecords = `${renderedFrom}_selected`

  const { getColumnData } = useColumns();
  const [frameWorkComponent, setFrameWorkComponent] = useState({})
  const [columns, setColumns] = useState([])

  const extraColumns = [
    { field: "regionalWideRole", headerName: "Assigned Roles", filter: false, sortable: false, show: true, cellRenderer: "regionalWideRoleRenderer" },
    { field: "status", headerName: "Status", show: true, filter: false, sortable: false, cellRenderer: "statusRenderer" },
  ];

  useEffect(() => {
    fetchFields()
    fetchAllUsers()
    fetchLoggedInUserEntities()
    fetchLoggedInUserRole()
  }, [])

  const fetchFields = () => {
    axiosInstance()
      .get(`/field?resource=User&view=true`)
      .then(({ data: { data } }) => {
        let columns = [];
        let rendererNames = [];
        data.forEach((o) => {
          let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.userDetail.path);
          if (currentColumn !== null) {
            columns = [...columns, currentColumn?.columnData];
            if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
              rendererNames.push(currentColumn?.rendererName);
            }
          }
        });
        let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
        tempFrameworkComponent = {
          ...tempFrameworkComponent,
          statusRenderer: StatusRenderer,
          regionalWideRoleRenderer: RegionalWideRoleRenderer,
          actionsRenderer: ActionsRenderer
        };
        setFrameWorkComponent({ ...tempFrameworkComponent });
        columns = [...columns, ...extraColumns, ...getStaticFields()];
        setColumns([...columns]);
      });
  };

  if (columnState) {
    columns.forEach((item) => {
      columnState.forEach((d) => {
        if (d.colId === item.field) {
          item.show = !d.hide;
        }
      });
    });
  }
  
  const StatusRenderer = params => <div style={{ width: 150 }}>
    {params.value ? (
      <Tooltip title="Inactive">
        <Typography>
          <FaUserAltSlash className="text-error ml-2" />
        </Typography>
      </Tooltip>
    ) : (
      <Tooltip title="Active">
        <Typography>
          <FaUserCheck className="text-success ml-2" />
        </Typography>
      </Tooltip>
    )}{" "}
  </div>;

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
        {/* <Tooltip
          className={permissions.user.isCreate ? "" : "cursor-stop"}
          title={permissions.user.isCreate ? "Clone" : "You do not have permission to clone/create"} >
          <IconButton
            size="small"
            aria-label="Clone"
            onClick={() => {
              setIsOpen({ open: true, isClone: true, idToClone: params.data._id })
            }}
          >
            <FileCopyIcon fontSize="small" color="primary" />
          </IconButton>
        </Tooltip> */}
        {permissions?.user?.isDelete ? (

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
                onClick={() => {
                  setDeleteUser(params?.data)
                  setShowDeleteDialog(true)
                }}
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
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(updatedFilters))}&filterType=and`
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

  const fetchLoggedInUserRole = async () => {
    let roleIds = [];
    await axiosInstance().get(`/user/${user.user?._id}`).then(({ data: { data } }) => {
      data.entities.map((item) => {
        item.role.forEach((role) => {
          if (roleIds.includes(role?._id)) {

          } else {
            roleIds.push(role?._id)
          }
        })

      })
      setRoleAccessOfLoggedInUser(roleIds)
    }).catch((error) => {
      toastConfig.setToastConfig(error);
    });
  }

  const fetchLoggedInUserEntities = async () => {
    const entityIds = user.entity?.map((e) => e._id);
    setEntityAccess(entityIds)
  }

  const fetchAllUsers = () => {
    axiosInstance()
      .get(`/user`)
      .then(({ data: { data, count } }) => {
        let tempAllUsers = data.map(o => ({ optionValue: o?._id, optionLabel: o?.concatedName }))
        setAllUsers(tempAllUsers)
      })
  }
  const fetchUsers = () => {
    const queryString = getQueryString();
    dispatch({ type: "loading", loading: true });

    if (gridApi) {
      gridApi.setRowData([]);
    }

    axiosInstance()
      .get(`/user${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data.map((u) => {
          const { createdBy, updatedBy, role, entities, ...restProperties } = u;

          const [firstCompanyWideRole, ...restCompanyWideRoles] = role;
          const allRegionalWideRoles = uniqBy(entities.map(d => d.role).flat(), "_id") as any[];

          const [firstRegionalWideRole, ...restRegionalWideRoles] = allRegionalWideRoles;


          let finalObject = prepareDataForGrid(u);
          finalObject["canDelete"] = permissions?.user?.isDelete;
          finalObject["isChecked"] = selectedRecords.some(s => s._id === u._id);
          finalObject["allowedToEdit"] = permissions?.user?.isUpdate;

          let res = {
            ...finalObject,
            status: u.blocked ? u.blocked : false,
            isBrandAdmin: u.userType === userType.brandAdmin,
            companyWideRoleId: firstCompanyWideRole?._id ?? "",
            companyWideRole: firstCompanyWideRole?.name ?? "",
            restCompanyWideRoles: restCompanyWideRoles,
            regionalWideRoleId: firstRegionalWideRole?._id ?? "",
            regionalWideRole: firstRegionalWideRole?.name ?? "",
            restRegionalWideRoles: restRegionalWideRoles,
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

  const handleAssignBrandAdmin = () => {
    setShowBrandAssignConfirmation(true)
  }

  const handleUnAssignBrandAdmin = () => {
    setShowBrandUnAssignConfirmation(true)
  }

  const assignBrandAdmin = async () => {
    setBrandAssigningLoading(true)
    const records = selectedRecords.map((record) => record._id)
    axiosInstance()
      .put(`/user/make-user-admin`, { 'users': records })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: "success",
          message: data.message,
        });
        setShowBrandAssignConfirmation(false)
        setBrandAssigningLoading(false)
        fetchUsers()
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setShowBrandAssignConfirmation(false)
        setBrandAssigningLoading(false)
      });
  }

  const unAssignBrandAdmin = async () => {
    setBrandUnAssigningLoading(true)
    const records = selectedRecords.map((record) => record._id)
    axiosInstance()
      .put('/user/unassign-user-admin', { 'users': records })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: "success",
          message: data.message,
        });
        setShowBrandUnAssignConfirmation(false)
        setBrandUnAssigningLoading(false)
        fetchUsers()
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setShowBrandUnAssignConfirmation(false)
        setBrandUnAssigningLoading(false)
      });
  }

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
    setIsOpen({ open: true, isClone: false, idToClone: null });
  };

  const handleClose = () => {
    setIsOpen({ open: false, isClone: false, idToClone: null });
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

  const isLoggedInUserBrandAdmin = 'userType' in user?.user && user?.user?.userType === userType.brandAdmin;
  const isRoleSetUpPermission = permissions?.role?.isUpdate && permissions?.entity?.isUpdate && permissions?.user?.isUpdate;
  const isUserSetupPermission = isLoggedInUserBrandAdmin || isRoleSetUpPermission;


  return (
    <>
      {
        isOpen?.open && (
          <ManageUserDialog
            open={isOpen?.open}
            isClone={isOpen?.isClone}
            close={handleClose}
            onSuccess={(obj) => { setUserList([]); fetchUsers() }}
            userId={isOpen?.idToClone}
            dataToUpdate={null}
            isNew={isOpen?.isClone ? false : true}
            isUserSetupPermission={isUserSetupPermission}
          />
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
            isRoleSetUpPermission={isRoleSetUpPermission}
            isApprovalProcess={isLoggedInUserBrandAdmin}
            roleAccessIds={roleAccessOfLoggedInUser}
            entityAccessIds={entityAccess}
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
            hasPermissionToUpdateApprovalProcess={permissions?.user?.isUpdate && user?.user?.userType === userType.brandAdmin}
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
            entityAccessIds={entityAccess}
            roleAccessIds={roleAccessOfLoggedInUser}
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
              permissions={permissions?.user}
              module="user(s)"
              api={"/user"}
              afterImportCompleted={() => {
                fetchUsers();
                setUserList([])
              }}
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
                else fetchUsers()
              }}
            />
          </Grid>
        </Grid>
        <CustomContainer>
          <div className="header-panel">
            <Header
              onSearch={handleSearch}
              searchVal={search}
              userPermissions={permissions?.user}
              onCreate={handleCreate}
              showConfirmBox={showConfirmBox}
              openApprovalProcessDialog={() => setShowApprovalProcessDialog(true)}
              openGlobalRolesDialog={handleGlobalRolesOpenDialog}
              openRegionalRolesDialog={handleRegionalRolesOpenDialog}
              rolesActionDisabled={selectedRecords.length === 0}
              approvalProcessActionDisabled={selectedRecords.length === 0 || !(user?.user?.userType === userType.brandAdmin)}
              canDelete={selectedRecords.length > 1}
              selectedRecordsLength={selectedRecords.length}
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
              userSetupDisabled={selectedRecords.length === 0}
              manageDeleteUser={() => {
                if (selectedRecords[0] && selectedRecords[0]?._id) {
                  setDeleteUser(selectedRecords[0])
                  setShowDeleteDialog(true)
                }
              }}
              isAssignBrandAdmin={user?.user?.userType === userType.brandAdmin && selectedRecords.some((records) => 'userType' in records && records.userType === userType.brandAdmin)}
              handleAssignBrandAdmin={handleAssignBrandAdmin}
              isUserSetupPermission={isUserSetupPermission}
              isUnAssignBrandAdmin={selectedRecords.length > 0 && selectedRecords.filter((records) => 'userType' in records).length === selectedRecords.length}
              handleUnAssignBrandAdmin={handleUnAssignBrandAdmin}
              columns={columns}
              dispatch={dispatch}
            />
          </div>

          {isMobile && !isTablet ? <CustomSwipableList
            allowSelection={true}
            allowSwipe={true}
            permissions={permissions?.user}
            primaryField={columns?.find(d => d.field === "concatedName")}
            onClick={(d) => {
              history.push(`${routes.userDetail.path}/${d._id}`)
            }}
            dataRows={dataRows}
            selectedRecords={selectedRecords}
            dispatch={dispatch}
            onEdit={(d) => {
              history.push(`${routes.userDetail.path}/${d._id}`)
            }}
            extraParamsToCheckDelete={true}
            onDelete={(d) => {
              setDeleteUser(d)
              setShowDeleteDialog(true)
            }}
            rowCount={rowCount}
            page={page}
            loading={loading}
            additionalDetails={[
              {
                icon: <FaSuitcase size={18} />,
                field: "regionalWideRole"
              }
            ]}
            chips={[
              {
                icon: <MdEmail />,
                label: "Email: ",
                field: "email"
              },
              {
                label: "Status",
                field: "status"
              },
              {
                icon: <IoCreateSharp />,
                label: "Created By: ",
                field: "createdBy"
              }
            ]}
            owerCollaboratorInitialsOrImages=""
            onCreate={false}
            showClone={false}
            onClone={() => { }}
            renderedFrom={renderedFrom} />
            :
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
                actionWidth={110}
                loading={loading}
                renderedFrom={renderedFrom}
                refreshGrid={fetchUsers}
              /> : null}
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
        {showBrandAssignConfirmation &&
          <ConfirmationDialog
            open={showBrandAssignConfirmation}
            message={`Are you sure you want to assign the selected user(s) Brand Admin?`}
            onClose={() => {
              setShowBrandAssignConfirmation(false)
              fetchUsers()
            }
            }
            okBtnLoading={brandAssigningLoading}
            onOk={assignBrandAdmin}
          />
        }
        {
          showBrandUnAssignConfirmation &&
          <ConfirmationDialog
            open={showBrandUnAssignConfirmation}
            onClose={() => {
              setShowBrandUnAssignConfirmation(false)
              fetchUsers()
            }}
            message={`Are you sure want to unassign the user from Brand Admin role`}
            okBtnLoading={brandUnAssigningLoading}
            onOk={unAssignBrandAdmin}
          />
        }
        {
          showDeleteDialog ?
            <ResourceTransferDialog
              open={true}
              fromResource={{ ...deleteUser, name: deleteUser?.concatedName ?? '' }}
              allResourceData={allUsers.filter(user => user.optionValue !== deleteUser?._id)}
              onClose={() => {
                setDeleteUser({})
                setShowDeleteDialog(false)
              }}
              handleDelete={() => {
                setDeleteUser({})
                setShowDeleteDialog(false)
                fetchUsers()
              }}
              resource="User"
              selectedRecords={selectedRecords}
            />
            : null
        }
      </Fragment>
    </>
  );
};

export default User;
