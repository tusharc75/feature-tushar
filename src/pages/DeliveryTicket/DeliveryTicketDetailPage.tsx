import { useContext, useEffect, useMemo, useState, useReducer, Fragment } from 'react'
import { useHistory, useParams } from "react-router-dom";
import { Paper, Box, Grid, Button, Typography, IconButton, Tooltip, Tabs, Tab } from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import DetailsPageHeader from "../../components/DetailsPageHeader";
import queryString from 'query-string';
import { yyyyMMDD, deliveryTicket, getObjKeysWithValues, defaultActivityShow, dateTimeFormat } from "../../constants/helpers";
import { useData } from "../../StateProvider/Provider";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import routes from "../../components/Helpers/Routes";
import axiosInstance from "../../axios/axiosInstance";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import DetailsPage from "../../components/Shared/DetailsPage";
import ManageDeliveryTicket from "./ManageDeliveryTicket"
import CustomAgGrid, { reducer, intialState } from "../../components/AgGridComponents/CustomAgGrid";
import { productInventory, gridLoadingTimeout } from "../../constants/helpers"
import { IoIosArrowDropright, IoIosArrowDropleft, IoMdDownload } from 'react-icons/io';
import Activity from "../../components/Activity";
import { isMobile, isTablet } from "react-device-detect";
import SignatureDialog from '../../components/Helpers/SignatureDialog';
import ViewSignsDialog from './ViewSignsDialog'
import AddBoxRoundedIcon from '@material-ui/icons/AddBoxRounded';
import RemoveCircleRoundedIcon from '@material-ui/icons/RemoveCircleRounded';
import moment from 'moment';
import AddSerializedAsset from '../RentalManagement/SerializedAsset/AddSerializedAsset';
import { FaFileSignature, FaMailchimp, FaSignature, FaWpforms } from "react-icons/fa";
import { BiEdit, BiFoodMenu } from "react-icons/bi";
import { prepareDataForGrid, DELIVERY_TICKET_MAPPED_STATUS, sidebarResource, DELIVERY_TICKET_STATUS, DELIVERY_TICKET_TYPE, DELIVERY_TICKET_REFRENCE_TYPE, DELIVERY_FROM_TO_TYPE } from "../../constants/helpers"
import useColumns, { getStaticFields, getFrameworkComponents } from "../../constants/useColumns"
import CustomSwipableList from "../../components/SwipableListComponents/CustomSwipableList";
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { AiFillFilePdf } from "react-icons/ai";
import { CustomOfflineContext } from "../../StateProvider/OfflineContext/OfflineContext";
import { objectStore, findOne, findAll } from '../../constants/indexdbhelper';
import { updateSignatureOffline } from './deliveryTicketOfflineHelper';

interface TabPanelProps {
  children?: React.ReactNode;
  index: any;
  value: any;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} id={`main-tabpanel-${index}`} aria-labelledby={`main-tab-${index}`} {...other}>
      {children}
    </div>
  );
}

function a11yProps(index: any) {
  return {
    id: `main-tab-${index}`,
    'aria-controls': `main-tabpanel-${index}`
  };
}

const renderedFrom = "deliveryTicketDetailInventoryPage"


