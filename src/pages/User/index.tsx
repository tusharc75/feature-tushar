import { useState, FC, useCallback, useEffect } from "react";
import {
  Checkbox,
  Chip,
  Grid,
  Divider,
  Tooltip,
  IconButton,
  makeStyles,
  Link as MuiLink,
} from "@material-ui/core";
import { Delete as DeleteIcon } from "@material-ui/icons";
import { DataGrid } from "@material-ui/data-grid";
import moment from "moment";
import { Link } from "react-router-dom";

import axiosInstance from "../../axios/axiosInstance";
import Layout from "../../components/Layout";
import routes from "./../../components/Helpers/Routes";
import CustomBreadCrumbs from "./../../components/CustomBreadCrumbs";
import Header from "./Header";
import Container from "../../components/Container";
import DataGridCustomToolbar from "../../components/Helpers/DataGridCustomToolbar";
import { CustomEventEmitter } from "./../../axios/events";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import MessageDialog from "../../components/Helpers/MessageDialog";
import { getSearchQuery } from "../../services/util";
import { useData } from "../../StateProvider/Provider";

const useStyles = makeStyles((theme) => ({
  linksContainer: {
    display: "flex",
  },
  links: {
    color: theme.palette.primary.main, //  textDark
  },
  linkDivider: {
    backgroundColor: theme.palette.primary.main, //  darkBg
    margin: "0 1rem",
  },
}));

