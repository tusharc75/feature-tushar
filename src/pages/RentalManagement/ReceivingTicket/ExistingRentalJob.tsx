
import Box from "@material-ui/core/Box/Box";
import React, { useState, useEffect, useReducer, useContext, Fragment } from "react";
import CustomAgGrid, { intialState, reducer } from "../../../components/AgGridComponents/CustomAgGrid";
import Grid from "@material-ui/core/Grid/Grid";
import { Button, Dialog, IconButton } from "@material-ui/core";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import { CustomDialogTransition, gridLoadingTimeout, deliveryTicket, rentalManagement, INVENTORY_STATUS } from "../../../constants/helpers";
import { useData } from "../../../StateProvider/Provider";
import axiosInstance from "../../../axios/axiosInstance";
import routes from "../../../components/Helpers/Routes";
import { prepareDataForGrid, DELIVERY_TICKET_REFRENCE_TYPE, DELIVERY_FROM_TO_TYPE, DELIVERY_TICKET_TYPE } from "../../../constants/helpers";
import CustomDialogHeader from "../../../components/CustomDialog/CustomDialogHeader";
import useColumns, { getStaticFields, getFrameworkComponents, checkStaticField } from "../../../constants/useColumns"
import ManageDeliveryTicket from '../../DeliveryTicket/ManageDeliveryTicket';
import ManageRentalManagementDialog from '../ManageRental/ManageRentalManagementDialog';