export default function DeliveryTicketDetail(props) {
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams();
  const {
    state: { user, selectedEntity, permissions }
  }: any = useData();
  const { tab }: any = queryString.parse(history.location.search);
  const [deliveryTicketData, setDeliveryTicketData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [openSigns, setOpenSigns] = useState(false);
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
  const [okBtnLoading, setOkBtnLoading] = useState(false)
  const [showRemoveAssetFromLoadingTicketDialog, setShowRemoveAssetFromLoadingTicketDialog] = useState(false)
  const { dataRows, rowCount, page, limit, pageSizes, selectedRecords } = state;
  const { getColumnData } = useColumns();
  const [frameWorkComponent, setFrameWorkComponent] = useState({})
  const [columns, setColumns] = useState([])
  const [canEdit, setCanEdit] = useState(false)
  const [addSerializedAssetDialog, setAddSerializedAssetDialog] = useState(false)

  const [startDeliveryDate, setStartDeliveryDate] = useState(null);
  const [signOffDate, setSignOffDate] = useState(null);
  const [isAdding, setIsAdding] = useState(false);

  const [tabValue, setTabValue] = useState(tab ? parseInt(tab) : 0);
  const [downlodingFile, setDownlodingFile] = useState(false)
  const [locationKeys, setLocationKeys] = useState([])
  const { isOffline } = useContext(CustomOfflineContext);

  useEffect(() => {
    return history.listen(location => {
      const { tab }: any = queryString.parse(history.location.search);
      if (history.action === 'PUSH') {
        setLocationKeys([location.key])
      }
      if (history.action === 'POP') {
        if (locationKeys[1] === location.key) {
          setLocationKeys(([_, ...keys]) => keys)
          // Handle forward event
          setTabValue(tab ? parseInt(tab) : 1)

        } else {
          setLocationKeys((keys) => [location.key, ...keys])
          // Handle back event
          setTabValue(tab ? parseInt(tab) : 1)

        }
      }
    })
  }, [locationKeys])

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
    history.push(`?tab=${newValue}`);
  };

  const handleActivityHideShow = () => {
    setActivityShow(!showActivity)
  }
  useEffect(() => {
    fetchDeliveryTicketData();
  }, [id]);

  const getDeliveryTicketFields = async (ticket: any) => {
    try {
      let data;
      if (isOffline) {
        data = await findOne(objectStore.resource, objectStore.deliveryTicket)
      }
      else {
        const response = await axiosInstance().get(`/field?resource=${sidebarResource["deliveryTicket"]}&showHiddenFields=true`)
        data = response?.data?.data
      }
      data = data.filter((fields: any) => {
        if (ticket?.type === DELIVERY_TICKET_REFRENCE_TYPE.transferAsset) {
          if (fields.fieldData.fieldName === "repairJob" || fields.fieldData.fieldName === "rentalJob" || fields.fieldData.fieldName === "productInventory") {
            return false
          }
        }
        if (ticket?.type === DELIVERY_TICKET_REFRENCE_TYPE.transferAsset) {
          if (fields.fieldData.fieldName === "rentalJob" || fields.fieldData.fieldName === "transferAsset" || fields.fieldData.fieldName === "productInventory") {
            return false
          }
        }
        if (ticket?.type === DELIVERY_TICKET_REFRENCE_TYPE.rentalJob || ticket?.type === DELIVERY_TICKET_REFRENCE_TYPE.salesOrder) {
          if (fields.fieldData.fieldName === "repairJob" || fields.fieldData.fieldName === "transferAsset" || fields.fieldData.fieldName === "productInventory") {
            return false
          }
        }
        if (fields.fieldData.sectionName.includes("Fields")) {
          return false
        }
        return true
      })
      if (ticket?.ticketType !== DELIVERY_TICKET_TYPE.return) {
        data = data.filter((fields: any) => fields.fieldData.fieldName !== "returnReason")
      }
      data.forEach(element => {
        if (element?.fieldData.fieldName === "pickupFrom") {
          if (ticket?.pickupFromType === DELIVERY_FROM_TO_TYPE.customer) {
            element.fieldData.lookupResource = sidebarResource.customerAccount
          }
          if (ticket?.pickupFromType === DELIVERY_FROM_TO_TYPE.supplier) {
            element.fieldData.lookupResource = sidebarResource.supplierAccount
          }
        }
        if (element?.fieldData.fieldName === "deliveryFrom") {
          if (ticket?.deliveryFromType === DELIVERY_FROM_TO_TYPE.customer) {
            element.fieldData.lookupResource = sidebarResource.customerAccount
          }
          if (ticket?.deliveryFromType === DELIVERY_FROM_TO_TYPE.supplier) {
            element.fieldData.lookupResource = sidebarResource.supplierAccount
          }
        }
      });
      setDeliveryTicketFields(data);
      setLoading(false);
    }
    catch (error) {
      setLoading(false);
      toastConfig.setToastConfig(error);
    }
  };

  const fetchDeliveryTicketData = async () => {
    try {
      if (gridApi) {
        gridApi.deselectAll();
      }
      localStorage.setItem(`${renderedFrom}_selected`, JSON.stringify([]));
      if (selectedEntity) {
        setLoading(true);
        let data;
        if (isOffline) {
          data = await findOne(objectStore.deliveryTicket, id)
        }
        else {
          const response = await axiosInstance().get(`${deliveryTicketApi}/${id}?entity=${selectedEntity}`)
          data = response?.data?.data
        }
        getDeliveryTicketFields(data)
        setDeliveryTicketData(data)
        const startDeliverySignatures = data?.signatures?.filter(f => f.status === "Start Delivery" && f.date);
        if (startDeliverySignatures && startDeliverySignatures.length > 0) {
          setStartDeliveryDate(moment(startDeliverySignatures[startDeliverySignatures.length - 1].date).format(dateTimeFormat));
        }
        const signOffSignatures = data?.signatures?.filter(f => f.status === "Sign-Off" && f.date);
        if (signOffSignatures && signOffSignatures.length > 0) {
          setSignOffDate(moment(signOffSignatures[signOffSignatures.length - 1].date).format(dateTimeFormat));
        }
        setCanEdit(
          [...(data?.collaborator ?? []), data?.owner ?? {}].some(
            (obj) => obj.optionValue === user.user._id
          )
        );
        setSignatures(data?.signatures || []);
        if (data?.productInventory && data?.productInventory.length) {
          let ids = data?.productInventory.map(o => o?.optionValue)
          fetchProductInventory(ids)
        } else {
          dispatch({ type: "initialize", data: [], count: 0 });
        }
      }
    }
    catch (error) {
      toastConfig.setToastConfig(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGridColumns()
  }, [])

  const fetchGridColumns = async () => {
    try {
      let data;
      if (isOffline) {
        data = await findOne(objectStore.resource, "productInventory")
      }
      else {
        const response = await axiosInstance().get(`/field?resource=Product Inventory`)
        data = response?.data?.data
      }
      let columns = []
      let rendererNames = []
      data.forEach(o => {
        let currentColumn = getColumnData(routes.productInventory?.title, o?.fieldData, routes.productInventoryDetail.path)
        if (currentColumn !== null) {
          columns = [...columns, currentColumn?.columnData]
          if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
            rendererNames.push(currentColumn?.rendererName)
          }
        }
      })
      let tempFrameworkComponent = getFrameworkComponents(rendererNames, true)
      tempFrameworkComponent = {
        ...tempFrameworkComponent,
      }
      setFrameWorkComponent({ ...tempFrameworkComponent })
      columns = [...columns, ...getStaticFields()]
      setColumns([...columns])
    }
    catch (error) {
      toastConfig.setToastConfig(error);
    }
  }

  const fetchProductInventory = async (productInventories) => {
    if (!productInventories) {
      productInventories = deliveryTicketData?.productInventory?.map(o => o?.optionValue)
    }
    try {
      dispatch({ type: "loading", loading: true });
      if (gridApi) {
        gridApi.setRowData([]);
      }
      let data;
      if (isOffline) {
        const deliveryTicket = await findOne(objectStore.deliveryTicket, id)
        const response = await findOne(objectStore.rentalManagement, deliveryTicket?.rentalJob?.optionValue)
        data = response?.productInventory.map((u) => {
          return u.inventoryDetail;
        })
        const inventory = deliveryTicket?.productInventory?.map((e) => e.optionValue);
        data = response?.productInventory?.filter(d => inventory?.includes(d.inventory)).map(obj => obj.inventoryDetail)
      }
      else {
        let ids = JSON.stringify(productInventories)
        const queryString = `?getById=${ids}`
        const response = await axiosInstance().get(`${productInventory.api}${queryString}`)
        data = response?.data?.data
      }
      let rows = data.map((u) => {
        let res = {
          ...prepareDataForGrid(u, user)
        };
        return res;
      });
      dispatch({ type: "initialize", data: rows, count: rows.length });
      setTimeout(() => { dispatch({ type: "loading", loading: false }); }, gridLoadingTimeout);
    }
    catch (error) {
      toastConfig.setToastConfig(error);
      dispatch({ type: "loading", loading: false });
    }
  };

  const getMainPoints = useMemo(() => {
    let mainPoint = {};
    if (deliveryTicketData) {
      mainPoint["Pick-Up Date:"] = yyyyMMDD(deliveryTicketData?.["pick-UpDate"]) || "";
      mainPoint["Delivery Date"] = yyyyMMDD(deliveryTicketData?.deliveryDate) || "";
      mainPoint["delivery Person"] = deliveryTicketData?.deliveryPerson?.optionLabel || ""
    }
    return mainPoint;
  }, [deliveryTicketData?.ticketName, deliveryTicketData?.deliveryPerson, deliveryTicketData?.deliveryDate]);


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

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const handleChangeStatus = (label) => {
    if (DELIVERY_TICKET_MAPPED_STATUS[label]) {
      const fieldsDataForUpdate = deliveryTicketFields.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);
      let values = getObjKeysWithValues(deliveryTicketData, fieldsDataForUpdate)
      values["status"] = DELIVERY_TICKET_MAPPED_STATUS[label]
      values["_id"] = deliveryTicketData._id
      axiosInstance().put(`${deliveryTicketApi}`, values).then(({ data: { data } }) => {
        fetchDeliveryTicketData()
      }).catch((error) => {
        toastConfig.setToastConfig(error);
      });
    }
  }

  let label = deliveryTicketData ? deliveryTicketData?.status === "New" ? "Sign-off - Dispatch" :
    (deliveryTicketData?.status === "In-Transit") ? "Sign-off - Delivery" : "" : ""

  const handleSignature = async (signedData) => {
    let signaturesToSend = [...signatures];
    const status = label === "Sign-off - Dispatch" ? "Start Delivery" : "Sign-Off";

    const { type, sign: newSign, name } = signedData;
    const indexOfExistingSignature = signatures.findIndex((sign) => sign.type === type && sign.status === status);

    if (indexOfExistingSignature === -1) {
      signaturesToSend = [...signatures, { type, signature: newSign, status: status, name: name }];
    } else {
      signaturesToSend[indexOfExistingSignature] = {
        ...signaturesToSend[indexOfExistingSignature],
        type,
        signature: newSign,
        status: status,
        name: name
      }
    }

    setSignatures([...signaturesToSend]);
    if (signaturesToSend.length === 2 || signaturesToSend.length === 4) {
      if (isOffline) {
        setSubmittingSign(true)
        const response = await updateSignatureOffline(id, signaturesToSend)
        fetchDeliveryTicketData()
        setOpenSignatureDialog(false)
        setSubmittingSign(false)
      }
      else {
        setSubmittingSign(true)
        axiosInstance().put(`${deliveryTicketApi}/signature`, {
          _id: id,
          signatures: [...signaturesToSend]
        }).then(() => {
          handleChangeStatus(label)
          setOpenSignatureDialog(false)
          setSubmittingSign(false)
        }).catch((error) => {
          toastConfig.setToastConfig(error);
          setOpenSignatureDialog(false)
          setSubmittingSign(false)
        });
      }
    }
  }

  const handleViewPdf = (download) => {
    axiosInstance().get(`${deliveryTicketApi}/${id}/pdf`)
      .then(({ data }) => {
        axiosInstance()
          .get(`user/download?fileName=${data.data.fileName}`, {
            responseType: "blob",
          })
          .then(({ data }) => {
            if (download) {
              const url = window.URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', `LoadingTicket-${deliveryTicketData.ticketName || ""}.pdf`);
              document.body.appendChild(link);
              link.click();
            }
            else {
              const file = new Blob([data], { type: "application/pdf" });
              const fileURL = URL.createObjectURL(file);
              const pdfWindow = window.open();
              pdfWindow.location.href = fileURL;
              toastConfig.setToastConfig({ open: true, type: "success", message: "Preview file downloaded successfully." })

            }
            setDownlodingFile(false);
          })
          .catch((err) => {
            toastConfig.setToastConfig(err);
            setDownlodingFile(false);
          });
      }).catch((err) => {
        toastConfig.setToastConfig(err);
        setDownlodingFile(false);
      })
  }

  const handleReceiveCustomerSign = () => {
    if (deliveryTicketData?.customerAccount?.optionValue) {
      axiosInstance().post(`${deliveryTicketApi}/receive-customer-sign`, { "id": deliveryTicketData.customerAccount.optionValue, "deliveryTicketId": id }).then(({ data: { data } }) => {
        toastConfig.setToastConfig({ open: true, type: "success", message: data })

      }).catch((error) => {
        toastConfig.setToastConfig(error);
      });
    }
  }

  return (
    <>
      <Fragment>
        <Grid container className="headerbox">
          <CustomBreadCrumbs routes={[routes.deliveryTicket, { title: deliveryTicketData?.ticketName }]} />
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
                  heading={deliveryTicketData ? deliveryTicketData?.ticketName : ""}
                  mainPoints={deliveryTicketData ? getMainPoints : ""}
                  showHeading={true}
                >
                  {permissions?.deliveryTicket?.isUpdate && canEdit && deliveryTicketData?.status !== "Delivered" && (
                    <Button
                      variant={isMobile && !isTablet ? 'text' : 'contained'}
                      color="primary"
                      size="small"
                      onClick={handleOpenUpdateDialog}
                      style={isMobile && !isTablet ? { color: "var(--teal)" } : {}}
                    >
                      {isMobile && !isTablet ? <BiEdit size={20} /> : "Edit"}
                    </Button>
                  )}
                  {deliveryTicketData?.deliveryPerson?.optionValue === user?.user?._id || canEdit ?
                    label !== "" ?
                      <Button
                        variant={isMobile && !isTablet ? 'text' : 'contained'}
                        color="primary"
                        size="small"
                        disabled={loading}
                        style={isMobile && !isTablet ? { color: "var(--warning-darken)" } : {}}
                        onClick={() => setOpenSignatureDialog(true)}>
                        {isMobile && !isTablet ? <FaFileSignature size={18} /> : label}
                      </Button>
                      : null
                    : null}
                  {(deliveryTicketData?.status === "In-Transit" || deliveryTicketData?.status === "Delivered") ?
                    <Button
                      variant={isMobile && !isTablet ? "text" : "contained"}
                      color="primary"
                      size="small"
                      onClick={() => setOpenSigns(true)}
                      style={isMobile && !isTablet ? { color: "var(--info-darken)" } : {}}
                    >
                      {isMobile && !isTablet ? <FaSignature size={20} /> : "View Signatures"}
                    </Button> : null
                  }
                  {(deliveryTicketData?.ticketType === "Loading" && deliveryTicketData?.type === "Rental Job" && deliveryTicketData?.signatures?.length === 4) ?
                    <Button
                      variant={isMobile && !isTablet ? "text" : "contained"}
                      color="primary"
                      size="small"
                      onClick={() => { handleReceiveCustomerSign() }}
                      style={isMobile && !isTablet ? { color: "var(--info-darken)" } : {}}
                    >
                      {isMobile && !isTablet ? <FaMailchimp size={20} /> : "Send To Customer"}
                    </Button> : null
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
                    {(deliveryTicketData && deliveryTicketFields.length > 0 ?
                      <DetailsPage
                        data={{ ...deliveryTicketData, actualDispatchedDate: startDeliveryDate, actualDeliveredDate: signOffDate }}
                        fields={[...deliveryTicketFields, {
                          fieldData: {
                            fieldLabel: "Actual Dispatched Date",
                            fieldName: "actualDispatchedDate",
                            sectionName: "Sign-off Information"
                          }
                        }, {
                          fieldData: {
                            fieldLabel: "Actual Delivered Date",
                            fieldName: "actualDeliveredDate",
                            sectionName: "Sign-off Information"
                          }
                        }
                        ]} /> : null
                    )}
                  </TabPanel>
                  <TabPanel value={tabValue} index={1}>
                    <Grid container spacing={1} className="p-2">
                      <Grid item xs={12} className="mt-2 d-flex gap-2">
                        <Typography variant="subtitle1" className="font-weight-bold text-primary">
                          Serialized Assets
                        </Typography>
                        {
                          deliveryTicketData?.status === "New" && <IconButton
                            onClick={() => {
                              setAddSerializedAssetDialog(true)
                            }}
                            disabled={isOffline}
                            color='primary'
                            size="small"
                          >
                            <Tooltip
                              title="Add More Serialized Assets">
                              <AddBoxRoundedIcon />
                            </Tooltip>
                          </IconButton>
                        }
                        {
                          deliveryTicketData?.status === "New" && <IconButton
                            disabled={selectedRecords.length === 0 || isOffline}
                            onClick={() => {
                              setShowRemoveAssetFromLoadingTicketDialog(true)
                            }}
                            color='primary'
                            size="small"
                          >
                            <Tooltip
                              title="Remove Serialized Assets">
                              <RemoveCircleRoundedIcon />
                            </Tooltip>
                          </IconButton>
                        }
                        <Box mx={1} />
                        {permissions?.deliveryTicket?.isRead && (
                          <Button
                            variant={isMobile && !isTablet ? "text" : "outlined"}
                            color="primary"
                            type="button"
                            size="small"
                            style={isMobile && !isTablet ? { color: "var(--info-dark)" } : {}}
                            startIcon={isMobile && !isTablet ? '' : <AiFillFilePdf />}
                            disabled={downlodingFile || isOffline}
                            onClick={() => { handleViewPdf(false) }}
                          >
                            {isMobile && !isTablet ? <AiFillFilePdf size={18} /> : downlodingFile ? "Please wait..." : "Preview"}
                          </Button>
                        )}
                        {permissions?.deliveryTicket?.isRead && (
                          <Button
                            variant={isMobile && !isTablet ? "text" : "outlined"}
                            color="primary"
                            type="button"
                            size="small"
                            style={isMobile && !isTablet ? { color: "var(--warning-darken)" } : {}}
                            startIcon={isMobile && !isTablet ? '' : <IoMdDownload />}
                            disabled={downlodingFile || isOffline}
                            onClick={() => { handleViewPdf(true) }}
                          >
                            {isMobile && !isTablet ? <IoMdDownload size={20} /> : downlodingFile ? "Please wait..." : "Download"}
                          </Button>
                        )}
                      </Grid>
                      <Grid item xs={12}>
                        {isMobile && !isTablet ? <CustomSwipableList
                          allowSelection={true}
                          allowSwipe={true}
                          permissions={permissions}
                          primaryField={columns?.find(d => d.field === "assetNumber")}
                          onClick={(data) => {
                            history.push(`${routes.productInventoryDetail.path}/${data._id}`)
                          }}
                          dataRows={dataRows}
                          selectedRecords={selectedRecords}
                          dispatch={dispatch}
                          onEdit={() => {

                          }}
                          extraParamsToCheckDelete={true}
                          onDelete={() => {
                          }}
                          rowCount={rowCount}
                          page={page}
                          loading={loading}
                          chips={
                            [{
                              label: `Product Description: `,
                              field: "productName",
                              forceShow: true
                            }]
                          }
                          onCreate={null}
                          showClone={false}
                          fullHeight={true}
                          renderedFrom={"receivingTicketDetailInventoryPage"}
                          onClone={() => {
                          }}
                        /> :
                          Object.keys(frameWorkComponent).length > 0 ?
                            <CustomAgGrid
                              isClientSideGrid={true}
                              allowSelection={deliveryTicketData?.status === "New"}
                              allowAction={false}
                              columns={columns}
                              dataRows={dataRows}
                              frameworkComponents={frameWorkComponent}
                              setGridApi={setGridApi}
                              dispatch={dispatch}
                              rowCount={rowCount}
                              limit={limit}
                              pageSizes={pageSizes}
                              page={page}
                              actionWidth={150}
                              loading={false}
                              renderedFrom={renderedFrom}
                              refreshGrid={fetchProductInventory}
                            /> : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>
                        }
                      </Grid>
                    </Grid>
                  </TabPanel>

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
          <ManageDeliveryTicket
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
            steps={label === "Sign-off - Dispatch" ? ["Supervisor", "Delivery Person"] : ["Delivery Person", "Receiver"]}
            forDelivery={true}
            open={true}
            onClose={() => {
              setOpenSignatureDialog(false)
            }}
            onSigned={handleSignature}
          />}

        {openSigns &&
          <ViewSignsDialog
            signatures={deliveryTicketData?.signatures}
            close={() => setOpenSigns(false)}
          />}

        {showRemoveAssetFromLoadingTicketDialog && (
          <ConfirmationDialog
            open={showRemoveAssetFromLoadingTicketDialog}
            message={`Are you sure you want to remove selected serialized asset(s) ?`}
            onClose={() => {
              setShowRemoveAssetFromLoadingTicketDialog(false);
            }}
            onOk={() => {
              setOkBtnLoading(true);
              axiosInstance().put(`${deliveryTicket.deliveryTicketApi}/${id}/remove-assets`, { ids: selectedRecords.map(m => m._id) })
                .then(() => {
                  toastConfig.setToastConfig({ open: true, type: "success", message: `Selected serialized asset(s) removed` });
                  dispatch({
                    type: 'selection',
                    selectedRecords: []
                  });
                  fetchDeliveryTicketData();
                }).catch((error) => {
                  toastConfig.setToastConfig(error);
                }).finally(() => {
                  setOkBtnLoading(false);
                  setShowRemoveAssetFromLoadingTicketDialog(false);
                });

            }}
            okBtnLoading={okBtnLoading}
          />
        )}

        {addSerializedAssetDialog &&
          <AddSerializedAsset
            addSerializedAsset={(newRecordsToAdd) => {
              axiosInstance().post(`${deliveryTicket.deliveryTicketApi}/${id}/add-assets`, { "ids": newRecordsToAdd.map(m => m._id ?? m.id) })
                .then(({ data }) => {
                  setAddSerializedAssetDialog(false)
                  fetchDeliveryTicketData()
                  setIsAdding(false)
                  toastConfig.setToastConfig({
                    open: true,
                    type: "success",
                    message: data.message,
                  });
                }).catch((error) => {
                  setAddSerializedAssetDialog(false)
                  setIsAdding(false)
                  toastConfig.setToastConfig(error)
                });
            }}
            handleSerializedAssetClose={() => {
              setAddSerializedAssetDialog(false);
            }}
            isAdding={isAdding}
            selectedProducts={[]}
            rentalId={deliveryTicketData?.type === DELIVERY_TICKET_REFRENCE_TYPE.rentalJob ? deliveryTicketData?.rentalJob?.optionValue : ""}
            repairJobId={deliveryTicketData?.type === DELIVERY_TICKET_REFRENCE_TYPE.repairJob ? deliveryTicketData?.repairJob?.optionValue : ""}
            transferAssetId={deliveryTicketData?.type === DELIVERY_TICKET_REFRENCE_TYPE.transferAsset ? deliveryTicketData?.transferAsset?.optionValue : ""}
            salesOrderId={deliveryTicketData?.type === DELIVERY_TICKET_REFRENCE_TYPE.salesOrder ? deliveryTicketData?.salesOrder?.optionValue : ""}
            notIn={deliveryTicketData.ticketType}
          />
        }
      </Fragment>
    </>
  );
}
