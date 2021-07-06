import React, { useContext, useEffect, useState, useReducer } from "react";
import ManageBudgetDialog from "./ManageBudgetDialog";
import Layout from "../../components/Layout";
import { Box, Button, Menu, MenuItem, Grid } from "@material-ui/core";
import { useData } from "../../StateProvider/Provider";
import { Link } from "react-router-dom";
import { ExpandMore } from "@material-ui/icons";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import AddIcon from "@material-ui/icons/Add";
import CustomBreadCrumbs from "./../../components/CustomBreadCrumbs";
import SearchBox from "../../components/Helpers/SearchBox";
import CustomContainer from "../../components/CustomContainer";
import MessageDialog from "../../components/Helpers/MessageDialog";
import styles from "../Leads/Header.module.scss";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import ToggleButton from "@material-ui/lab/ToggleButton";
import ToggleButtonGroup from "@material-ui/lab/ToggleButtonGroup";
import { MdContacts } from "react-icons/md";
import axiosInstance from "../../axios/axiosInstance";
import {
  sidebarResource,
  isObjectEmpty,
  gridLoadingTimeout,
  budget,
} from "../../constants/helpers";
import NoDataCell from "../../components/Helpers/NoDataCell";
import { useHistory } from "react-router-dom";
import ImportExportLinks from "../../components/Helpers/ImportExportLinks";
import { Chip } from "@material-ui/core";
import routes from "./../../components/Helpers/Routes";
import {
  CommonRenderer,
  CreatedByRenderer,
  UpdatedByRenderer,
  CommonRendererWithCopy,
} from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import GridDeleteIcon from "../../components/Helpers/GridDeleteIcon";
import CustomAgGrid, {
  reducer,
  intialState,
} from "../../components/AgGridComponents/CustomAgGrid";
import CustomRenderCell from "../../components/Helpers/CustomRenderCell";
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';

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


  const columns = [
    {
      field: "name",
      headerName: "Name",
      show: true,
      disabled: true,
      cellRenderer: "nameRenderer",
    },
    {
      field: "year",
      headerName: "Year",
      show: true,
    },
    {
      field: "entity",
      headerName: "Entity",
      show: true,
    },
    {
      field: "marketSegment",
      headerName: "Market Segment",
      show: true,
    },
    {
      field: "subMarketSegment",
      headerName: "Sub Market Segment",
      show: true,
    },
    {
      field: "productCategory",
      headerName: "Product Category",
      show: true,
    },
    {
      field: "currency",
      headerName: "Currency",
      show: true,
    },
  ];

  useEffect(() => {
    fetchBudgetList();
  }, [page, limit, filters, sorting, search]);


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

  const NameRenderer = params => (
    <>
      {
        permissions.budget.isUpdate ?
          <span className="link"
            onClick={() => {
              setShowManageBudgetDialog({ show: true, id: params.data.id });
            }}>
            <CustomRenderCell value={params?.value} />
          </span>
          : params?.value
      }
    </>
  )

  const ActionsRenderer = params => (
    <>
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
    actionsRenderer: ActionsRenderer
  };

  const onSuccess = () => {
    // Add code of getting grid data again
    fetchBudgetList();
    setShowManageBudgetDialog({ show: false, id: null });
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

  return (
    <>
      {showManageBudgetDialog.show && (
        <ManageBudgetDialog
          open={showManageBudgetDialog.show}
          onSuccess={onSuccess}
          onClose={() => {
            setShowManageBudgetDialog({ show: false, id: null });
          }}
          budgetId={showManageBudgetDialog.id}
        />
      )}
      <Layout>
        <Grid container className="headerbox">
          <Grid item md={4} sm={11} xs={10}>
            <CustomBreadCrumbs routes={[{ title: routes.budget.title }]} />
          </Grid>
          <Grid item md={8} sm={1} xs={2}>
            {/* <ImportExportLinks /> */}
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
                  {sidebarResource["budget"]}
                </span>
              </Grid>
              <Grid className={styles.filter_side} item>
                <Box className={styles.filter_side_header} component="div">
                  <SearchBox size="small" />

                  <>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      startIcon={<AddIcon />}
                      className={styles.add_submit_btn}
                      onClick={() => {
                        setShowManageBudgetDialog({ show: true, id: null });
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
      </Layout>
    </>
  );
}

export default Budget;
