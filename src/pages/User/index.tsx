import React, { useState, FC, useCallback, useEffect, useContext } from "react";
import { Checkbox, Tooltip, IconButton } from "@material-ui/core";
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
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import MessageDialog from "../../components/Helpers/MessageDialog";
import { getSearchQuery } from "../../services/util";
import { useData } from "../../StateProvider/Provider";
import CreateUser from "./CreateUser";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import { FaUserCheck, FaUserAltSlash } from "react-icons/fa";
import AssignRolesDialog from "../../components/AssignRolesDialog/AssignRolesDialog";
import NoDataCell from "../../components/Helpers/NoDataCell";
import CustomDataGridNoDataFound from "../../components/Helpers/CustomDataGridNoDataFound";

let userTimeout;
const User: FC = () => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions },
  }: any = useData();
  const [searchVal, setSearchVal] = useState("");
  const [query, setQuery] = useState({ page: 0, limit: 25 });
  const [rolesDialogOpen, setRolesDialogOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [dataRows, setDataRows] = useState<any[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [checkAllUsers, setCheckAllUsers] = useState(false);
  const [deleteRec, setDeleteRec] = useState<any>({});
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
  const [
    showDeleteWarningConfirmBox,
    setShowDeleteWarningConfirmBox,
  ] = useState(false);

  const fetchUsers = useCallback(() => {
    if (userTimeout) {
      clearTimeout(userTimeout);
    }

    userTimeout = setTimeout(() => {
      let searchParams: any = { ...query };
      searchParams = searchVal
        ? { ...searchParams, search: searchVal }
        : { ...searchParams };
      let api = getSearchQuery("/user", searchParams);
      setLoadingUsers(true);
      axiosInstance()
        .get(api)
        .then(({ data: { data, count } }) => {
          getRows(data);
          setRowCount(count);
          setLoadingUsers(false);
        })
        .catch((err) => {
          toastConfig.setToastConfig(err);
          setLoadingUsers(false);
        });
    }, 600);
  }, [searchVal, query, toastConfig]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const getRows = (data: []) => {
    const rows = data.length
      ? data.map((user: any) => ({
          id: user._id,
          isChecked: false,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          createdAt: moment(user.createdAt).format("MMM Do, YYYY"),
          createdBy: user.createdBy,
          updatedBy: user.updatedBy,
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
      width: 400,
      renderCell: (params: any) => (
        <Link
          title={params.value}
          className="text-truncate LeadNameLink"
          to={ { pathname: `${routes.userDetails.path}/${params.row.id}`, state: { userList: dataRows} }}
        >
          {params.value}
        </Link>
      ),
      sortable: false,
      filterable: false,
    },
    {
      field: "status",
      headerName: "Status",
      width: 150,
      sortable: false,
      filterable: false,
      align: "center",
      headerAlign: "center",
      disableColumnMenu: true,
      renderCell: (params: any) => (
        <div style={{ width: 150 }}>
          {params.value ? (
            <FaUserCheck className="text-success" />
          ) : (
            <FaUserAltSlash className="text-error" />
          )}{" "}
        </div>
      ),
    },

    {
      field: "email",
      headerName: "Email",
      width: 300,
      renderCell: (params: any) => (
        <p title={params.value} className="text-truncate">
          {params.value}
        </p>
      ),
    },
    // {
    //   field: "createdAt",
    //   headerName: "Created At",
    //   width: 200,
    //   renderCell: (params: any) => (
    //     <p title={`Created At • ${params.value}`} className="text-truncate">
    //       {params.value}
    //     </p>
    //   ),
    // },
    {
      field: "createdBy",
      headerName: "Created By",
      width: 250,
      disableColumnMenu: true,
      sortable: false,
      filterable: false,
      renderCell: (params: any) =>
        params?.value && params?.value?.user ? (
          <h5 className="createBy">
            {params.value.user.firstName}
            <span
              className="createdAtTime"
              title={`${params.value.user.firstName} • ${moment(
                params.value.date.slice(0, 10)
              ).format("MMM Do, YYYY")}`}
            >
              {moment(params.value.date.slice(0, 10)).format("MMM Do, YYYY")}
            </span>
          </h5>
        ) : (
          <NoDataCell />
        ),
    },
    {
      field: "updatedBy",
      headerName: "Updated By",
      width: 250,
      sortable: false,
      filterable: false,
      renderCell: (params) =>
        params?.value?.user ? (
          <h5 className="updateBy">
            {params?.value?.user?.firstName}
            <span title={params?.value?.date} className="updatedAtTime">
              {moment(params?.value?.date?.slice(0, 10)).format("MMM Do, YYYY")}
            </span>
          </h5>
        ) : (
          <NoDataCell />
        ),
    },
    {
      field: "actions",
      headerName: "Actions ",
      disableColumnMenu: true,
      sortable: false,
      filterable: false,
      renderCell: (params: any) =>
        user?.user._id === params.row.id ? (
          <p title="There is no action for currently logged in user">
            No Actions
          </p>
        ) : (
          <>
            {permissions.user.isDelete ? (
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
  ] as Array<any>;

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
    handleSelectedUsers(params.row.id, ev.target.checked);
  };

  const showConfirmBox = (row) => {
    if (row) {
      setIsConformDialogVisible(true);
      if (row && row.id) {
        setDeleteRec(row);
      }
    } else {
      if (dataRows.find((d) => d.isChecked && d.allowToDelete === false)) {
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
      dataRows.forEach((obj) => {
        if (obj.isChecked) recs.push(obj.id);
      });
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

  // Handle entity selection
  const handleSelectedUsers = (id, isChecked) => {
    let tempSelectedUsers = [...selectedUsers],
      curRecIndex = selectedUsers.indexOf(id);
    if (isChecked && curRecIndex < 0) {
      tempSelectedUsers = [...selectedUsers, id];
    } else if (!isChecked && curRecIndex >= 0) {
      tempSelectedUsers.splice(curRecIndex, 1);
    }
    setSelectedUsers(tempSelectedUsers);
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

  const onFilterChange = React.useCallback((params) => {
    if (params.filterModel.items[0].value) {
      setQuery((prevState) => ({
        ...prevState,
        [params.filterModel.items[0].columnField]:
          params.filterModel.items[0].value,
      }));
    } else {
      setQuery({ page: 0, limit: 25 });
    }
  }, []);

  return (
    <>
      {isOpen && (
        <CreateUser open={isOpen} close={handleClose} fetchData={fetchUsers} />
      )}
      {rolesDialogOpen && (
        <AssignRolesDialog
          rolesDialogOpen={rolesDialogOpen}
          handleCloseDialog={handleCloseDialog}
          userIds={selectedUsers}
          onSuccess={() => {
            handleCloseDialog();
            setSelectedUsers([]);
          }}
        />
      )}
      <Layout>
        <CustomBreadCrumbs routes={[routes.user]} />

        <Container>
          <div className="header-panel">
            <Header
              onSearch={handleSearch}
              searchVal={searchVal}
              userPermissions={permissions.user}
              onCreate={handleCreate}
              showConfirmBox={showConfirmBox}
              openRolesDialog={handleOpenDialog}
              rolesActionDiabled={Boolean(!selectedUsers.length)}
              canDelete={dataRows.filter((d) => d.isChecked).length === 0}
            />
          </div>
        </Container>
        <Container>
          <div className="listing-grid">
            <DataGrid
              components={{
                Toolbar: DataGridCustomToolbar,
                NoRowsOverlay: CustomDataGridNoDataFound,
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
              onFilterModelChange={onFilterChange}
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
            onOk={handleDeleteUser}
          />
        ) : null}
      </Layout>
    </>
  );
};

export default User;
