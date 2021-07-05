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

function Budget() {
  const [showManageBudgetDialog, setShowManageBudgetDialog] = useState({
    show: false,
    id: null,
  });

  const onSuccess = () => {
    // Add code of getting grid data again

    setShowManageBudgetDialog({ show: false, id: null });
  };

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
    fetchBudgetList();
  }, [page, limit, filters, sorting, search]);

  const fetchBudgetList = () => {
    dispatch({ type: "loading", loading: true });
    axiosInstance()
      .get(`/budget`)
      .then((res) => {
        let rows = res.data.data.map((item) => {
          const { createdBy, updatedBy, productCategory, ...restProperties } =
            item;
          let res = {
            ...restProperties,
            id: item._id,
            productCategory: productCategory.optionLabel,
          };
          return res;
        });
        console.log(rows);
        dispatch({ type: "initialize", data: rows, count: res.data.count });
        setTimeout(() => {
          dispatch({ type: "loading", loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: "loading", loading: false });
      });
  };
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
      cellRenderer: "yearRenderer",
    },
    {
      field: "entity",
      headerName: "Entity",
      show: true,
      cellRenderer: "entityRenderer",
    },
    {
      field: "marketSegment",
      headerName: "Market Segment",
      show: true,
      cellRenderer: "marketSegmentRenderer",
    },
    {
      field: "subMarketSegment",
      headerName: "Sub Market Segment",
      show: true,
      cellRenderer: "subMarketSegmentRenderer",
    },
    {
      field: "productCategory",
      headerName: "Product Category",
      show: true,
      cellRenderer: "productCategoryRenderer",
    },
    {
      field: "currency",
      headerName: "Currency",
      show: true,
      cellRenderer: "currencyRenderer",
    },
  ];

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
                    >
                      Add
                    </Button>
                  </>

                  <>
                    <Button
                      // disabled={Boolean(!selectedBrand)}

                      variant="outlined"
                      color="default"
                      size="small"
                      className={styles.action_submit_btn}
                      aria-controls="action-menu"
                    >
                      Actions <ExpandMore />
                    </Button>
                    <Menu
                      open={Boolean(false)}
                      keepMounted
                      getContentAnchorEl={null}
                      anchorOrigin={{
                        vertical: "bottom",
                        horizontal: "left",
                      }}
                      id="action-menu"
                    >
                      <MenuItem>Delete</MenuItem>
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
              frameworkComponents=""
              setGridApi={setGridApi}
              dispatch=""
              rowCount=""
              limit=""
              pageSizes=""
              page=""
              actionWidth={100}
              loading=""
            />
          </Box>
        </CustomContainer>
      </Layout>
    </>
  );
}

export default Budget;
