import { useState, useEffect, useContext, Fragment, useReducer, useRef } from "react";
import { Grid, Box, Button, Paper } from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import { useParams, useHistory } from "react-router-dom";
import axiosInstance from "../../axios/axiosInstance";
import routes from "../../components/Helpers/Routes";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import DetailsPageHeader from "../../components/DetailsPageHeader";
import DetailsPage from "../../components/Shared/DetailsPage";
import { useData } from "../../StateProvider/Provider";
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import { gridLoadingTimeout, productInventory, rentalManagement } from "../../constants/helpers";
import Steps from "./Steps";
import AddExistingProductInventory from "./AddExistingProductInventory";
import CustomAgGrid, { intialState, reducer } from "../../components/AgGridComponents/CustomAgGrid";
import { CreatedByRenderer, UpdatedByRenderer } from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import { Link } from 'react-router-dom'
import InputAdornment from "@material-ui/core/InputAdornment/InputAdornment";
import TextField from "@material-ui/core/TextField/TextField";
import Autocomplete from "@material-ui/lab/Autocomplete/Autocomplete";
import { Field, FieldArray, Form, Formik, FormikProps } from "formik";
import Container from "@material-ui/core/Container/Container";
import IconButton from "@material-ui/core/IconButton/IconButton";
import ButtonGroup from "@material-ui/core/ButtonGroup/ButtonGroup";
import Add from "@material-ui/icons/Add";
import Delete from "@material-ui/icons/Delete";
import DeliveryTicket from "./DeliveryTicket";
import GridDeleteIcon from "../../components/Helpers/GridDeleteIcon";
import CreateRentalManagementDialog from "./ManageRental/CreateRentalManagementDialog";
import ManageDeliveryTicket from "../DeliveryTicket/ManageDeliveryTicket";

