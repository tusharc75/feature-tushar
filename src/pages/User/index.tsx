import React, { useState, FC, useCallback, useEffect, useContext, useReducer } from "react";
import { Checkbox, Tooltip, IconButton, Grid, Chip, TablePagination } from "@material-ui/core";
import { Delete as DeleteIcon } from "@material-ui/icons";
import moment from "moment";
import { Link } from "react-router-dom";
import { AgGridColumn, AgGridReact } from 'ag-grid-react';
import CustomFloatingFilter from '../../components/AgGridComponents/CustomAgGridFilter'
import { isMobile, isTablet } from "react-device-detect";
import {
  CommonRenderer,
  CommonRendererWithCopy,
  CustomLoadingOverlay
} from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import GridDeleteIcon from "../../components/Helpers/GridDeleteIcon";
import CustomGridHeaderOptions from "../../components/AgGridComponents/CustomGridHeaderOptions";
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
import NoDataCell from "../../components/Helpers/NoDataCell";
import CustomContainer from "../../components/CustomContainer";
import AccountCircleIcon from '@material-ui/icons/AccountCircle';
import { userType, gridPageSizes, isObjectEmpty } from './../../constants/helpers'
import ManageUserDialog from "./ManageUserDialog";
import { useHistory } from "react-router-dom";
import { startCase } from "lodash";

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
  const [isOpen, setIsOpen] = useState(false);
  const [checkAllUsers, setCheckAllUsers] = useState(false);
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
  const [columnApi, setColumnApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

  const [columns, setColumns] = useState([
    {
      field: "name", headerName: "Name", show: true, disabled: true, cellRenderer: "nameRenderer",
    },
    { field: "status", headerName: "Status", show: true, cellRenderer: "statusRenderer" },
    { field: "email", headerName: "Email", show: true, cellRenderer: "emailRenderer" },
    { field: "createdBy", headerName: "Created By", show: true, cellRenderer: "createdByRenderer" },
    { field: "updatedBy", headerName: "Updated By", show: true, cellRenderer: "updatedByRenderer" },
  ]);

  const NameRenderer = params => (<>
    <Link
      title={params.value}
      className="link"
      to={`${routes.userDetail.path}/${params.data.id}`}
    >
      {params.value}
    </Link>
    {params?.data?.isBrandAdmin ? <Tooltip title="Brand Admin">
      <AccountCircleIcon color="primary" className="ml-2" fontSize="small" />
    </Tooltip> : ""}
  </>
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

  const CreatedByRendererCustom = params => params?.value && params?.value?.user ? (
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
  );

  const UpdatedByRendererCustom = params => params?.value && params?.value?.user ? (
    <h5 className="updateBy">
      {params.value.user.firstName}
      <span
        className="updatedAtTime badge-date"
        title={`${params.value.user.firstName} • ${moment(
          params.value.date.slice(0, 10)
        ).format("MMM Do, YYYY")}`}
      >
        {moment(params.value.date.slice(0, 10)).format("MMM Do, YYYY")}
      </span>
    </h5>
  ) : (
    <NoDataCell />
  );
  {/* <GridDeleteIcon
      hasDeletePermission={permissions.user.isDelete}
      ownerId={null}
      userId={user?.user?._id}
      onDelete={() => showConfirmBox(params.row)
      }
      entity="user"
    /> */}

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
    createdByRenderer: CreatedByRendererCustom,
    updatedByRenderer: UpdatedByRendererCustom,
    actionsRenderer: ActionsRenderer,
    customLoadingOverlay: CustomLoadingOverlay,
    customFloatingFilter: CustomFloatingFilter,
    commonRenderer: CommonRenderer
    //  customLoadingCellRenderer: CustomLoadingCellRenderer,
    // customNoRowsOverlay: CustomNoRowsOverlay
  };

  const onGridReady = (params) => {
    setGridApi(params.api);
    setColumnApi(params.columnApi)
  }

  const generateColumns = columns.map((column: any, index) => {
    return <AgGridColumn
      key={index}
      field={column.field}
      headerName={column.headerName}
      filter={column.filter ?? "agTextColumnFilter"}
      cellRenderer={column.cellRenderer ?? null}
    // floatingFilterComponent={column.floatingFilterComponent ?? null}
    // floatingFilterComponentParams={column.floatingFilterComponentParams ?? {
    //   suppressFilterButton: true,
    // }}
    >
    </AgGridColumn>
  })

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
      case "owner":
        return "owner.optionLabel";

      case "customerAccountName":
        return "customerAccountName.optionLabel";

      case "supplierAccountName":
        return "supplierAccountName.optionLabel";

      default:
        return field;
    }
  }
  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}`;

    // if (selectedEntity) {
    //   deepFilter = `${deepFilter}&entity=${selectedEntity}`
    // }

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
      deepFilter = `${deepFilter}&sortBy=${replaceFieldNameForSorting(sorting[0].colId)}&orderBy=${sorting[0].sort}`
    }

    if (search) {
      deepFilter = `${deepFilter}&search=${search}`;
    }

    return deepFilter;
  };


  const fetchUsers = useCallback(() => {
    if (userTimeout) {
      clearTimeout(userTimeout);
    }

    userTimeout = setTimeout(() => {
      const queryString = getQueryString();
      dispatch({ type: "loading", loading: true });
      if (gridApi) {
        gridApi.setRowData([]);
        gridApi.showLoadingOverlay();
      }
      // let searchParams: any = { ...query };
      // searchParams = searchVal
      //   ? { ...searchParams, search: searchVal }
      //   : { ...searchParams };
      if (entityRoleRedirectDetails?.id) {
        switch (entityRoleRedirectDetails?.type) {
          case "entity":
            queryString["filterById"] = JSON.stringify([{ field: "entities.entity", term: entityRoleRedirectDetails?.id }]);
            break;
          case "regionalRole":
            queryString["filterById"] = JSON.stringify([{ field: "entities.role", term: entityRoleRedirectDetails?.id }]);
            break;
          case "globalRole":
            queryString["filterById"] = JSON.stringify([{ field: "role", term: entityRoleRedirectDetails?.id }]);
            break;
        }
      }
      axiosInstance()
        .get(`/user${queryString}`)
        .then(({ data: { data, count } }) => {
          let rows = data.map((u) => {
            const { createdBy, updatedBy,
              ...restProperties } = u;

            let res = {
              ...restProperties,
              id: u._id,
              isChecked: false,
              name: `${u.firstName} ${u.lastName}`,
              email: u.email,
              createdAt: moment(u.createdAt).format("MMM Do, YYYY"),
              createdBy: u.createdBy,
              updatedBy: u.updatedBy,
              status: u.blocked ? u.blocked : false,
              isBrandAdmin: u.userType === userType.brandAdmin
            };
            return res;
          });

          dispatch({ type: "initialize", data: rows, count: count });


        })
        .catch((err) => {
          dispatch({ type: "loading", loading: false });
          toastConfig.setToastConfig(err);
        });
    }, 600);
    // eslint-disable-next-line
  }, [search, entityRoleRedirectDetails]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);





  // const updateCheckedStatus = (params, ev) => {
  //   const gridData = [...dataRows];
  //   const indexOfRecord = gridData.findIndex((d) => d.id === params.row.id);
  //   gridData[indexOfRecord].isChecked = ev.target.checked;

  //   setDataRows([...gridData]);

  //   const checkedRecords = gridData.filter((d) => d.isChecked === true);

  //   if (checkedRecords.length === gridData.length) {
  //     setCheckAllUsers(true);
  //   } else {
  //     setCheckAllUsers(false);
  //   }
  //   handleSelectedUsers(params.row.id, ev.target.checked);
  // };

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


  // const handleSortModelChange = (params) => {
  //   if (params?.sortModel && params.sortModel.length > 0) {
  //     let temp = { ...params.sortModel[0] };
  //     setQuery((prevState) => ({
  //       ...prevState,
  //       page: 0,
  //       sortBy: temp.field,
  //       orderBy: temp.sort,
  //     }));
  //   }
  // };

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
          userIds={selectedUsers}
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
          <CustomGridHeaderOptions columns={columns} setColumns={setColumns} columnApi={columnApi} />

          <div className="ag-theme-material ag-grid-listing-grid">
            <AgGridReact
              rowData={dataRows}
              onGridReady={onGridReady}
              suppressDragLeaveHidesColumns={true}
              suppressCellSelection={true}
              rowHeight={40}
              frameworkComponents={frameworkComponents}
              defaultColDef={{
                resizable: true,
                floatingFilter: true,
                sortable: true,
                width: 250,
                suppressMenu: true,
                // headerCheckboxSelection: true,
                // checkboxSelection: true,
                floatingFilterComponentParams: { suppressFilterButton: true }
              }}
              onSortChanged={(e) => {
                dispatch({ type: "sort", sorting: e.api.getSortModel() })
              }}
              onFilterChanged={(e) => {
                dispatch({ type: "filter", filters: e.api.getFilterModel() });
              }}
              enableCellTextSelection={true}
              ensureDomOrder={false}
              loadingOverlayComponent={'customLoadingOverlay'}
              loadingOverlayComponentParams={{
                loadingMessage: 'Loading...',
              }}
              animateRows={false}
              suppressAnimationFrame={true}
              suppressMaintainUnsortedOrder={true}

              rowBuffer={limit}
              // suppressMaxRenderedRowRestriction={true}

              // loadingCellRenderer={'customLoadingCellRenderer'}
              // loadingCellRendererParams={{
              //   loadingMessage: 'One moment please...',
              // }}

              suppressRowClickSelection={true}
              rowSelection={'multiple'}
              onSelectionChanged={(event: any) => {
                dispatch({ type: "selection", selectedRecords: event.api.getSelectedRows() })
              }}
              immutableData={true}
              getRowNodeId={(data) => {
                return data._id;
              }}
            >
              <AgGridColumn width={70} filter={false} pinned="left" lockPinned={true}
                headerCheckboxSelection={true}
                headerCheckboxSelectionFilteredOnly={true}
                checkboxSelection={true}
                resizable={false} sortable={false}
              >
              </AgGridColumn>

              {generateColumns}

              <AgGridColumn width={100} headerName="Actions"
                pinned={(isMobile || isTablet) ? false : "right"}
                lockPinned={(isMobile || isTablet) ? false : true}
                resizable={false} sortable={false}
                filter={false} cellRenderer="actionsRenderer">
              </AgGridColumn>

            </AgGridReact>
          </div>

          <TablePagination
            component="div"
            count={rowCount}
            page={page}
            onChangePage={(event, newPage) => {
              dispatch({ type: "pageChange", page: newPage })
            }}
            rowsPerPage={limit}
            onChangeRowsPerPage={(event) => {
              dispatch({ type: "pageSizeChange", limit: event.target.value })
            }}
            rowsPerPageOptions={pageSizes}
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
