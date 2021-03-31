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
import CreateEntity from "./CreateEntity";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
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
    state: { user },
  }: any = useData();
  const [searchVal, setSearchVal] = useState("");
  const [query, setQuery] = useState({ page: 0, limit: 25 });
  const [entities, setEntities] = useState<any[]>([]);
  const [dataRows, setDataRows] = useState<any[]>([]);
  const [rowCount, setRowCount] = useState(0);

  const [loadingEntities, setLoadingEntities] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [checkAllEntities, setCheckAllEntities] = useState(false);
  const [showCreateEntityDialog, setShowCreateEntityDialog] = useState(false);
  const [deleteRec, setDeleteRec] = useState<any>({});
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [entitiesPermissions, setEntitiesPermissions] = useState({
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

  useEffect(() => {
    const data = user?.role?.sideBar;
    if (data) {
      const hasUsersPermission = data.find((d: any) => d.name === "Entity");
      if (hasUsersPermission) {
        setEntitiesPermissions({
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
          {entitiesPermissions.isDelete ? (
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

  const handleCreate = () => {
    setIsOpen(true);
    setShowCreateEntityDialog(true);
  };

  const handleClose = () => {
    setIsOpen(false);
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
      <Layout>
        <Grid container spacing={3} direction="row">
          <Grid item xs={12} sm={6} className="pl-3">
            <CustomBreadCrumbs routes={[routes.entity]} />
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
            entityPermissions={entitiesPermissions}
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
