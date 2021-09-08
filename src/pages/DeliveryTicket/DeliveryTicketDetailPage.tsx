import { useContext, useEffect, useMemo, useState, useReducer, Fragment } from 'react'
import { useHistory, useParams, useLocation } from "react-router-dom";
import { Paper, Box, Grid, Button, Typography } from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import DetailsPageHeader from "../../components/DetailsPageHeader";
import { yyyyMMDD, deliveryTicket, sidebarResource } from "../../constants/helpers";
import { useData } from "../../StateProvider/Provider";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import routes from "../../components/Helpers/Routes";
import axiosInstance from "../../axios/axiosInstance";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import DetailsPage from "../../components/Shared/DetailsPage";
import ManageDeliveryTicketDialog from "./ManageDeliveryTicket"
import CustomAgGrid, { reducer, intialState } from "../../components/AgGridComponents/CustomAgGrid";
import {
  CreatedByRenderer,
  UpdatedByRenderer
} from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import { Link } from "react-router-dom";
import { isObjectEmpty, productInventory, gridLoadingTimeout } from "../../constants/helpers"

export default function DeliveryTicketDetail(props) {
  const history = useHistory();
  const location = useLocation();
  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams();
  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();
  const [deliveryTicketData, setDeliveryTicketData] = useState(null);
  const [loading, setLoading] = useState(false);
  const { deliveryTicketApi } = deliveryTicket;
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [deliveryTicketFields, setDeliveryTicketFields] = useState([]);
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

  useEffect(() => {
    fetchDeliveryTicketData();
    getDeliveryTicketFields()
  }, [id]);

  const columns = [
    { field: "productCategory", headerName: "Product Category", show: true, disabled: true, cellRenderer: "nameRenderer" },
    { field: "productName", headerName: "Product Name", show: true, disabled: true, cellRenderer: "nameRenderer" },
    { field: "equipmentNumber", headerName: "Equipment Number", show: true, disabled: true, cellRenderer: "nameRenderer" },
    { field: "batchNumber", headerName: "Batch Number", show: true, disabled: true, cellRenderer: "nameRenderer" },
    { field: "warehouse", headerName: "Warehouse", show: true, disabled: true, cellRenderer: "nameRenderer" },
    { field: "description", headerName: "Description", show: true, disabled: true, cellRenderer: "nameRenderer" },
    { field: "assetNumber", headerName: "Asset Number", show: true, cellRenderer: "CommonRenderer" },
    { field: "inventoryNumber", headerName: "Inventory Number", show: true, cellRenderer: "CommonRenderer" },
    { field: "bornInDate", headerName: "Born on Date", show: true, cellRenderer: "CommonRenderer" },
    { field: "inServiceDate", headerName: "In Service Date", show: true, cellRenderer: "CommonRenderer" },
    { field: "createdBy", headerName: "Created By", show: true, cellRenderer: "createdByRenderer" },
    { field: "updatedBy", headerName: "Updated By", show: true, cellRenderer: "updatedByRenderer" },
  ];

  const getDeliveryTicketFields = () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource["deliveryTicket"]}`)
      .then(({ data }) => {
        setDeliveryTicketFields(data.data);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };
  const getMainPoints = useMemo(() => {
    let mainPoint = {};
    if (deliveryTicketData) {
      mainPoint["Pick-UpDate:"] = yyyyMMDD(deliveryTicketData?.["pick-UpDate"]) || "";
      mainPoint["Delivery Date"] = yyyyMMDD(deliveryTicketData?.deliveryDate) || "";
      mainPoint["deliveryPerson"] = deliveryTicketData?.deliveryPerson?.optionLabel || ""
    }
    return mainPoint;
  }, [deliveryTicketData?.deliveryJobName, deliveryTicketData?.deliveryPerson, deliveryTicketData?.deliveryDate]);

  const fetchDeliveryTicketData = () => {
    if (selectedEntity) {
      setLoading(true);
      axiosInstance()
        .get(`${deliveryTicketApi}/${id}?entity=${selectedEntity}`)
        .then(({ data: { data } }) => {
          setDeliveryTicketData(data)
          if (data?.productInventory && data?.productInventory.length) {
            fetchProductInventory(data?.productInventory)
          }
          setLoading(false);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setLoading(false);
        });
    }
  };

  const fetchProductInventory = (productInventories) => {
    dispatch({ type: "loading", loading: true });

    if (gridApi) {
      gridApi.setRowData([]);
    }

    const queryString = getQueryString();
    axiosInstance().get(`${productInventory.api}${queryString}`).then(({ data }) => {
      data.data = data.data.filter((u) => productInventories.indexOf(u?._id) >= 0)
        ?.map((u) => ({
          ...u,
          id: u._id,
          inServiceDate: u.inServiceDate,
          bornInDate: u.bornInDate,
          status: u.status?.optionLabel,
          warehouse: u.warehouse?.optionLabel,
          productCategory: u.productCategory?.optionLabel,
          productName: u.product?.optionLabel,
          createdBy: u.createdBy?.user?.concatedName,
          createdByDate: u.createdBy?.date,
          updatedBy: u.updatedBy?.user?.concatedName,
          updatedByDate: u.updatedBy?.date,
        }));

      dispatch({ type: "initialize", data: data.data, count: data.count });
      setTimeout(() => {
        dispatch({ type: "loading", loading: false });
      }, gridLoadingTimeout);

    }).catch((error) => {
      toastConfig.setToastConfig(error);
      dispatch({ type: "loading", loading: false });
    });
  };

  const getQueryString = () => {
    let deepFilter = `? page = ${page} & limit=${limit}`;

    if (!isObjectEmpty(filters)) {
      const updatedFilters = [];

      Object.keys(filters).forEach(field => {
        updatedFilters.push({
          field: replaceFieldName(field),
          term: filters[field].filter
        })
      });
      deepFilter = `${deepFilter} & deepFilter=${JSON.stringify(updatedFilters)} & filterType=and`
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter} & sortBy=${sorting[0].colId} & orderBy=${sorting[0].sort}`
    }

    if (search) {
      deepFilter = `${deepFilter} & search=${search}`;
    }

    return deepFilter;
  };

  const handleDeleteLoadingTicket = () => {
    if (deliveryTicketData?._id) {
      axiosInstance()
        .put(`${deliveryTicketApi} / remove ? entity = ${selectedEntity}`, {
          ids: [deliveryTicketData._id],
        })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: "success",
            message: data.message,
          });
          history.push({
            pathname: routes.deliveryTicket.path,
          });
          setShowConfirmBox(false);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setShowConfirmBox(false);
        });
    } else {
      setShowConfirmBox(false);
    }
  };

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const NameRenderer = (params) => (
    <Link className="link" title={params.value} to={`${routes.productInventoryDetail.path} / ${params.data._id}`}>
      {params.value}
    </Link>
  );

  const frameworkComponents = {
    createdByRenderer: CreatedByRenderer,
    updatedByRenderer: UpdatedByRenderer,
    nameRenderer: NameRenderer,
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

  return (
    <>
      <Fragment>
        <Grid container className="headerbox">
          <CustomBreadCrumbs routes={[routes.deliveryTicket, { title: deliveryTicketData?.deliveryJobName }]} />
        </Grid >
        <div className={`detail-container grid-without-activity`} >
          <div>
            <Paper>
              {!deliveryTicketData ? (
                <div>
                  <Skeleton variant="text" width="150px" height="40px" />
                  <Box display="flex">
                    <Skeleton
                      style={{ borderRadius: 6 }}
                      width="120px"
                      height="80px"
                    />
                    <Box marginX={1} />
                    <Skeleton
                      style={{ borderRadius: 6 }}
                      width="120px"
                      height="80px"
                    />
                  </Box>
                </div>
              ) : (
                <DetailsPageHeader
                  heading={deliveryTicketData ? deliveryTicketData?.deliveryJobName : ""}
                  mainPoints={deliveryTicketData ? getMainPoints : ""}
                  showHeading={true}
                >
                  {permissions?.deliveryTicket?.isUpdate && (
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={handleOpenUpdateDialog}
                    >
                      Edit
                    </Button>
                  )}
                  {(permissions?.deliveryTicket?.isDelete &&
                    deliveryTicketData?.createdBy?.user?._id === user?.user._id) && (
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => setShowConfirmBox(true)}
                      >
                        Delete
                      </Button>
                    )}
                </DetailsPageHeader>
              )}

              {loading ? (
                <Box padding={2}>
                  <Grid container spacing={2}>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                      <Grid item sm={6} md={6} key={i}>
                        <Skeleton variant="text" width="100px" height="16px" />
                        <Box marginY={1} />
                        <Skeleton width="100%" height="50px" />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ) : (
                <>
                  {(deliveryTicketData && deliveryTicketFields.length > 0 ?
                    <DetailsPage
                      data={deliveryTicketData}
                      fields={deliveryTicketFields} /> : null
                  )}
                  {
                    dataRows && dataRows.length ?
                      <>
                        <Grid container>
                          <Grid item xs={12} alignItems='center'>
                            <Box
                              component="div"
                              display="flex"
                              alignItems="center"
                              flexGrow={1}
                            >
                              <Box padding="5px">
                                <Typography variant="subtitle1">
                                  Product Inventory
                                </Typography>
                              </Box>
                            </Box>
                          </Grid>
                          <Grid item xs={12} alignItems='center'>
                            <CustomAgGrid
                              allowSelection={false}
                              allowAction={false}
                              columns={columns}
                              dataRows={dataRows}
                              frameworkComponents={frameworkComponents}
                              setGridApi={setGridApi}
                              dispatch={dispatch}
                              rowCount={rowCount}
                              limit={limit}
                              pageSizes={pageSizes}
                              page={page}
                              actionWidth={150}
                              loading={false}
                              renderedFrom="deliveryDetailPage"
                            />
                          </Grid>
                        </Grid>
                      </>
                      : null
                  }

                </>
              )}
            </Paper>
          </div>
        </div>

        {showConfirmBox ? (
          <ConfirmationDialog
            open={showConfirmBox}
            message={`Are you sure you want to delete this Loading Ticket ? `}
            onClose={() => setShowConfirmBox(false)}
            onOk={handleDeleteLoadingTicket}
          />
        ) : null}
        {openUpdateDialog && (
          <ManageDeliveryTicketDialog
            deliveryTicketId={deliveryTicketData?._id}
            open={openUpdateDialog}
            onClose={() => setOpenUpdateDialog(false)}
            onSuccess={() => {
              setOpenUpdateDialog(false);
              fetchDeliveryTicketData();
            }}
          />
        )}

      </Fragment>
    </>
  );
}
