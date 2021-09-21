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
} from "../../constants/helpers";
import routes from "./../../components/Helpers/Routes";
import {
  CommonRenderer,
} from "../../components/AgGridComponents/CustomAgGridCellRenderers";
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

let timeout;
function Budget() {

  const {
    state: { permissions },
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

  const columnState = JSON.parse(localStorage.getItem("budgetPage"));

  const columns = [
    {
      field: "name",
      headerName: "Name",
      show: true,
      disabled: true,
      cellRenderer: "nameRenderer"
    },
    {
      field: "year",
      headerName: "Year",
      show: true,
      cellRenderer: "commonRenderer"
    },
    {
      field: "entity",
      headerName: "Entity",
      show: true,
      cellRenderer: "commonRenderer"
    },
    {
      field: "marketSegment",
      headerName: "Market Segment",
      show: true,
      cellRenderer: "commonRenderer"
    },
    {
      field: "subMarketSegment",
      headerName: "Sub Market Segment",
      show: true,
      cellRenderer: "commonRenderer"
    },
    {
      field: "productCategory",
      headerName: "Product Category",
      show: true,
      cellRenderer: "commonRenderer"
    },
    {
      field: "currency",
      headerName: "Currency",
      show: true,
      cellRenderer: "commonRenderer"
    },
  ];
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

  const frameworkComponents = {
    nameRenderer: NameRenderer,
    commonRenderer: CommonRenderer,
    actionsRenderer: ActionsRenderer
  };

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

  const fetchBudgetList = () => {
    dispatch({ type: "loading", loading: true });

    if (gridApi) {
      gridApi.setRowData([]);
    }

    const queryString = getQueryString();
    axiosInstance()
      .get(`/budget${queryString}`)
      .then(({ data }) => {
        let rows = data.data.map((item) => {
          const { createdBy, updatedBy, productCategory, marketSegment, subMarketSegment, entity, ...restProperties } =
            item;
          let res = {
            ...restProperties,
            id: item._id,
            productCategory: productCategory?.optionLabel ?? "",
            marketSegment: marketSegment?.optionLabel ?? "",
            subMarketSegment: subMarketSegment?.optionLabel ?? "",
            entity: entity?.optionLabel ?? ""
          };
          return res;
        });

        dispatch({ type: "initialize", data: rows, count: data.count });
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
            <CustomAgGrid
              columns={columns}
              dataRows={dataRows}
              frameworkComponents={frameworkComponents}
              setGridApi={setGridApi}
              dispatch={dispatch}
              rowCount={rowCount}
              limit={limit}
              pageSizes={pageSizes}
              page={page}
              actionWidth={100}
              loading={loading}
              renderedFrom="budgetPage"
            />
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
