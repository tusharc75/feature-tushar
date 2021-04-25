import { useState, FC, useCallback, useEffect, useContext } from "react";
import {
  Checkbox,
  Tooltip,
  IconButton,
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
import DataGridCustomToolbar from "../../components/Helpers/DataGridCustomToolbar";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import MessageDialog from "../../components/Helpers/MessageDialog";
import { getSearchQuery } from "../../services/util";
import { useData } from "../../StateProvider/Provider";
import CreateEntity from "./CreateEntity";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import NoDataCell from "../../components/Helpers/NoDataCell";
import {
  SET_USER,
  USER_LOADING,
  SET_SELECTED_ENTITY,
} from "../../StateProvider/actionTypes";
import AssignRolesDialog from "../../components/AssignRolesDialog/AssignEntityDialog";
import CustomDataGridNoDataFound from "../../components/Helpers/CustomDataGridNoDataFound";

const Entity: FC = () => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { permissions },
    dispatch,
  }: any = useData();
  const [searchVal, setSearchVal] = useState("");
  const [query, setQuery] = useState({ page: 0, limit: 25 });
  const [rolesDialogOpen, setRolesDialogOpen] = useState(false);
  const [selectedEntities, setSelectedEntities] = useState<any[]>([]);

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
        getRows(data);
        setRowCount(count);
        setCheckAllEntities(false);
        setLoadingEntities(false);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setLoadingEntities(false);
      });
    // eslint-disable-next-line
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
          createdBy: entity?.createdBy,
          updatedBy: entity?.updatedBy,
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
      width: 250,
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
    //   width: 150,
    //   renderCell: (params: any) => (
    //     <p title={`Created At • ${params.value}`} className="text-truncate">
    //       {params?.value}
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
            {params?.value?.user?.firstName}
            <span
              className="createdAtTime badge-date"
              title={`${params?.value?.user?.firstName} • ${moment(
                params?.value?.date?.slice(0, 10)
              ).format("MMM Do, YYYY")}`}
            >
              {moment(params?.value?.date?.slice(0, 10)).format("MMM Do, YYYY")}
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
      renderCell: (params: any) =>
        params?.value && params?.value?.user ? (
          <h5 className="updateBy">
            {params.value.user.firstName}
            <span
              className="updatedAtTime"
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
      disableColumnMenu: true,
      sortable: false,
      filterable: false,
    },

    {
      field: "actions",
      headerName: "Actions ",
      disableColumnMenu: true,
      sortable: false,
      filterable: false,
      renderCell: (params: any) => (
        <>
          <span
            title={
              permissions?.entity.isDelete
                ? "Delete"
                : "You can't do this action"
            }
          >
            <IconButton
              disabled={!permissions?.entity.isDelete}
              aria-label="Delete"
              onClick={() => showConfirmBox(params.row)}
            >
              <DeleteIcon fontSize="small" color="error" />
            </IconButton>
          </span>
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
    setIsConformDialogVisible(true);
    if (row && row.id) {
      setDeleteRec(row);
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
          fetchUserData();
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

  const fetchUserData = () => {
    dispatch({ type: USER_LOADING, payload: true });
    axiosInstance()
      .get("/user/me")
      .then(({ data: response }) => {
        const { data } = response;
        dispatch({ type: SET_USER, payload: data });
        if (data?.role?.selectedEntity?._id) {
          dispatch({
            type: SET_SELECTED_ENTITY,
            payload: data.role.selectedEntity._id,
          });
        }
        dispatch({ type: USER_LOADING, payload: false });
      })
      .catch((err) => {
        localStorage.setItem("token", "");
        dispatch({ type: USER_LOADING, payload: false });
      });
  };

  const onFilterChange = useCallback((params) => {
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
        <CreateEntity
          open={isOpen}
          close={handleClose}
          fetchData={fetchEntities}
        />
      )}
      {rolesDialogOpen && (
        <AssignRolesDialog
          entitiesDialogOpen={rolesDialogOpen}
          handleCloseDialog={handleCloseDialog}
          type="role"
          ids={selectedEntities}
          onSuccess={() => {
            fetchEntities();
            handleCloseDialog();
          }}
        />
      )}
      <Layout>
        <CustomBreadCrumbs routes={[routes.entity]} />
        <div className="main-container">
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
          <div className="listing-grid">
            <DataGrid
              components={{
                Toolbar: DataGridCustomToolbar,
                NoRowsOverlay: CustomDataGridNoDataFound,
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
              onFilterModelChange={onFilterChange}
            />
          </div>
        </div>
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
