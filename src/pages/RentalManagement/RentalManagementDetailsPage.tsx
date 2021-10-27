import { useState, useEffect, useContext, Fragment, useReducer } from "react";
import { Grid, Box, Button, Paper, CircularProgress } from "@material-ui/core";
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
import { getUniqueCurrencies, gridLoadingTimeout, rentalManagement, defaultActivityShow } from "../../constants/helpers";
import Steps from "./Steps";
import AddExistingProductInventory from "./AddExistingProductInventory";
import { intialState, reducer } from "../../components/AgGridComponents/CustomAgGrid";
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
import Activity from "../../components/Activity";
import styles from "./Retal.module.scss";
import ReceivingTicket from "./ReceivingTicket";
import ManageReceivingTicket from "../ReceivingTicket/ManageReceivingTicket";
import { CustomOfflineContext } from "../../StateProvider/OfflineContext/OfflineContext";
import HideWhenOffline from "../../components/HideWhenOffline";
import DeleteButton from "../../components/Helpers/DeleteButton";
import { CommonRenderer, DateRenderer } from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import NoDataCell from "../../components/Helpers/NoDataCell";
import CustomAgGridEditable from "../../components/AgGridComponents/CustomAgGridEditable";
import { GiMineExplosion } from 'react-icons/gi'
import HtmlTooltip from '../../components/CustomTooltipTitle'
import BulkEditInventoryDialog from './BulkEditInventoryDialog'
import SerializedAssetStep from "./SerializedAssetStep";

