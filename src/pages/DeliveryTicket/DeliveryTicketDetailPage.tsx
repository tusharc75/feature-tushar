import { useContext, useEffect, useMemo, useState, useReducer, Fragment } from 'react'
import { useHistory, useParams } from "react-router-dom";
import { Paper, Box, Grid, Button, Typography, IconButton, Tooltip, Tabs, Tab, useMediaQuery } from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import DetailsPageHeader from "../../components/DetailsPageHeader";
import queryString from 'query-string';
import { yyyyMMDD, deliveryTicket, getObjKeysWithValues, defaultActivityShow, dateTimeFormat, ACTIVITY_RESOURCE } from "../../constants/helpers";
import { useData } from "../../StateProvider/Provider";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import routes from "../../components/Helpers/Routes";
import axiosInstance from "../../axios/axiosInstance";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import DetailsPage from "../../components/Shared/DetailsPage";
import ManageDeliveryTicket from "./ManageDeliveryTicket"
import CustomAgGrid, { reducer, intialState } from "../../components/AgGridComponents/CustomAgGrid";
import { serializedAsset, gridLoadingTimeout } from "../../constants/helpers"
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
import { camelCase } from 'lodash';
import DeliveryTicketProduct from './DeliveryTicketProduct';
import DeliveryTicketAdditionalCost from './DeliveryTicketAdditionalCost';
import HideWhenOffline from 'src/components/HideWhenOffline';
import ActivityButton from 'src/components/Activity/ActivityButton';

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



