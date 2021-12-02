import React, { useState, useEffect, useContext, Fragment, useReducer, useMemo } from "react";
import { Grid, Box, Button, Paper, CircularProgress, useMediaQuery, Typography, Tab, Tabs } from "@material-ui/core";
import { Skeleton, Alert } from "@material-ui/lab";
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
import {
  getUniqueCurrencies, gridLoadingTimeout, rentalManagement, defaultActivityShow,
  dateFormat, pricingCondition, generateUniqueId, treeToFlatArray, formatAmountWithCurrency
} from "../../constants/helpers";
import Steps from "./Steps";
import CustomAgGrid, { intialState, reducer } from "../../components/AgGridComponents/CustomAgGrid";
import IconButton from "@material-ui/core/IconButton/IconButton";
import Add from "@material-ui/icons/Add";
import { IoIosArrowDropright, IoIosArrowDropleft } from 'react-icons/io';
import { MdEdit, MdDelete } from 'react-icons/md';
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
import { CommonRenderer } from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import HtmlTooltip from '../../components/CustomTooltipTitle'

import SerializedAssetStep from "./SerializedAssetStep";
import moment from "moment";
import { camelCase, startCase, orderBy, sum } from "lodash";
import queryString from "query-string";
import { FaWpforms } from "react-icons/fa";
import { BiFoodMenu } from "react-icons/bi";
import TabPanel from "../../components/TabPanel";
import { AddOutlined } from '@material-ui/icons';
import NoDataCell from "../../components/Helpers/NoDataCell";

import Productpackage from "./Productpackage";
import AdditionalCost from "./AdditionalCost";

const rentalProcessSteps = ["New", "Additional Cost", "Serialized Asset", "Loading Ticket", "Receiving Ticket", "Ready To Ship"]