const rentalProcessSteps = ["New", "Additional Cost", "Serialized Asset", "Loading Ticket", "Receiving Ticket", "Ready To Ship"]

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
  const [isUpdating, setUpdating] = useState(false);
  const [isBulkEdit, setBulkEdit] = useState(false);
  const [rentalManagementData, setRentalManagementData] = useState(null);
  const [deleteData, setDeleteData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [isDeleting, setDeleting] = useState(false);
  const [isAddingProducts, setAddingProducts] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [addExistingProductDialog, setAddExistingProductDialog] = useState(false);
  const [inventoryType, setInventoryType] = useState(null);
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
  const [currencySymbol, setCurrencySymbol] = useState(null);
  const [showActivity, setActivityShow] = useState(defaultActivityShow);
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
    if (currentStep === 2 && additionalCost.length > 0) {
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
    axiosInstance().post(`${rentalManagement.rentalManagementApi}/${id}/additional-cost`, { "additionalCost": values.map(d => { return { "type": d.type, "value": d.amount ? Number(d.amount) : 0, "description": d?.description, "uom": d.uom, "qty": d.qty ? Number(d.qty) : 0 } }) })
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
      setAdditionalCost(data?.additionalCost?.map(d => { return { "id": d?._id, "type": d.type, "amount": d?.value, "description": d?.description, "uom": d.uom, "qty": d.qty, } }))
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
    // setWarehouseForDeliveryTicket(warehouse)
    setShowDeliveryTicketDialog(true)
  }

  const handleReceivingTicketDialog = (selectedProductInventory) => {
    setProductInventoryForReceivingTicket(selectedProductInventory)
    // setWarehouseForReceivingTicket(warehouse)
    setShowReceivingTicketDialog(true)
  }

  const costTypeList = ["Repair", "Delivery", "Assembly"]
  const uomTypeList = ["Pcs"]
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;


  const fetchProductInventory = () => {
    let tempInventory = []
    dispatch({ type: "loading", loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }

    axiosInstance().get(`${rentalManagement.rentalManagementApi}/${id}/products-packages`).then(({ data }) => {
      data.data?.products.map((u: any) => (tempInventory.push({
        ...u,
        id: u._id,
        detail: u.productName,
        productCategory: u.productCategory?.optionLabel,
        package: u.hasOwnProperty("package") ? u.package.packageName : "",
        packageId: u.hasOwnProperty("package") ? u.package._id : ""
      })));
      data.data?.packages.map((u) => (tempInventory.push({
        ...u,
        id: u._id,
        detail: u.packageName,
        description: u.packageDescription,

      })));
      setProductInventory(tempInventory)

      // let tempWareHouse = []
      // data.data.map(d => {
      //   if (!tempWareHouse.some(t => t.optionValue === d.inventory.warehouse.optionValue)) {
      //     tempWareHouse.push(d.inventory.warehouse)
      //   }
      // })
      // if (data.data > 0 && data.data.every(d => d.inventory?.warehouse?.optionLabel !== null && d.inventory?.warehouse?.optionLabel !== undefined)) {
      //   setCurrentStep(4)
      //   axiosInstance().put(`${rentalManagement.rentalManagementApi}/${id}/status `, { "status": "Ready To Ship" }).then(({ data }) => {
      //   }).catch((error) => {
      //     toastConfig.setToastConfig(error);
      //   });
      // }
      // setWarehouseList(tempWareHouse)
      dispatch({ type: "initialize", data: tempInventory, count: tempInventory.length });
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
    <Link className="link" title={params.value} to={params.data.type === "Product" ? `${routes.productDetail.path}/${params.data.id}` : `${routes.packagesDetail.path}/${params.data.id}`}>
      {params.value}
    </Link>
  );

  const PackageNameRenderer = (params) => (
    params.value ? <Link className="link" title={params.value} to={`${routes.packagesDetail.path}/${params.data.packageId}`}>
      {params.value}
    </Link> : <NoDataCell />
  );

  const ActionsRenderer = (params) => (
    <>
      <GridDeleteIcon
        hasDeletePermission={permissions?.rentalManagement?.isDelete}
        ownerId={user?.user?._id}
        userId={user?.user?._id}
        onDelete={() => {
          deleteInventories([{
            id: params.data.id,
            type: params.data?.type.toLowerCase()
          }])
        }
        }
        entity="rentalManagement"
      />
      {params.data.type === "Package" &&
        <HtmlTooltip title="Explode package">
          <IconButton
            onClick={() => explodePackage(params.data.id)}
            size="small"
            color='primary'
          >
            <GiMineExplosion />
          </IconButton>
        </HtmlTooltip>
      }
    </>
  );

  const frameworkComponents = {
    nameRenderer: NameRenderer,
    productRenderer: ProductRenderer,
    packageNameRenderer: PackageNameRenderer,
    commonRenderer: CommonRenderer,
    actionsRenderer: ActionsRenderer,
    dateRenderer: DateRenderer,
  };
  const columns = [
    { field: "detail", headerName: "Detail", show: true, disabled: true, cellRenderer: "productRenderer" },
    { field: "type", headerName: "Type", show: true, disabled: true, cellRenderer: "commonRenderer" },
    { field: "package", headerName: "Package", show: true, disabled: true, cellRenderer: "packageNameRenderer" },
    { field: "startDate", headerName: "Start Date", show: true, disabled: true, cellRenderer: "dateRenderer", cellEditor: "dateEditor", editable: true },
    { field: "endDate", headerName: "End Date", show: true, disabled: true, cellRenderer: "dateRenderer", cellEditor: "dateEditor", editable: true },
    { field: "qty", headerName: "Quantity", show: true, disabled: true, cellRenderer: "commonRenderer", cellEditor: "numericCellEditor", editable: true },
    { field: "UOM", headerName: "UOM", show: true, disabled: true, cellRenderer: "commonRenderer", cellEditor: "agSelectCellEditor", cellEditorParams: { cellRenderer: "commonRenderer", values: ["Pcs"] }, editable: true },
    { field: "pricingMethod", headerName: "Pricing Method", show: true, disabled: true, cellRenderer: "commonRenderer", cellEditor: "agSelectCellEditor", cellEditorParams: { cellRenderer: "commonRenderer", values: ["Per Day", "Per Week", "Per Month"] }, editable: true },
    { field: "price", headerName: "Price", show: true, disabled: true, cellRenderer: "commonRenderer", cellEditor: "numericCellEditor", editable: true },
    { field: "discount", headerName: "Discount (%)", show: true, disabled: true, cellRenderer: "commonRenderer", cellEditor: "numericCellEditor", editable: true },
    { field: "finalPrice", headerName: "Final Price", show: true, disabled: true, cellRenderer: "commonRenderer", cellEditor: "numericCellEditor", editable: true },
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



  const handleAddProductInventory = (productInventoryArray) => {
    // let tempProductArray = productInventoryArray.map(d => { return { "inventory": d._id, "costing": { "costPerDay": 0, "totalCost": 0, "startDate": rentalManagementData.rentalStartDate, "dueDate": rentalManagementData.rentalEndDate } } })
    setAddingProducts(true)
    let tempProductArray = productInventoryArray.map(d => ({
      "id": d.id,
      "qty": parseInt(d.quantity || d.qty) || 0,
      "type": d.type.toLowerCase(),
      "detail": d.detail || "",
      "pricingMethod": d.pricingMethod || "",
      "UOM": d.UOM || "",
      "finalPrice": parseInt(d.finalPrice) || 0,
      "price": parseInt(d.mrp) || parseInt(d.price) || 0,
      "discount": parseInt(d.discount) || 0,
      "startDate": rentalManagementData ? rentalManagementData?.rentalStartDate : new Date(),
      "endDate": rentalManagementData ? rentalManagementData?.rentalEndDate : new Date(),
    }))
    axiosInstance().post(`${rentalManagement.rentalManagementApi}/${id}/products-packages`, { "productsPackages": tempProductArray })
      .then(() => {
        setAddExistingProductDialog(false)
        fetchProductInventory()
        setAddingProducts(false)
      }).catch((error) => {
        setAddExistingProductDialog(false)
        toastConfig.setToastConfig(error)
        setAddingProducts(false)
      });
  }


  const deleteInventories = (data) => {
    setDeleteData(data)
  }

  const handleRemoveProductInventory = (productInventoryId) => {
    setDeleting(true)
    axiosInstance().put(`${rentalManagement.rentalManagementApi}/${id}/products-packages/remove`, {
      ids: productInventoryId
    })
      .then(() => {
        setDeleting(false)
        fetchProductInventory()
        setDeleteData(null)
      }).catch((error) => {
        setDeleting(false)
        toastConfig.setToastConfig(error)
        setDeleteData(null)
      });
  }

  const explodePackage = (packageId) => {
    axiosInstance().get(`${rentalManagement.rentalManagementApi}/${id}/products-packages/explode/${packageId}`)
      .then(() => {
        fetchProductInventory()
      }).catch((error) => {
        toastConfig.setToastConfig(error)
      });
  }

  const updateProductData = (data) => {

    let updatedArr = dataRows.map(d => {
      if (d.id === data.id) {
        if (data.endData || data.startDate) {
          data["endDate"] = new Date(data.endDate)
          data["startDate"] = new Date(data.startDate)
        }
        return data
      } else {
        return d
      }
    }).map(d => ({
      "id": d.id,
      "qty": parseInt(d.quantity || d.qty) || 0,
      "type": d.type.toLowerCase(),
      "detail": d.detail,
      "pricingMethod": d.pricingMethod,
      "UOM": d.UOM,
      "finalPrice": parseInt(d.finalPrice) || 0,
      "price": parseInt(d.price) || 0,
      "discount": parseInt(d.discount) || 0,
      "startDate": d.startDate,
      "endDate": d.endDate,
    }))


    axiosInstance().put(`${rentalManagement.rentalManagementApi}/${id}/products-packages`, { "productsPackages": updatedArr })
      .then(() => {
        fetchProductInventory()
      }).catch((error) => {
        toastConfig.setToastConfig(error)
      });
  }

  const bulkEditData = (values: any) => {
    let updatedArr = dataRows.map(d => ({
      "id": d.id,
      "type": d.type.toLowerCase(),
      "detail": d.detail,
      "pricingMethod": values.pricingMethod ? values.pricingMethod : d.pricingMethod,
      "UOM": values.UOM ? values.UOM : d.UOM,
      "finalPrice": values.finalPrice ? values.finalPrice : d.finalPrice,
      "discount": values.discount ? values.discount : d.discount,
      "startDate": values.startDate ? values.startDate : d.startDate,
      "endDate": values.endDate ? values.endDate : d.endDate,
      "qty": values.qty ? values.qty : d.qty,
      "price": values.price ? values.price : d.price
    })
    )

    setUpdating(true)
    axiosInstance().put(`${rentalManagement.rentalManagementApi}/${id}/products-packages`, { "productsPackages": updatedArr })
      .then(() => {
        setUpdating(false)
        setBulkEdit(false)
        fetchProductInventory()
      }).catch((error) => {
        setUpdating(false)
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
            <Box my={1} />
            <Paper>
              <Steps
                className={styles.steps_box}
                isNextStep={!Boolean(productInventory.length)}
                steps={rentalProcessSteps.slice(0, 5)}
                currentStep={currentStep}
                setCurrentStep={setCurrentStep}
              />
              {(currentStep === 0) && (
                <>
                  <Box display="flex" justifyContent="space-between" m={1}>
                    <Box display="flex">
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => {
                          setAddExistingProductDialog(true);
                          setInventoryType("product")
                        }}
                      >
                        {`Add ${routes.product.title}`}
                      </Button>
                      <Box mx={1} />
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => {
                          setAddExistingProductDialog(true);
                          setInventoryType("package")
                        }}
                      >
                        {`Add ${routes.packages.title}`}
                      </Button>
                    </Box>
                    <Box display="flex">
                      <HtmlTooltip title={Boolean(selectedRecords.length) ? "Buld edit selected records" : "Select records to edit"}>
                        <span>
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            disabled={!Boolean(selectedRecords.length)}
                            onClick={() => setBulkEdit(true)}
                          >
                            Bulk Edit
                          </Button>
                        </span>
                      </HtmlTooltip>
                      <Box mx={1} />
                      <HtmlTooltip title={Boolean(selectedRecords.length) ? "Delete selected records" : "Select records to delete"}>
                        <span>

                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            disabled={!Boolean(selectedRecords.length) || isDeleting}
                            onClick={() => {
                              const dataToDelete = selectedRecords.map(rec => ({
                                id: rec._id ?? rec.id,
                                type: rec.type.toLowerCase()
                              }))
                              setDeleteData(dataToDelete)
                            }}

                            endIcon={isDeleting && <CircularProgress size={20} color="primary" />}
                          >
                            Delete
                          </Button>
                        </span>
                      </HtmlTooltip>
                    </Box>
                  </Box>
                  {columns ?
                    <CustomAgGridEditable
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
                      allowAction={true}
                      loading={loading}
                      onCellValueChanged={(row) => { updateProductData(row.data) }}
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
                <Formik
                  initialValues={{ additionalCost: additionalCost || [{ "id": "", "description": "", "uom": "", "qty": 0, "type": "", "amount": 0 }] }}
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
                                    <Grid item md={2}> Cost Type </Grid>
                                    <Grid item md={2}> Description </Grid>
                                    <Grid item md={2}> Quantity </Grid>
                                    <Grid item md={2}> Unit of Measure </Grid>
                                    <Grid item md={2}> Amount </Grid>
                                    <Grid item md={1}></Grid>

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
                                            <Grid item md={2}>
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
                                                />}
                                              />
                                            </Grid>
                                            <Grid item md={2}>
                                              <Field
                                                fullWidth
                                                variant="outlined"
                                                type="text"
                                                size="small"
                                                component={TextField}
                                                name="description"
                                                placeholder="Description"
                                                value={userVal.description}
                                                onChange={(e) => {
                                                  arrayHelpers.replace(index, {
                                                    ...values.additionalCost[index],
                                                    ["description"]: e.target.value
                                                  })
                                                }}
                                              />
                                            </Grid>
                                            <Grid item md={2}>
                                              <Field
                                                fullWidth
                                                variant="outlined"
                                                type="text"
                                                size="small"
                                                component={TextField}
                                                name="Quantity"
                                                placeholder="Quantity"
                                                value={userVal.qty}
                                                onChange={(e) => {
                                                  arrayHelpers.replace(index, {
                                                    ...values.additionalCost[index],
                                                    ["qty"]: e.target.value.replace(/[^0-9]/g, '')
                                                  })
                                                }}
                                              />
                                            </Grid>
                                            <Grid item md={2}>
                                              <Autocomplete
                                                size="small"
                                                style={{ minWidth: 200 }}
                                                value={userVal.uom}
                                                freeSolo
                                                autoSelect
                                                options={uomTypeList}
                                                getOptionLabel={(option: any) => option ? option : ""}
                                                onChange={(_, newValue) => {
                                                  arrayHelpers.replace(index, {
                                                    ...values.additionalCost[index],
                                                    ["uom"]: newValue,
                                                  });
                                                }}

                                                renderInput={(params) => <TextField
                                                  {...params}
                                                  variant="outlined"
                                                  name="nameField"
                                                  label="UOM"
                                                />}
                                              />
                                            </Grid>
                                            {
                                              <Grid item md={2}>
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
                                                />
                                              </Grid>
                                            }
                                            <Grid item md={1}>
                                              <ButtonGroup size="small" aria-label="small outlined button group">
                                                <IconButton
                                                  size="small"
                                                  aria-label="add"
                                                  onClick={() => {
                                                    arrayHelpers.push({
                                                      "id": "", "description": "", "uom": "", "qty": "", "type": "", "amount": 0
                                                    })
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
                                              arrayHelpers.push({ "id": "", "description": "", "uom": "", "qty": "", "type": "", "amount": 0 })
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
                    </>
                  )}
                </Formik>

              )}
              {(currentStep === 2) && (
                <SerializedAssetStep
                  rentalManagementId={id}
                  productInventory={productInventory}
                  currentStep={currentStep}
                />
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
                  productInventory={productInventory}
                  currentStep={currentStep}
                  handleReceivingTicketDialog={handleReceivingTicketDialog}
                />
              )}
            </Paper>
          </div>
          <div className="position-relative">
            <HideWhenOffline>
              {showActivity ?
                <Paper>
                  {!isMobile && !isTablet && <span className="activityHide cursor-pointer" onClick={handleActivityHideShow}>
                    <IoIosArrowDropright className="icon" />
                  </span>}
                  <Grid container>
                    <Grid item xs={12}>
                      {rentalManagementData && (
                        <div>
                          <Activity
                            resourceId={rentalManagementData._id}
                            resource={rentalManagement.resource}
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
                !isMobile && !isTablet && <span className="activityShow cursor-pointer" onClick={handleActivityHideShow}>
                  <IoIosArrowDropleft className="icon" />
                </span>}
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
          isAddingProducts={isAddingProducts}
          addProductInventory={handleAddProductInventory}
          handleProductInventoryClose={() => { setAddExistingProductDialog(false) }}
          productInventory={productInventory}
          type={inventoryType}
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
          rentalData={rentalManagementData}
          onClose={() => setShowReceivingTicketDialog(false)}
          onSuccess={() => {
            setShowReceivingTicketDialog(false)
            fetchProductInventory()
          }}
          isRedirectToDetailPage={false}
        />
      }
      {deleteData && <ConfirmationDialog
        open={true}
        message={`Are you sure you want to delete the record(s)?`}
        onClose={() => setDeleteData(null)}
        onOk={() => handleRemoveProductInventory(deleteData)}
        okBtnLoading={isDeleting}
      />}
      {isBulkEdit &&
        <BulkEditInventoryDialog
          isSaving={isUpdating}
          onClose={() => setBulkEdit(false)}
          submitBulkEdit={bulkEditData}
          currencySymbol={currencySymbol}
        />}
    </>
  );
};

export default RentalManagementDetailsPage;