const ExistingRentalJob = ({ referenceData, referenceType, productInventory, onClose, onSuccess }) => {

  const { state: { user, permissions, selectedEntity } }: any = useData();
  const [frameWorkComponent, setFrameWorkComponent] = useState({})
  const [columns, setColumns] = useState([])
  const { getColumnData } = useColumns();
  const [showTicketDialog, setShowTicketDialog] = useState({ open: false, ticketType: "", data: {}, rentalJob: null });
  const [showRentalDialog, setShowRentalDialog] = useState({ open: false, data: {} });
  const [assetsAdd, setAssetsAdd] = useState([])

  const toastConfig = useContext(CustomToastContext)

  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  
  const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;

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
      data.rentalJob = referenceData._id;
      const product = []
      productInventory.filter((e) => e.type === "Asset")?.forEach((ele) => {
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

  const calculateNestedQty = (material, parent) => {
    const childProduct: any = material.filter((e) => e.parentId === parent._id);
    childProduct?.forEach((child) => {
      child.qty = child.qty * parent.qty;
      calculateNestedQty(material, child);
    });
  }

  const handleCreateReceivingTicket = async (rentalData, isOnlyAssetAdd) => {

    const response = await axiosInstance().get(`${rentalManagement.api}/productpackage/${rentalData._id}`)
    const assetsAdd = [];
    const inventory = JSON.parse(JSON.stringify(productInventory.filter((e) => e.type === "Asset")))
    var material = response?.data?.data?.material

    material?.forEach((element) => {
      if (element.parentId === null) {
        calculateNestedQty(material, element)
      }
    })

    material?.forEach((e: any) => {
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

    if (assetsAdd.length !== productInventory.filter((e) => e.type === "Asset").length) {
      alert("Product is not same")
      return
    }

    if (isOnlyAssetAdd) {
      axiosInstance().post(`${rentalManagement.api}/${rentalData._id}/inventory`, { "products": assetsAdd })
        .then(({ data }) => {
          onSuccess()
        }).catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
    else {
      setAssetsAdd(assetsAdd);
      const data = {}
      data["ticketName"] = referenceData.rentalJobName;
      data["refrenceId"] = referenceData._id;
      data["pickupFromType"] = DELIVERY_FROM_TO_TYPE.customer;
      data["pickupFrom"] = referenceData?.customerAccount?.optionValue;
      data["pickupFromAddress"] = referenceData.shippingAddress?.optionValue;
      data["deliveryToType"] = DELIVERY_FROM_TO_TYPE.customer;
      data["deliveryTo"] = rentalData?.deliveryTo;
      data["deliveryToAddress"] = rentalData?.deliveryToAddress;
      data["startDate"] = referenceData?.estimateStartDate;
      data["endDate"] = referenceData?.estimateStartDate;
      data["wellName"] = referenceData?.wellName?.optionValue;
      data["afeNumber"] = referenceData?.afeNumber;
      if (referenceData?.processor?.optionValue) {
        data["processor"] = referenceData?.processor?.optionValue;
      }
      data["isPickupFromDisable"] = true;
      data["isDeliveryToDisable"] = true;
      setShowTicketDialog({ open: true, ticketType: DELIVERY_TICKET_TYPE.receiving, data: data, rentalJob: rentalData._id });
    }
  }

  const handleCreateLoadingTicketAddAsstes = (data) => {
    const deliveryTicketData: any = {};
    deliveryTicketData._id = data._id;
    deliveryTicketData.rentalJob = showTicketDialog.rentalJob;
    deliveryTicketData.ticketType = DELIVERY_TICKET_TYPE.loading;
    axiosInstance().post(`${rentalManagement.api}/${showTicketDialog.rentalJob}/inventory`, { "products": assetsAdd })
      .then(({ data }) => {
        axiosInstance().post(`${deliveryTicket.api}/auto-create-ticket`, deliveryTicketData).then(({ data }) => {
          setShowTicketDialog({ open: false, ticketType: "", data: {}, rentalJob: null });
          onSuccess()
        }).catch((error) => {
          toastConfig.setToastConfig(error);
        });
      }).catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }

  const cloneRentalDetail = (rentalData) => {
    const data: any = {};
    data._id = referenceData._id;
    data.newRentalJobId = rentalData._id;
    axiosInstance().post(`${rentalManagement.api}/clone-rental-detail`, data)
      .then(({ data }) => {
        let isOnlyAssetAdd = false;
        if (productInventory.some((e) => e.status === INVENTORY_STATUS.inUse)) {
          isOnlyAssetAdd = false
        }
        else {
          isOnlyAssetAdd = true
        }
        handleCreateReceivingTicket({ _id: rentalData._id, deliveryTo: rentalData.customerAccount, deliveryToAddress: rentalData.shippingAddress }, isOnlyAssetAdd)
      }).catch((error) => {
        toastConfig.setToastConfig(error);
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
        <Grid item xs={12} sm={12} md={12} container justify={"flex-end"} >
          <Button size="small"
            color="primary"
            onClick={() => { setShowRentalDialog({ open: true, data: {} }) }}
            variant="contained"
          >
            {`Create ${routes.rentalManagement.title}`}</Button>
          <Box mx={1} />
          <Button size="small"
            color="primary"
            onClick={() => {
              let isOnlyAssetAdd = false;
              if (productInventory.some((e) => e.status === INVENTORY_STATUS.inUse)) {
                isOnlyAssetAdd = false
              }
              else {
                isOnlyAssetAdd = true
              }
              handleCreateReceivingTicket({
                _id: selectedRecords[0]?._id,
                deliveryTo: selectedRecords[0]?.customerAccountId,
                deliveryToAddress: selectedRecords[0]?.shippingAddressId
              }, isOnlyAssetAdd)
            }}
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
        productInventory={productInventory?.filter((e) => e.type === "Asset")}
        products={productInventory?.filter((e) => e.type === "Product")}
        onClose={() => setShowTicketDialog({ open: false, ticketType: "", data: {}, rentalJob: null })}
        onSuccess={(data) => {
          handleCreateLoadingTicketAddAsstes(data)
        }}
      />
    )}
    {showRentalDialog.open && (
      <ManageRentalManagementDialog
        rentalManagementId={null}
        isClone={false}
        open={showRentalDialog.open}
        referenceData={{ warehouse: referenceData?.warehouse?.optionValue }}
        onClose={() => { setShowRentalDialog({ open: false, data: {} }) }}
        onSuccess={(data) => {
          cloneRentalDetail(data)
        }}
      />
    )}
  </Dialog>
  );
}

export default ExistingRentalJob;