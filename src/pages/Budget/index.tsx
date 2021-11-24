import { useContext, useEffect, useState, useReducer, Fragment } from "react";
import ManageBudgetDialog from "./ManageBudgetDialog";
import { Box, Button, Menu, MenuItem, Grid } from "@material-ui/core";
import { useData } from "../../StateProvider/Provider";
import { ExpandMore } from "@material-ui/icons";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import AddIcon from "@material-ui/icons/Add";
import CustomBreadCrumbs from "./../../components/CustomBreadCrumbs";
import SearchBox from "../../components/Helpers/SearchBox";
import CustomContainer from "../../components/CustomContainer";
import styles from "../Leads/Header.module.scss";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import { MdContacts } from "react-icons/md";
import axiosInstance from "../../axios/axiosInstance";
import {
  isObjectEmpty,
  gridLoadingTimeout,
  budget,
  prepareDataForGrid
} from "../../constants/helpers";
import routes from "./../../components/Helpers/Routes";
import CustomAgGrid, {
  reducer,
  intialState,
} from "../../components/AgGridComponents/CustomAgGrid";
import CustomRenderCell from "../../components/Helpers/CustomRenderCell";
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import ImportExportLinks from "../../components/Helpers/ImportExportLinks";
import FileCopyIcon from '@material-ui/icons/FileCopy';
import useColumns, {getStaticFields, getFrameworkComponents } from "../../constants/useColumns"
import { useLocation, useHistory } from "react-router-dom";
import queryString from "query-string";
import { isMobile } from 'react-device-detect';
import CustomSwipableList from "../../components/SwipableListComponents/CustomSwipableList";

