import { useState, useEffect, useContext, Fragment, useReducer } from "react";
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
import { Field, FieldArray, Form, Formik } from "formik";
import Container from "@material-ui/core/Container/Container";
import IconButton from "@material-ui/core/IconButton/IconButton";
import ButtonGroup from "@material-ui/core/ButtonGroup/ButtonGroup";
import Add from "@material-ui/icons/Add";
import Delete from "@material-ui/icons/Delete";

const RentalManagementDetailsPage = () => {
  const toastConfig = useContext(CustomToastContext);

  const { id } = useParams();
  const history = useHistory();
  const {
    state: { permissions }
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
  const [currentStep, setCurrentStep] = useState(0);
  const [users, setUsers] = useState<any[]>([]);
  const [userList, setUserList] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      getRentalManagementFields();
      fetchRentalManagementData();
      fetchProductInventory();
      fetchUsers();
    }
    // eslint-disable-next-line
  }, [id]);

  const handleMainPoints = (data) => {
    let mainPoint = {};
    // mainPoint['Account Name'] = data?.accountName?.optionLabel || '';
    setMainPoints(mainPoint);
  };

  const fetchRentalManagementData = async () => {
    setLoadingDetails(true);
    try {
      const {
        data: { data },
      } = await axiosInstance().get(`${rentalManagement.rentalManagementApi}/${id}`);

      handleMainPoints(data);
      setHeadingLbl(data._id);
      setCustomizedRoutes([routes.rentalManagement, { title: `${data._id}` }]);
      setRentalManagementData(data);
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
  const costTypeList = ["Repair", "Delivery", "Assembly"]
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

  const NameRenderer = (params) => (
    <Link className="link" title={params.value} to={`${routes.productInventoryDetail.path}/${params.data._id}`}>
      {params.value}
    </Link>
  );
  const frameworkComponents = {
    createdByRenderer: CreatedByRenderer,
    updatedByRenderer: UpdatedByRenderer,
    nameRenderer: NameRenderer,
  };
  const columns = [
    { field: "productName", headerName: "Product Name", show: true, disabled: true, cellRenderer: "nameRenderer" },
    { field: "assetNumber", headerName: "Asset Number", show: true, cellRenderer: "CommonRenderer" },
    { field: "serialNumber", headerName: "Serial Number", show: true, cellRenderer: "CommonRenderer" },
    { field: "createdBy", headerName: "Created By", show: true, cellRenderer: "createdByRenderer" },
    { field: "updatedBy", headerName: "Updated By", show: true, cellRenderer: "updatedByRenderer" },
  ];

  const fetchProductInventory = () => {
    dispatch({ type: "loading", loading: true });

    if (gridApi) {
      gridApi.setRowData([]);
    }

    axiosInstance().get(`${rentalManagement.rentalManagementApi}/${id}/inventory `).then(({ data }) => {
      data.data = data.data?.map((u) => ({
        ...u,
        id: u._id,
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

  const handleAddProductInventory = (productInventoryArray) => {
    axiosInstance().post(`${rentalManagement.rentalManagementApi}/${id}/inventory`, { "products": productInventoryArray.map(d => d._id) })
      .then(({ data }) => {
        setAddExistingProductDialog(false)
      }).catch((error) => {
        setAddExistingProductDialog(false)
        toastConfig.setToastConfig(error)
      });
  }

  const fetchUsers = () => {
    axiosInstance()
      .get("/user")
      .then(({ data: { data, count } }) => {
        getRows(data);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  }

  const getRows = (data: []) => {
    const rows = data.length
      ? data.map((user: any) => ({
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
      }))
      : [];

    setUserList(rows);
  };

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
            <Steps steps={["New", "Additional Cost", "Delivery Ticket"]} currentStep={currentStep} setCurrentStep={setCurrentStep} />
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
                initialValues={{ users: users }}
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
                            {values.users && values.users.length > 0 && (

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
                                name="users"
                                render={arrayHelpers => (
                                  <div>
                                    {values.users && values.users.length > 0 ? (
                                      values.users.map((userVal, index) => (
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
                                              value={costTypeList.find(v => v === userVal)}
                                              options={costTypeList.filter(element => !values.users.includes(element)) }
                                              getOptionLabel={(option: any) => option?  option : ""}
                                              onChange={(event, newValue) => {
                                                arrayHelpers.replace(index, {
                                                  ...values.users[index],
                                                  ["name"]: newValue,
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
                                                    ...values.users[index],
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
                    <div>
                      {`Total Cost :  `}
                    </div>
                  </>
                )}
              </Formik>

            )}
            {(currentStep === 2) && (
              
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
    </>
  );
};

export default RentalManagementDetailsPage;

