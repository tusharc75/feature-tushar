import Box from '@material-ui/core/Box/Box';
import { useState, useEffect, useReducer, useContext, Fragment } from 'react';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import CustomAgGrid, { intialState, reducer } from '../../../components/AgGridComponents/CustomAgGrid';
import { CommonRenderer } from '../../../components/AgGridComponents/CustomAgGridCellRenderers';
import { Link } from 'react-router-dom';
import routes from '../../../components/Helpers/Routes';
import Grid from '@material-ui/core/Grid/Grid';
import { Button, Menu, MenuItem } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import {
  deliveryTicket,
  gridLoadingTimeout,
  DELIVERY_TICKET_STATUS,
  DELIVERY_TICKET_TYPE,
  DELIVERY_TICKET_REFERENCE_TYPE,
  DELIVERY_FROM_TO_TYPE,
  repairOrder,
  INVENTORY_STATUS,
  WORK_ORDER_STATUS
} from '../../../constants/helpers';
import { useHistory } from 'react-router-dom';
import { isMobile, isTablet } from 'react-device-detect';
import CustomSwipableList from '../../../components/SwipableListComponents/CustomSwipableList';
import ManageDeliveryTicket from '../../DeliveryTicket/ManageDeliveryTicket';
import { uniq, map } from 'lodash';
import { ExpandMore } from '@material-ui/icons';

