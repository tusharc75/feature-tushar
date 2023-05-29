import { useState, FC, useReducer, useEffect, useContext, Fragment } from "react";
import { Chip, Grid } from "@material-ui/core";
import axiosInstance from "../../axios/axiosInstance";
import routes from "../../components/Helpers/Routes";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import ProjectHeader from "./Header";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import MessageDialog from "../../components/Helpers/MessageDialog";
import { useData } from "../../StateProvider/Provider";
import CreateProjectSales from "./CreateProjectSales";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import { customerAccount, gridLoadingTimeout, gridPageSizes, isObjectEmpty, supplierAccount } from "../../constants/helpers";
import GridDeleteIcon from "../../components/Helpers/GridDeleteIcon";
import CustomAgGrid from "../../components/AgGridComponents/CustomAgGrid";
import "./style.scss";
import ImportExportLinks from "../../components/Helpers/ImportExportLinks";
import EntitySelectionsDialog from "../../components/EntitySelections"
import { AiOutlineDeploymentUnit } from "react-icons/ai"
import Tooltip from "@material-ui/core/Tooltip"
import IconButton from "@material-ui/core/IconButton"
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { sidebarResource, prepareDataForGrid } from "../../constants/helpers"
import { isMobile, isTablet } from "react-device-detect";
import CustomSwipableList from "../../components/SwipableListComponents/CustomSwipableList";
import { useHistory } from 'react-router-dom';
import useColumns, { getStaticFields, getFrameworkComponents, checkStaticField, gridFilterParser } from "../../constants/useColumns"
import { StayPrimaryPortraitSharp } from "@material-ui/icons";
import { BiDollar } from "react-icons/bi";
import { SiMarketo, AiFillFileMarkdown, GiArrowScope, FaPercentage, FaAward, SiStatuspage, GoVersions } from "react-icons/all";
import { camelCase } from "lodash";

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
  const renderedFrom = camelCase(routes?.projectSales.title)
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const {
    state: { user, permissions, selectedEntity },
  }: any = useData();
  const { getColumnData } = useColumns();
  const [isOpen, setIsOpen] = useState({ open: false, isClone: false, idToClone: null });
  const [deleteRec, setDeleteRec] = useState<any>({});
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedType, setselectedType] = useState(1);
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
  const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] =
    useState({ show: false, isDelete: false });
  const [renderCount, setRenderCount] = useState(0);
  const [projectSalesId, setProjectSalesId] = useState(null)
  const [showEntityDialog, setShowEntityDialog] = useState(false)
  const [gridApi, setGridApi] = useState(null);
  const [entities, setEntities] = useState([])
  const [columns, setColumns] = useState([])
  const [frameWorkComponent, setFrameWorkComponent] = useState({})

  const [referenceDetails, setReferenceDetails] = useState({
    referenceId: history.location?.state?.accountId,
    referenceName: history.location?.state?.accountName,
    resource: history.location?.state?.resource
  });

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
    appendRows
  } = state;
  const columnState = JSON.parse(localStorage.getItem(renderedFrom));
  const [isAllChecked, setIsAllChecked] = useState(false);
  const [clonedData, setClonedData] = useState([])
  const localStorageSelectedRecords = `${routes.projectSales.title}_selected`;

  useEffect(() => {
    fetchGridColumns()
  }, [])

  const fetchGridColumns = async () => {

    const response = await axiosInstance()
      .get(`/field?resource=Project Sales&view=true`)

    let data = response?.data?.data

    let columns = []
    let rendererNames = []
    data.forEach(o => {
      let currentColumn = getColumnData(renderedFrom, o?.fieldData, 'project-sales/detail')
      if (currentColumn !== null) {
        columns = [...columns, currentColumn?.columnData]
        if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
          rendererNames.push(currentColumn?.rendererName)
        }
      }
      return o?.fieldData
    })
    let tempFrameworkComponent = getFrameworkComponents(rendererNames, true)
    tempFrameworkComponent = {
      ...tempFrameworkComponent,
      actionsRenderer: ActionsRenderer
    }
    setFrameWorkComponent({ ...tempFrameworkComponent })
    let staticFields = getStaticFields()
    staticFields.forEach(field => {
      columns.push(checkStaticField(renderedFrom, field))
    })
    setColumns([...columns])
  }

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
  }, [page, limit, selectedType, filters, sorting, selectedEntity, referenceDetails]);

  const ActionsRenderer = (params) => (
    <>
      {permissions?.projectSales?.isCreate ?
        (<Tooltip
          title={"Clone"} >
          <IconButton
            size="small"
            aria-label="Clone"
            onClick={() => {
              setIsOpen({ open: true, isClone: true, idToClone: params.data._id })
            }}
          >
            <FileCopyIcon fontSize="small" color="primary" />
          </IconButton>
        </Tooltip>) : (
          <Tooltip className="cursor-stop" title="You do not have permission to clone/create">
            <IconButton aria-label="Clone" size="small">
              <FileCopyIcon />
            </IconButton>
          </Tooltip>
        )
      }
      <GridDeleteIcon
        hasDeletePermission={permissions?.projectSales?.isDelete}
        ownerId={params.data.projectManagerId}
        userId={user?.user?._id}
        onDelete={() => showConfirmBox(params.data)}
        entity="Project"
      />
      {
        (permissions?.projectSales?.isUpdate && params?.data?.isTeamMember) ||
          params?.data?.isManager ?
          <Tooltip title="Entity">
            <IconButton
              size="small"
              aria-label="Entity"
              onClick={() => {
                setProjectSalesId(params.data._id)
                setShowEntityDialog(true)
                if (params?.data?.entity) {
                  let entities = []
                  if (params?.data?.entityId) {
                    entities.push(params?.data?.entityId)
                  }
                  if (params?.data?.restentity) {
                    let restEntities = params?.data?.restentity.map(o => o.optionValue)
                    entities = [...entities, ...restEntities]
                  }
                  setEntities([...entities])
                }
              }}>
              <AiOutlineDeploymentUnit fontSize="15" color="primary" />
            </IconButton>
          </Tooltip> : (
            <Tooltip className="cursor-stop" title="You do not have permission to update entity">
              <IconButton aria-label="Clone" size="small">
                <AiOutlineDeploymentUnit fontSize="15" />
              </IconButton>
            </Tooltip>
          )
      }
    </>
  );

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}`;
    if (selectedType === 2) {
      deepFilter = deepFilter + `&myRecords=1`;
    }
    if (isExport) {
      deepFilter = `?`;
    }
    if (selectedEntity) {
      deepFilter = `${deepFilter}&entity=${selectedEntity}`;
    }

    const { filterByIds, deepFilters } = gridFilterParser(filters)

    if (referenceDetails.referenceId) {
      if (referenceDetails.resource === sidebarResource.opportunity) {
          filterByIds.push({ field: "staticData.opportunity", term: referenceDetails.referenceId })
      }
      else if (referenceDetails.resource === customerAccount.accountResource) {
          filterByIds.push({ field: 'customerAccountName', term: referenceDetails.referenceId })
      }
      else if (referenceDetails.resource === supplierAccount.accountResource) {
          filterByIds.push({ field: 'supplierAccountName', term: { $in: [referenceDetails.referenceId] } })
      }
    }
    
    if (filterByIds?.length) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterByIds)}`;
    }
    if (deepFilters?.length) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURI(JSON.stringify(deepFilters))}`;
    }

    if (filterByIds?.length || deepFilters?.length) {
      deepFilter = `${deepFilter}&filterType=and`;
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }

    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURI(search)}`;
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
          let rows = data.map((project) => {

            let finalObject = prepareDataForGrid(project, user);
            finalObject["canDelete"] = finalObject["projectManagerId"] === user?.user._id;
            finalObject["isChecked"] = selectedRecords.some(s => s._id === project._id);
            finalObject["allowedToEdit"] = finalObject["projectManagerId"] === user?.user._id;

            finalObject["owerCollaboratorInitialsOrImages"] = [{ initials: finalObject["projectManager"] }];
            return {
              ...finalObject,
              isManager: user.user._id === project?.projectManager?.optionValue,
              isTeamMember: Boolean(data.staticData?.user.find((u) => u._id === user.user._id)),
            };
          });
          setIsAllChecked(false);
          setClonedData(data)
          if (appendRows) {
            dispatch({
              type: "initialize", data: [...dataRows, ...rows],
              count: count, selectedRecords: [...dataRows, ...rows].filter(f => f.isChecked === true)
            });
          } else {
            dispatch({
              type: "initialize", data: rows, count: count,
              selectedRecords: rows.filter(f => f.isChecked === true)
            });
          }

          if (gridApi) {
            try {
              let oldSelectedRecords = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : []
              if (oldSelectedRecords.length > 0) {
                gridApi.forEachNode(function (node) {
                  node.setSelected(
                    oldSelectedRecords.some((o) => o === node.data._id)
                  );
                });
              }
            } catch (ex) {
              console.error("Error in getting selected records from local storage")
            }
          }

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
  };

  const handleProjectFilter = (filterValues) => {
    setselectedType(filterValues);
  };

  const showConfirmBox = (row) => {
    if (row === null) {
      if (permissions?.projectSales?.isDelete) {
        const myData = selectedRecords.filter(
          (s) => s.projectManagerId === user.user._id
        );

        if (selectedRecords?.length !== myData.length) {
          setShowDeleteWarningConfirmBox({ show: true, isDelete: true });
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
              permissions={permissions?.projectSales}
              module="project-sale(s)"
              api={"project-sales"}
              afterImportCompleted={() => {
                fetchProjects();
              }}
              isExportAllOrSomeFeature={true}
              total={rowCount}
              recordsToExport={selectedRecords.length}
              ids={selectedRecords.length ? selectedRecords.map((obj) => obj._id) : []}
              onExportToExcelSuccess={() => {
                if (gridApi) gridApi.deselectAll()
                else fetchProjects()
              }}
              additionalParams={getQueryString(true)}
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
              columns={columns}
              dispatch={dispatch}
              showConfirmBox={showConfirmBox}
              canDelete={selectedRecords?.length === 0}
              selectedRecords={selectedRecords}
              setShowDeleteWarningConfirmBox={setShowDeleteWarningConfirmBox}
              setShowEntityDialog={setShowEntityDialog}
              setEntities={setEntities}
              filters={filters}
            >
              {referenceDetails.referenceId && (
                <Chip
                  className="ml-3"
                  color="primary"
                  label={`${referenceDetails.resource === customerAccount.accountResource ? routes.customerAccount.title :
                    referenceDetails.resource === supplierAccount.accountResource ? routes.supplierAccount.title :
                      routes.opportunity.title} : ${referenceDetails.referenceName}`}
                  onDelete={() => {
                    setReferenceDetails({ referenceId: null, referenceName: null, resource: null });
                  }}
                />
              )}
            </ProjectHeader>
          </div>

          {
            Object.keys(frameWorkComponent).length > 0 ?
              isMobile && !isTablet ?
                <CustomSwipableList
                  allowSelection={true}
                  allowSwipe={true}
                  permissions={permissions?.projectSales}
                  primaryField={columns?.find(d => d.primaryField)}
                  onClick={(data) => {
                    history.push(`${routes.projectSalesDetail.path}/${data._id}`)
                  }}
                  dataRows={dataRows}
                  selectedRecords={selectedRecords}
                  dispatch={dispatch}
                  onEdit={(data) => {
                    history.push(`${routes.projectSalesDetail.path}/${data._id}?openEdit=true`)
                  }}
                  extraParamsToCheckDelete={true}
                  onDelete={(data) => {
                    showConfirmBox(data)
                  }}
                  rowCount={rowCount}
                  page={page}
                  loading={loading}
                  additionalDetails={[

                    {
                      icon: <BiDollar size={18} />,
                      field: "amount"
                    }
                  ]}
                  chips={[
                    {
                      icon: <FaAward />,
                      label: "Award Date : ",
                      field: "awardDate",

                    },
                    {
                      icon: <AiFillFileMarkdown />,
                      label: "Market:",
                      field: "marketSegment",
                    },
                    {
                      icon: <SiMarketo />,
                      label: "Sub-Market:",
                      field: "subMarketSegment"
                    },
                    {
                      icon: <GiArrowScope />,
                      label: "Scope:",
                      field: "scope"
                    },
                  ]}
                  onCreate={false}
                  showClone={true}
                  onClone={(data) => {
                    setIsOpen({ open: true, isClone: true, idToClone: data._id })
                  }}
                  renderedFrom={renderedFrom}
                />
                :
                <CustomAgGrid
                  columns={columns}
                  dataRows={dataRows}
                  frameworkComponents={frameWorkComponent}
                  setGridApi={setGridApi}
                  dispatch={dispatch}
                  rowCount={rowCount}
                  limit={limit}
                  pageSizes={pageSizes}
                  actionWidth={150}
                  page={page}
                  loading={loading}
                  renderedFrom={renderedFrom}
                  refreshGrid={fetchProjects}
                  showOnlyShowFilteredRecordSwitch={true}
                  showFilters={true}
                  resource={sidebarResource.projectSales}
                /> : null
          }
        </div>

        {showDeleteWarningConfirmBox?.show ? (
          <MessageDialog
            open={showDeleteWarningConfirmBox?.show}
            message={
              showDeleteWarningConfirmBox?.isDelete ?
                `You are trying to delete records which you do not have permission to delete, Please remove those records from selection and try again.`
                : `You are trying to update records which you do not have permission to update, Please remove those records from selection and try again.`
            }
            onClose={() => setShowDeleteWarningConfirmBox({ show: false, isDelete: false })}
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
              resourceIds={selectedRecords.length ? selectedRecords.map(o => o._id) : [projectSalesId]}
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