import { useState, FC, useCallback, useEffect, useContext } from "react";
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
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import MessageDialog from "../../components/Helpers/MessageDialog";
import { getSearchQuery } from "../../services/util";
import { useData } from "../../StateProvider/Provider";

import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import CreateRole from "./CreateRole";

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

const RoleTypes = [
  {
    key: "Global",
    value: 1
  },
  {
    key: "Regional",
    value: 2
  }
]

const Roles: FC = () => {
  const toastConfig = useContext(CustomToastContext);
  const classes = useStyles();
  const {
    state: { user },
  }: any = useData();
  const [searchVal, setSearchVal] = useState("");
  const [selectedType, setSelectedType] = useState(1)
  const [query, setQuery] = useState({ page: 0, limit: 25 });
  const [roles, setRoles] = useState<any[]>([]);
  const [dataRows, setDataRows] = useState<any[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [renderCount, setRenderCount] = useState(0);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [checkAllRoles, setCheckAllRoles] = useState(false);
  const [deleteRec, setDeleteRec] = useState<any>({});
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [rolesPermissions, setRolesPermissions] = useState({
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

  const fetchRoles = useCallback(() => {
    let searchParams: any = { ...query, type: selectedType };
    searchParams = searchVal
      ? { ...searchParams, search: searchVal }
      : { ...searchParams };
    let api = getSearchQuery("/role", searchParams);
    setLoadingRoles(true);
    axiosInstance()
      .get(api)
      .then(({ data: { data, count } }) => {
        setRoles(data);
        getRows(data);
        setRowCount(count);
        setLoadingRoles(false);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setLoadingRoles(false);
      });
  }, [searchVal, query, selectedType]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    const data = user?.role?.sideBar;
    if (data) {
      const hasRolePermission = data.find((d: any) => d.name === "Role");
      if (hasRolePermission) {
        setRolesPermissions({
          isCreate: hasRolePermission.isCreate,
          isUpdate: hasRolePermission.isUpdate,
          isRead: hasRolePermission.isRead,
          isDelete: hasRolePermission.isDelete,
        });
      }
    }
  }, [user]);

  const getRows = (data: []) => {
    const rows = data.length
      ? data.map((role: any) => ({
        id: role._id,
        isChecked: false,
        name: role.name,
        description: role.description,
        type: `${role.type === 1 ? "Global" : "Regional"} Role`,
        createdAt: moment(role.createdAt).format("MMM Do, YYYY"),
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
          checked={checkAllRoles}
          onChange={(ev) => {
            setCheckAllRoles(ev.target.checked);
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
          to={`${routes.roleDetails.path}/${params.row.id}`}
        >
          {params.value}
        </Link>
      ),
    },
    {
      field: "description",
      headerName: "Description",
      width: 300,
      renderCell: (params: any) => (
        <p title={params.value} className="text-truncate">
          {params.value}
        </p>
      ),
    },
    {
      field: "type",
      headerName: "Type",
      width: 140,
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
      renderCell: (params: any) => (
        <>
          {rolesPermissions.isDelete ? (
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
              title="You do not have permission to delete role"
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
      setCheckAllRoles(true);
    } else {
      setCheckAllRoles(false);
    }
  };

  const showConfirmBox = (row) => {
    if (row) {
      setIsConformDialogVisible(true);
      if (row && row.id) {
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

  const handleDeleteRole = async () => {
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
        .put(`/role/remove`, { ids: [...recs] })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: "success",
            message: data.message,
          });
          setIsConformDialogVisible(false);
          setDeleteLoading(false);
          if (deleteRec) setDeleteRec({});
          fetchRoles();
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

  const handleCreate = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };
  const handleRoleTypeSel = (filteredValue) => {
    setSelectedType(filteredValue);
  };
  return (
    <>
      {isOpen && (
        <CreateRole open={isOpen} close={handleClose} fetchData={fetchRoles} roleType={selectedType} />
      )}
      <Layout>
        <Grid container spacing={3} direction="row">
          <Grid item xs={12} sm={6} className="pl-3">
            <CustomBreadCrumbs routes={[routes.role]} />
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
            selectedType={selectedType}
            onTypeChange={handleRoleTypeSel}
            options={RoleTypes}
            onSearch={handleSearch}
            searchVal={searchVal}
            rolePermissions={rolesPermissions}
            onCreate={handleCreate}
            showConfirmBox={showConfirmBox}
            canDelete={dataRows.filter((d) => d.isChecked).length == 0}
          />
        </Container>
        <Container styles={{ minHeight: "calc(100vh - 210px)", padding: 10 }}>
          <div className="listing-grid">
            <DataGrid
              components={{
                Toolbar: DataGridCustomToolbar,
              }}
              loading={loadingRoles}
              rows={loadingRoles ? [] : dataRows}
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
            message={`Are you sure, you want to delete role ${deleteRec.name || ""
              }?`}
            onClose={() => {
              if (deleteRec) setDeleteRec({});
              setIsConformDialogVisible(false);
            }}
            okBtnLoading={deleteLoading}
            onOk={handleDeleteRole}
          />
        ) : null}
      </Layout>
    </>
  );
};

export default Roles;
