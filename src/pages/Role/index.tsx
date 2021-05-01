import React, { useState, FC, useCallback, useEffect, useContext } from "react";
import { Checkbox, Tooltip, IconButton, Grid } from "@material-ui/core";
import { Delete as DeleteIcon } from "@material-ui/icons";
import { DataGrid } from "@material-ui/data-grid";
import moment from "moment";
import { Link } from "react-router-dom";
import axiosInstance from "../../axios/axiosInstance";
import Layout from "../../components/Layout";
import routes from "./../../components/Helpers/Routes";
import CustomBreadCrumbs from "./../../components/CustomBreadCrumbs";
import CustomContainer from "../../components/CustomContainer";
import DataGridCustomToolbar from "../../components/Helpers/DataGridCustomToolbar";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import MessageDialog from "../../components/Helpers/MessageDialog";
import { getSearchQuery } from "../../services/util";
import { useData } from "../../StateProvider/Provider";

import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import CreateRole from "./CreateRole";
import NoDataCell from "../../components/Helpers/NoDataCell";
import { PERMISSION } from "../../constants/Roles";
import CustomDataGridNoDataFound from "../../components/Helpers/CustomDataGridNoDataFound";
import { roleTypes } from "../../constants/helpers";
import RoleHeader from "./RoleHeader";

const rolePermissionArray = [PERMISSION.superAdmin, PERMISSION.brandAdmin];

const Roles: FC = () => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { permissions, selectedEntity },
  }: any = useData();
  const [searchVal, setSearchVal] = useState("");
  const [selectedType, setSelectedType] = useState(1);
  const [query, setQuery] = useState({ page: 0, limit: 25 });
  const [dataRows, setDataRows] = useState<any[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [checkAllRoles, setCheckAllRoles] = useState(false);
  const [deleteRec, setDeleteRec] = useState<any>({});
  const [deleteLoading, setDeleteLoading] = useState(false);
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
        getRows(data);
        setRowCount(count);
        setCheckAllRoles(false);
        setLoadingRoles(false);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setLoadingRoles(false);
      });
    // eslint-disable-next-line
  }, [searchVal, query, selectedType]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const getRows = (data: []) => {
    const rows = data.length
      ? data.map((role: any) => ({
        ...role,
        id: role._id,
        isChecked: false,
        name: role.name,
        description: role.description,
        type: `${role.type === 1 ? "Global" : "Regional"} Role`,
        createdAt: moment(role.createdAt).format("MMM Do, YYYY"),
        createdBy: role.createdBy,
        updatedBy: role.updatedBy,
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
          className="text-truncate link"
          to={`${routes.roleDetail.path}/${params.row.id}`}
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
    // {
    //   field: "createdAt",
    //   headerName: "Created At",
    //   width: 150,
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
              className="createdAtTime badge-date"
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
      renderCell: (params: any) =>
        params?.value && params?.value?.user ? (
          <h5 className="updateBy">
            {params.value.user.firstName}
            <span
              title={`${params.value.user.firstName} • ${params.value.date}`}
              className="updatedAtTime badge-date"
            >
              {moment(params.value.date.slice(0, 10)).format("MMM Do, YYYY")}
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
      renderCell: (params: any) => (
        <>
          {permissions.role.isDelete ? (
            <span title="Delete Role">
              <IconButton
                aria-label="Delete"
                onClick={() => showConfirmBox(params.row)}
                disabled={
                  rolePermissionArray.indexOf(params?.row?.permission) >= 0
                }
              >
                {rolePermissionArray.indexOf(params?.row?.permission) >= 0 ? (
                  <DeleteIcon fontSize="small" color="disabled" />
                ) : (
                  <DeleteIcon fontSize="small" color="error" />
                )}
              </IconButton>
            </span>
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
      if (dataRows.find((d) => d.isChecked && d.allowToDelete === false)) {
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

  const disableDelete = dataRows.some(
    (o) => o.isChecked && rolePermissionArray.indexOf(o?.permission) >= 0
  );

  return (
    <>
      {isOpen && (
        <CreateRole
          open={isOpen}
          close={handleClose}
          fetchData={fetchRoles}
          roleType={selectedType}
          setToastConfig={toastConfig.setToastConfig}
          selectedEntity={selectedEntity}
        />
      )}
      <Layout>

        <Grid container>
          <Grid item md={12} sm={12} xs={12}>
            <CustomBreadCrumbs routes={[routes.role]} />
          </Grid>
        </Grid>
        <CustomContainer>
          <div className="header-panel">
            <RoleHeader
              selectedType={selectedType}
              onTypeChange={handleRoleTypeSel}
              options={roleTypes}
              onSearch={handleSearch}
              searchVal={searchVal}
              rolePermissions={permissions.role}
              onCreate={handleCreate}
              showConfirmBox={showConfirmBox}
              canDelete={!disableDelete}
            />
          </div>
          <div className="listing-grid">
            <DataGrid
              components={{
                Toolbar: DataGridCustomToolbar,
                NoRowsOverlay: CustomDataGridNoDataFound,
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
              onFilterModelChange={onFilterChange}
            />
          </div>

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