const LoadingTicket = ({ repairOrderData, setNextStep, renderedFrom, allowedToEdit }) => {
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;

  const [gridApi, setGridApi] = useState(null);
  const [columns, setColumns] = useState(null);
  const [anchorActionEl, setAnchorActionEl] = useState(null);
  const [showTicketDialog, setShowTicketDialog] = useState({ open: false, data: {} });

  useEffect(() => {
    fetchRecords();
    getColumn();
  }, []);

  const fetchRecords = async () => {
    setNextStep(false);
    try {
      localStorage.setItem(`${renderedFrom}_selected`, JSON.stringify([]));
      if (gridApi) {
        gridApi.setRowData([]);
      }
      var material: any = [];
      dispatch({ type: 'loading', loading: true });
      const response = await axiosInstance().get(`${repairOrder.api}/${repairOrderData._id}/product-package`);

      const {
        data: { data: deliveryTicketList }
      } = await axiosInstance().get(
        `${deliveryTicket.api}/typewise?referenceType=${DELIVERY_TICKET_REFERENCE_TYPE.repairOrder}&referenceId=${repairOrderData._id}&ticketType=${DELIVERY_TICKET_TYPE.loading}`
      );

      response?.data?.data?.material?.forEach((e: any) => {
        if (e?.type === 'serializedAsset') {
          const obj: any = {};
          obj._id = e?.serializedAssetDetail?._id;
          obj.assetNumber = e?.serializedAssetDetail?.assetNumber;
          obj.serialNumber = e?.serializedAssetDetail?.serialNumber;
          obj.status = e?.serializedAssetDetail?.status;
          obj.productName = e?.serializedAssetDetail?.product?.optionLabel;
          obj.productId = e?.serializedAssetDetail?.product?.optionValue;
          obj.workOrderStatus = e?.workOrder?.status;
          obj.workOrder = e?.workOrder?.optionLabel;
          obj.workOrderId = e?.workOrder?.optionValue;
          obj.isChecked = false;
          obj.hideSelection = [WORK_ORDER_STATUS.completed].includes(obj.workOrderStatus) ? false : true;
          material.push(obj);
        }
      });

      deliveryTicketList?.map((obj) => {
        if (obj.ticketType === DELIVERY_TICKET_TYPE.loading) {
          material.map((d, index) => {
            if (obj?.productInventory?.some((p) => d?._id === p?.optionValue)) {
              material[index]['loadingTicket'] = obj?.ticketName;
              material[index]['loadingTicketId'] = obj?._id;
              material[index]['loadingTicketStatus'] = obj?.status;
            }
          });
        }
      });

      if (material?.filter((e) => e.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered).length > 0) {
        setNextStep(true);
      }

      dispatch({ type: 'initialize', data: material, count: material?.length });
      setTimeout(() => {
        dispatch({ type: 'loading', loading: false });
      }, gridLoadingTimeout);
    } catch (error) {
      dispatch({ type: 'loading', loading: false });
      toastConfig.setToastConfig(error);
    }
  };

  const getColumn = async () => {
    const {
      data: { data }
    } = await axiosInstance().put(`/field/find-field-labels`, {
      fields: [
        {
          resource: 'Serialized Asset',
          fieldNames: ['assetNumber', 'serialNumber']
        },
        {
          resource: 'Product',
          fieldNames: ['productName']
        }
      ]
    });
    const assetFields = data?.find((d) => d.resource === 'Serialized Asset');
    const productFields = data?.find((d) => d.resource === 'Product');
    const column: any = [];
    [...assetFields?.fieldNames, ...productFields?.fieldNames]?.forEach((d: any) => {
      var cellRenderer = 'commonRenderer';
      if (d.fieldName === 'assetNumber') {
        cellRenderer = 'inventoryRenderer';
      }
      if (d.fieldName === 'productName') {
        cellRenderer = 'productNameRenderer';
      }
      column.push({
        field: d.fieldName,
        headerName: d.fieldLabel,
        show: true,
        cellRenderer: cellRenderer
      });
    });
    column.push({ field: 'workOrder', headerName: 'Work Order', show: true, cellRenderer: 'workOrderRenderer' });
    column.push({ field: 'workOrderStatus', headerName: 'Work Order Status', show: true, cellRenderer: 'commonRenderer' });
    column.push({
      field: 'status',
      headerName: 'Status',
      show: true,
      cellRenderer: 'commonRenderer'
    });
    column.push({ field: 'loadingTicket', headerName: 'Loading Ticket', show: true, cellRenderer: 'ticketRenderer' });
    setColumns(column);
  };

  const TicketRenderer = (params) =>
    params?.value ? (
      <Link className="link text-truncate" title={params.value} to={`${routes.deliveryTicketDetail.path}/${params.data.loadingTicketId}`}>
        {params.value}
      </Link>
    ) : (
      <NoDataCell />
    );

  const WorkOrderRenderer = (params) =>
    params?.value ? (
      <Link className="link text-truncate" title={params.value} to={`${routes.workOrderDetail.path}/${params.data.workOrderId}`}>
        {params.value}
      </Link>
    ) : (
      <NoDataCell />
    );

  const InventoryRenderer = (params) => (
    <Fragment>
      <Link className="link text-truncate" title={params.value} to={`${routes.serializedAssetDetail.path}/${params?.data?._id}`}>
        {params.value}
      </Link>
    </Fragment>
  );

  const ProductNameRenderer = (params) => (
    <Link className="link text-truncate" title={params.value} to={`${routes.productDetail.path}/${params.data?.productId}`}>
      {params.value}
    </Link>
  );

  const frameworkComponents = {
    ticketRenderer: TicketRenderer,
    productNameRenderer: ProductNameRenderer,
    inventoryRenderer: InventoryRenderer,
    workOrderRenderer: WorkOrderRenderer,
    commonRenderer: CommonRenderer
  };

  const openActions = (event) => {
    setAnchorActionEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorActionEl(null);
  };

  const handleDeliveryTicketDialog = () => {
    if (selectedRecords.length) {
      const data = {};
      data['ticketName'] = repairOrderData.repairOrderNumber;
      data['referenceId'] = repairOrderData._id;
      data['pickupFromType'] = DELIVERY_FROM_TO_TYPE.plant;
      data['pickupFrom'] = repairOrderData?.warehouse?.optionValue;
      data['pickupFromAddress'] = repairOrderData?.warehouse?.optionValue;
      data['deliveryToType'] = DELIVERY_FROM_TO_TYPE.customer;
      data['deliveryTo'] = repairOrderData?.customerAccount?.optionValue;
      data['deliveryToAddress'] = repairOrderData?.shippingAddress?.optionValue;
      data['startDate'] = new Date();
      data['endDate'] = new Date();
      data['isPickupFromDisable'] = true;
      data['isDeliveryToDisable'] = true;
      if (repairOrderData?.processor?.optionValue) {
        data['processor'] = repairOrderData?.processor?.optionValue;
      }
      data['status'] = DELIVERY_TICKET_STATUS.indTransit;
      setShowTicketDialog({ open: true, data: data });
    }
  };

  const handelProcessTickets = () => {
    let data = {};
    const loadingTicketIds = uniq(map(selectedRecords, 'loadingTicketId'));
    if (loadingTicketIds.length) {
      data['_ids'] = loadingTicketIds?.map((e) => e);
      data['status'] = DELIVERY_TICKET_STATUS.delivered;
      data['signatures'] = [];
      data['warehouse'] = repairOrderData?.warehouse?.optionValue;
      axiosInstance()
        .post(`${deliveryTicket.api}/updatebulk`, data)
        .then(({ data: { data } }) => {
          fetchRecords();
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: `Delivered Successfully`
          });
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  return (
    <>
      <Box display="flex" justifyContent="flex-end" pt={1}>
        <Box display="flex" alignItems="center" gridGap={8}>
          {allowedToEdit && (
            <Fragment>
              <Button
                variant="outlined"
                color="default"
                size="small"
                onClick={openActions}
                aria-controls="action-menu"
                disabled={selectedRecords.length === 0}
                endIcon={<ExpandMore />}
              >
                Actions
              </Button>
              <Menu
                anchorEl={anchorActionEl}
                keepMounted
                getContentAnchorEl={null}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left'
                }}
                id="action-menu"
                open={Boolean(anchorActionEl)}
                onClose={closeActions}
              >
                <MenuItem
                  onClick={() => {
                    closeActions();
                    handleDeliveryTicketDialog();
                  }}
                  disabled={selectedRecords.length === 0 || selectedRecords.some((f) => f.hasOwnProperty('loadingTicketId'))}
                >
                  Create Loading Ticket
                </MenuItem>
                <MenuItem
                  disabled={
                    selectedRecords.length === 0 ||
                    selectedRecords.filter((e: any) => e?.loadingTicketStatus === DELIVERY_TICKET_STATUS.indTransit).length !== selectedRecords.length
                  }
                  onClick={() => {
                    handelProcessTickets();
                    closeActions();
                  }}
                >
                  Delivered to Customer
                </MenuItem>
              </Menu>
              <Box mx={1} />
            </Fragment>
          )}
        </Box>
      </Box>
      <Grid item xs={12} md={12} sm={12} className="mt-3">
        {columns ? (
          isMobile && !isTablet ? (
            <CustomSwipableList
              allowSelection={allowedToEdit}
              allowSwipe={true}
              permissions={true}
              primaryField={columns?.find((d) => d.field)}
              onClick={(data) => {
                history.push(`${routes.serializedAssetDetail.path}/${data._id}`);
              }}
              dataRows={dataRows}
              selectedRecords={selectedRecords}
              dispatch={dispatch}
              onEdit={false}
              extraParamsToCheckDelete={true}
              onDelete={false}
              rowCount={rowCount}
              page={page}
              loading={loading}
              additionalDetails={[]}
              chips={[
                {
                  label: 'Status : ',
                  field: 'status'
                },
                {
                  label: 'Loading Ticket : ',
                  field: 'loadingTicket',
                  onClick: (data) => history.push(`${routes.deliveryTicketDetail.path}/${data.loadingTicketId}`)
                }
              ]}
              owerCollaboratorInitialsOrImages="owerCollaboratorInitialsOrImages"
              onCreate={false}
              showClone={false}
              onClone={() => {}}
              renderedFrom={renderedFrom}
            />
          ) : (
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
              allowAction={false}
              loading={loading}
              isClientSideGrid={true}
              allowSelection={allowedToEdit}
              renderedFrom={renderedFrom}
              refreshGrid={fetchRecords}
            />
          )
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Grid>
      {showTicketDialog.open && (
        <ManageDeliveryTicket
          ticketType={DELIVERY_TICKET_TYPE.loading}
          referenceType={DELIVERY_TICKET_REFERENCE_TYPE.repairOrder}
          referenceData={showTicketDialog.data}
          onClose={() => setShowTicketDialog({ open: false, data: {} })}
          productInventory={selectedRecords}
          products={[]}
          onSuccess={() => {
            setShowTicketDialog({ open: false, data: {} });
            fetchRecords();
          }}
        />
      )}
    </>
  );
};

export default LoadingTicket;
