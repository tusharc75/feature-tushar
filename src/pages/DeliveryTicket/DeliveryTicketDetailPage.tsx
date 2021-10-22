import { useContext, useEffect, useMemo, useState, useReducer, Fragment } from 'react'
import { useHistory, useParams } from "react-router-dom";
import { Paper, Box, Grid, Button, Typography } from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import DetailsPageHeader from "../../components/DetailsPageHeader";
import { yyyyMMDD, deliveryTicket, sidebarResource, getObjKeysWithValues, defaultActivityShow } from "../../constants/helpers";
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
  UpdatedByRenderer,
  CommonRenderer,
  DateRenderer
} from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import { Link } from "react-router-dom";
import { productInventory, gridLoadingTimeout } from "../../constants/helpers"
import { IoIosArrowDropright, IoIosArrowDropleft } from 'react-icons/io';
import Activity from "../../components/Activity";
import { isMobile, isTablet } from "react-device-detect";
import SignatureDialog from '../../components/Helpers/SignatureDialog';

const mappedStatus = {
  "Start Delivery": "In-Transit",
  "Sign-Off": "Delivered"
}

export default function DeliveryTicketDetail(props) {
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams();
  const {
    state: { user, selectedEntity }
  }: any = useData();
  const [deliveryTicketData, setDeliveryTicketData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submittingSign, setSubmittingSign] = useState(false);
  const [openSignatureDialog, setOpenSignatureDialog] = useState(false);
  const [signatures, setSignatures] = useState([]);
  const { deliveryTicketApi } = deliveryTicket;
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [deliveryTicketFields, setDeliveryTicketFields] = useState([]);
  const [gridApi, setGridApi] = useState(null);
  const [showActivity, setActivityShow] = useState(defaultActivityShow);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, page, limit, pageSizes } = state;

  const handleActivityHideShow = () => {
    setActivityShow(!showActivity)
  }
  useEffect(() => {
    fetchDeliveryTicketData();
    getDeliveryTicketFields()
  }, [id]);

  const columns = [
    { field: "serialNumber", headerName: "Serial Number", show: true, disabled: true, cellRenderer: "nameRenderer" },
    { field: "productName", headerName: "Product Description", show: true, disabled: true, cellRenderer: "productRenderer" },
    { field: "productCategory", headerName: "Product Category", show: true, disabled: true, cellRenderer: "commonRenderer" },
    { field: "description", headerName: "Description", show: true, disabled: true, cellRenderer: "commonRenderer" },
    { field: "equipmentNumber", headerName: "Equipment Number", show: true, disabled: true, cellRenderer: "commonRenderer" },
    { field: "assetNumber", headerName: "Asset Number", show: true, cellRenderer: "commonRenderer" },
    { field: "batchNumber", headerName: "Batch Number", show: true, disabled: true, cellRenderer: "commonRenderer" },
    { field: "bornOnDate", headerName: "Born on Date", show: true, cellRenderer: "dateRenderer" },
    { field: "inServiceDate", headerName: "In Service Date", show: true, cellRenderer: "dateRenderer" },
    { field: "status", headerName: "Status", show: true, cellRenderer: "commonRenderer" },
    { field: "inventoryNumber", headerName: "Inventory Number", show: true, cellRenderer: "commonRenderer" },
    { field: "warehouse", headerName: "Plants", show: true, disabled: true, cellRenderer: "commonRenderer" },
    { field: "createdBy", headerName: "Created By", show: true, cellRenderer: "createdByRenderer" },
    { field: "updatedBy", headerName: "Updated By", show: true, cellRenderer: "updatedByRenderer" },
  ];

  const columnState = JSON.parse(localStorage.getItem("deliveryTicketDetailInventoryPage"));
  if (columnState) {
    columns.forEach((item) => {
      columnState.forEach((d) => {
        if (d.colId === item.field) {
          item.show = !d.hide;
        }
      });
    });
  }

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
      mainPoint["Pick-Up Date:"] = yyyyMMDD(deliveryTicketData?.["pick-UpDate"]) || "";
      mainPoint["Delivery Date"] = yyyyMMDD(deliveryTicketData?.deliveryDate) || "";
      mainPoint["delivery Person"] = deliveryTicketData?.deliveryPerson?.optionLabel || ""
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
            let ids = data?.productInventory.map(o => o?.optionValue)
            fetchProductInventory(ids)
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
    let ids = JSON.stringify(productInventories)
    const queryString = `?getById=${ids}`
    axiosInstance().get(`${productInventory.api}${queryString} `).then(({ data }) => {
      data.data = data.data.filter((u) => productInventories.indexOf(u?._id) >= 0)
        ?.map((u) => ({
          ...u,
          id: u._id,
          inServiceDate: u.inServiceDate,
          bornInDate: u.bornInDate,
          status: u.status,
          warehouse: u.warehouse?.optionLabel,
          warehouseId: u.warehouse?.optionValue,
          productCategory: u.productCategory?.optionLabel,
          productName: u.product?.optionLabel,
          productId: u.product?.optionValue,
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

  const handleDeleteLoadingTicket = () => {
    if (deliveryTicketData?._id) {
      axiosInstance()
        .put(`${deliveryTicketApi}/remove?entity=${selectedEntity}`, {
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

  // const handleOpenUpdateDialog = () => {
  //   setOpenUpdateDialog(true);
  // };

  const NameRenderer = (params) => (
    <Link className="link" title={params.value} to={`${routes.productInventoryDetail.path}/${params.data._id}`}>
      {params.value}
    </Link>
  );

  const ProductRenderer = (params) => (
    <Link className="link" title={params.value} to={`${routes.product.path}/detail/${params.data.productId}`}>
      {params.value}
    </Link>
  );
  const frameworkComponents = {
    createdByRenderer: CreatedByRenderer,
    updatedByRenderer: UpdatedByRenderer,
    nameRenderer: NameRenderer,
    commonRenderer: CommonRenderer,
    dateRenderer: DateRenderer,
    productRenderer: ProductRenderer
  };

  const handleChangeStatus = (label) => {
    if (mappedStatus[label]) {
      const fieldsDataForUpdate = deliveryTicketFields.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);
      let values = getObjKeysWithValues(deliveryTicketData, fieldsDataForUpdate)
      values["status"] = mappedStatus[label]
      values["_id"] = deliveryTicketData._id
      axiosInstance().put(`${deliveryTicketApi}`, values).then(({ data: { data } }) => {
        fetchDeliveryTicketData()
      }).catch((error) => {
        toastConfig.setToastConfig(error);
      });
    }
  }



  let label = deliveryTicketData ? deliveryTicketData?.status === "New" ? "Start Delivery" :
    (deliveryTicketData?.status === "In-Transit") ? "Sign-Off" : "" : ""

  const handleSignature = (signedData) => {
    const { type, sign: newSign } = signedData;
    let stateArr = signatures;
    const existingData = signatures.find(d => d.type === type)

    if (existingData) {
      stateArr = stateArr.map(d => {
        if (d.type === type) {
          d.sign = newSign.split("base64,")[1]
        }
        return d
      })
    } else {
      stateArr.push(signedData);
    }

    if (stateArr.length === 2) {
      setSignatures(stateArr)
      setSubmittingSign(true)
      axiosInstance().put(`${deliveryTicketApi}/signature`, {
        _id: id,
        signatures: stateArr.map(d => ({ type: d.type, signature: d.sign, status: label }))
      }).then(() => {
        handleChangeStatus(label)
        setOpenSignatureDialog(false)
        setSubmittingSign(false)
        setSignatures([])
      }).catch((error) => {
        toastConfig.setToastConfig(error);
        setOpenSignatureDialog(false)
        setSubmittingSign(false)
        setSignatures([])
      });
    }
  }


  return (
    <>
      <Fragment>
        <Grid container className="headerbox">
          <CustomBreadCrumbs routes={[routes.deliveryTicket, { title: deliveryTicketData?.deliveryJobName }]} />
        </Grid >
        <div className={`detail-container ${showActivity ? 'grid-with-activity' : 'grid-without-activity'}`} >
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
                  {/* {permissions?.deliveryTicket?.isUpdate && (
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
                    )} */}
                  {
                    deliveryTicketData?.deliveryPerson?.optionValue === user?.user?._id ?
                      label !== "" ?
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          disabled={loading}
                          onClick={() => setOpenSignatureDialog(true)}>
                          {label}
                        </Button> : null : null
                  }
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
                          <Grid item xs={12}>
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
                          <Grid item xs={12}>
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
                              renderedFrom="deliveryTicketDetailInventoryPage"
                              refreshGrid={fetchProductInventory}
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
          <div className="position-relative">
            {showActivity ?
              <Paper>
                {!isMobile && !isTablet && <span className="activityHide cursor-pointer" onClick={handleActivityHideShow}>
                  <IoIosArrowDropright className="icon" />
                </span>}
                {!deliveryTicketData ? (
                  <Box>
                    <Skeleton variant="text" width="100px" height="25px" />
                    <Box marginY={1} />
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} width="100%" height="50px" />
                    ))}
                  </Box>
                ) : (
                  <div>
                    <Activity
                      resourceId={deliveryTicketData?._id}
                      resource={deliveryTicket.deliveryTicketResource}
                      restrictedAddActivities={["Attachment", "Case"]}
                      relatedTo={[
                        {
                          type: deliveryTicket.deliveryTicketResource,
                          referenceId: deliveryTicketData?._id,
                          access: true,
                        },
                      ]}
                      handleActivityRefresh={() => { }}
                      //   emails={contactsEmailsData}
                      emails={null}
                    />
                  </div>
                )}
              </Paper> :
              !isMobile && !isTablet && <span className="activityShow cursor-pointer" onClick={handleActivityHideShow}>
                <IoIosArrowDropleft className="icon" />
              </span>}
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
        {openSignatureDialog &&
          <SignatureDialog
            submitting={submittingSign}
            label={label}
            steps={label === "Start Delivery" ? ["Supervisor", "Delivery Person"] : ["Delivery Person", "Receiver"]}
            forDelivery={true}
            open={true}
            onClose={() => {
              setOpenSignatureDialog(false)
              setSignatures([])
            }}
            onSigned={handleSignature}
          />}
      </Fragment>
    </>
  );
}
