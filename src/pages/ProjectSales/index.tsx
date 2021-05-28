import {
  useState,
  FC,
  useReducer,
  useCallback,
  useEffect,
  useContext,
} from "react";
import { TablePagination, Grid } from "@material-ui/core";
import { Link } from "react-router-dom";

import axiosInstance from "../../axios/axiosInstance";
import Layout from "../../components/Layout";
import routes from "../../components/Helpers/Routes";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import ProjectHeader from "./Header";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import MessageDialog from "../../components/Helpers/MessageDialog";
import { useData } from "../../StateProvider/Provider";
import CreateProjectStrategy from "./CreateProjectSales";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";

import { gridPageSizes, isObjectEmpty } from "../../constants/helpers";
import NoDataCell from "../../components/Helpers/NoDataCell";
import GridDeleteIcon from "../../components/Helpers/GridDeleteIcon";
import { AgGridColumn, AgGridReact } from "ag-grid-react";
import CustomFloatingFilter from "../../components/AgGridComponents/CustomAgGridFilter";
import { isMobile, isTablet } from "react-device-detect";
import {
  CommonRenderer,
  CreatedByRenderer,
  UpdatedByRenderer,
  CustomLoadingOverlay,
} from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import CustomGridHeaderOptions from "../../components/AgGridComponents/CustomGridHeaderOptions";
import "./style.scss";
import {
  AgGridHeaderHeight,
  AgGridRowHeight,
  AgGridFloatingFiltersHeight,
} from "./../../constants/helpers";

