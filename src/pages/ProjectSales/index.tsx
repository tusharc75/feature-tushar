import { useState, FC, useReducer, useEffect, useContext, Fragment } from "react";
import { Grid } from "@material-ui/core";
import { Link } from "react-router-dom";
import axiosInstance from "../../axios/axiosInstance";
import routes from "../../components/Helpers/Routes";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import ProjectHeader from "./Header";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import MessageDialog from "../../components/Helpers/MessageDialog";
import { useData } from "../../StateProvider/Provider";
import CreateProjectSales from "./CreateProjectSales";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import { gridLoadingTimeout, gridPageSizes, isObjectEmpty } from "../../constants/helpers";
import NoDataCell from "../../components/Helpers/NoDataCell";
import GridDeleteIcon from "../../components/Helpers/GridDeleteIcon";
import {
  CommonRenderer,
  CreatedByRenderer,
  UpdatedByRenderer,
} from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import CustomAgGrid from "../../components/AgGridComponents/CustomAgGrid";
import "./style.scss";
import ImportExportLinks from "../../components/Helpers/ImportExportLinks";
import EntitySelectionsDialog from "../../components/EntitySelections"
import { AiOutlineDeploymentUnit } from "react-icons/ai"
import Tooltip from "@material-ui/core/Tooltip"
import IconButton from "@material-ui/core/IconButton"
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { sidebarResource } from "../../constants/helpers"

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
        rowCount: action.count
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
    state: { user, permissions, selectedEntity },
  }: any = useData();
  const [isOpen, setIsOpen] = useState({ open: false, isClone: false, idToClone: null });
  const [deleteRec, setDeleteRec] = useState<any>({});
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedType, setselectedType] = useState(1);
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
  const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] =
    useState(false);
  const [renderCount, setRenderCount] = useState(0);
  const [projectSalesId, setProjectSalesId] = useState(null)
  const [showEntityDialog, setShowEntityDialog] = useState(false)
  const [gridApi, setGridApi] = useState(null);
  const [entities, setEntities] = useState([])

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
  const columnState = JSON.parse(localStorage.getItem("projectSalesPage"));

  const [columns] = useState([
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
  if (columnState) {
    columns.map((item) => {
      columnState.map((d) => {
        if (d.colId === item.field) {
          item.show = !d.hide;
        }
      });
    });
  }
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
  }, [page, limit, selectedType, filters, sorting, selectedEntity]);

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
      <Tooltip
        className={permissions?.projectSales.isCreate ? "" : "cursor-stop"}
        title={permissions?.projectSales.isCreate ? "Clone" : "You do not have permission to clone/create"} >
        <IconButton
          size="small"
          aria-label="Clone"
          onClick={() => {
            setIsOpen({ open: true, isClone: true, idToClone: params.data._id })
          }}
        >
          <FileCopyIcon fontSize="small" color="primary" />
        </IconButton>
      </Tooltip>
      <GridDeleteIcon
        hasDeletePermission={permissions?.projectSales.isDelete}
        ownerId={params.data.projectManagerId}
        userId={user?.user?._id}
        onDelete={() => showConfirmBox(params.data)}
        entity="Project"
      />
      {
        permissions?.projectSales.isUpdate && <Tooltip title="Entity">
          <IconButton
            size="small"
            aria-label="Entity"
            onClick={() => {
              setProjectSalesId(params.data._id)
              setShowEntityDialog(true)
              if (params?.data?.entity) {
                let restEntities = params?.data?.entity.map(o => o.optionValue)
                setEntities([...restEntities])
              }
            }}>
            <AiOutlineDeploymentUnit fontSize="15" color="primary" />
          </IconButton>
        </Tooltip>
      }
    </>
  );

  const frameworkComponents = {
    nameRenderer: NameRenderer,
    projectManager: ProjectManagerRenderer,
    commonRenderer: CommonRenderer,
    createdByRenderer: CreatedByRenderer,
    updatedByRenderer: UpdatedByRenderer,
    actionsRenderer: ActionsRenderer,
  };

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

    if (selectedEntity) {
      deepFilter = `${deepFilter}&entity=${selectedEntity}`;
    }

    if (!isObjectEmpty(filters)) {
      const updatedFilters = [];

      Object.keys(filters).forEach((field) => {
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
    if (selectedEntity) {
      dispatch({ type: "loading", loading: true });
      const queryString = getQueryString();

      if (gridApi) {
        gridApi.setRowData([]);
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
          setTimeout(() => {
            dispatch({ type: "loading", loading: false });
          }, gridLoadingTimeout);
        })
        .catch((err) => {
          toastConfig.setToastConfig(err);
          dispatch({ type: "loading", loading: false });
        });
    }
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
    setIsOpen({ open: true, isClone: false, idToClone: null });
  };

  const handleClose = () => {
    setIsOpen({ open: false, isClone: false, idToClone: null });
  };

  return (
    <>
      {isOpen?.open && (
        <CreateProjectSales
          open={isOpen?.open}
          isClone={isOpen?.isClone}
          projectSalesId={isOpen?.idToClone}
          close={handleClose}
          fetchData={fetchProjects}
        />
      )}
      <Fragment>
        <Grid container className="headerbox">
          <Grid item md={4} sm={11} xs={10}>
            <CustomBreadCrumbs routes={[routes.projectSales]} />
          </Grid>
          <Grid item md={8} sm={1} xs={2}>
            <ImportExportLinks
              permissions={permissions.projectSales}
              module="project-sale(s)"
              api={"project-sales"}
              afterImportCompleted={() => {
                fetchProjects();
              }}
            />
          </Grid>
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

          <CustomAgGrid
            columns={columns}
            dataRows={dataRows}
            frameworkComponents={frameworkComponents}
            setGridApi={setGridApi}
            dispatch={dispatch}
            rowCount={rowCount}
            limit={limit}
            pageSizes={pageSizes}
            actionWidth={150}
            page={page}
            loading={loading}
            renderedFrom="projectSalesPage"
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
            message={`Are you sure you want to delete this record ${deleteRec.name || ""
              }?`}
            onClose={() => {
              if (deleteRec) setDeleteRec({});
              setIsConformDialogVisible(false);
            }}
            okBtnLoading={deleteLoading}
            onOk={handleDeleteProjects}
          />
        ) : null}
        {
          showEntityDialog ?
            <EntitySelectionsDialog
              open={showEntityDialog}
              resource={sidebarResource.projectSales}
              resourceId={projectSalesId}
              onClose={() => {
                setShowEntityDialog(false)
                setProjectSalesId("")
              }}
              entities={entities}
              onSuccess={fetchProjects}
            /> : null
        }
      </Fragment>
    </>
  );
};

export default ProjectSales;
