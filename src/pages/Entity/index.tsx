import React, { useState, FC, useCallback, useEffect, useContext, useReducer } from "react";
import {
  Checkbox,
  Tooltip,
  IconButton,
  Grid,
  Link as MuiLink,
  TablePagination,
} from "@material-ui/core";
import { Delete as DeleteIcon } from "@material-ui/icons";
import { DataGrid } from "@material-ui/data-grid";
import moment from "moment";
import { Link, useHistory } from "react-router-dom";
import { entity, gridPageSizes, isObjectEmpty } from "../../constants/helpers";
import axiosInstance from "../../axios/axiosInstance";
import Layout from "../../components/Layout";
import routes from "./../../components/Helpers/Routes";
import CustomBreadCrumbs from "./../../components/CustomBreadCrumbs";
import EntityHeader from "./Header";
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
import AssignUsersDialog from "../../components/AssignRolesDialog/AssignEntityDialog";
import CustomDataGridNoDataFound from "../../components/Helpers/DataGridHelpers/CustomDataGridNoDataFound";
import CustomDataGridToolbar from "../../components/Helpers/DataGridHelpers/CustomDataGridToolbar";
import {
  CommonRenderer,
  CreatedByRenderer,
  UpdatedByRenderer,
  CustomLoadingOverlay
} from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import CustomFloatingFilter from '../../components/AgGridComponents/CustomAgGridFilter'
import { AgGridColumn, AgGridReact } from 'ag-grid-react';
import ImportExportLinks from "../../components/Helpers/ImportExportLinks";
import CustomContainer from "../../components/CustomContainer";
import CustomGridHeaderOptions from "../../components/AgGridComponents/CustomGridHeaderOptions";
import { isMobile, isTablet } from "react-device-detect";

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

let entityTimeout;