export default function DeliveryTicketDetail(props) {
  const renderedFrom = `${camelCase(routes?.deliveryTicket.title)}_grid-1`
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
  const isSmallScreen = useMediaQuery('(max-width:1300px)');

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
        if (ticket?.type === DELIVERY_TICKET_REFRENCE_TYPE.repairJob) {
          if (["transferAsset", "rentalJob", "sublease", "salesOrder", "productInventory", "pickupFromType", "deliveryToType", "transferInventory", "repairOrder"].includes(fields.fieldData.fieldName)) {
            return false
          }
        }
        if (ticket?.type === DELIVERY_TICKET_REFRENCE_TYPE.transferAsset) {
          if (["rentalJob", "repairJob", "sublease", "salesOrder", "productInventory", "pickupFromType", "deliveryToType", "transferInventory", "repairOrder"].includes(fields.fieldData.fieldName)) {
            return false
          }
        }
        if (ticket?.type === DELIVERY_TICKET_REFRENCE_TYPE.rentalJob) {
          if (["repairJob", "transferAsset", "sublease", "salesOrder", "productInventory", "pickupFromType", "deliveryToType", "transferInventory", "repairOrder"].includes(fields.fieldData.fieldName)) {
            return false
          }
        }
        if (ticket?.type === DELIVERY_TICKET_REFRENCE_TYPE.salesOrder) {
          if (["repairJob", "transferAsset", "sublease", "productInventory", "pickupFromType", "deliveryToType", "transferInventory", "repairOrder"].includes(fields.fieldData.fieldName)) {
            return false
          }
        }
        if (ticket?.type === DELIVERY_TICKET_REFRENCE_TYPE.sublease) {
          if (["rentalJob", "repairJob", "transferAsset", "salesOrder", "productInventory", "pickupFromType", "deliveryToType", "transferInventory", "repairOrder"].includes(fields.fieldData.fieldName)) {
            return false
          }
        }
        if (ticket?.type === DELIVERY_TICKET_REFRENCE_TYPE.transferInventory) {
          if (["rentalJob", "repairJob", "transferAsset", "salesOrder", "productInventory", "pickupFromType", "deliveryToType", "sublease", "repairOrder"].includes(fields.fieldData.fieldName)) {
            return false
          }
        }
        if (ticket?.type === DELIVERY_TICKET_REFRENCE_TYPE.repairOrder) {
          if (["rentalJob", "repairJob", "transferAsset", "salesOrder", "productInventory", "pickupFromType", "deliveryToType", "sublease", "transferInventory"].includes(fields.fieldData.fieldName)) {
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
        if (element?.fieldData.fieldName === "deliveryTo") {
          if (ticket?.deliveryToType === DELIVERY_FROM_TO_TYPE.customer) {
            element.fieldData.lookupResource = sidebarResource.customerAccount
          }
          if (ticket?.deliveryToType === DELIVERY_FROM_TO_TYPE.supplier) {
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
          const response = await axiosInstance().get(`${deliveryTicket.api}/${id}?entity=${selectedEntity}`)
          data = response?.data?.data
        }
        getDeliveryTicketFields(data)
        setDeliveryTicketData(data)
        const startDeliverySignatures = data?.signatures?.filter(f => f.status === "Start Delivery" && f.date);
        if (startDeliverySignatures && startDeliverySignatures.length > 0) {
          setStartDeliveryDate(moment(startDeliverySignatures[startDeliverySignatures.length - 1].date).format(dateTimeFormat));
        }
        setSignOffDate(data?.actualDeliveryDate)
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

  useEffect(() => {
    if (isSmallScreen && tabValue === 0) {
      setActivityShow(true)
    }
    else {
      setActivityShow(false)
    }
  }, [isSmallScreen, tabValue])


  const fetchGridColumns = async () => {
    try {
      let data;
      if (isOffline) {
        data = await findOne(objectStore.resource, "serializedAsset")
      }
      else {
        const response = await axiosInstance().get(`/field?resource=${serializedAsset.resource}`)
        data = response?.data?.data
      }
      let columns = []
      let rendererNames = []
      data.forEach(o => {
        let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.serializedAssetDetail.path)
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
        const response = await axiosInstance().get(`${deliveryTicket.api}/${id}/assets`)
        data = response?.data?.data
      }
      let rows = data.map((u) => {
        let finalObject = prepareDataForGrid(u, user);
        finalObject["isChecked"] = false;
        return finalObject;
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
      mainPoint["Pick-Up Date:"] = yyyyMMDD(deliveryTicketData?.["pickUpDate"]) || "";
      mainPoint["Delivery Date"] = yyyyMMDD(deliveryTicketData?.deliveryDate) || "";
      mainPoint["Processor"] = deliveryTicketData?.deliveryPerson?.optionLabel || ""
    }
    return mainPoint;
  }, [deliveryTicketData?.ticketName, deliveryTicketData?.deliveryPerson, deliveryTicketData?.deliveryDate]);


  const handleDeleteLoadingTicket = () => {
    if (deliveryTicketData?._id) {
      axiosInstance()
        .put(`${deliveryTicket.api}/remove?entity=${selectedEntity}`, {
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
      axiosInstance().put(`${deliveryTicket.api}`, values).then(({ data: { data } }) => {
        fetchDeliveryTicketData()
      }).catch((error) => {
        toastConfig.setToastConfig(error);
      });
    }
  }


  const handleSignature = async (signedData) => {
    let signaturesToSend = [...signatures];

    const status = deliveryTicketData?.status === DELIVERY_TICKET_STATUS.new ? "Start Delivery" : "Sign-Off";
    const label = deliveryTicketData?.status === DELIVERY_TICKET_STATUS.new ? "Sign-off - Dispatch" :
      deliveryTicketData?.status === "In-Transit" ? "Sign-off - Delivery" : "";

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
        axiosInstance().put(`${deliveryTicket.api}/signature`, {
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
    axiosInstance().get(`${deliveryTicket.api}/${id}/pdf`)
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
      axiosInstance().post(`${deliveryTicket.api}/receive-customer-sign`, { "id": deliveryTicketData.customerAccount.optionValue, "deliveryTicketId": id }).then(({ data: { data } }) => {
        toastConfig.setToastConfig({ open: true, type: "success", message: data })

      }).catch((error) => {
        toastConfig.setToastConfig(error);
      });
    }
  }





  return (
    <>
      <Box className="main-container-v1">
        <Box className="headerbox-v1">
          <Box className="nav-v1">
            <CustomBreadCrumbs routes={[routes.deliveryTicket, { title: deliveryTicketData?.ticketName }]} />
          </Box>
          <Box className="controls-v1">
            <Box className="control-buttons-v1">

              {permissions?.deliveryTicket?.isUpdate && canEdit && ![DELIVERY_TICKET_STATUS.delivered, DELIVERY_TICKET_STATUS.cancelled].includes(deliveryTicketData?.status) && (
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


              {(deliveryTicketData?.signatures?.length > 0) ?
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
              {permissions?.deliveryTicket?.isRead && !isMobile && (
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
              <ActivityButton referenceId={deliveryTicketData?._id} resource={ACTIVITY_RESOURCE.deliveryTicket} />
            </Box>
          </Box>
        </Box>
        <Box className={`detail-container-v1`}>
          <Tabs
            className="new-tab-container-v1"
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
              label={
                <div className="d-flex align-items-center tab-font">
                  <FaWpforms className="mr-1" fontSize="inherit" /> Header
                </div>
              }
              {...a11yProps(0)}
            />
            <Tab
              className={'tabLayout'}
              label={
                <div className="d-flex align-items-center tab-font">
                  <BiFoodMenu className="mr-1" fontSize="inherit" /> Serialized Assets
                </div>
              }
              {...a11yProps(1)}
            />
            <Tab
              className={'tabLayout'}
              label={
                <div className="d-flex align-items-center tab-font">
                  <BiFoodMenu className="mr-1" fontSize="inherit" /> Additional Products
                </div>
              }
              {...a11yProps(0)}
            />
            {deliveryTicketData?.additionalCost?.length > 0 &&
              <Tab
                className={'tabLayout'}
                label={
                  <div className="d-flex align-items-center tab-font">
                    <BiFoodMenu className="mr-1" fontSize="inherit" /> Services and Consumables
                  </div>
                }
                {...a11yProps(0)}
              />
            }
          </Tabs>
          <TabPanel value={tabValue} index={0}>
            {(deliveryTicketData && deliveryTicketFields.length > 0 ?
              <DetailsPage
                data={{ ...deliveryTicketData, actualDispatchedDate: startDeliveryDate, actualDeliveryDate: signOffDate, creationDate: deliveryTicketData?.createdBy?.date, completionDate: deliveryTicketData?.actualDeliveryDate }}
                fields={[...deliveryTicketFields
                  , {
                  fieldData: {
                    type: "date",
                    fieldLabel: "Actual Delivery Date",
                    fieldName: "actualDeliveryDate",
                    sectionName: "Actuals"
                  }
                },
                {
                  fieldData: {
                    type: "date",
                    fieldLabel: "Creation Date",
                    fieldName: "creationDate",
                    sectionName: "Actuals"
                  }
                },
                {
                  fieldData: {
                    type: "date",
                    fieldLabel: "Completion Date",
                    fieldName: "completionDate",
                    sectionName: "Actuals"
                  }
                }
                ]} /> : null
            )}
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={1} className="p-2">
              <Grid item xs={12} className="mt-2 d-flex gap-2">
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
              </Grid>
              <Grid item xs={12}>
                {isMobile && !isTablet ? <CustomSwipableList
                  allowSelection={true}
                  allowSwipe={true}
                  permissions={permissions}
                  primaryField={columns?.find(d => d.field === "assetNumber")}
                  onClick={(data) => {
                    history.push(`${routes.serializedAssetDetail.path}/${data._id}`)
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
                  renderedFrom={renderedFrom}
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
          <TabPanel value={tabValue} index={2}>
            <DeliveryTicketProduct
              renderedFrom={`${camelCase(routes?.deliveryTicket.title)}_grid-2`}
              deliveryTicketId={id} />
          </TabPanel>
          {deliveryTicketData?.additionalCost?.length > 0 &&
            <TabPanel value={tabValue} index={3}>
              <DeliveryTicketAdditionalCost
                renderedFrom={`${camelCase(routes?.deliveryTicket.title)}_grid-3`}
                additionalCost={deliveryTicketData?.additionalCost} />
            </TabPanel>}
        </Box>
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
            label={deliveryTicketData?.status === DELIVERY_TICKET_STATUS.new ? "Sign-off - Dispatch" : "Sign-off - Delivery"}
            steps={deliveryTicketData?.status === DELIVERY_TICKET_STATUS.new ? ["Supervisor", "Delivery Person"] : ["Delivery Person", "Receiver"]}
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
              axiosInstance().put(`${deliveryTicket.api}/${id}/assets`, { ids: selectedRecords.map(m => m._id) })
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
              axiosInstance().post(`${deliveryTicket.api}/${id}/assets`, { "ids": newRecordsToAdd.map(m => m._id ?? m.id) })
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
      </Box>
    </>
  );
}