const RentalManagementDetailsPage = () => {
  const toastConfig = useContext(CustomToastContext);
  const { isOffline, offlineFieldsData, offlineGridData, updateOfflineGridData } = useContext(CustomOfflineContext);

  const { id } = useParams();
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const { openEdit } = parsed;

  const {
    state: { user, permissions }
  }: any = useData();
  const isSmallScreen = useMediaQuery('(max-width:1300px)');
  const isTabletScreen = useMediaQuery('(max-width:960px)');
  const [headingLbl, setHeadingLbl] = useState("");
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [isUpdating, setUpdating] = useState(false);
  const [isProductEdit, setIsProductEdit] = useState({ open: false, editType: null });
  const [recordToUpdate, setRecordToUpdate] = useState(null)
  const [rentalManagementData, setRentalManagementData] = useState(null);
  const [deleteData, setDeleteData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [isDeleting, setDeleting] = useState(false);
  const [isAddingProducts, setAddingProducts] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [addExistingProductDialog, setAddExistingProductDialog] = useState({ open: false, type: "" });
  const [rentalManagementFields, setRentalManagementFields] = useState([]);
  const [mainPoints, setMainPoints] = useState(null);
  const [customizedRoutes, setCustomizedRoutes] = useState([]);
  const [warehouseList, setWarehouseList] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [additionalCost, setAdditionalCost] = useState<any[]>([]);
  const [productInventory, setProductInventory] = useState<any[]>([]);
  const [serializeAssets, setSerializeAssets] = useState<any[]>([]);
  const [productInventoryForDeliveryTicket, setProductInventoryForDeliveryTicket] = useState<any[]>([]);
  const [warehouseForDeliveryTicket, setWarehouseForDeliveryTicket] = useState(null);
  const [showDeliveryTicketDialog, setShowDeliveryTicketDialog] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState(null);
  const [currency, setCurrency] = useState("USD");
  const [showActivity, setActivityShow] = useState(defaultActivityShow);
  const [allowedToEdit, setAllowedToEdit] = useState(false)
  const [productInventoryForReceivingTicket, setProductInventoryForReceivingTicket] = useState<any[]>([]);
  const [showReceivingTicketDialog, setShowReceivingTicketDialog] = useState(false);
  const [isInOfflineSaveQueue, setIsInOfflineSaveQueue] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState([])
  const [packageForProducts, setPackageForProducts] = useState(null)
  const [nextStep, setNextStep] = useState(true)
  const [tabValue, setTabValue] = useState(0);
  const [showManageAdditionalCostDialog, setShowManageAdditionalCostDialog] = useState({
    open: false,
    isNew: false,
    record: null,
  })

  const [dataForNewTabData, setDataForNewTabData] = useState([]);

 

  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

  const [pinnedBottomRowData, setPinnedBottomRowData] = useState([]);

  const handleActivityHideShow = () => {
    setActivityShow(!showActivity)
  }

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
  };


  function a11yProps(index: any) {
    return {
      id: `main-tab-${index}`,
      'aria-controls': `main-tabpanel-${index}`
    };
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
    if (currentStep >= 0 && currentStep <= 4) {
      axiosInstance().put(`${rentalManagement.rentalManagementApi}/${id}/process-status`, { "processStatus": rentalProcessSteps[currentStep] }).then(({ data }) => {
      }).catch((error) => {
        toastConfig.setToastConfig(error);
      });
    }
  }, [currentStep]);

  useEffect(() => {
    if (isSmallScreen) {
      setActivityShow(true)
    }
  }, [isSmallScreen])

  const handleMainPoints = (data) => {
    let mainPoint = {};
    setMainPoints(mainPoint);
  };

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
      setAdditionalCost(data?.additionalCost?.map((d, index) => { return { "id": d?._id, rowIndex: index + 1, "type": d.type, "amount": d?.value, "description": d?.description, "uom": d.uom, "qty": d.qty } }) ?? [])
      setCurrentStep(rentalProcessSteps.indexOf(data?.processStatus) !== -1 ? rentalProcessSteps.indexOf(data?.processStatus) : 0)
      setLoadingDetails(false);
      setCurrencySymbol(
        getUniqueCurrencies().find(
          (d) => d.currencyCode === data["currency"]
        )?.symbolNative
      );
      setCurrency(data?.currency);

      const isAllowedToEdit = [...(data.collaborator ?? []), data.owner].some((d) => d?.optionValue === user?.user?._id);

      setAllowedToEdit(isAllowedToEdit);

      if (isAllowedToEdit && openEdit === "true") {
        setOpenUpdateDialog(true)
        const params = new URLSearchParams()
        params.delete("openEdit")
        history.push({ search: params.toString() })
      }

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

  //  This is copied method from helpers.ts as wee need some modification for this screen only
  const translateDataToTreeForProducts = (data, parentProperty, childProperty, childrenPropertyToStore) => {
    let parents = data.filter(value => value[parentProperty] == 'undefined' || value[parentProperty] == null)
    let childrens = data.filter(value => value[parentProperty] !== 'undefined' && value[parentProperty] != null)

    parents.forEach((current) => {
      if (current.type === "Product" || current.type === "Package") {
        current["qtyToDisplay"] = current?.qty ?? 0;
        current["isValid"] = (!isNaN(current?.finalPrice) && current?.finalPrice !== 0)
      }
    })

    let translator = (parents, childrens) => {
      parents.forEach((parent) => {
        childrens.forEach((current, index) => {
          if (current.parent === parent[childProperty]) {
            let temp = JSON.parse(JSON.stringify(childrens))
            temp.splice(index, 1)
            translator([current], temp)

            //  Check validation for products in package - Start
            current["qtyToDisplay"] = `${parent.qty} x ${current.qty} = ${current.qty * parent.qty}`

            if (current?.finalPrice !== null && current?.finalPrice !== undefined && typeof current?.finalPrice !== "string" && current?.finalPrice !== 0) {
              current["isValid"] = true;
            } else {
              current["isValid"] = parent["isValid"];
            }
            //  Check validation for products in package - End

            if (typeof parent[childrenPropertyToStore] !== 'undefined') {
              parent[childrenPropertyToStore].push(current)
            } else {
              parent[childrenPropertyToStore] = [current]
            }
          }
        })
      })
    }
    translator(parents, childrens)

    return parents
  }

  const fetchProductInventory = () => {

    let tempInventory = []
    // dispatch({ type: "loading", loading: true });
    // if (gridApi) {
    //   gridApi.setRowData([]);
    // }

    axiosInstance().get(`${rentalManagement.rentalManagementApi}/${id}/products-packages`).then(({ data }) => {
      data.data?.products.map((u: any, index) => (tempInventory.push({
        ...u,
        id: u._id,
        productCategory: u.productCategory?.optionLabel,
        isValid: true,
        qtyToDisplay: u.qty
        // package: u.hasOwnProperty("package") ? u.package.packageName : "",
        // packageId: u.hasOwnProperty("package") ? u.package._id : ""
      })));
      data.data?.packages.map((u) => (tempInventory.push({
        ...u,
        id: u._id,
        description: u.packageDescription,
      })));
      setProductInventory(tempInventory)
      setSerializeAssets(data.data?.inventory || [])
      tempInventory = restructureRowData(tempInventory)

      let zeroPrice = tempInventory.filter(pkg => pkg.type !== "productInPackage" && pkg?.finalPrice === 0);

      if (zeroPrice.length > 0) {
        setNextStep(false)
      } else {
        setNextStep(true)
      }

      const newData = [];
      tempInventory.forEach(({ _id, ...rest }) => {
        newData.push(rest)
      })

      const newDataForReactTable = [...translateDataToTreeForProducts(newData ? [...newData] : [], "parent", "treeId", "subRows")];

      setDataForNewTabData([...orderBy(newDataForReactTable, ["order"], ["asc"])]);

      // dispatch({ type: "initialize", data: [], count: 0 })
      // dispatch({ type: "initialize", data: [...orderBy(newDataForReactTable, ["order"], ["asc"])], count: newDataForReactTable.length });

      // setTimeout(() => {
      //   dispatch({ type: "loading", loading: false });
      // }, gridLoadingTimeout);

      setSelectedProducts([])

    }).catch((error) => {
      toastConfig.setToastConfig(error);
      // dispatch({ type: "loading", loading: false });
    });
  };

  const restructureRowData = (rowData: any) => {
    let extractedProducts = []
    let newDataOfRow = [...rowData]

    let packageProducts = newDataOfRow.filter(rd => rd.type === "productInPackage")
    let packages = newDataOfRow.filter(rd => rd.type === "Package")
    let products = newDataOfRow.filter(rd => rd.type === "Product")
    let modifiedPkgProducts = [];

    packages.forEach((pkg: any) => {
      let currentPkgProducts = packageProducts.filter((p: any) => p.packageId === pkg.id);
      currentPkgProducts.forEach((p: any) => {
        let product = { ...p, pkgQty: pkg.qty, totalQty: pkg.qty * p.qty };
        modifiedPkgProducts.push(product)
      })
    })

    extractedProducts = [...products, ...packages, ...modifiedPkgProducts]

    return extractedProducts
  }

  return (<>
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
                    className="buttonStyleBigScreen"
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={handleOpenUpdateDialog}
                  >
                    Edit
                  </Button>
                )}
                {permissions?.rentalManagement?.isUpdate && allowedToEdit && (
                  <Button
                    className="buttonStyleSmallScreen"
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={handleOpenUpdateDialog}
                  >
                    <MdEdit size={24} />
                  </Button>
                )}
                <HideWhenOffline>
                  {permissions?.rentalManagement?.isDelete &&
                    rentalManagementData?.owner?.optionValue &&
                    user?.user?._id &&
                    rentalManagementData.owner.optionValue === user.user._id ? (
                    <DeleteButton
                      text="Delete"
                      className="buttonDeleteBigScreen"
                      onClick={() => setShowConfirmBox(true)}
                    />
                  ) : null}
                </HideWhenOffline>
                <HideWhenOffline>
                  {permissions?.rentalManagement?.isDelete &&
                    rentalManagementData?.owner?.optionValue &&
                    user?.user?._id &&
                    rentalManagementData.owner.optionValue === user.user._id ? (
                    <Button
                      className="buttonDeleteSmallScreen"
                      onClick={() => setShowConfirmBox(true)}
                    >
                      <MdDelete size={24} />
                    </Button>
                  ) : null}
                </HideWhenOffline>
              </DetailsPageHeader>
            )}
            <Tabs
              className="quote-tab"
              value={tabValue}
              onChange={handleMainTabChange}
              textColor="primary"
              TabIndicatorProps={{
                style: {
                  display: 'none'
                }
              }}
            >
              {/* <Tab
                        className={"tabLayout"}
                      style={{
                        background: tabValue === 0 ? "white" : "",
                        color: tabValue === 0 ? "blue" : "#163340",
                      }}
                      label={
                        <div className="d-flex align-items-center tab-font ">
                          <InfoIcon className="mr-1" fontSize="inherit" /> All
                          Version Status
                        </div>
                      }
                      {...a11yProps(0)}
                    /> */}
              <Tab
                className={'tabLayout'}
                style={{
                  background: tabValue === 1 ? 'white' : '',
                  color: tabValue === 1 ? '#163340' : '#163340'
                }}
                label={
                  <div className="d-flex align-items-center tab-font">
                    <FaWpforms className="mr-1" fontSize="inherit" /> Header
                  </div>
                }
                {...a11yProps(0)}
              />
              <Tab
                className={'tabLayout'}
                style={{
                  background: tabValue === 2 ? 'white' : '',
                  color: tabValue === 2 ? 'blue' : '#163340'
                }}
                label={
                  <div className="d-flex align-items-center tab-font">
                    <BiFoodMenu className="mr-1" fontSize="inherit" /> Details
                  </div>
                }
                {...a11yProps(1)}
              />
              <div className={'uio'}> </div>
            </Tabs>
            <TabPanel value={tabValue} index={0}>
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
              <div className="position-relative">
                <HideWhenOffline>
                  {/* {showActivity ?
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
                </span>} */}
                  <Paper>
                    {!isSmallScreen && <span className={`${showActivity ? "activityHide" : "activityShow"} cursor-pointer`} onClick={handleActivityHideShow}>
              {showActivity ? <IoIosArrowDropright className="icon" /> : <IoIosArrowDropleft className="icon" />}
            </span>}
                    <div style={{ display: showActivity ? "block" : "none" }}>
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
                    </div>
                  </Paper>
                </HideWhenOffline>
              </div>

            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              <Paper>
                <Steps
                  className={styles.steps_box}
                  isNextStep={treeToFlatArray(dataForNewTabData, "subRows").some(f => f.isValid === false)}
                  nextStep={nextStep}
                  steps={rentalProcessSteps.slice(0, 5)}
                  currentStep={currentStep}
                  setCurrentStep={setCurrentStep}
                />
                {(currentStep === 0) && (
                  <Productpackage
                    rentalManagementData={rentalManagementData}
                    setNextStep={setNextStep}
                    currencySymbol={currencySymbol}
                  />
                )}
                {(currentStep === 1) && (
                  <AdditionalCost
                    rentalManagementData={rentalManagementData}
                  />
                )}
                {(currentStep === 2) && (
                  <SerializedAssetStep
                    rentalManagementId={id}
                    productInventory={[
                      ...productInventory,
                      ...serializeAssets
                    ]}
                    fetchProductsData={fetchProductInventory}
                    isSmallScreen={isSmallScreen}
                    isTabletScreen={isTabletScreen}
                    showActivity={showActivity}
                    currentStep={currentStep}
                    currencySymbol={currencySymbol}
                    currencyCode={rentalManagementData?.currency}
                    loading={loading}
                    serializeAssets={serializeAssets}
                    setNextStep={setNextStep}
                  />
                )}
                {(currentStep === 3) && (
                  <DeliveryTicket
                    fetchRentalData={fetchRentalManagementData}
                    rentalManagementData={rentalManagementData}
                    rentalManagementId={id}
                    warehouselist={warehouseList}
                    productInventory={serializeAssets}
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
            </TabPanel>
          </Paper>
        </div>
        <Box my={1} />
      </div>
    </div>
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
    {openUpdateDialog && (
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
  </>
  );
};

export default RentalManagementDetailsPage;