const User: FC = () => {
  const classes = useStyles();
  const {
    state: { user },
  }: any = useData();
  const [searchVal, setSearchVal] = useState("");
  const [query, setQuery] = useState({ page: 0, limit: 25 });
  const [users, setUsers] = useState<any[]>([]);
  const [dataRows, setDataRows] = useState<any[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [renderCount, setRenderCount] = useState(0);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [checkAllUsers, setCheckAllUsers] = useState(false);
  const [deleteRec, setDeleteRec] = useState<any>({});
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [usersPermissions, setUsersPermissions] = useState({
    isCreate: false,
    isUpdate: false,
    isRead: false,
    isDelete: false,
  });
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
  const [
    showDeleteWarningConfirmBox,
    setShowDeleteWarningConfirmBox,
  ] = useState(false);

  const fetchUsers = useCallback(() => {
    // let searchParams: any = { ...query };
    // searchParams = searchVal
    //   ? { ...searchParams, search: searchVal }
    //   : { ...searchParams };
    // let api = getSearchQuery("/user", searchParams);
    setLoadingUsers(true);
    axiosInstance()
      .get("/user")
      .then(({ data: { data, count } }) => {
        setUsers(data);
        getRows(data);
        setRowCount(count);
        setLoadingUsers(false);
      })
      .catch((err) => {
        console.log(err);
        setLoadingUsers(false);
      });
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const data = user?.role?.sideBar;
    if (data) {
      const hasUsersPermission = data.find((d: any) => d.name === "User");
      if (hasUsersPermission) {
        setUsersPermissions({
          isCreate: hasUsersPermission.isCreate,
          isUpdate: hasUsersPermission.isUpdate,
          isRead: hasUsersPermission.isRead,
          isDelete: hasUsersPermission.isDelete,
        });
      }
    }
  }, [user]);

  const getRows = (data: []) => {
    const rows = data.length
      ? data.map((user: any) => ({
          id: user._id,
          isChecked: false,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          createdAt: moment(user.createdAt).format("MMM Do, YYYY"),
          status: user.blocked ? user.blocked : false,
        }))
      : [];

    setDataRows(rows);
  };

  const columns = [
    {
      field: "isChecked",
      headerName: "Checkbox",
      renderHeader: () => (
        <Checkbox
          color="primary"
          checked={checkAllUsers}
          onChange={(ev) => {
            setCheckAllUsers(ev.target.checked);
            const gridData = dataRows;
            gridData.map((d) => {
              d.isChecked = ev.target.checked;
              return d;
            });
            setDataRows([...gridData]);
          }}
        />
      ),
      renderCell: (params) => (
        <Checkbox
          color="primary"
          checked={params.value}
          onChange={(ev) => {
            updateCheckedStatus(params, ev);
          }}
        />
      ),
      disableColumnMenu: true,
      sortable: false,
      filterable: false,
      width: 75,
    },
    {
      field: "name",
      headerName: "Name",
      width: 200,
      renderCell: (params: any) => (
        <Link
          title={params.value}
          className="text-truncate LeadNameLink"
          to={`/${routes.userDetails.path}/${params.row.id}`}
        >
          {params.value}
        </Link>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params: any) => (
        <Chip
          size="small"
          label={params.value ? "Active" : "Inactive"}
          className={params.value ? "bg-primary" : "bg-danger"}
        />
      ),
    },

    {
      field: "email",
      headerName: "Email",
      width: 200,
      renderCell: (params: any) => (
        <p title={params.value} className="text-truncate">
          {params.value}
        </p>
      ),
    },
    {
      field: "createdAt",
      headerName: "Created At",
      width: 150,
      renderCell: (params: any) => (
        <p title={`Created At • ${params.value}`} className="text-truncate">
          {params.value}
        </p>
      ),
    },

    {
      field: "actions",
      headerName: "Actions ",
      renderCell: (params: any) =>
        user?.user._id === params.row.id ? (
          <p title="There is no action for currently logged in user">
            No Actions
          </p>
        ) : (
          <>
            {usersPermissions.isDelete ? (
              params.row.allowToDelete ? (
                <Tooltip title="Delete">
                  <IconButton
                    aria-label="Delete"
                    onClick={() => showConfirmBox(params.row)}
                  >
                    <DeleteIcon fontSize="small" color="error" />
                  </IconButton>
                </Tooltip>
              ) : (
                <Tooltip
                  className="cursor-stop"
                  title="You must be the owner of this user to get the delete functionality"
                >
                  <IconButton aria-label="Delete">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )
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
        ),
      width: 200,
    },
  ];

  const updateCheckedStatus = (params, ev) => {
    const gridData = [...dataRows];
    const indexOfRecord = gridData.findIndex((d) => d.id === params.row.id);
    gridData[indexOfRecord].isChecked = ev.target.checked;

    setDataRows([...gridData]);

    const checkedRecords = gridData.filter((d) => d.isChecked === true);

    if (checkedRecords.length === gridData.length) {
      setCheckAllUsers(true);
    } else {
      setCheckAllUsers(false);
    }
  };

  const showConfirmBox = (row) => {
    if (row) {
      setIsConformDialogVisible(true);
      if (row && row._id) {
        setDeleteRec(row);
      }
    } else {
      if (dataRows.find((d) => d.isChecked && d.allowToDelete == false)) {
        setShowDeleteWarningConfirmBox(true);
      } else {
        setIsConformDialogVisible(true);
      }
    }
  };

  const handleDeleteLeads = async () => {
    setDeleteLoading(true);
    let recs = [];
    if (deleteRec?._id) {
      recs.push(deleteRec?._id);
    } else {
      dataRows.forEach((obj) => {
        if (obj.isChecked) recs.push(obj._id);
      });
    }
    if (recs && recs.length > 0) {
      axiosInstance()
        .put(`/user/remove`, { ids: [...recs] })
        .then(({ data }) => {
          CustomEventEmitter.dispatch("show-toast", {
            type: "success",
            errorMsg: data.message,
          });
          setIsConformDialogVisible(false);
          setDeleteLoading(false);
          if (deleteRec) setDeleteRec({});
          fetchUsers();
        })
        .catch((err) => {
          setIsConformDialogVisible(false);
          setDeleteLoading(false);
        });
    }
  };

  const handleSearch = (e) => {
    if (query.page !== 0) {
      setQuery((prevState) => ({ ...prevState, page: 0 }));
    }
    setSearchVal(e.target.value);
  };

  const handlePage = (params) => {
    if (query.page !== params.page) {
      setQuery((prevState) => ({ ...prevState, page: params.page }));
    }
  };

  const handlePageSize = (params) => {
    if (params.pageSize !== query.limit) {
      setQuery({ page: 0, limit: params.pageSize });
    }
  };

  const handleSortModelChange = (params) => {
    if (params?.sortModel && params.sortModel.length > 0) {
      let temp = { ...params.sortModel[0] };
      setQuery((prevState) => ({
        ...prevState,
        page: 0,
        sortBy: temp.field,
        orderBy: temp.sort,
      }));
    }
  };

  const handleCreate = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <Layout>
      <Grid container spacing={3} direction="row">
        <Grid item xs={12} sm={6} className="pl-3">
          <CustomBreadCrumbs routes={[routes.user]} />
        </Grid>
        <Grid item xs={12} sm={6} className="pr-3">
          <Grid container justify="flex-end">
            <MuiLink
              href="#"
              onClick={(e) => e.preventDefault()}
              className={classes.links}
            >
              Import from Excel
            </MuiLink>
            <Divider
              orientation="vertical"
              flexItem
              className={classes.linkDivider}
            />
            <MuiLink
              href="#"
              onClick={(e) => e.preventDefault()}
              className={classes.links}
            >
              Export to Excel
            </MuiLink>
            <Divider
              orientation="vertical"
              flexItem
              className={classes.linkDivider}
            />
            <MuiLink
              href="#"
              onClick={(e) => e.preventDefault()}
              className={classes.links}
            >
              Download Template
            </MuiLink>
            <Divider
              orientation="vertical"
              flexItem
              className={classes.linkDivider}
            />
            <MuiLink
              href="#"
              onClick={(e) => e.preventDefault()}
              className={classes.links}
            >
              Email a Link
            </MuiLink>
          </Grid>
        </Grid>
      </Grid>
      <Container>
        <Header
          onSearch={handleSearch}
          searchVal={searchVal}
          userPermissions={usersPermissions}
          onCreate={handleCreate}
          showConfirmBox={showConfirmBox}
          canDelete={dataRows.filter((d) => d.isChecked).length == 0}
        />
      </Container>
      <Container styles={{ minHeight: "calc(100vh - 210px)", padding: 10 }}>
        <div className="contact-grid-height1">
          <DataGrid
            components={{
              Toolbar: DataGridCustomToolbar,
            }}
            loading={loadingUsers}
            rows={loadingUsers ? [] : dataRows}
            columns={columns}
            disableSelectionOnClick
            disableMultipleSelection
            paginationMode="server"
            pagination
            rowCount={rowCount}
            onPageChange={handlePage}
            onPageSizeChange={handlePageSize}
            pageSize={query.limit}
            page={query.page}
            onSortModelChange={handleSortModelChange}
            rowsPerPageOptions={[25, 50, 75]}
            density="compact"
          />
        </div>
      </Container>
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
          message={`Are you sure, you want to delete user ${
            deleteRec.name || ""
          }?`}
          onClose={() => {
            if (deleteRec) setDeleteRec({});
            setIsConformDialogVisible(false);
          }}
          okBtnLoading={deleteLoading}
          onOk={handleDeleteLeads}
        />
      ) : null}
    </Layout>
  );
};

export default User;
