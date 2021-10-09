import { useState, useEffect, useContext, Fragment, useReducer } from "react";
import { Grid, Box, Button, Paper, Tooltip } from "@material-ui/core";
import { Skeleton, Autocomplete, Alert } from "@material-ui/lab";
import { useParams, useHistory } from "react-router-dom";
import { isMobile, isTablet } from "react-device-detect";
import axiosInstance from "../../axios/axiosInstance";
import routes from "../../components/Helpers/Routes";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import DetailsPageHeader from "../../components/DetailsPageHeader";
import DetailsPage from "../../components/Shared/DetailsPage";
import { useData } from "../../StateProvider/Provider";
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import { getUniqueCurrencies, gridLoadingTimeout, rentalManagement } from "../../constants/helpers";
import Steps from "./Steps";
import AddExistingProductInventory from "./AddExistingProductInventory";
import CustomAgGrid, { intialState, reducer } from "../../components/AgGridComponents/CustomAgGrid";
import { Link } from 'react-router-dom'
import InputAdornment from "@material-ui/core/InputAdornment/InputAdornment";
import TextField from "@material-ui/core/TextField/TextField";
import { Field, FieldArray, Form, Formik } from "formik";
import Container from "@material-ui/core/Container/Container";
import IconButton from "@material-ui/core/IconButton/IconButton";
import ButtonGroup from "@material-ui/core/ButtonGroup/ButtonGroup";
import Add from "@material-ui/icons/Add";
import Delete from "@material-ui/icons/Delete";
import { IoIosArrowDropright, IoIosArrowDropleft } from 'react-icons/io';
import DeliveryTicket from "./DeliveryTicket";
import GridDeleteIcon from "../../components/Helpers/GridDeleteIcon";
import ManageRentalManagementDialog from "./ManageRental/ManageRentalManagementDialog";
import ManageDeliveryTicket from "../DeliveryTicket/ManageDeliveryTicket";
import ManageProductInventory from '../ProductInventory/ManageProductInventory'
import AddRentalCost from "./AddRentalCost";
import Activity from "../../components/Activity";
import styles from "./Retal.module.scss";
import ReceivingTicket from "./ReceivingTicket";
import ManageReceivingTicket from "../ReceivingTicket/ManageReceivingTicket";
import { CustomOfflineContext } from "../../StateProvider/OfflineContext/OfflineContext";
import HideWhenOffline from "../../components/HideWhenOffline";
import DeleteButton from "../../components/Helpers/DeleteButton";

const rentalProcessSteps = ["New", "Add Rental Cost", "Additional Cost", "Loading Ticket", "Receiving Ticket", "Ready To Ship"]

