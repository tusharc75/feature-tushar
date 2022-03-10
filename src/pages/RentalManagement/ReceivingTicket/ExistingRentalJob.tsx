
import Box from "@material-ui/core/Box/Box";
import React, { useState, useEffect, useReducer, useContext, Fragment } from "react";
import CommonSkeleton from "../../../components/Helpers/CommonSkeleton";
import CustomAgGrid, { intialState, reducer } from "../../../components/AgGridComponents/CustomAgGrid";
import { CommonRenderer, DateRenderer, } from "../../../components/AgGridComponents/CustomAgGridCellRenderers";
import Grid from "@material-ui/core/Grid/Grid";
import { Button, Dialog, IconButton } from "@material-ui/core";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import { CustomDialogTransition, customerContact, gridLoadingTimeout, deliveryTicket, rentalManagement, RENTAL_STATUS, sidebarResource, DELIVERY_TICKET_STATUS } from "../../../constants/helpers";
import { useData } from "../../../StateProvider/Provider";
import axiosInstance from "../../../axios/axiosInstance";
import { CreateEmail } from "../../../components/Activity/Email/CreateEmail";
import { isMobile, isTablet } from "react-device-detect";
import { AiFillFilePdf } from "react-icons/ai";
import routes from "../../../components/Helpers/Routes";
import { BiPurchaseTagAlt, IoMdDownload, MdEmail } from "react-icons/all";
import { CURReplaceByCurrencySingle } from "../../../constants/formulaUtility";
import { prepareDataForGrid, DELIVERY_TICKET_REFRENCE_TYPE, DELIVERY_FROM_TO_TYPE, DELIVERY_TICKET_TYPE } from "../../../constants/helpers";
import CustomAgGridEditable from "../../../components/AgGridComponents/CustomAgGridEditable";
import { Link } from "react-router-dom";
import { startCase } from "lodash";
import CustomDialogHeader from "../../../components/CustomDialog/CustomDialogHeader";
import useColumns, { getStaticFields, getFrameworkComponents, checkStaticField } from "../../../constants/useColumns"
import ManageDeliveryTicket from '../../DeliveryTicket/ManageDeliveryTicket';

