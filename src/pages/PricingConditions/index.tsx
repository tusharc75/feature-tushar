import { useContext, useEffect, useState, useReducer, Fragment } from "react";
import { Box, Button, Menu, MenuItem, Grid } from "@material-ui/core";
import { useData } from "../../StateProvider/Provider";
import {AddOutlined, ExpandMore} from "@material-ui/icons";
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
  pricingCondition,
} from "../../constants/helpers";
import routes from "./../../components/Helpers/Routes";
import { CommonRenderer } from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import CustomAgGrid, {
  reducer,
  intialState,
} from "../../components/AgGridComponents/CustomAgGrid";
import CustomRenderCell from "../../components/Helpers/CustomRenderCell";
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import ImportExportLinks from "../../components/Helpers/ImportExportLinks";
import { Link, useHistory } from "react-router-dom";
import {isMobile} from "react-device-detect";
import {MdAdd} from "react-icons/all";

let timeout;
const PricingConditions = () => {

  const { state: { permissions } }: any = useData();
  const { pricingConditionApi } = pricingCondition;
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false)

  const history = useHistory();
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
      fetchPriceConditionList()
    }, millisec);
  }, [search]);

  useEffect(() => {
    fetchPriceConditionList();
  }, [page, limit, filters, sorting]);

  const columnState = JSON.parse(localStorage.getItem("pricingConditionPage"));

  const columns = [
    {
      field: "conditionName",
      headerName: "Name",
      show: true,
      disabled: true,
      cellRenderer: "nameRenderer"
    },
    {
      field: "description",
      headerName: "Description",
      show: true,
      cellRenderer: "commonRenderer"
    },
    {
      field: "conditionType",
      headerName: "Condition Type",
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

  const NameRenderer = params => <Link className="link"
    to={`${routes.pricingConditionDetail.path}/${params.data._id}`} title={params.value}>
    {params.value}
  </Link>;

  const ActionsRenderer = params => (
    permissions.pricingCondition.isDelete &&
    <Tooltip title="Delete">
      <IconButton size="small" aria-label="Delete" onClick={() => {
        setDeleteRecord(params.data)
        setShowDeleteConfirmBox(true)
      }} >
        <DeleteIcon color="error" />
      </IconButton>
    </Tooltip >
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
      case "product":
        return "product.optionLabel";

      case "warehouse":
        return "warehouse.optionLabel";

      case "customer":
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

  const fetchPriceConditionList = () => {
    dispatch({ type: "loading", loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    const queryString = getQueryString();
    axiosInstance().get(`/pricing-condition${queryString}`).then(({ data }) => {
      let rows = data.data.map((item) => {
        const { createdBy, updatedBy, ...restProperties } = item;
        let res = {
          ...restProperties,
          id: item._id,
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

  const handleDelete = () => {
    let ids = []
    if (deleteRecord) {
      ids.push(deleteRecord._id)
    }
    else {
      ids = selectedRecords.map(d => d._id);
    }
    axiosInstance().put(`${pricingConditionApi}/remove`, { "ids": ids }).then(() => {
      fetchPriceConditionList();
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

  const CreateNew = (id, isClone) => {
    if (isClone) {
      history.push(routes.pricingConditionDetail.path + "/0", { isClone: true })
    }
    else {
      history.push(routes.pricingConditionDetail.path + "/" + id, { isClone: false })
    }
  }

  return (
    <Fragment>
      <Grid container className="headerbox">
        <Grid item md={4} sm={11} xs={10}>
          <CustomBreadCrumbs routes={[{ title: routes.pricingCondition.title }]} />
        </Grid>
        <Grid item md={8} sm={1} xs={2}>
          <ImportExportLinks
            permissions={permissions.pricingCondition}
            module="pricingCondition(s)"
            api={"pricingCondition"}
            afterImportCompleted={() => {
              fetchPriceConditionList();
            }}
            isExportAllOrSomeFeature={true}
            total={rowCount}
            recordsToExport={selectedRecords.length}
            ids={selectedRecords.length ? selectedRecords.map((obj) => obj._id) : []}
            onExportToExcelSuccess={() => {
              if (gridApi) gridApi.deselectAll()
              else fetchPriceConditionList()
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
                {routes.pricingCondition.title}
              </span>
            </Grid>
            <Grid className={styles.filter_side} item xs={isMobile ? 12 : 6}>
              <Box className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} component="div">

                <Grid style={{display: "flex", flex:1}}>
                <SearchBox
                  onSearch={onSearch}
                  searchbox={styles.search_box_input}
                  value={search}
                  size="small"
                  placeholder="Search PriceCondition"
                  width={isMobile ? "200px" : "242px"}
                  style={isMobile ? {flex:1} : {}}
                />
                </Grid>

                <Grid style={{display: "flex" , gap:"5px"}}>
                <Button
                    variant={isMobile ? "text" : "contained"}
                  color="primary"
                  size="small"
                    className={isMobile ? "mobile_button" : styles.add_submit_btn}
                    startIcon={isMobile ? null : <AddOutlined />}
                  onClick={() => CreateNew("0", false)}
                >
                  {isMobile ? <MdAdd size={23}/> : "Add"}
                </Button>
                <Button
                    variant={isMobile ? "text" : "contained"}
                  color="default"
                  size="small"
                    className={isMobile ? "mobile_button" : styles.action_submit_btn}
                  onClick={openActions}
                  disabled={selectedRecords.length ? false : true}
                  aria-controls="action-menu"
                >
                  {isMobile ? "" :  "Actions" } <ExpandMore/>
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
                </Grid>
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
            renderedFrom="pricingConditionPage"
            refreshGrid={fetchPriceConditionList}
          />
        </Box>
      </CustomContainer>
      {showDeleteConfirmBox &&
        <ConfirmationDialog
          open={showDeleteConfirmBox}
          message={deleteRecord?._id ? `Are you sure you want to delete the pricing condition ${deleteRecord?.name} ?` : "Are you sure you want to delete selected pricingCondition(s) ?"}
          onClose={() => setShowDeleteConfirmBox(false)}
          onOk={handleDelete}
        />
      }
    </Fragment>
  );
}

export default PricingConditions;