const RentalManagementDetailsPage = () => {
  const toastConfig = useContext(CustomToastContext);

  const { id } = useParams();
  const history = useHistory();
  const {
    state: { user, permissions }
  }: any = useData();
  const [headingLbl, setHeadingLbl] = useState("");
  const [loadingDetails, setLoadingDetails] = useState(false);
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

  useEffect(() => {
    if (id) {
      getRentalManagementFields();
      fetchRentalManagementData();
      fetchProductInventory();
    }
    // eslint-disable-next-line
  }, [id]);

  useEffect(() => {
    if (currentStep === 2) {
    }
    // eslint-disable-next-line
  }, [currentStep]);

  const handleMainPoints = (data) => {
    let mainPoint = {};
    // mainPoint['Account Name'] = data?.accountName?.optionLabel || '';
    setMainPoints(mainPoint);
  };

  const handleSaveAdditionalCost = (values) => {
    axiosInstance().post(`${rentalManagement.rentalManagementApi}/${id}/additional-cost`, { "additionalCost": values.map(d => { return { "type": d.type, "value": d.amount ? Number(d.amount) : 0 } }) })
      .then(({ data }) => {
        setAddExistingProductDialog(false)
        fetchProductInventory()
        toastConfig.setToastConfig({
          open: true,
          type: "success",
          message: data.message,
        });
      }).catch((error) => {
        toastConfig.setToastConfig(error)
      });
  }

  const fetchRentalManagementData = async () => {
    setLoadingDetails(true);
    try {
      const {
        data: { data },
      } = await axiosInstance().get(`${rentalManagement.rentalManagementApi}/${id}`);

      handleMainPoints(data);
      setHeadingLbl(data.rentalJobName);
      setCustomizedRoutes([routes.rentalManagement, { title: `${data.rentalJobName}` }]);
      setRentalManagementData(data);
      setAdditionalCost(data?.additionalCost?.map(d => { return { "id": d?._id, "type": d.type, "amount": d?.value } }))
      setLoadingDetails(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const getRentalManagementFields = () => {
    axiosInstance()
      .get("/field?resource=Rental Management")
      .then(({ data }) => {
        setRentalManagementFields(data.data);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const handleDelete = () => {

    axiosInstance().put(`${rentalManagement.rentalManagementApi}/remove`, { "ids": [] }).then(() => {
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
  const costTypeList = ["Repair", "Delivery", "Assembly"]
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

  const NameRenderer = (params) => (
    <Link className="link" title={params.value} to={`${routes.productInventoryDetail.path}/${params.data._id}`}>
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
    actionsRenderer: ActionsRenderer,
  };
  const columns = [
    { field: "productName", headerName: "Product Name", show: true, disabled: true, cellRenderer: "nameRenderer" },
    { field: "assetNumber", headerName: "Asset Number", show: true, cellRenderer: "CommonRenderer" },
    { field: "serialNumber", headerName: "Serial Number", show: true, cellRenderer: "CommonRenderer" },
  ];

  const fetchProductInventory = () => {
    dispatch({ type: "loading", loading: true });

    if (gridApi) {
      gridApi.setRowData([]);
    }

    axiosInstance().get(`${rentalManagement.rentalManagementApi}/${id}/inventory `).then(({ data }) => {
      data.data = data.data?.map((u) => ({
        ...u,
        id: u.inventory?._id,
        productName: u.product?.productName,
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

  const fetchDeliveryTicket = (values) => {
    axiosInstance()
      .get(`${rentalManagement.rentalManagementApi}/${id}/delivery-ticket `)
      .then(({ data }) => {
        let tempProductInventory = values
        data.data.map(obj => {
          tempProductInventory.map((d, index) => {
            if (obj.productInventory.some(p => d.id === p.optionValue)) {
              tempProductInventory[index]["deliveryTicket"] = obj.deliveryJobName
            }
          })

        })
        setProductInventory(tempProductInventory)
        if (tempProductInventory.length > 0 && tempProductInventory.every(d => d.deliveryTicket !== undefined)) {
          setCurrentStep(3)
        }
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleAddProductInventory = (productInventoryArray) => {
    axiosInstance().post(`${rentalManagement.rentalManagementApi}/${id}/inventory`, { "products": productInventoryArray.map(d => d._id) })
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
        <Grid container spacing={1} className="detail-container">
          <Grid item xs={12} sm={12} md={12} lg={12} spacing={2}>
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
                  {permissions?.rentalManagement?.isUpdate && (
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={handleOpenUpdateDialog}
                    >
                      Edit
                    </Button>
                  )}

                </DetailsPageHeader>
              )}


              <Box>
                {loadingDetails || !rentalManagementFields.length ? (
                  <Grid container spacing={2} style={{ padding: "8px" }}>
                    <CommonSkeleton lenArray={[...Array(7).keys()]} />
                  </Grid>
                ) : (
                  <>
                    <DetailsPage data={rentalManagementData} fields={rentalManagementFields} />
                  </>
                )}
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={12} md={12} lg={12}>
            <Steps steps={["New", "Additional Cost", "Loading Ticket"]} currentStep={currentStep} setCurrentStep={setCurrentStep} />
            {(currentStep === 0) && (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  onClick={() => { setAddExistingProductDialog(true) }}
                >
                  Add Existing
                </Button>
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
                  />
                  : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>
                }
              </>
            )}
            {(currentStep === 1) && (
              <Formik
                initialValues={{ additionalCost: additionalCost }}
                enableReinitialize={true}
                onSubmit={() => { }}>
                {({ values }) => (
                  <>
                    <Form>
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
                                              id="combo-box-demo"
                                              size="small"
                                              style={{ minWidth: 200 }}
                                              value={userVal.type}
                                              options={costTypeList}
                                              getOptionLabel={(option: any) => option ? option : ""}
                                              onChange={(event, newValue) => {
                                                arrayHelpers.replace(index, {
                                                  ...values.additionalCost[index],
                                                  ["type"]: newValue,
                                                });
                                              }}

                                              renderInput={(params) => <TextField
                                                {...params}
                                                variant="outlined"
                                                name="nameField"
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
                                                      {/* {currencySymbol ? currencySymbol : ""} */}
                                                    </InputAdornment>
                                                  ),
                                                }}
                                                // startAdornment={currencySymbol ? <InputAdornment position="start">{currencySymbol}</InputAdornment> : ""}
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

                    <Grid container >
                      <Grid item xs={12} md={12} sm={12} className="d-flex justify-content-end">
                        {/* <div>
                          {`Total Cost :  `}
                        </div> */}
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
                    </Grid>
                  </>
                )}
              </Formik>

            )}
            {(currentStep === 2 || currentStep === 3) && (
              <DeliveryTicket warehouselist={warehouseList} productInventory={productInventory} currentStep={currentStep} handleDeliveryTicketDialog={handleDeliveryTicketDialog} />
            )}
          </Grid>
        </Grid>

      </Fragment>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete this product inventory ?`
          }
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {addExistingProductDialog && <AddExistingProductInventory addProductInventory={handleAddProductInventory} handleProductInventoryClose={() => { setAddExistingProductDialog(false) }} />}
      {openUpdateDialog && (
        <CreateRentalManagementDialog
          open={openUpdateDialog}
          rentalManagementId={id}
          onClose={() => setOpenUpdateDialog(false)}
          onSuccess={() => {
            setOpenUpdateDialog(false);
            fetchRentalManagementData();
          }}
        />
      )}
      {showDeliveryTicketDialog &&
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
    </>
  );
};

export default RentalManagementDetailsPage;

