import React, {
  useState,
  useEffect,
  Fragment,
  useContext,
  useReducer,
} from "react";
import Grid from "@material-ui/core/Grid";
import Button from "@material-ui/core/Button";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import AddIcon from "@material-ui/icons/Add";
import IconButton from "@material-ui/core/IconButton";
import DeleteIcon from "@material-ui/icons/Delete";
import { Link } from "react-router-dom";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "../../axios/axiosInstance";
import { RiPriceTag2Fill } from "react-icons/ri";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import MessageDialog from "../../components/Helpers/MessageDialog";
import CustomContainer from "../../components/CustomContainer";
import routes from "../../components/Helpers/Routes";
import CreateNewDialog from "./CreateNewDialog";
import {
  CreatedByRenderer,
  UpdatedByRenderer,
} from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import CustomAgGrid, {
  intialState,
  reducer,
} from "../../components/AgGridComponents/CustomAgGrid";
import { Menu, MenuItem } from "@material-ui/core";
import { ExpandMore } from "@material-ui/icons";
import { gridLoadingTimeout } from "../../constants/helpers";
import { useData } from "../../StateProvider/Provider";

const ProductBuilder = () => {
  const {
    state: {
      permissions: { productBuilder: permission },
      user: { user },
    },
  } = useData();
  const toastConfig = useContext(CustomToastContext);
  const [isCreate, setIsCreate] = useState(false);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] =
    useState(false);
  // const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [okButtonLoading] = useState(false);

  //  Grid Variables - Start
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const {
    dataRows,
    rowCount,
    loading,
    page,
    limit,
    pageSizes,
    selectedRecords,
  } = state;

  // const [showGridFilters, setShowGridFilters] = useState(true)
  const columns = [
    {
      field: "name",
      headerName: "Name",
      show: true,
      disabled: true,
      cellRenderer: "nameRenderer",
    },
    {
      field: "createdBy",
      headerName: "Created By",
      show: true,
      sortable: false,
      cellRenderer: "createdByRenderer",
    },
  ];
  //  Grid Variables - End

  useEffect(() => {
    fetchProductBuilder();
  }, []);

  const NameRenderer = (params) => (
    <Link
      className="link"
      to={`${routes.productBuilder.path}/${params.data.id}`}
    >
      {params.data.name}
    </Link>
  );

  const ActionsRenderer = (params) => {
    const hasPermission =
      permission?.isDelete && params.data.createdById === user?._id;
    return (
      <span title={hasPermission ? "" : "You don't have permission to delete"}>
        <IconButton
          disabled={hasPermission ? false : true}
          size="small"
          aria-label="Delete"
          onClick={() => {
            setDeleteRecord(params.data);
            setShowDeleteConfirmBox(true);
          }}
        >
          <DeleteIcon color={hasPermission ? "error" : "disabled"} />
        </IconButton>
      </span>
    );
  };

  const fetchProductBuilder = () => {
    dispatch({ type: "loading", loading: true });

    if (gridApi) {
      gridApi.setRowData([]);
    }

    axiosInstance()
      .get(`/productbuilder`)
      .then(({ data: { data } }) => {
        let rows = data.map((u) => {
          const { createdBy, ...restProperties } = u;

          let res = {
            ...restProperties,
            id: u._id,
            name: u.name,
            createdBy: u.createdBy?.user?.concatedCreatedByName,
            createdById: u.createdBy?.user?._id,
            createdByDate: u.createdBy?.date,
          };

          return res;
        });

        dispatch({ type: "initialize", data: rows, count: data.length });
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
    if (deleteRecord) {
      axiosInstance()
        .delete(`/productbuilder/` + deleteRecord._id)
        .then(() => {
          fetchProductBuilder();
          setShowDeleteConfirmBox(false);
          setDeleteRecord(null);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    } else {
      axiosInstance()
        .put(
          `/productbuilder/remove`,
          selectedRecords.map((d) => d._id)
        )
        .then(() => {
          fetchProductBuilder();
          setShowDeleteConfirmBox(false);
          setDeleteRecord(null);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const frameworkComponents = {
    nameRenderer: NameRenderer,
    createdByRenderer: CreatedByRenderer,
    updatedByRenderer: UpdatedByRenderer,
    actionsRenderer: ActionsRenderer,
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const showConfirmBox = (row) => {
    if (row) {
      setShowDeleteConfirmBox(true);
      if (row) {
        setDeleteRecord({ id: row.id, name: row.name });
      }
    } else {
      const notYou = selectedRecords.filter((d) => d.createdById !== user?._id);

      if (notYou.length) {
        setShowDeleteWarningConfirmBox(true);
      } else {
        setShowDeleteConfirmBox(true);
      }
    }
  };

  return (
    <Fragment>
      <Grid container className="headerbox">
        <Grid item md={12} sm={12} xs={12}>
          <CustomBreadCrumbs
            routes={[{ title: routes.productBuilder.title }]}
          />
        </Grid>
      </Grid>
      <CustomContainer>
        <div className="header-panel">
          <Grid container>
            <Grid item xs={6} className="d-flex align-items-center gap-1">
              <RiPriceTag2Fill  size={22} style={{paddingBottom: "3px"}}/>{" "}
              <span className="listingHeader">
                {routes.productBuilder.title}
              </span>
            </Grid>
            <Grid item xs={6} className="d-flex justify-content-end">
              {permission?.isCreate && (
                <Button
                  onClick={() => setIsCreate(true)}
                  variant="contained"
                  size="small"
                  color="primary"
                  startIcon={<AddIcon />}
                >
                  Add
                </Button>
              )}
              {permission?.isDelete && (
                <Button
                  className="ml-2"
                  // className={styles.action_submit_btn}
                  variant="outlined"
                  color="default"
                  size="small"
                  onClick={openActions}
                  aria-controls="action-menu"
                  disabled={selectedRecords.length > 0 ? false : true}
                >
                  Actions <ExpandMore />
                </Button>
              )}
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
                <MenuItem
                  onClick={() => {
                    showConfirmBox(null);
                    closeActions();
                  }}
                >
                  Delete
                </MenuItem>
              </Menu>
            </Grid>
          </Grid>
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
          page={page}
          allowSelection={true}
          actionWidth={100}
          isClientSideGrid={true}
          loading={loading}
        />

        {showDeleteWarningConfirmBox ? (
          <MessageDialog
            open={showDeleteWarningConfirmBox}
            message={`You are trying to delete records which you do not have permission to delete, Please remove those records from selection and try again.`}
            onClose={() => setShowDeleteWarningConfirmBox(false)}
          />
        ) : null}
        {showDeleteConfirmBox && (
          <ConfirmationDialog
            open={showDeleteConfirmBox}
            message={`Are you sure you want to delete ${
              deleteRecord ? deleteRecord.name : "selected product(s)"
            }?`}
            onClose={() => {
              setDeleteRecord(null);
              setShowDeleteConfirmBox(false);
            }}
            onOk={handleDelete}
            okBtnLoading={okButtonLoading}
          />
        )}
        {isCreate && <CreateNewDialog handleClose={() => setIsCreate(false)} />}
      </CustomContainer>
    </Fragment>
  );
};

export default ProductBuilder;
