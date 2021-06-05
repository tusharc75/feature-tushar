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
import { startCase } from "lodash";
import CustomAgGrid from "../../components/AgGridComponents/CustomAgGrid";

let userTimeout: ReturnType<typeof setTimeout>;

function reducer(state, action) {
  switch (action.type) {
    case "loading":
      return {
        ...state,
        loading: action.loading
      }

    case "initialize":
      return {
        ...state,
        dataRows: action.data,
        rowCount: action.count,
        loading: false
      }

    case "selection":
      return {
        ...state,
        selectedRecords: action.selectedRecords,
      }

    case "update":
      return {
        ...state,
        dataRows: action.data,
        loading: false
      }

    case "filter":
      return {
        ...state,
        loading: true,
        filters: action.filters,
        page: 0
      }

    case "sort":
      return {
        ...state,
        sorting: action.sorting,
        loading: true
      }

    case "search":
      return {
        ...state,
        search: action.search,
        loading: true
      }

    case "pageChange":
      return {
        ...state,
        page: action.page
      }

    case "pageSizeChange":
      return {
        ...state,
        limit: action.limit,
        page: 0,
        loading: true
      }

    case "complete":
      return {
        ...state,
        loading: false
      }

    default:
      break;
  }

  return state;
}

const intialState = {
  dataRows: [],
  rowCount: 0,
  loading: false,
  page: 0,
  limit: 25,
  pageSizes: gridPageSizes,
  search: "",
  filters: {},
  sorting: [],
  selectedRecords: []
}

const User: FC = () => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions },
  }: any = useData();
  const history = useHistory();
  const [rolesDialogOpen, setRolesDialogOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
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
  });

  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

  const columns = [
    {
      field: "concatedName", headerName: "Name", show: true, disabled: true, cellRenderer: "nameRenderer",
    },
    { field: "status", headerName: "Status", show: true, filter: false, sortable: false, cellRenderer: "statusRenderer" },
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

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}`;

    if (entityRoleRedirectDetails?.id) {
      switch (entityRoleRedirectDetails?.type) {
        case "entity":
          deepFilter = `${deepFilter}&filterById=${JSON.stringify([{ field: "entities.entity", term: entityRoleRedirectDetails?.id }])}`
          break;

        case "regionalRole":
          deepFilter = `${deepFilter}&filterById=${JSON.stringify([{ field: "entities.role", term: entityRoleRedirectDetails?.id }])}`
          break;

        case "globalRole":
          deepFilter = `${deepFilter}&filterById=${JSON.stringify([{ field: "role", term: entityRoleRedirectDetails?.id }])}`
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
      deepFilter = `${deepFilter}&sortBy=${replaceFieldName(sorting[0].colId)}&orderBy=${sorting[0].sort}`
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
          const { createdBy, updatedBy, ...restProperties } = u;

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
            isBrandAdmin: u.userType === userType.brandAdmin
          };
          return res;
        });
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

  const handleOpenDialog = () => {
    setRolesDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setRolesDialogOpen(false);
  };

  return (
    <>
      {
        isOpen && (
          <ManageUserDialog open={isOpen} close={handleClose} onSuccess={() => { fetchUsers() }}
            userId={null} dataToUpdate={null} isNew={true} />
          // <CreateUser open={isOpen} close={handleClose} fetchData={fetchUsers} />
        )
      }
      {rolesDialogOpen && (
        <AssignRolesDialog
          rolesDialogOpen={rolesDialogOpen}
          handleCloseDialog={handleCloseDialog}
          userIds={selectedRecords.map((d) => d._id)}
          assignedRoles={null}
          onSuccess={() => {
            handleCloseDialog();
            setSelectedUsers([]);
          }}
        />
      )}
      <Layout>
        <Grid container className="headerbox">
          <CustomBreadCrumbs routes={[routes.user]} />
        </Grid>
        <CustomContainer>
          <div className="header-panel">
            <Header
              onSearch={handleSearch}
              searchVal={search}
              userPermissions={permissions.user}
              onCreate={handleCreate}
              showConfirmBox={showConfirmBox}
              openRolesDialog={handleOpenDialog}
              rolesActionDisabled={selectedRecords.length === 0}
              canDelete={selectedRecords.length === 0}
            />
            {entityRoleRedirectDetails.id && (
              <Chip
                className="ml-3"
                color="primary"
                label={`${startCase(entityRoleRedirectDetails.type)} : ${entityRoleRedirectDetails.name}`}
                onDelete={() => {
                  setEntityRoleRedirectDetails({ id: null, name: null, type: null });
                  // getContacts();
                }}
              />
            )}
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