const Entity: FC = () => {

  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { user, permissions },
  }: any = useData();
  const [isOpen, setIsOpen] = useState(false);
  const [renderCount, setRenderCount] = useState(0);
  const [okButtonLoading, setOkButtonLoading] = useState(false);
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState({ id: null, name: null });
  const [entityPermissions, setEntityPermissions] = useState({
    isCreate: false,
    isUpdate: false,
    isRead: false,
    isDelete: false,
  });
  const [
    showDeleteWarningConfirmBox,
    setShowDeleteWarningConfirmBox,
  ] = useState(false);

  const [usersDialogOpen, setUsersDialogOpen] = useState(false);
  const [users, setUsers] = useState([]);
  //  Grid Variables - Start
  const [gridApi, setGridApi] = useState(null);
  const [columnApi, setColumnApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

  // const [showGridFilters, setShowGridFilters] = useState(true)
  const [columns, setColumns] = useState([
    { field: "entityName", headerName: "Name", show: true, disabled: true, cellRenderer: "nameRenderer" },
    { field: "address", headerName: "Address", show: true, cellRenderer: "commonRenderer" },
    { field: "createdBy", headerName: "Created By", show: true, cellRenderer: "createdByRenderer" },
    { field: "updatedBy", headerName: "Updated By", show: true, cellRenderer: "updatedByRenderer" },
  ]);
  //  Grid Variables - End


  const { entityResource, entityApi } = entity;

  useEffect(() => {
    if (permissions && permissions[entityResource]) {
      setEntityPermissions(permissions[entityResource]);
    }
  }, [permissions]);

  useEffect(() => {
    let millisec = Object.keys(search).length > 0 ? 600 : 5;
    if (entityTimeout) {
      clearTimeout(entityTimeout);
    }

    entityTimeout = setTimeout(() => {
      fetchEntity();
    }, millisec);
  }, [search]);

  useEffect(() => {
    if (renderCount > 0) {
      fetchEntity();
    } else setRenderCount((preCount) => preCount + 1);
  }, [page, limit, filters, sorting]);

  useEffect(() => {
    if (selectedRecords.length === 1) {
      fetchEntityUser();
    }
  }, [selectedRecords]);

  const fetchEntityUser = () => {
    axiosInstance()
      .get(`/user?filterById=[{"field": "entities.entity", "term": "${selectedRecords[0].id}"}]`)
      .then(({ data: { data } }) => {
        setUsers(data);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };
  const NameRenderer = params => <Link className="link"
    to={`${routes.entityDetails.path}/${params.data._id}`} title={params.value}>
    {params.value}
  </Link>;

  const frameworkComponents = {
    nameRenderer: NameRenderer,
    commonRenderer: CommonRenderer,
    createdByRenderer: CreatedByRenderer,
    updatedByRenderer: UpdatedByRenderer,
    customLoadingOverlay: CustomLoadingOverlay,
    customFloatingFilter: CustomFloatingFilter,
    // customLoadingCellRenderer: CustomLoadingCellRenderer,
    // customNoRowsOverlay: CustomNoRowsOverlay
  };

  //  If you want to do something once grid binding done
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

      case "relatedOpportunity":
        return "staticData.opportunity.opportunityName";

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

      default:
        return field;
    }
  }

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}`;

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

  const fetchEntity = () => {
    const queryString = getQueryString();
    dispatch({ type: "loading", loading: true });

    if (gridApi) {
      gridApi.setRowData([]);
      gridApi.showLoadingOverlay();
    }

    axiosInstance()
      .get(`${entityApi}${queryString}`)
      .then(({ data: { data, count } }) => {

        let rows = data.map((u) => {

          const { owner, collaborator, createdBy, updatedBy, staticData, ...restProperties } = u;

          let res = {
            ...restProperties,
            id: u._id,

            isChecked: false,
            createdBy: u.createdBy?.user?.concatedName,
            createdByDate: u.createdBy?.date,
            updatedBy: u.updatedBy?.user?.concatedName,
            updatedByDate: u.updatedBy?.date,
          };
          return res;
        });

        dispatch({ type: "initialize", data: rows, count: count });
        // if (gridApi && rows.length > 0) {
        //   gridApi.hideOverlay();
        // }
      }).catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: "loading", loading: false });
      });

  }

  const handleSearch = (e) => {
    dispatch({ type: "search", search: e.target.value });
  };


  const handleCreate = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    fetchEntity();
  };
  const handleOpenDialog = () => {
    setUsersDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setUsersDialogOpen(false);
  };

  const showConfirmBox = (row) => {
    if (row) {
      setIsConformDialogVisible(true);
      if (row) {
        setDeleteRecord({ id: row._id, name: row.concatedName });
      }
    } else {
      if (
        selectedRecords.find((d) => d.ownerId != user.user._id)
      ) {
        setShowDeleteWarningConfirmBox(true);
      } else {
        setIsConformDialogVisible(true);
      }
    }
  };

  const handleDeleteEntity = async () => {
    if (deleteRecord.id || selectedRecords.length > 0) {
      setOkButtonLoading(true);

      axiosInstance()
        .put(`${entityApi}/remove`,
          { ids: deleteRecord.id ? [deleteRecord.id] : selectedRecords.map(d => d._id) })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: "success",
            message: data.message,
          });
          setIsConformDialogVisible(false);
          setOkButtonLoading(false);
          if (deleteRecord.id) { setDeleteRecord({ id: null, name: null }); }
          fetchEntity();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setIsConformDialogVisible(false);
          setOkButtonLoading(false);
        });
    }
  };

  return (
    <Layout>
      <Grid container className="headerbox">
        <Grid item md={4} sm={11} xs={10}>
          <CustomBreadCrumbs routes={[routes.entity]} />
        </Grid>
        <Grid
          item
          md={8}
          sm={1}
          xs={2}>
          <ImportExportLinks
            module="entity(s)"
            api={entityApi}
            onSuccessfulImport={(isImportedSuccessfully) => {
              if (isImportedSuccessfully) { fetchEntity(); }
            }}
          />
        </Grid>
      </Grid>

      <CustomContainer>
        <div className="header-panel">
          <EntityHeader
            onSearch={handleSearch}
            searchVal={search}
            entityPermissions={permissions?.entity}
            onCreate={handleCreate}
            showConfirmBox={showConfirmBox}
            openUserDialog={handleOpenDialog}
            userActionDiabled={selectedRecords.length !== 1} //single select entity can assign user
            canDelete={dataRows.filter((d) => d.isChecked).length === 0}
          />
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

        {isOpen && (
          <CreateEntity
            open={isOpen}
            close={handleClose}
            fetchData={fetchEntity}
          />
        )}
        {usersDialogOpen && (
          <AssignUsersDialog
            entitiesDialogOpen={usersDialogOpen}
            handleCloseDialog={handleCloseDialog}
            type="user"
            ids={[selectedRecords[0].id]}
            assignedEntity={users}
            regionalRole={false}
            onSuccess={() => {
              fetchEntity();
              handleCloseDialog();
            }}
          />
        )}
        {
          showDeleteWarningConfirmBox ? (
            <MessageDialog
              open={showDeleteWarningConfirmBox}
              message={`You are trying to delete records which you do not have permission to delete, Please remove those records from selection and try again.`}
              onClose={() => setShowDeleteWarningConfirmBox(false)}
            />
          ) : null
        }
        {
          isConfirmDialogVisible ? (
            <ConfirmationDialog
              open={isConfirmDialogVisible}
              message={`Are you sure, you want to delete entity ${deleteRecord.name || ""
                }?`}
              onClose={() => {
                if (deleteRecord.id) setDeleteRecord({ id: null, name: null });
                setIsConformDialogVisible(false);
              }}
              okBtnLoading={okButtonLoading}
              onOk={handleDeleteEntity}
            />
          ) : null
        }


      </CustomContainer >
    </Layout >
  );

};

export default Entity;
