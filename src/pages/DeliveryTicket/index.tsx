import { useState, useEffect, useContext, useReducer, Fragment } from "react";
import Grid from "@material-ui/core/Grid";
import Box from "@material-ui/core/Box";
import { useHistory } from "react-router-dom";
import { useData } from "../../StateProvider/Provider";
import axiosInstance from "../../axios/axiosInstance";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import MessageDialog from "../../components/Helpers/MessageDialog";
import CustomBreadCrumbs from "./../../components/CustomBreadCrumbs";
import routes from "./../../components/Helpers/Routes";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import {
  isObjectEmpty,
  gridLoadingTimeout,
  deliveryTicket,
} from "../../constants/helpers";
import CustomContainer from "../../components/CustomContainer";
import GridDeleteIcon from "../../components/Helpers/GridDeleteIcon";
import CustomAgGrid, {
  reducer,
  intialState,
} from "../../components/AgGridComponents/CustomAgGrid";
import styles from "../Leads/Header.module.scss";
import { GiAbstract055 } from 'react-icons/gi';
import SearchBox from '../../components/Helpers/SearchBox'
import ManageDeliveryTicket from "./ManageDeliveryTicket"
import { sidebarResource, prepareDataForGrid } from "../../constants/helpers"
import useColumns, {getStaticFields, getFrameworkComponents } from "../../constants/useColumns"
import { isMobile } from 'react-device-detect';
import CustomSwipableList from "../../components/SwipableListComponents/CustomSwipableList";

let deliveryTicketTimeout;