let timeout;
function Budget() {

  const location = useLocation()
  const history = useHistory();
  const {
    state: { permissions, user },
  }: any = useData();
  const { budgetApi } = budget;

  const [deleteRecord, setDeleteRecord] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);

  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false)
  const [showManageBudgetDialog, setShowManageBudgetDialog] = useState({
    show: false,
    id: null,
    isClone: false
  });
  const {getColumnData} = useColumns();
  const [columns, setColumns] = useState([])
  const [frameWorkComponent, setFrameWorkComponent] = useState({})

  const [gridApi, setGridApi] = useState(null);
  const toastConfig = useContext(CustomToastContext);
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

  useEffect(() => {
    let millisec = Object.keys(search).length > 0 ? 600 : 5;

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      fetchBudgetList()
    }, millisec);
  }, [search]);

  useEffect(() => {
    fetchBudgetList();
  }, [page, limit, filters, sorting]);

  useEffect(() => {
    const parsedParams = queryString.parse(location?.search);
    if (parsedParams?.id) {
      setShowManageBudgetDialog({ show: true, id: parsedParams?.id, isClone: false });
    }
  }, [location])

  useEffect(() => {
    fetchGridColumns()
  }, [])

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field?resource=Budget`)
      .then(({ data: { data } }) => {
        let columns = []
        let rendererNames = []
        data.forEach(o => {

          let currentColumn = getColumnData(routes.budget.title, o?.fieldData, routes.budget.path, true)

          if (currentColumn !== null) {
            columns = [...columns, currentColumn?.columnData]
            if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
              rendererNames.push(currentColumn?.rendererName)
            }
          }
        })
        let tempFrameworkComponent = getFrameworkComponents(rendererNames, true)
        tempFrameworkComponent = {
          ...tempFrameworkComponent,
          actionsRenderer: ActionsRenderer
        }
        setFrameWorkComponent({ ...tempFrameworkComponent })
        columns = [...columns, ...getStaticFields()]
        setColumns([...columns])
      })
  }

  const columnState = JSON.parse(localStorage.getItem("budgetPage"));


  if (columnState) {
    columns.map((item) => {
      columnState.map((d) => {
        if (d.colId == item.field) {
          item.show = !d.hide;
        }
      });
    });
  }
  const NameRenderer = params => (
    <>
      {
        permissions.budget.isUpdate ?
          <span className="link"
            onClick={() => {
              setShowManageBudgetDialog({ show: true, id: params.data.id, isClone: false });
            }}>
            <CustomRenderCell value={params?.value} />
          </span>
          : params?.value
      }
    </>
  )

  const ActionsRenderer = params => (
    <>
      <Tooltip
        className={permissions.budget.isCreate ? "" : "cursor-stop"}
        title={permissions.budget.isCreate ? "Clone" : "You do not have permission to clone/create"} >
        <IconButton
          size="small"
          aria-label="Clone"
          onClick={() => {
            setShowManageBudgetDialog({ show: true, id: params.data._id, isClone: true })
          }}>
          <FileCopyIcon fontSize="small" color="primary" />
        </IconButton>
      </Tooltip>
      {
        permissions.budget.isDelete &&
        <Tooltip title="Delete">
          <IconButton size="small" aria-label="Delete" onClick={() => {
            setDeleteRecord(params.data)
            setShowDeleteConfirmBox(true)
          }} >
            <DeleteIcon color="error" />
          </IconButton>
        </Tooltip >
      }
    </>
  )

  const replaceFieldName = (field) => {
    switch (field) {
      default:
        return field;
    }
  }

  const replaceFieldNameForSorting = (field) => {
    const updatedField = replaceFieldName(field);

    if (field !== updatedField) return updatedField;

    switch (field) {
      case "marketSegment":
        return "marketSegment.optionLabel";

      case "subMarketSegment":
        return "subMarketSegment.optionLabel";

      case "entity":
        return "entity.optionLabel";

      default:
        return field;
    }
  }

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}`;

    const updatedFilters = [];

    if (!isObjectEmpty(filters)) {

      Object.keys(filters).forEach(field => {
        updatedFilters.push({
          field: replaceFieldName(field),
          term: filters[field].filter
        })
      });

      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(updatedFilters))}&filterType=and`
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${replaceFieldNameForSorting(sorting[0].colId)}&orderBy=${sorting[0].sort}`
    }

    if (search) {
      deepFilter = `${deepFilter}&search=${search}`;
    }
    return deepFilter;
  };

  const fetchBudgetList = () => {
    dispatch({ type: "loading", loading: true });

    if (gridApi) {
      gridApi.setRowData([]);
    }

    const queryString = getQueryString();
    axiosInstance()
      .get(`/budget${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data.map((item) => {
          let res = {
            ...prepareDataForGrid(item, user),
          };
          return res;
        });

        dispatch({ type: "initialize", data: rows, count: count });
        setTimeout(() => {
          dispatch({ type: "loading", loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: "loading", loading: false });
      });
  };

  const onSuccess = () => {
    // Add code of getting grid data again
    fetchBudgetList();
    setShowManageBudgetDialog({ show: false, id: null, isClone: false });
  };

  const handleDelete = () => {
    let ids = []
    if (deleteRecord) {
      ids.push(deleteRecord._id)
    }
    else {
      ids = selectedRecords.map(d => d._id);
    }
    axiosInstance().put(`${budgetApi}/remove`, { "ids": ids }).then(() => {
      fetchBudgetList();
      setShowDeleteConfirmBox(false)
      setDeleteRecord(null)
      setAnchorEl(null)
    }).catch((error) => {
      toastConfig.setToastConfig(error)
    });
  }

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const onSearch = (e) => {
    dispatch({ type: "search", search: e.target.value });
  };

  return (
    <>
      {showManageBudgetDialog.show && (
        <ManageBudgetDialog
          open={showManageBudgetDialog.show}
          onSuccess={onSuccess}
          onClose={() => {
            setShowManageBudgetDialog({ show: false, id: null, isClone: false });
          }}
          budgetId={showManageBudgetDialog.id}
          isClone={showManageBudgetDialog.isClone}
        />
      )}
      <Fragment>
        <Grid container className="headerbox">
          <Grid item md={4} sm={11} xs={10}>
            <CustomBreadCrumbs routes={[{ title: routes.budget.title }]} />
          </Grid>
          <Grid item md={8} sm={1} xs={2}>
            <ImportExportLinks
              permissions={permissions.budget}
              module="budget(s)"
              api={"budget"}
              afterImportCompleted={() => {
                fetchBudgetList();
              }}
              isExportAllOrSomeFeature={true}
              total={rowCount}
              recordsToExport={selectedRecords.length}
              ids={selectedRecords.length ? selectedRecords.map((obj) => obj._id) : []}
              onExportToExcelSuccess={() => {
                if (gridApi) gridApi.deselectAll()
                else fetchBudgetList()
              }}
            />
          </Grid>
        </Grid>

        <CustomContainer>
          <div className="header-panel">
            <Grid
              className={styles.filter_side_container}
              container
              justify="space-between"
            >
              <Grid item className="d-flex align-items-center gap-1">
                <MdContacts className="headerLogo" />
                <span className="listingHeader">
                  {routes.budget.title}
                </span>
              </Grid>
              <Grid className={styles.filter_side} item>
                <Box className={styles.filter_side_header} component="div">
                  <SearchBox
                    onSearch={onSearch}
                    searchbox={styles.search_box_input}
                    value={search}
                    size="small"
                    placeholder="Search Budget"
                    width="242px"
                  />

                  <>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      startIcon={<AddIcon />}
                      className={styles.add_submit_btn}
                      onClick={() => {
                        setShowManageBudgetDialog({ show: true, id: null, isClone: false });
                      }}
                    >
                      Add
                    </Button>
                  </>

                  <>
                    <Button
                      variant="outlined"
                      color="default"
                      size="small"
                      className={styles.action_submit_btn}
                      onClick={openActions}
                      disabled={selectedRecords.length ? false : true}
                      aria-controls="action-menu"
                    >
                      Actions <ExpandMore />
                    </Button>

                    <Menu
                      anchorEl={anchorEl}
                      keepMounted
                      getContentAnchorEl={null}
                      anchorOrigin={{
                        vertical: "bottom",
                        horizontal: "left",
                      }}
                      id="action-menu"
                      open={Boolean(anchorEl)}
                      onClose={closeActions}
                    >
                      <MenuItem onClick={() => setShowDeleteConfirmBox(true)}>Delete</MenuItem>
                    </Menu>
                  </>
                </Box>
              </Grid>
            </Grid>
          </div>
          <Box component="div">
            {isMobile ? <CustomSwipableList
              allowSelection={true}
              allowSwipe={true}
              permissions={permissions.budget}
              primaryField={columns?.find(d => d.primaryField)}
              onClick={(d) => {
                history.push(`${routes.budget.path}?id=${d._id}`)
              }}
              dataRows={dataRows}
              selectedRecords={selectedRecords}
              dispatch={dispatch}
              onEdit={(d) => {
                history.push(`${routes.budget.path}?id=${d._id}`)
              }}
              extraParamsToCheckDelete={true}
              onDelete={(d) => {
                setDeleteRecord(d)
                setShowDeleteConfirmBox(true)
              }}
              rowCount={rowCount}
              page={page}
              loading={loading}
              additionalDetails={[]}
              chips={[]}
              owerCollaboratorInitialsOrImages=""
              onCreate={() => setShowManageBudgetDialog({ show: true, id: null, isClone: null })}
              showClone={false}
              onClone={() => { }}
              renderedFrom={budget.resource}

            /> :
              Object.keys(frameWorkComponent).length > 0 ?
                <CustomAgGrid
                  columns={columns}
                  dataRows={dataRows}
                  frameworkComponents={frameWorkComponent}
                  setGridApi={setGridApi}
                  dispatch={dispatch}
                  rowCount={rowCount}
                  limit={limit}
                  pageSizes={pageSizes}
                  page={page}
                  actionWidth={100}
                  loading={loading}
                  renderedFrom={routes.budget.title}
                  refreshGrid={fetchBudgetList}
                /> : null
            }
          </Box>
        </CustomContainer>

        {showDeleteConfirmBox &&
          <ConfirmationDialog
            open={showDeleteConfirmBox}
            message={deleteRecord?._id ? `Are you sure you want to delete the budget ${deleteRecord?.name} ?` : "Are you sure you want to delete selected budget(s) ?"}
            onClose={() => setShowDeleteConfirmBox(false)}
            onOk={handleDelete}
          />
        }
      </Fragment>
    </>
  );
}

export default Budget;