function reducer(state, action) {
  switch (action.type) {
    case "loading":
      return {
        ...state,
        loading: action.loading,
      };

    case "initialize":
      return {
        ...state,
        dataRows: action.data,
        rowCount: action.count,
        loading: false,
      };

    case "selection":
      return {
        ...state,
        selectedRecords: action.selectedRecords,
      };

    case "update":
      return {
        ...state,
        dataRows: action.data,
        loading: false,
      };

    case "filter":
      return {
        ...state,
        loading: true,
        filters: action.filters,
        page: 0,
      };

    case "sort":
      return {
        ...state,
        sorting: action.sorting,
        loading: true,
      };

    case "search":
      return {
        ...state,
        search: action.search,
        loading: true,
      };

    case "pageChange":
      return {
        ...state,
        page: action.page,
      };

    case "pageSizeChange":
      return {
        ...state,
        limit: action.limit,
        page: 0,
        loading: true,
      };

    case "complete":
      return {
        ...state,
        loading: false,
      };

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
  selectedRecords: [],
};

let projectSalesTimeout;
const ProjectSales: FC = () => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions },
  }: any = useData();
  const [isOpen, setIsOpen] = useState(false);
  const [deleteRec, setDeleteRec] = useState<any>({});
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedType, setselectedType] = useState(1);
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
  const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] =
    useState(false);
  const [renderCount, setRenderCount] = useState(0);

  const [gridApi, setGridApi] = useState(null);
  const [columnApi, setColumnApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const {
    dataRows,
    rowCount,
    loading,
    page,
    limit,
    pageSizes,
    search,
    filters,
    sorting,
    selectedRecords,
  } = state;

  // const [showGridFilters, setShowGridFilters] = useState(true)z
  const [columns, setColumns] = useState([
    {
      field: "projectName",
      headerName: "Name",
      show: true,
      disabled: true,
      cellRenderer: "nameRenderer",
    },
    {
      field: "projectManager",
      headerName: "Project Manager",
      show: true,
      disabled: true,
      cellRenderer: "projectManager",
    },
    {
      field: "createdBy",
      headerName: "Created By",
      show: true,
      cellRenderer: "createdByRenderer",
    },
    {
      field: "updatedBy",
      headerName: "Updated By",
      show: true,
      cellRenderer: "updatedByRenderer",
    },
  ]);
  //  Grid Variables - End

  useEffect(() => {
    let millisec = Object.keys(search).length > 0 ? 600 : 5;

    if (projectSalesTimeout) {
      clearTimeout(projectSalesTimeout);
    }

    projectSalesTimeout = setTimeout(() => {
      fetchProjects();
    }, millisec);
  }, [search]);

  useEffect(() => {
    if (renderCount > 0) {
      fetchProjects();
    } else setRenderCount((preCount) => preCount + 1);
  }, [page, limit, selectedType, filters, sorting]);

  const NameRenderer = (params) => (
    <Link
      className="link"
      to={`/project-sales/detail/${params.data._id}`}
      title={params.value}
    >
      {params.value}
    </Link>
  );

  const ProjectManagerRenderer = (params) => (
    <>
      {params.value ? (
        <Link
          className="link"
          to={`/user/detail/${params.data.projectManagerId}`}
          title={params.value}
        >
          {params.value}
        </Link>
      ) : (
        <NoDataCell />
      )}
    </>
  );

  const ActionsRenderer = (params) => (
    <>
      <GridDeleteIcon
        hasDeletePermission={permissions?.projectSales.isDelete}
        ownerId={params.data.projectManagerId}
        userId={user?.user?._id}
        onDelete={() => showConfirmBox(params.data)}
        entity="Project"
      />
    </>
  );

  const frameworkComponents = {
    nameRenderer: NameRenderer,
    projectManager: ProjectManagerRenderer,
    commonRenderer: CommonRenderer,
    createdByRenderer: CreatedByRenderer,
    updatedByRenderer: UpdatedByRenderer,
    actionsRenderer: ActionsRenderer,
    customLoadingOverlay: CustomLoadingOverlay,
    customFloatingFilter: CustomFloatingFilter,
    // customLoadingCellRenderer: CustomLoadingCellRenderer,
    // customNoRowsOverlay: CustomNoRowsOverlay
  };

  //  If you want to do something once grid binding done
  const onGridReady = (params) => {
    setGridApi(params.api);
    setColumnApi(params.columnApi);
  };

  const generateColumns = columns.map((column: any, index) => {
    return (
      <AgGridColumn
        key={index}
        field={column.field}
        headerName={column.headerName}
        filter={column.filter ?? "agTextColumnFilter"}
        cellRenderer={column.cellRenderer ?? null}
        // floatingFilterComponent={column.floatingFilterComponent ?? null}
        // floatingFilterComponentParams={column.floatingFilterComponentParams ?? {
        //   suppressFilterButton: true,
        // }}
      ></AgGridColumn>
    );
  });

  const replaceFieldName = (field) => {
    switch (field) {
      case "createdBy":
        return "createdBy.user.concatedName";

      case "updatedBy":
        return "updatedBy.user.concatedName";

      default:
        return field;
    }
  };

  const replaceFieldNameForSorting = (field) => {
    const updatedField = replaceFieldName(field);

    if (field !== updatedField) return updatedField;

    switch (field) {
      case "projectManager":
        return "projectManager.optionLabel";

      default:
        return field;
    }
  };

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}&filterProjects=${selectedType}`;

    if (!isObjectEmpty(filters)) {
      const updatedFilters = [];

      Object.keys(filters).map((field) => {
        updatedFilters.push({
          field: replaceFieldName(field),
          term: filters[field].filter,
        });
      });
      deepFilter = `${deepFilter}&deepFilter=${JSON.stringify(
        updatedFilters
      )}&filterType=and`;
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${replaceFieldNameForSorting(
        sorting[0].colId
      )}&orderBy=${sorting[0].sort}`;
    }

    if (search) {
      deepFilter = `${deepFilter}&search=${search}`;
    }

    return deepFilter;
  };

  const fetchProjects = async () => {
    const queryString = getQueryString();
    dispatch({ type: "loading", loading: true });

    if (gridApi) {
      gridApi.setRowData([]);
      gridApi.showLoadingOverlay();
    }

    axiosInstance()
      .get(`/project-sales${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data.map((project) => ({
          ...project,
          projectManager: project.projectManager?.optionLabel,
          projectManagerId: project.projectManager?.optionValue,
          createdBy: project.createdBy?.user?.concatedName,
          createdByDate: project.createdBy?.date,
          updatedBy: project.updatedBy?.user?.concatedName,
          updatedByDate: project.updatedBy?.date,
        }));

        dispatch({ type: "initialize", data: rows, count: count });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        dispatch({ type: "loading", loading: false });
      });
    // eslint-disable-next-line
  };

  const handleProjectFilter = (filterValues) => {
    setselectedType(filterValues);
  };

  const showConfirmBox = (row) => {
    if (row === null) {
      if (permissions?.projectSales.isDelete) {
        const myData = selectedRecords.filter(
          (s) => s.projectManagerId === user.user._id
        );

        if (selectedRecords?.length !== myData.length) {
          setShowDeleteWarningConfirmBox(true);
        } else {
          setIsConformDialogVisible(true);
        }
      }
    }

    if (row && row._id) {
      setIsConformDialogVisible(true);
      setDeleteRec(row);
    }
  };

  const handleDeleteProjects = async () => {
    setDeleteLoading(true);
    let recs = [];
    if (deleteRec?._id) {
      recs.push(deleteRec?._id);
    } else {
      selectedRecords.forEach((obj) => {
        recs.push(obj._id);
      });
    }
    if (recs && recs.length > 0) {
      axiosInstance()
        .put(`/project-sales/remove`, { ids: [...recs] })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: "success",
            message: data.message,
          });
          setIsConformDialogVisible(false);
          setDeleteLoading(false);
          if (deleteRec) setDeleteRec({});
          fetchProjects();
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

  return (
    <>
      {isOpen && (
        <CreateProjectStrategy
          open={isOpen}
          close={handleClose}
          fetchData={fetchProjects}
        />
      )}
      <Layout>
        <Grid container className="headerbox">
          <CustomBreadCrumbs routes={[routes.projectSales]} />
        </Grid>
        <div className="main-container">
          <div className="header-panel">
            <ProjectHeader
              userId={user?.user?._id}
              onSearch={handleSearch}
              searchVal={search}
              permissions={permissions?.projectSales}
              selectedType={selectedType}
              handleFilterChange={handleProjectFilter}
              onCreate={handleCreate}
              showConfirmBox={showConfirmBox}
              canDelete={selectedRecords?.length === 0}
            />
          </div>

          <CustomGridHeaderOptions
            columns={columns}
            setColumns={setColumns}
            columnApi={columnApi}
          />

          <div className="ag-theme-material ag-grid-listing-grid">
            <AgGridReact
              rowData={dataRows}
              onGridReady={onGridReady}
              suppressDragLeaveHidesColumns={true}
              suppressCellSelection={true}
              headerHeight={AgGridHeaderHeight}
              floatingFiltersHeight={AgGridFloatingFiltersHeight}
              rowHeight={AgGridRowHeight}
              frameworkComponents={frameworkComponents}
              defaultColDef={{
                resizable: true,
                floatingFilter: true,
                sortable: true,
                width: 250,
                suppressMenu: true,
                // headerCheckboxSelection: true,
                // checkboxSelection: true,
                floatingFilterComponentParams: { suppressFilterButton: true },
              }}
              onSortChanged={(e) => {
                dispatch({ type: "sort", sorting: e.api.getSortModel() });
              }}
              onFilterChanged={(e) => {
                dispatch({ type: "filter", filters: e.api.getFilterModel() });
              }}
              enableCellTextSelection={true}
              ensureDomOrder={false}
              loadingOverlayComponent={"customLoadingOverlay"}
              loadingOverlayComponentParams={{
                loadingMessage: "Loading...",
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
              rowSelection={"multiple"}
              onSelectionChanged={(event: any) => {
                dispatch({
                  type: "selection",
                  selectedRecords: event.api.getSelectedRows(),
                });
              }}
              immutableData={true}
              getRowNodeId={(data) => {
                return data._id;
              }}
            >
              <AgGridColumn
                width={70}
                filter={false}
                pinned="left"
                lockPinned={true}
                headerCheckboxSelection={true}
                headerCheckboxSelectionFilteredOnly={true}
                checkboxSelection={true}
                resizable={false}
                sortable={false}
              ></AgGridColumn>

              {generateColumns}

              <AgGridColumn
                width={150}
                headerName="Actions"
                pinned={isMobile || isTablet ? false : "right"}
                lockPinned={isMobile || isTablet ? false : true}
                resizable={false}
                sortable={false}
                filter={false}
                cellRenderer="actionsRenderer"
              ></AgGridColumn>
            </AgGridReact>
          </div>
          <TablePagination
            component="div"
            count={rowCount}
            page={page}
            onChangePage={(event, newPage) => {
              dispatch({ type: "pageChange", page: newPage });
            }}
            rowsPerPage={limit}
            onChangeRowsPerPage={(event) => {
              dispatch({ type: "pageSizeChange", limit: event.target.value });
            }}
            rowsPerPageOptions={pageSizes}
          />
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
            message={`Are you sure, you want to delete this record ${
              deleteRec.name || ""
            }?`}
            onClose={() => {
              if (deleteRec) setDeleteRec({});
              setIsConformDialogVisible(false);
            }}
            okBtnLoading={deleteLoading}
            onOk={handleDeleteProjects}
          />
        ) : null}
      </Layout>
    </>
  );
};

export default ProjectSales;
