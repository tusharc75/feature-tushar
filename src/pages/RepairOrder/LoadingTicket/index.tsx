import { Button, IconButton, Menu, MenuItem } from '@mui/material';
import Box from '@mui/material/Box/Box';
import Grid from '@mui/material/Grid/Grid';
import { ExpandMore } from '@material-ui/icons';
import { map, uniq } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import { FiExternalLink } from 'react-icons/fi';
import { useData } from 'src/StateProvider/Provider';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../../axios/axiosInstance';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import routes from '../../../components/Helpers/Routes';
import {
  ASSET_STATUS,
  DELIVERY_FROM_TO_TYPE,
  DELIVERY_TICKET_REFERENCE_TYPE,
  DELIVERY_TICKET_STATUS,
  DELIVERY_TICKET_TYPE,
  MATERIAL_TYPE,
  WORK_ORDER_STATUS,
  deliveryTicket,
  gridLoadingTimeout,
  repairOrder
} from '../../../constants/helpers';
import ManageDeliveryTicket from '../../DeliveryTicket/ManageDeliveryTicket';

const LoadingTicket = ({ repairOrderData, setNextStep, renderedFrom, allowedToEdit }) => {
  const toastConfig = useContext(CustomToastContext);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { selectedRecords } = state;

  const [columns, setColumns] = useState(null);
  const [anchorActionEl, setAnchorActionEl] = useState(null);
  const [showTicketDialog, setShowTicketDialog] = useState({ open: false, data: {} });

  const {
    state: { user }
  }: any = useData();

  useEffect(() => {
    setNextStep(false);
    getColumn();
    if (user.user.brandPolicy?.repairOrderAutoLoadingTicket) {
      createLoadingTicket();
    } else {
      fetchRecords();
    }
  }, []);

  const createLoadingTicket = async () => {
    await axiosInstance()
      .put(`${repairOrder.api}/loading-ticket/${repairOrderData._id}`)
      .then(({ data: { data } }) => {
        if (data?.length) {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: `Loading Ticket Created Successfully`
          });
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
    fetchRecords();
  };

  const fetchRecords = async () => {
    try {
      var material: any = [];

      dispatch({ type: 'selection', selectedRecords: [] });
      dispatch({ type: 'loading', loading: true });
      const response = await axiosInstance().get(`${repairOrder.api}/${repairOrderData._id}/product-package`);

      const {
        data: { data: deliveryTicketList }
      } = await axiosInstance().get(
        `${deliveryTicket.api}/typewise?referenceType=${DELIVERY_TICKET_REFERENCE_TYPE.repairOrder}&referenceId=${repairOrderData._id}&ticketType=${DELIVERY_TICKET_TYPE.loading}`
      );

      response?.data?.data?.material?.forEach((e: any) => {
        if (e?.type === MATERIAL_TYPE.serializedAsset) {
          const obj: any = {};
          obj._id = e?.serializedAssetDetail?._id;
          obj.uniqueId = e?.serializedAssetDetail?._id;
          obj.assetNumber = e?.serializedAssetDetail?.assetNumber;
          obj.serialNumber = e?.serializedAssetDetail?.serialNumber;
          obj.status = e?.serializedAssetDetail?.status;
          obj.productName = e?.serializedAssetDetail?.product?.optionLabel;
          obj.productId = e?.serializedAssetDetail?.product?.optionValue;
          obj.workOrderStatus = e?.workOrder?.status;
          obj.workOrder = e?.workOrder?.optionLabel;
          obj.workOrderId = e?.workOrder?.optionValue;
          obj.hideSelection = [WORK_ORDER_STATUS.completed].includes(obj.workOrderStatus) ? false : true;
          material.push(obj);
        }
      });

      deliveryTicketList?.map((obj) => {
        if (obj.ticketType === DELIVERY_TICKET_TYPE.loading) {
          material.map((d, index) => {
            if (obj?.assets?.some((p) => d?._id === p?.asset)) {
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
      var cell = ({ row }) => (row?.original[d.fieldName] ? <h5 className="text-truncate">{row?.original[d.fieldName]}</h5> : <NoDataCell />);
      if (d.fieldName === 'assetNumber') {
        cell = ({ row }) =>
          row?.original?.assetNumber ? (
            <div className="d-flex items-center gap-2">
              <h5 className="text-truncate">{row?.original?.assetNumber}</h5>
              <IconButton
                size="small"
                onClick={() => {
                  window.open(`${routes.serializedAssetDetail.path}/${row?.original?._id}`);
                }}
              >
                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
              </IconButton>
            </div>
          ) : (
            <NoDataCell />
          );
      }
      if (d.fieldName === 'productName') {
        cell = ({ row }) =>
          row?.original?.productName ? (
            <div className="d-flex items-center gap-2">
              <h5 className="text-truncate">{row?.original?.productName}</h5>
              <IconButton
                size="small"
                onClick={() => {
                  window.open(`${routes.productDetail.path}/${row?.original?.productId}`);
                }}
              >
                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
              </IconButton>
            </div>
          ) : (
            <NoDataCell />
          );
      }
      column.push({
        accessor: d.fieldName,
        Header: d.fieldLabel,
        Cell: cell
      });
    });
    column.push({
      accessor: 'workOrder',
      Header: 'Work Order',
      Cell: ({ row }) =>
        row?.original?.workOrder ? (
          <div className="d-flex align-items-center gap-2">
            <h5 className="text-truncate">{row?.original?.workOrder}</h5>
            <IconButton
              size="small"
              onClick={() => {
                window.open(`${routes?.workOrderDetail?.path}/${row?.original?.workOrderId}`);
              }}
            >
              <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
            </IconButton>
          </div>
        ) : (
          <NoDataCell />
        )
    });
    column.push({
      accessor: 'workOrderStatus',
      Header: 'Work Order Status',
      Cell: ({ row }) => (row?.original?.workOrderStatus ? <h5 className="text-truncate">{row?.original?.workOrderStatus}</h5> : <NoDataCell />)
    });
    column.push({
      accessor: 'status',
      Header: 'Status',
      Cell: ({ row }) => (row?.original?.status ? <h5 className="text-truncate">{row?.original?.status}</h5> : <NoDataCell />)
    });
    column.push({
      accessor: 'loadingTicket',
      Header: 'Loading Ticket',
      Cell: ({ row }) =>
        row?.original?.loadingTicket ? (
          <div className="d-flex align-items-center gap-2">
            <h5 className="text-truncate">{row?.original?.loadingTicket}</h5>
            <IconButton
              size="small"
              onClick={() => {
                window.open(`${routes.deliveryTicketDetail.path}/${row?.original?.loadingTicketId}`);
              }}
            >
              <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
            </IconButton>
          </div>
        ) : (
          <NoDataCell />
        )
    });
    setColumns(column);
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
      data['status'] = DELIVERY_TICKET_STATUS.inTransit;
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
                className="new-dropdown-v1"
                id={'details-page-action-button'}
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
                    selectedRecords.filter((e: any) => e?.loadingTicketStatus === DELIVERY_TICKET_STATUS.inTransit).length !== selectedRecords.length
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
          <CustomReactTable
            height={'calc(100vh - 393px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchRecords}
            isClientSideGrid={true}
            hideSelection={!allowedToEdit}
            hideAction={true}
            setWholeRowsCellColor={(rowData) => (rowData?.status === ASSET_STATUS.scrap ? 'dark-gray-1' : '')}
          />
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
          assets={selectedRecords}
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