const DeliveryTicket = () => {
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const {
    state: { user, selectedEntity, permissions },
  }: any = useData();
  const {getColumnData} = useColumns();
  const [renderCount, setRenderCount] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState<any>({});
  const [deliveryPermissions, setdeliveryPermissions] = useState({
    isCreate: permissions?.deliveryTicket?.isCreate,
    isUpdate: permissions?.deliveryTicket?.isUpdate,
    isRead: permissions?.deliveryTicket?.isRead,
    isDelete: permissions?.deliveryTicket?.isDelete,
  });

  const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] = useState(false);
  const [showManageDeliveryTicket, setShowManageDeliveryTicket] = useState(false);
  const [columns, setColumns] = useState([])
  const [frameWorkComponent, setFrameWorkComponent] = useState({})

  const { deliveryTicketApi, deliveryTicketResource } = deliveryTicket;

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
    search,
    filters,
    sorting,
    selectedRecords,
    appendRows
  } = state;

  const fetchGridMetadata = () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource["deliveryTicket"]}&entity=${selectedEntity}&view=true&showHiddenFields=true`)
      .then(({ data: { data } }) => {
        let columns = []
        let rendererNames = []
        data.forEach(o => {
          let currentColumn = getColumnData(deliveryTicketResource, o?.fieldData, `${routes.deliveryTicket.path}/detail`)
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
        columns = [...columns, ...getStaticFields()]
        setColumns([...columns])
      })
  }

  useEffect(() => {
    fetchGridMetadata()
  }, [])

  const columnState = JSON.parse(localStorage.getItem(deliveryTicketResource));
  if (columnState) {
    columns.forEach((item) => {
      columnState.forEach((d) => {
        if (d.colId == item.field) {
          item.show = !d.hide;
        }
      });
    });
  }

  useEffect(() => {
    if (permissions && permissions.deliveryTicket) {
      setdeliveryPermissions(permissions.deliveryTicket);
    }

    return () => {
      setdeliveryPermissions(null);
    };
  }, [permissions]);

  useEffect(() => {
    let millisec = Object.keys(search).length > 0 ? 600 : 5;
    if (deliveryTicketTimeout) {
      clearTimeout(deliveryTicketTimeout);
    }

    deliveryTicketTimeout = setTimeout(() => {
      fetchDeliveryTicket();
    }, millisec);
  }, [search]);

  useEffect(() => {
    if (renderCount > 0) {
      fetchDeliveryTicket();
    } else setRenderCount((preCount) => preCount + 1);
  }, [
    page,
    limit,
    filters,
    sorting,
    selectedEntity,
  ]);

  const ActionsRenderer = (params) => (
    <>
      <GridDeleteIcon
        hasDeletePermission={deliveryPermissions?.isDelete && params.data?.canDelete}
        ownerId={params.data.ownerId}
        userId={user?.user?._id}
        onDelete={() => {
          setDeleteRecord(params.data)
          setIsConformDialogVisible(true)
        }
        }
        entity="Delivery Ticket"
      />
    </>
  );

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
      case "customerAccount":
        return "customerAccount.optionLabel";

      default:
        return field;
    }
  };

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}`;

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

  const fetchDeliveryTicket = async () => {
    if (selectedEntity) {
      dispatch({ type: "loading", loading: true });
      const queryString = getQueryString();

      if (gridApi) {
        gridApi.setRowData([]);
      }

      axiosInstance()
        .get(`${deliveryTicketApi}${queryString}`)
        .then(({ data: { data, count } }) => {
          let rows = data.map((u) => {
            let res = {
              ...prepareDataForGrid(u, user),
              //  Commenting canDelete because right now we are neither showing checkbox for multiple delete nor delete icon in row
              //  canDelete: u?.createdBy?.user?._id === user?.user._id,
            };
            return res;
          });

          if (appendRows) {
            dispatch({ type: "initialize", data: [...dataRows, ...rows], count: count });
          } else {
            dispatch({ type: "initialize", data: rows, count: count });
          }

          setTimeout(() => {
            dispatch({ type: "loading", loading: false });
          }, gridLoadingTimeout);
        })
        .catch((error) => {
          dispatch({ type: "loading", loading: false });
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleSearch = (e) => {
    dispatch({ type: "search", search: e.target.value });
  };

  const showConfirmBox = (row) => {
    if (row) {
      setIsConformDialogVisible(true);
      if (row && row._id) {
        setDeleteRecord(row);
      }
    } else {
      if (selectedRecords.find((d) => d.canDelete === false)) {
        setShowDeleteWarningConfirmBox(true);
      } else {
        setIsConformDialogVisible(true);
      }
    }
  };

  const handleDeleteDeliveryTicket = async () => {
    setDeleteLoading(true);
    let recordsToDelete = [];
    if (deleteRecord?._id) {
      recordsToDelete.push(deleteRecord?._id);
    } else {
      recordsToDelete = selectedRecords.map((o) => o._id);
    }
    if (recordsToDelete.length > 0) {
      axiosInstance()
        .put(`${deliveryTicketApi}/remove?entity=${selectedEntity}`, {
          ids: recordsToDelete,
        })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: "success",
            message: data.message,
          });
          setIsConformDialogVisible(false);
          setDeleteLoading(false);
          if (deleteRecord) setDeleteRecord({});
          fetchDeliveryTicket();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setIsConformDialogVisible(false);
          setDeleteLoading(false);
        });

    }
  };

  return (
    <>
      <Fragment>
        <Grid container className="headerbox">
          <Grid item md={4} sm={11} xs={10}>
            <CustomBreadCrumbs routes={[routes.deliveryTicket]} />
          </Grid>
          {/* <Grid item md={8} sm={1} xs={2}>
            <Grid container direction="row">
              <Grid item xs={12} sm={12}>
                <Grid container justify="flex-end">
                  <ImportExportLinks
                    permissions={deliveryPermissions}
                    module="quotes"
                    api={deliveryTicketApi}
                    afterImportCompleted={() => {
                      fetchDeliveryTicket();
                    }}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid> */}
        </Grid>

        {/* Tables Begins Here */}
        <CustomContainer>
          <div className="header-panel">
            <Grid container className={styles.filter_side_container}>
              <Grid item xs={6} className="d-flex align-items-center gap-1">
                <GiAbstract055 className="headerLogo" />
                <span className="listingHeader">{routes.deliveryTicket.title} </span>
              </Grid>
              <Grid xs={isMobile ? 12 : 6} container className={styles.filter_side} >
                <Box className={styles.filter_side_header} component="div" >
                  <Grid style={{display: "flex", flex:1}}>
                  <SearchBox
                    onSearch={handleSearch}
                    searchbox={styles.search_box_input}
                    width="242px"
                    size="small"
                    value={search}
                    style={isMobile ? {flex:1} : {}}
                  />
                  </Grid>
                  {/* {deliveryPermissions?.isCreate &&
                    <Button className={styles.add_submit_btn}
                      onClick={() => setShowManageDeliveryTicket(true)}
                      variant="contained" size="small" color="primary" startIcon={<AddIcon />}>Add</Button>
                  } */}
                  {/* {deliveryPermissions?.isDelete &&
                    <Button
                      className={styles.action_submit_btn}
                      variant="outlined"
                      color="default"
                      size="small"
                      onClick={openActions}
                      disabled={selectedRecords.length ? false : true}
                      aria-controls="action-menu"
                    >Actions <ExpandMore />
                    </Button>
                  }
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
                    <MenuItem onClick={() => {
                      setIsConformDialogVisible(true)
                      closeActions()
                    }}>Delete</MenuItem>
                  </Menu> */}
                </Box>
              </Grid>
            </Grid>
          </div>

          {
            isMobile ?
              <CustomSwipableList
                allowSelection={false}
                allowSwipe={true}
                permissions={permissions.deliveryTicket}
                primaryField={columns?.find(d => d.primaryField)}
                onClick={(data) => {
                  history.push(`${routes.deliveryTicketDetail.path}/${data._id}`)
                }}
                dataRows={dataRows}
                selectedRecords={selectedRecords}
                dispatch={dispatch}
                onEdit={() => { }}
                extraParamsToCheckDelete={true}
                onDelete={() => { }}
                rowCount={rowCount}
                page={page}
                loading={loading}
                chips={[
                  {
                    label: "Status: ",
                    field: "status"
                  },
                  {
                    label: "Job Name: ",
                    field: "deliveryJobName"
                  }
                ]}
                onCreate={null}
                showClone={false}
                onClone={() => { }}
                renderedFrom={deliveryTicketResource}
              />
              : Object.keys(frameWorkComponent).length > 0 ?
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
                  allowSelection={false}
                  allowAction={false}
                  renderedFrom={deliveryTicketResource}
                  refreshGrid={fetchDeliveryTicket}
                /> : null
          }

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
              message={`Are you sure you want to delete ${deleteRecord?.deliveryJobName ? "Delivery Ticket" : "Delivery Tickets"
                }   ${deleteRecord.deliveryJobName || ""}?`}
              onClose={() => {
                if (deleteRecord) setDeleteRecord({});
                setIsConformDialogVisible(false);
              }}
              okBtnLoading={deleteLoading}
              onOk={handleDeleteDeliveryTicket}
            />
          ) : null}

          {
            showManageDeliveryTicket ?
              <ManageDeliveryTicket
                onClose={() => setShowManageDeliveryTicket(false)}
                onSuccess={() => {
                  fetchDeliveryTicket()
                  setShowManageDeliveryTicket(false)
                }}
              />
              : null
          }
        </CustomContainer>
      </Fragment>
    </>
  );
};

export default DeliveryTicket;