const RentalManagementDetailsPage = () => {
  const toastConfig = useContext(CustomToastContext);
  const { isOffline, offlineFieldsData, offlineGridData, updateOfflineGridData } = useContext(CustomOfflineContext);

  const { id } = useParams();
  const history = useHistory();
  const {
    state: { user, permissions }
  }: any = useData();
  const [headingLbl, setHeadingLbl] = useState("");
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [rentalManagementData, setRentalManagementData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [addExistingProductDialog, setAddExistingProductDialog] = useState(false);
  const [rentalManagementFields, setRentalManagementFields] = useState([]);
  const [mainPoints, setMainPoints] = useState(null);
  const [customizedRoutes, setCustomizedRoutes] = useState([]);
  const [warehouseList, setWarehouseList] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [additionalCost, setAdditionalCost] = useState<any[]>([]);
  const [productInventory, setProductInventory] = useState<any[]>([]);
  const [productInventoryForDeliveryTicket, setProductInventoryForDeliveryTicket] = useState<any[]>([]);
  const [warehouseForDeliveryTicket, setWarehouseForDeliveryTicket] = useState(null);
  const [showDeliveryTicketDialog, setShowDeliveryTicketDialog] = useState(false);
  const [showManageProductInventoryDialog, setShowManageProductInventoryDialog] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState(null);
  const [showActivity, setActivityShow] = useState(true);
  const [allowedToEdit, setAllowedToEdit] = useState(false)
  const [productInventoryForReceivingTicket, setProductInventoryForReceivingTicket] = useState<any[]>([]);
  const [warehouseForReceivingTicket, setWarehouseForReceivingTicket] = useState<any[]>([]);
  const [showReceivingTicketDialog, setShowReceivingTicketDialog] = useState(false);
  const [isInOfflineSaveQueue, setIsInOfflineSaveQueue] = useState(false)

  const handleActivityHideShow = () => {
    setActivityShow(!showActivity)
  }

  useEffect(() => {
    if (id) {
      getRentalManagementFields();
      fetchRentalManagementData();
      fetchProductInventory();
    }
    // eslint-disable-next-line
  }, [id]);

  useEffect(() => {
    if (currentStep === 3 && additionalCost.length > 0) {
      handleSaveAdditionalCost(additionalCost)
    }

    if (currentStep > 0) {
      axiosInstance().put(`${rentalManagement.rentalManagementApi}/${id}/process-status`, { "processStatus": rentalProcessSteps[currentStep] }).then(({ data }) => {
      }).catch((error) => {
        toastConfig.setToastConfig(error);
      });
    }
    // eslint-disable-next-line
  }, [currentStep]);

  useEffect(() => {
    updateStatus()
  }, [currentStep, productInventory])

  const updateStatus = () => {
    if (productInventory.length > 0 && rentalManagementData) {
      const leftItems = [];
      for (const product of productInventory) {
        if (!product.deliveryTicket) {
          leftItems.push(product.id)
        }
      }

      if (currentStep === 4 && leftItems.length === 0 && rentalManagementData) {
        if (rentalManagementData.status === "New") {
          const tempUpdateData = {
            "_id": rentalManagementData._id,
            "rentalJobName": rentalManagementData.rentalJobName,
            "rentalJobID": rentalManagementData.rentalJobID,
            "customerAccount": rentalManagementData.customerAccount?.optionValue,
            "customerContact": rentalManagementData.customerContact?.optionValue,
            "shippingAddress": rentalManagementData.shippingAddress,
            "currency": rentalManagementData.currency,
            "rentalStartDate": rentalManagementData.rentalStartDate,
            "rentalEndDate": rentalManagementData.rentalEndDate,
            "jobDescription": rentalManagementData.jobDescription,
            "status": "Ready to Ship",
            "owner": rentalManagementData.owner.optionValue,
            // "collaborator": rentalManagementData.collaborator,

          }
          axiosInstance().put(`${rentalManagement.rentalManagementApi}`, tempUpdateData)
            .then(() => {
              fetchRentalManagementData()
            }).catch((error) => {
              toastConfig.setToastConfig(error);
            });
        }
      }
    }
  }

  const handleMainPoints = (data) => {
    let mainPoint = {};
    // mainPoint['Account Name'] = data?.accountName?.optionLabel || '';
    setMainPoints(mainPoint);
  };

  const handleSaveAdditionalCost = (values) => {
    axiosInstance().post(`${rentalManagement.rentalManagementApi}/${id}/additional-cost`, { "additionalCost": values.map(d => { return { "type": d.type, "value": d.amount ? Number(d.amount) : 0 } }) })
      .then(({ data }) => {
        setAddExistingProductDialog(false)
        // fetchProductInventory()
        // fetchRentalManagementData()
        // toastConfig.setToastConfig({
        //   open: true,
        //   type: "success",
        //   message: data.message,
        // });
      }).catch((error) => {
        toastConfig.setToastConfig(error)
      });
  }

  const fetchRentalManagementData = async () => {
    try {
      let data;

      if (!isOffline) {
        const response: any = await axiosInstance().get(`${rentalManagement.rentalManagementApi}/${id}`);
        data = response?.data?.data;
      } else {
        data = offlineGridData?.rentalManagement?.find(d => d._id === id)
      }

      if (localStorage.getItem("offlineDataToSave")) {
        const offlineDataToSave = JSON.parse(localStorage.getItem("offlineDataToSave"))
        if (offlineDataToSave["rentalManagement"]) {
          setIsInOfflineSaveQueue(offlineDataToSave["rentalManagement"].some(d => d.values._id === id));
        }
      }

      try {
        updateOfflineGridData("rentalManagement", [data], []);
      } catch (ex) {
        console.error(`Rental Management: Error while adding/updating data for Offline context. Error: ${ex.message}`)
      }

      handleMainPoints(data);
      setHeadingLbl(data.rentalJobName);
      setCustomizedRoutes([routes.rentalManagement, { title: `${data.rentalJobName}` }]);
      setRentalManagementData(data);
      setAdditionalCost(data?.additionalCost?.map(d => { return { "id": d?._id, "type": d.type, "amount": d?.value } }))
      setCurrentStep(rentalProcessSteps.indexOf(data?.processStatus) !== -1 ? rentalProcessSteps.indexOf(data?.processStatus) : 0)
      setLoadingDetails(false);
      setCurrencySymbol(
        getUniqueCurrencies().find(
          (d) => d.currencyCode === data["currency"]
        )?.symbolNative
      );
      setAllowedToEdit([...(data.collaborator ?? []), data.owner].some((d) => d?.optionValue === user?.user?._id));
    } catch (error) {
      setLoadingDetails(false)
      toastConfig.setToastConfig(error);
    }
  };

  const getRentalManagementFields = async () => {
    try {
      if (!isOffline) {
        const response: any = await axiosInstance().get("/field?resource=Rental Management")
        setRentalManagementFields(response?.data?.data)
      } else {
        setRentalManagementFields(offlineFieldsData?.rentalManagement);
      }

    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const handleDelete = () => {
    axiosInstance().put(`${rentalManagement.rentalManagementApi}/remove`, { "ids": [rentalManagementData._id] }).then(() => {
      try {
        updateOfflineGridData("rentalManagement", [], [rentalManagementData._id]);
      } catch (ex) {
        console.error(`Rental Management: Error while removing data for Offline context. Error: ${ex.message}`)
      }

      setShowConfirmBox(false);
      history.goBack();
    }).catch((error) => {
      toastConfig.setToastConfig(error)
      setShowConfirmBox(false);
    });
  }

  const handleDeliveryTicketDialog = (selectedProductInventory, warehouse) => {
    setProductInventoryForDeliveryTicket(selectedProductInventory)
    setWarehouseForDeliveryTicket(warehouse)
    setShowDeliveryTicketDialog(true)
  }

  const handleReceivingTicketDialog = (selectedProductInventory, warehouse) => {
    setProductInventoryForReceivingTicket(selectedProductInventory)
    setWarehouseForReceivingTicket(warehouse)
    setShowReceivingTicketDialog(true)
  }

  const costTypeList = ["Repair", "Delivery", "Assembly"]
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;


  const fetchProductInventory = () => {
    dispatch({ type: "loading", loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }

    axiosInstance().get(`${rentalManagement.rentalManagementApi}/${id}/inventory`).then(({ data }) => {
      data.data = data.data?.map((u) => ({
        ...u,
        id: u.inventory?._id,
        productId: u.product?._id,
        productName: u.product?.productName,
        productCategory: u.product?.productCategory?.optionLabel,
        warehouse: u.inventory?.warehouse?.optionLabel,
        status: u.inventory?.status,
        assetNumber: u.inventory?.assetNumber,
        serialNumber: u.inventory?.serialNumber,
      }));
      fetchDeliveryTicket(data.data);

      let tempWareHouse = []
      data.data.map(d => {
        if (!tempWareHouse.some(t => t.optionValue === d.inventory.warehouse.optionValue)) {
          tempWareHouse.push(d.inventory.warehouse)
        }
      })
      if (data.data > 0 && data.data.every(d => d.inventory?.warehouse?.optionLabel !== null && d.inventory?.warehouse?.optionLabel !== undefined)) {
        setCurrentStep(4)
        axiosInstance().put(`${rentalManagement.rentalManagementApi}/${id}/status `, { "status": "Ready To Ship" }).then(({ data }) => {
        }).catch((error) => {
          toastConfig.setToastConfig(error);
        });
      }
      setWarehouseList(tempWareHouse)
      dispatch({ type: "initialize", data: data.data, count: data.count });
      setTimeout(() => {
        dispatch({ type: "loading", loading: false });
      }, gridLoadingTimeout);
    }).catch((error) => {
      toastConfig.setToastConfig(error);
      dispatch({ type: "loading", loading: false });
    });
  };


  const NameRenderer = (params) => (
    <Link className="link" title={params.value} to={`${routes.productInventoryDetail.path}/${params.data.id}`}>
      {params.value}
    </Link>
  );

  const ProductRenderer = (params) => (
    <Link className="link" title={params.value} to={`${routes.productDetail.path}/${params.data.productId}`}>
      {params.value}
    </Link>
  );

  const ActionsRenderer = (params) => (
    <>
      <GridDeleteIcon
        hasDeletePermission={permissions?.rentalManagement?.isDelete}
        ownerId={user?.user?._id}
        userId={user?.user?._id}
        onDelete={() => {
          handleRemoveProductInventory(params.data.inventory._id)
        }
        }
        entity="rentalManagement"
      />
    </>
  );

  const frameworkComponents = {
    nameRenderer: NameRenderer,
    productRenderer: ProductRenderer,
    actionsRenderer: ActionsRenderer,
  };
  const columns = [
    { field: "serialNumber", headerName: "Serial Number", show: true, cellRenderer: "nameRenderer" },
    { field: "productName", headerName: "Product Description", show: true, disabled: true, cellRenderer: "productRenderer" },
    { field: "status", headerName: "Status", show: true, cellRenderer: "commonRenderer" },
    { field: "warehouse", headerName: "Warehouse", show: true, disabled: true, cellRenderer: "commonRenderer" },
    { field: "productCategory", headerName: "Product Category", show: true, disabled: true, cellRenderer: "commonRenderer" },
    { field: "assetNumber", headerName: "Asset Number", show: true, cellRenderer: "commonRenderer" },
  ];

  const columnState = JSON.parse(localStorage.getItem("rentalManagementDetailsPageInventory"));
  if (columnState) {
    columns.forEach((item) => {
      columnState.forEach((d) => {
        if (d.colId === item.field) {
          item.show = !d.hide;
        }
      });
    });
  }

  const fetchDeliveryTicket = (values) => {
    setProductInventory([])
    axiosInstance()
      .get(`${rentalManagement.rentalManagementApi}/${id}/delivery-ticket `)
      .then(({ data }) => {
        let tempProductInventory = values
        data.data.map(obj => {
          tempProductInventory.map((d, index) => {
            if (obj.productInventory.some(p => d.id === p.optionValue)) {
              tempProductInventory[index]["deliveryTicket"] = obj.deliveryJobName
              tempProductInventory[index]["deliveryTicketId"] = obj._id
            }
          })

        })
        setProductInventory(tempProductInventory)
        // if (tempProductInventory.length > 0 && tempProductInventory.every(d => d.deliveryTicket !== undefined)) {
        //   setCurrentStep(4)
        // }
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleAddProductInventory = (productInventoryArray) => {
    let tempProductArray = productInventoryArray.map(d => { return { "inventory": d._id, "costing": { "costPerDay": 0, "totalCost": 0, "startDate": rentalManagementData.rentalStartDate, "dueDate": rentalManagementData.rentalEndDate } } })
    axiosInstance().post(`${rentalManagement.rentalManagementApi}/${id}/inventory`, { "products": tempProductArray })
      .then(({ data }) => {
        setAddExistingProductDialog(false)
        fetchProductInventory()
        toastConfig.setToastConfig({
          open: true,
          type: "success",
          message: data.message,
        });
      }).catch((error) => {
        setAddExistingProductDialog(false)
        toastConfig.setToastConfig(error)
      });
  }

  const handleRemoveProductInventory = (productInventoryId) => {
    axiosInstance().put(`${rentalManagement.rentalManagementApi}/${id}/inventory/remove`, { "products": [productInventoryId] })
      .then(({ data }) => {
        fetchProductInventory()
      }).catch((error) => {
        toastConfig.setToastConfig(error)
      });
  }

  return (
    <>
      <Fragment>

        <Grid container className="headerbox">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Grid>
        <div className={`detail-container ${showActivity ? 'grid-with-activity' : 'grid-without-activity'}`} >
          <div>
            <div>
              <Paper>
                {!rentalManagementData ? (
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
                    heading={headingLbl}
                    mainPoints={mainPoints}
                    showHeading={true}
                  >

                    {permissions?.rentalManagement?.isUpdate && allowedToEdit && (
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={handleOpenUpdateDialog}
                      >
                        Edit
                      </Button>
                    )}

                    <HideWhenOffline>
                      {permissions?.rentalManagement?.isDelete &&
                        rentalManagementData?.owner?.optionValue &&
                        user?.user?._id &&
                        rentalManagementData.owner.optionValue === user.user._id ? (
                        <DeleteButton
                          text="Delete"
                          onClick={() => setShowConfirmBox(true)}
                        />
                      ) : null}
                    </HideWhenOffline>
                  </DetailsPageHeader>
                )}

                <Box>
                  {loadingDetails || !rentalManagementFields.length ? (
                    <Grid container spacing={2} style={{ padding: "8px" }}>
                      <CommonSkeleton lenArray={[...Array(7).keys()]} />
                    </Grid>
                  ) : (
                    <>
                      {
                        isInOfflineSaveQueue && <div className="px-3">
                          <Alert variant="filled" severity="info">Updates are in offline state, it will be affected once you will be in network</Alert>
                        </div>
                      }

                      <DetailsPage data={rentalManagementData} fields={rentalManagementFields} />
                    </>
                  )}
                </Box>
              </Paper>
            </div>
            <div>
              <Steps
                className={styles.steps_box}
                isNextStep={!Boolean(productInventory.length)}
                steps={rentalProcessSteps.slice(0, 5)}
                currentStep={currentStep}
                setCurrentStep={setCurrentStep}
              />
              {(currentStep === 0) && (
                <>
                  <Box display="flex" mb={1}>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => { setAddExistingProductDialog(true) }}
                    >
                      Add Existing Serialized Assets
                    </Button>
                    <Box mx={1} />
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => { setShowManageProductInventoryDialog(true) }}
                    >
                      Add New Serialized Assets
                    </Button>
                  </Box>
                  {columns ?
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
                      allowAction={true}
                      loading={loading}
                      renderedFrom="rentalManagementDetailsPageInventory"
                      refreshGrid={fetchProductInventory}
                    />
                    : <Box
                      p={2}
                      height={500}
                      bgcolor="white">
                      <CommonSkeleton lenArray={[...Array(10).keys()]} />
                    </Box>
                  }
                </>
              )}
              {(currentStep === 1) && (
                <AddRentalCost
                  rentalEndDate={rentalManagementData?.rentalEndDate}
                  rentalStartDate={rentalManagementData?.rentalStartDate}
                  productInventory={productInventory}
                  rentalId={id}
                  currencySymbol={currencySymbol}
                  fetchProductInventory={fetchProductInventory}
                />
              )}
              {(currentStep === 2) && (
                <Formik
                  initialValues={{ additionalCost: additionalCost || [{ "id": "", "type": "", "amount": 0 }] }}
                  enableReinitialize={true}
                  onSubmit={() => { }}>
                  {({ values }) => (
                    <>
                      <Form>
                        {setAdditionalCost(values.additionalCost)}
                        <Container className="p-0">
                          <Grid
                            container
                            direction="row"
                            justify="space-evenly"
                            alignItems="center"
                          >
                            <Grid item md={12}>
                              {values.additionalCost && values.additionalCost.length > 0 && (

                                <Box className={""}>
                                  <Grid
                                    container
                                    spacing={2}
                                    direction="row"
                                    justify="flex-start"
                                    alignItems="center"
                                  >
                                    <Grid item md={1}> # </Grid>
                                    <Grid item md={5}> Cost Type </Grid>
                                    <Grid item md={4}> Amount </Grid>
                                    <Grid item md={2}></Grid>

                                  </Grid>
                                </Box>
                              )}
                              <Box className="p-1">
                                <FieldArray
                                  name="additionalCost"
                                  render={arrayHelpers => (
                                    <div>
                                      {values.additionalCost && values.additionalCost.length > 0 ? (
                                        values.additionalCost.map((userVal, index) => (
                                          <Grid
                                            container
                                            spacing={2}
                                            direction="row"
                                            justify="flex-start"
                                            alignItems="center"
                                            key={index}
                                          >
                                            <Grid item md={1}>{index + 1}</Grid>
                                            <Grid item md={5}>

                                              <Autocomplete
                                                size="small"
                                                style={{ minWidth: 200 }}
                                                value={userVal.type}
                                                options={costTypeList}
                                                getOptionLabel={(option: any) => option ? option : ""}
                                                onChange={(_, newValue) => {
                                                  arrayHelpers.replace(index, {
                                                    ...values.additionalCost[index],
                                                    ["type"]: newValue,
                                                  });
                                                }}

                                                renderInput={(params) => <TextField
                                                  {...params}
                                                  variant="outlined"
                                                  name="nameField"
                                                  label="Cost Type"
                                                  required
                                                />}
                                              />
                                            </Grid>
                                            {
                                              <Grid item md={4}>
                                                <Field
                                                  fullWidth
                                                  InputProps={{
                                                    startAdornment: (
                                                      <InputAdornment position="start">
                                                        {currencySymbol ? currencySymbol : ""}
                                                      </InputAdornment>
                                                    ),
                                                  }}
                                                  startAdornment={currencySymbol ? <InputAdornment position="start">{currencySymbol}</InputAdornment> : ""}
                                                  variant="outlined"
                                                  type="text"
                                                  size="small"
                                                  component={TextField}
                                                  name="amount"
                                                  placeholder="Enter Amount"
                                                  value={userVal.amount}
                                                  onChange={(e) => {
                                                    arrayHelpers.replace(index, {
                                                      ...values.additionalCost[index],
                                                      ["amount"]: e.target.value.replace(/[^0-9]/g, '')
                                                    })
                                                  }}
                                                  required
                                                />
                                              </Grid>
                                            }
                                            <Grid item md={2}>
                                              <ButtonGroup size="small" aria-label="small outlined button group">
                                                <IconButton
                                                  size="small"
                                                  aria-label="add"
                                                  onClick={() => {
                                                    arrayHelpers.push({ "id": "", "type": "", "amount": 0 })
                                                  }
                                                  } >
                                                  <Add />
                                                </IconButton>
                                                <IconButton size="small" aria-label="delete" style={{ color: "#f44336" }} onClick={() => arrayHelpers.remove(index)} >
                                                  <Delete />
                                                </IconButton>
                                              </ButtonGroup>
                                            </Grid>
                                          </Grid>
                                        ))
                                      ) : (
                                        <Grid item md={12} className="d-flex  align-items-center justify-content-center">
                                          <Button
                                            variant="contained"
                                            color="primary"
                                            size="large"
                                            onClick={() => {
                                              arrayHelpers.push({ "id": "", "type": "", "amount": 0 })
                                            }}
                                          >
                                            Add Cost Type
                                          </Button>
                                        </Grid>
                                      )}
                                    </div>
                                  )}
                                />
                              </Box>
                            </Grid>
                          </Grid>
                        </Container>
                      </Form>

                      {/* <Grid container >
                      <Grid item xs={12} md={12} sm={12} className="d-flex justify-content-end">
                        <Button
                          variant="contained"
                          color="primary"
                          type="submit"
                          size="small"

                          onClick={() => {
                            handleSaveAdditionalCost(values.additionalCost)
                          }}
                        >
                          {"Save"}
                        </Button>
                      </Grid>
                    </Grid> */}
                    </>
                  )}
                </Formik>

              )}
              {(currentStep === 3) && (
                <DeliveryTicket
                  rentalManagementId={id}
                  warehouselist={warehouseList}
                  productInventory={productInventory}
                  currentStep={currentStep}
                  handleDeliveryTicketDialog={handleDeliveryTicketDialog}
                />
              )}
              {(currentStep === 4 || currentStep === 5) && (
                <ReceivingTicket
                  rentalManagementId={id}
                  warehouselist={warehouseList}
                  productInventory={productInventory}
                  currentStep={currentStep}
                  handleReceivingTicketDialog={handleReceivingTicketDialog}
                />
              )}
            </div>
          </div>
          <div className="position-relative">
            <HideWhenOffline>
              {showActivity ?
                <Paper>
                  {!isMobile && !isTablet && <a color="primary" className="activityHide" onClick={handleActivityHideShow}>
                    <IoIosArrowDropright className="icon" />
                  </a>}
                  <Grid container>
                    <Grid item xs={12}>
                      {rentalManagementData && (
                        <div>
                          <Activity
                            resourceId={rentalManagementData._id}
                            resource={routes.rentalManagement}
                            restrictedAddActivities={
                              permissions &&
                                permissions["rentalManagement"] &&
                                permissions["rentalManagement"].isUpdate
                                ? []
                                : ["Attachment", "Case"]
                            }
                            relatedTo={[
                              {
                                type: rentalManagement,
                                referenceId: rentalManagementData._id,
                                access: true,
                              },
                            ]}
                            handleActivityRefresh={() => { }}
                            emails={[]}
                          />
                        </div>
                      )}
                    </Grid>
                  </Grid>
                </Paper> :
                !isMobile && !isTablet && <a className="activityShow" onClick={handleActivityHideShow}>
                  <IoIosArrowDropleft className="icon" />
                </a>}
            </HideWhenOffline>
          </div>
        </div>

      </Fragment>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete this ${routes.rentalManagement.title.toLowerCase()} ?`
          }
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {addExistingProductDialog &&
        <AddExistingProductInventory
          addProductInventory={handleAddProductInventory}
          handleProductInventoryClose={() => { setAddExistingProductDialog(false) }}
        />
      }
      {
        openUpdateDialog && (
          <ManageRentalManagementDialog
            isClone={false}
            open={openUpdateDialog}
            rentalManagementId={id}
            rentalManagementData={rentalManagementData}
            onClose={() => setOpenUpdateDialog(false)}
            onSuccess={() => {
              setOpenUpdateDialog(false);
              fetchRentalManagementData();
            }}
          />)
      }
      {
        showDeliveryTicketDialog &&
        <ManageDeliveryTicket
          onClose={() => setShowDeliveryTicketDialog(false)}
          productInventoryForDeliveryTicket={productInventoryForDeliveryTicket}
          warehouseId={warehouseForDeliveryTicket}
          rentalData={rentalManagementData}
          onSuccess={() => {
            setShowDeliveryTicketDialog(false)
            fetchProductInventory()
          }}
        />
      }
      {
        showReceivingTicketDialog && <ManageReceivingTicket
          open={showReceivingTicketDialog}
          isClone={false}
          receivingTicketId={null}
          productInventoryForReceivingTicket={productInventoryForReceivingTicket}
          warehouseId={warehouseForReceivingTicket}
          rentalData={rentalManagementData}
          onClose={() => setShowReceivingTicketDialog(false)}
          onSuccess={() => {
            setShowReceivingTicketDialog(false)
            fetchProductInventory()
          }}
        />
      }
      {
        showManageProductInventoryDialog &&
        <ManageProductInventory
          isClone={null}
          productInventoryId={null}
          onClose={() => setShowManageProductInventoryDialog(false)}
          onSuccess={(data) => {
            setShowManageProductInventoryDialog(false);
            handleAddProductInventory([data])
          }}
        />
      }
    </>
  );
};

export default RentalManagementDetailsPage;