const ExistingRentalJob = ({ refrenceData, refrenceType, productInventory, onClose, onSuccess }) => {

  const { state: { user, permissions, selectedEntity } }: any = useData();
  const [frameWorkComponent, setFrameWorkComponent] = useState({})
  const [columns, setColumns] = useState([])
  const { getColumnData } = useColumns();
  const [showTicketDialog, setShowTicketDialog] = useState({ open: false, ticketType: "", data: {} });

  const [assetsAdd, setAssetsAdd] = useState([])

  const toastConfig = useContext(CustomToastContext)

  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows, showFilteredRecordsOnly } = state;

  useEffect(() => {
    fetchGridColumns()
  }, [])

  const fetchGridColumns = async () => {
    const response = await axiosInstance().get(`/field?resource=Rental Management&entity=${selectedEntity}&view=true`)
    const data = response?.data?.data
    let columns = []
    let rendererNames = []
    data.forEach(o => {
      let currentColumn = getColumnData(routes.rentalManagement, o?.fieldData, routes.rentalManagementDetail.path)
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
    }
    setFrameWorkComponent({ ...tempFrameworkComponent })
    let staticFields = getStaticFields()
    staticFields.forEach(field => {
      columns.push(checkStaticField(routes.rentalManagement.title, field))
    })
    setColumns([...columns])
    fetchRentalManagement()
  }

  const fetchRentalManagement = async () => {
    dispatch({ type: "loading", loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    try {
      const data: any = {}
      data.rentalJob = refrenceData._id;
      const product = []
      productInventory?.forEach((ele) => {
        const filter = product.filter((e) => e.product === ele?.product?.optionValue);
        if (filter.length) {
          filter[0].qty = filter[0].qty + 1;
        }
        else {
          product.push({ product: ele?.product?.optionValue, qty: 1 })
        }
      })
      data.product = product;
      const response: any = await axiosInstance().post(`${rentalManagement.api}/pending-asset-rental`, data);
      const count = response?.data?.count;
      let rows = response?.data?.data.map((u) => {
        let finalObject = prepareDataForGrid(u, user);
        return finalObject;
      });
      dispatch({ type: "initialize", data: rows, count: count });
      setTimeout(() => {
        dispatch({ type: "loading", loading: false });
      }, gridLoadingTimeout);
    } catch (error) {
      dispatch({ type: "loading", loading: false });
    }
  }

  const handleCreateReceivingTicket = async () => {

    const response = await axiosInstance().get(`${rentalManagement.api}/productpackage/${selectedRecords[0]?._id}`)
    const assetsAdd = [];
    const inventory = JSON.parse(JSON.stringify(productInventory))
    response?.data?.data?.material?.forEach((e: any) => {
      if (e.type === "product") {
        let qty = e.qty;
        while (qty) {
          const result = inventory.filter(f => f?.product?.optionValue === e.materialId && !f.isCounted);
          if (result.length) {
            let obj: any = {};
            obj._id = e._id
            obj.inventory = result[0]._id;
            obj.product = e.materialId
            assetsAdd.push(obj)
            result[0].isCounted = true;
          }
          qty--;
        }
      }
    })

    if (assetsAdd.length !== productInventory.length) {
      alert("Product is not same")
      return
    }
    setAssetsAdd(assetsAdd);
    const data = {}
    data["ticketName"] = refrenceData.rentalJobName;
    data["refrenceId"] = refrenceData._id;
    data["pickupFromType"] = DELIVERY_FROM_TO_TYPE.customer;
    data["pickupFrom"] = refrenceData?.customerAccount?.optionValue;
    data["pickupFromAddress"] = refrenceData.shippingAddress?.optionValue;
    data["deliveryToType"] = DELIVERY_FROM_TO_TYPE.customer;
    data["deliveryTo"] = selectedRecords[0]?.customerAccountId;
    data["deliveryToAddress"] = selectedRecords[0]?.shippingAddressId;
    data["startDate"] = refrenceData?.estimateStartDate;
    data["endDate"] = refrenceData?.estimateStartDate;
    data["wellName"] = refrenceData?.wellName?.optionValue;
    data["afeNumber"] = refrenceData?.afeNumber;
    if (refrenceData?.processor?.optionValue) {
      data["processor"] = refrenceData?.processor?.optionValue;
    }
    data["isPickupFromDisable"] = true;
    data["isDeliveryToDisable"] = true;
    setShowTicketDialog({ open: true, ticketType: DELIVERY_TICKET_TYPE.receiving, data: data });
  }

  const handleCreateLoadingTicketAddAsstes = (data) => {
    const deliveryTicketData: any = {};
    deliveryTicketData._id = data._id;
    deliveryTicketData.rentalJob = selectedRecords[0]._id;
    deliveryTicketData.ticketType = DELIVERY_TICKET_TYPE.loading;
    axiosInstance().post(`${rentalManagement.api}/${selectedRecords[0]._id}/inventory`, { "products": assetsAdd })
      .then(({ data }) => {
        axiosInstance().post(`${deliveryTicket.api}/auto-create-ticket`, deliveryTicketData).then(({ data }) => {
          setShowTicketDialog({ open: false, ticketType: "", data: {} });
          onSuccess()
        }).catch((error) => {
          toastConfig.setToastConfig(error);
        });
      }).catch((error) => {
      });
  }

  return (<Dialog
    fullScreen={true}
    TransitionComponent={CustomDialogTransition}
    aria-labelledby="customized-dialog-title"
    open={true}
  >
    <CustomDialogHeader title={`Select ${routes.rentalManagement.title}`} onClose={onClose} ></CustomDialogHeader>
    <div className="listing-grid p-3">
      <Box mb={2}>
        <Grid item xs={12} sm={12} md={12} container justify={"flex-end"}>
          <Button size="small"
            color="primary"
            onClick={() => { handleCreateReceivingTicket() }}
            variant={"contained"}
            disabled={selectedRecords.length > 1 || selectedRecords.length === 0}
          >
            {`Perform Transfer`}</Button>
        </Grid>
      </Box>
      {Object.keys(frameWorkComponent).length > 0 ?
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
          allowAction={false}
          renderedFrom={"rental_management_existing"}
          allowSelection={true}
          isClientSideGrid={true}
          refreshGrid={fetchRentalManagement}
          showOnlyShowFilteredRecordSwitch={true}
          isMultipleSelection={false}
        /> : null
      }
    </div>
    {showTicketDialog.open && (
      <ManageDeliveryTicket
        ticketType={showTicketDialog.ticketType}
        refrenceType={DELIVERY_TICKET_REFRENCE_TYPE.rentalJob}
        refrenceData={showTicketDialog.data}
        productInventory={productInventory}
        onClose={() => setShowTicketDialog({ open: false, ticketType: "", data: {} })}
        onSuccess={(data) => {
          handleCreateLoadingTicketAddAsstes(data)
        }}
      />
    )}
  </Dialog>
  );
}

export default ExistingRentalJob;