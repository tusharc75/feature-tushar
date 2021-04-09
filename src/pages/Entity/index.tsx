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
  Dialog,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Button,
  CircularProgress,
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
import CreateEntity from "./CreateEntity";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import CustomDialogHeader from "../../components/CustomDialog/CustomDialogHeader";
import Loader from "../../components/Loader";
import CustomDialogContent from "../../components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "../../components/CustomDialog/CustomDialogFooter";

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

const Entity: FC = () => {
  const toastConfig = useContext(CustomToastContext);
  const classes = useStyles();
  const {
    state: { user, permissions },
  }: any = useData();
  const [searchVal, setSearchVal] = useState("");
  const [query, setQuery] = useState({ page: 0, limit: 25 });
  const [entities, setEntities] = useState<any[]>([]);
  const [rolesDialogOpen, setRolesDialogOpen] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<any[]>([]);
  const [selectedEntities, setSelectedEntities] = useState<any[]>([]);
  const [isAssigning, setAssigning] = useState(false);

  const [dataRows, setDataRows] = useState<any[]>([]);
  const [rowCount, setRowCount] = useState(0);

  const [loadingEntities, setLoadingEntities] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [checkAllEntities, setCheckAllEntities] = useState(false);
  const [deleteRec, setDeleteRec] = useState<any>({});
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
  const [
    showDeleteWarningConfirmBox,
    setShowDeleteWarningConfirmBox,
  ] = useState(false);

  const fetchEntities = useCallback(() => {
    let searchParams: any = { ...query };
    searchParams = searchVal
      ? { ...searchParams, search: searchVal }
      : { ...searchParams };
    let api = getSearchQuery("/entity", searchParams);
    setLoadingEntities(true);
    axiosInstance()
      .get(api)
      .then(({ data: { data, count } }) => {
        setEntities(data);
        getRows(data);
        setRowCount(count);
        setLoadingEntities(false);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setLoadingEntities(false);
      });
  }, [searchVal, query]);

  useEffect(() => {
    fetchEntities();
  }, [fetchEntities]);

  const getRows = (data: []) => {
    const rows = data.length
      ? data.map((entity: any) => ({
          id: entity._id,
          isChecked: false,
          name: entity.entityName,
          address: entity.address,
          createdAt: moment(entity.createdAt).format("MMM Do, YYYY"),
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
          checked={checkAllEntities}
          onChange={(ev) => {
            setCheckAllEntities(ev.target.checked);
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
        <MuiLink
          title={params.value}
          className="text-truncate"
          component={Link}
          to={`${routes.entityDetails.path}/${params.row.id}`}
        >
          {params.value}
        </MuiLink>
      ),
    },
    {
      field: "address",
      headerName: "Address",
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
      renderCell: (params: any) => (
        <>
          {permissions?.entity?.isDelete ? (
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
              title="You do not have permission to delete entity"
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
      setCheckAllEntities(true);
    } else {
      setCheckAllEntities(false);
    }

    handleSelectedEntities(params.row.id, ev.target.checked);
  };

  const showConfirmBox = (row) => {
    if (row) {
      setIsConformDialogVisible(true);
      if (row && row.id) {
        setDeleteRec(row);
      }
    } else {
      if (dataRows.find((d) => d.isChecked)) {
        setShowDeleteWarningConfirmBox(true);
      } else {
        setIsConformDialogVisible(true);
      }
    }
  };

  const handleDeleteEntities = async () => {
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
        .put(`/entity/remove`, { ids: [...recs] })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: "success",
            message: data.message,
          });
          setIsConformDialogVisible(false);
          setDeleteLoading(false);
          if (deleteRec) setDeleteRec({});
          fetchEntities();
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

  // Get all roles
  const getRoles = async () => {
    setLoadingRoles(true);
    try {
      const {
        data: { data },
      } = await axiosInstance().get(`/role`);
      setRoles(data);
      setLoadingRoles(false);
    } catch (error) {
      setLoadingRoles(false);
      toastConfig.setToastConfig(error);
    }
  };

  // Handle entity selection
  const handleSelectedEntities = (id, isChecked) => {
    let tempSelectedEntities = [...selectedEntities],
      curRecIndex = selectedEntities.indexOf(id);
    if (isChecked && curRecIndex < 0) {
      tempSelectedEntities = [...selectedEntities, id];
    } else if (!isChecked && curRecIndex >= 0) {
      tempSelectedEntities.splice(curRecIndex, 1);
    }
    setSelectedEntities(tempSelectedEntities);
  };

  // handle role selection from dialog
  const handleRoleSelection = (e, id) => {
    let tempSelectedRoles = [...selectedRoles];
    let curIndex = tempSelectedRoles.indexOf(id);
    if (e.target.checked) {
      if (curIndex < 0) tempSelectedRoles = [...tempSelectedRoles, id];
    } else if (curIndex >= 0) {
      tempSelectedRoles.splice(curIndex, 1);
    }
    setSelectedRoles(tempSelectedRoles);
  };

  // Handle/Submit Roles
  const handleAssignRoles = async () => {
    if (selectedEntities.length && selectedRoles.length) {
      setAssigning(true);
      try {
        const dataObj = {
          entities: selectedEntities,
          roles: selectedRoles,
        };
        const { data } = await axiosInstance().put("/entity/add-role", dataObj);
        toastConfig.setToastConfig({
          message: "Roles assigned successfully",
          type: "success",
          open: true,
        });
        setAssigning(false);
        handleCloseDialog();
        fetchEntities();
        setSelectedRoles([]);
        setSelectedEntities([]);
      } catch (error) {
        setAssigning(false);
        toastConfig.setToastConfig(error);
      }
    }
  };

  const handleCreate = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleOpenDialog = () => {
    setRolesDialogOpen(true);
    getRoles();
  };

  const handleCloseDialog = () => {
    setRolesDialogOpen(false);
  };

  return (
    <>
      {isOpen && (
        <CreateEntity
          open={isOpen}
          close={handleClose}
          fetchData={fetchEntities}
        />
      )}
      <Dialog
        fullWidth
        maxWidth="xs"
        open={rolesDialogOpen}
        onClose={handleCloseDialog}
        aria-labelledby="assign-roles-dialog"
      >
        <CustomDialogHeader title="Assign roles" />
        <CustomDialogContent>
          {loadingRoles ? (
            <Loader text="Loading Roles" />
          ) : roles.length ? (
            <List style={{ padding: 0 }}>
              {roles.map((role) => (
                <ListItem divider key={role._id}>
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      onChange={(e) => handleRoleSelection(e, role._id)}
                      checked={selectedRoles.indexOf(role._id) >= 0}
                      inputProps={{
                        "aria-labelledby": `checkbox-list-label-${role._id}`,
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={role.name}
                    secondary={role.description}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography>No Roles</Typography>
          )}
        </CustomDialogContent>
        <CustomDialogFooter>
          <Button
            disabled={isAssigning}
            onClick={handleCloseDialog}
            color="primary"
          >
            Cancel
          </Button>
          <Button
            disabled={!selectedRoles.length || isAssigning}
            onClick={handleAssignRoles}
            color="primary"
          >
            {isAssigning ? <CircularProgress size={22} /> : "Save"}
          </Button>
        </CustomDialogFooter>
      </Dialog>
      <Layout>
        <CustomBreadCrumbs routes={[routes.entity]} />
        <Grid container direction="row" className="header-links">
          <Grid item xs={12} sm={12} className="pr-3">
            <Grid container justify="flex-end">
              <Link
                href="#"
                onClick={(e) => e.preventDefault()}
                className={classes.links}
              >
                Import from Excel
              </Link>
              <Divider
                orientation="vertical"
                flexItem
                className={classes.linkDivider}
              />
              <Link
                href="#"
                onClick={(e) => e.preventDefault()}
                className={classes.links}
              >
                Export to Excel
              </Link>
              <Divider
                orientation="vertical"
                flexItem
                className={classes.linkDivider}
              />
              <Link
                href="#"
                onClick={(e) => e.preventDefault()}
                className={classes.links}
              >
                Download Template
              </Link>
              <Divider
                orientation="vertical"
                flexItem
                className={classes.linkDivider}
              />
              <Link
                href="#"
                onClick={(e) => e.preventDefault()}
                className={classes.links}
              >
                Email a Link
              </Link>
            </Grid>
          </Grid>
        </Grid>
        <Container>
          <div className="header-panel">
            <Header
              onSearch={handleSearch}
              searchVal={searchVal}
              entityPermissions={permissions?.entity}
              onCreate={handleCreate}
              showConfirmBox={showConfirmBox}
              openRolesDialog={handleOpenDialog}
              rolesActionDiabled={Boolean(!selectedEntities.length)}
              canDelete={dataRows.filter((d) => d.isChecked).length === 0}
            />
          </div>
        </Container>
        <Container>
          <div className="listing-grid">
            <DataGrid
              components={{
                Toolbar: DataGridCustomToolbar,
              }}
              loading={loadingEntities}
              rows={loadingEntities ? [] : dataRows}
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
            message={`Are you sure, you want to delete entity ${
              deleteRec.name || ""
            }?`}
            onClose={() => {
              if (deleteRec) setDeleteRec({});
              setIsConformDialogVisible(false);
            }}
            okBtnLoading={deleteLoading}
            onOk={handleDeleteEntities}
          />
        ) : null}
      </Layout>
    </>
  );
};

export default Entity;
