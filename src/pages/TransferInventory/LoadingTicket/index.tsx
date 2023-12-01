import { useState, useContext, useEffect, Fragment } from 'react';
import { useHistory } from 'react-router-dom';
import { Box, Button } from '@material-ui/core';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import {
  DELIVERY_FROM_TO_TYPE,
  DELIVERY_TICKET_REFERENCE_TYPE,
  DELIVERY_TICKET_STATUS,
  DELIVERY_TICKET_TYPE,
  gridLoadingTimeout,
  deliveryTicket,
  TRANSFER_INVENTORY_STATUS,
  sidebarResource
} from 'src/constants/helpers';
import ManageDeliveryTicket from 'src/pages/DeliveryTicket/ManageDeliveryTicket';
import ReceiveDialog from './ReceiveDialog';
import { useData } from 'src/StateProvider/Provider';
import ConfirmationDialogRaw from 'src/components/Helpers/ConfirmationDialog';
import PreviewDownload from 'src/components/PreviewDownload';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTableNew';
import { ExpandMore } from '@material-ui/icons';
import { Menu, MenuItem } from '@material-ui/core';

const LoadingTicket = ({ allowedToEdit, transferInventoryData, renderedFrom, updateStatus, canLoad, canReceive, stepFullScreen }) => {

  const toastConfig = useContext(CustomToastContext);

  const {
    state: { user }
  }: any = useData();
  const { state, dispatch } = useTableReducer();
  const { dataRows, selectedRecords } = state;

  const [showTicketDialog, setShowTicketDialog] = useState({ open: false, data: {} });
  const [showConfirmBoxReceive, setShowConfirmBoxReceive] = useState(false);
  const [columns, setColumns] = useState(null);

  const [interPlantTransfer, setInterPlantTransfer] = useState(false);
  const [showConfirmInterPlantTransfer, setShowConfirmInterPlantTransfer] = useState(false);
  const [loadingInterPlantTransfer, setLoadingInterPlantTransfer] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    fetchFields();
    if (user?.user?.brandPolicy?.storageLocation) {
      if (transferInventoryData?.transferFromPlant?.optionValue === transferInventoryData?.transfertoPlant?.optionValue) {
        setInterPlantTransfer(true);
      }
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchFields = async () => {
    const column = [];
    const {
      data: { data }
    } = await axiosInstance().put(`/field/find-field-labels`, {
      fields: [
        {
          resource: 'Product',
          fieldNames: ['productName', 'productNumber', 'productDescription', 'serializedProduct']
        }
      ]
    });
    const productFields = data?.find((e) => e.resource === 'Product')?.fieldNames || [];
    productFields?.forEach((e) => {
      if (e?.fieldName === 'productName') {
        column.push({
          accessor: 'productName',
          primaryField: true,
          Header: e?.fieldLabel,
          show: true,
          disabled: true,
          Cell: ({ row }) => (<div>
            <p className="link text-truncate" title={row.original?.productName} onClick={() => window.open(`${routes.productDetail.path}/${row.original?.productId}`)}>
              {row.original?.productName}
            </p>
          </div>)
        });
      } else if (e?.fieldName === 'serializedProduct') {
        column.push({
          accessor: 'serializedProductShow', Header: e?.fieldLabel, show: true,
          Cell: ({ row }) => (row.original?.serializedProductShow ? <div>{row.original?.serializedProductShow}</div> : <NoDataCell />)
        });
      } else {
        column.push({
          accessor: e?.fieldName, Header: e?.fieldLabel, show: true,
          Cell: ({ row }) => (row.original[e?.fieldName] ? <div>{row.original[e?.fieldName]}</div> : <NoDataCell />)
        });
      }
    });
    const extracolumns = [
      {
        accessor: 'qty', Header: 'Qty', show: true, disabled: true,
        Cell: ({ row }) => (row.original?.qty ? <div>{row.original?.qty}</div> : <NoDataCell />)
      },
      {
        accessor: 'serialNumber', Header: 'Serial Number', show: true,
        Cell: ({ row }) => (row.original?.serialNumber?.length ? <div>{row.original?.serialNumber?.map((e) => e.serialNumber)?.toString()}</div> : <NoDataCell />)
      },
      {
        accessor: 'loadingTicket',
        Header: 'Loading Ticket',
        show: true,
        Cell: ({ row }) =>
          row.original?.loadingTicket ? (
            <p
              className="link text-truncate"
              title={row.original?.loadingTicket}
              onClick={() => window.open(`${routes.deliveryTicketDetail.path}/${row.original?.loadingTicketId}`)}
            >
              {row.original?.loadingTicket}
            </p>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'status', Header: 'Status', show: true,
        Cell: ({ row }) => (row.original?.status ? <div>{row.original?.status}</div> : <NoDataCell />)
      }
    ];
    setColumns([...column, ...extracolumns]);
  };

  const fetchData = async () => {
    dispatch({ type: 'selection', selectedRecords: [] });
    dispatch({ type: 'loading', loading: true });
    try {
      const {
        data: { data: productsData }
      } = await axiosInstance().get(`${routes.transferInventory.path}/${transferInventoryData._id}/product`);
      const {
        data: { data: deliveryTicketList }
      } = await axiosInstance().get(
        `${deliveryTicket.api}/typewise?referenceType=${DELIVERY_TICKET_REFERENCE_TYPE.transferInventory}&referenceId=${transferInventoryData._id}&ticketType=${DELIVERY_TICKET_TYPE.loading}`
      );

      const { assets, products, serialNumber } = productsData;
      let rows = [];

      assets?.forEach((asset) => {
        let obj = { ...asset };
        const product = products.find((p) => p._id === asset._id);
        obj['assetNumber'] = asset?.assetDetail?.assetNumber;
        obj['serialNumber'] = asset.assetDetail?.serialNumber;
        obj['status'] = asset.assetDetail?.status;
        obj['_id'] = asset.asset;
        obj['qty'] = 1;
        obj['type'] = 'Asset';
        obj['productName'] = product?.productDetail?.productName;
        obj['productId'] = product?.productDetail?._id;
        obj['isChecked'] = false;
        rows.push(obj);
      });

      products?.forEach((product) => {
        let obj = { ...product };
        obj['productId'] = product?.product;
        obj['_id'] = product.product;
        obj['productName'] = product?.productDetail?.productName;
        obj['productNumber'] = product?.productDetail?.productNumber;
        obj['productDescription'] = product?.productDetail?.productDescription;
        obj['serializedProduct'] = product?.productDetail?.serializedProduct;
        obj['serializedProductShow'] = product?.productDetail?.serializedProduct ? 'Yes' : 'No';
        obj['qty'] = product.qty;
        obj['type'] = 'Product';
        obj['isChecked'] = false;
        obj['serialNumber'] = serialNumber?.filter((e) => e.product === product?.product);
        rows.push(obj);
      });

      deliveryTicketList?.map((obj) => {
        rows.map((d, index) => {
          if (obj?.productInventory?.some((p) => p?.optionValue === d?._id)) {
            rows[index]['loadingTicket'] = obj?.ticketName;
            rows[index]['loadingTicketId'] = obj?._id;
            rows[index]['loadingTicketStatus'] = obj?.status;
          } else if (obj?.products?.some((p) => p?.product === d?._id)) {
            rows[index]['loadingTicket'] = obj?.ticketName;
            rows[index]['loadingTicketId'] = obj?._id;
            rows[index]['loadingTicketStatus'] = obj?.status;
            rows[index]['status'] = obj?.status;
          }
        });
      });

      if (transferInventoryData.status !== TRANSFER_INVENTORY_STATUS.delivered) {
        if (rows?.filter((d) => d?.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered).length === rows?.length) {
          updateStatus(TRANSFER_INVENTORY_STATUS.delivered);
        }
      }

      dispatch({ type: 'initialize', data: rows, count: rows.length });
      setTimeout(() => {
        dispatch({ type: 'loading', loading: false });
      }, gridLoadingTimeout);
    } catch (err) {
      toastConfig.setToastConfig(err);
      setTimeout(() => {
        dispatch({ type: 'loading', loading: false });
      }, gridLoadingTimeout);
    }
  };

  const handleLoadingTicketDialog = () => {
    const data = {};
    data['ticketName'] = transferInventoryData?.transferNumber;
    data['referenceId'] = transferInventoryData?._id;

    data['pickupFromType'] = DELIVERY_FROM_TO_TYPE.plant;
    data['pickupFrom'] = transferInventoryData?.transferFromPlant.optionValue;
    data['pickupFromAddress'] = transferInventoryData?.transferFromPlant.address;

    data['deliveryToType'] = DELIVERY_FROM_TO_TYPE.plant;
    data['deliveryTo'] = transferInventoryData?.transfertoPlant.optionValue;
    data['deliveryToAddress'] = transferInventoryData?.transfertoPlant.address;

    data['startDate'] = transferInventoryData?.estimateStartDate;
    data['endDate'] = transferInventoryData?.estimateStartDate;
    data['isPickupFromDisable'] = true;
    data['isDeliveryToDisable'] = true;

    data['wellName'] = '';
    data['afeNumber'] = '';
    if (transferInventoryData?.processor?.optionValue) {
      data['processor'] = transferInventoryData?.processor?.optionValue;
    }
    data['status'] = DELIVERY_TICKET_STATUS.indTransit;

    if (user?.user?.brandPolicy?.storageLocation) {
      if (transferInventoryData?.transferFromStorageLocation?.optionValue) {
        data['pickupFromStorageLocation'] = transferInventoryData?.transferFromStorageLocation.optionValue;
        data['isPickupFromStorageLocationDisable'] = true;
      }
      if (transferInventoryData?.transferToStorageLocation?.optionValue) {
        data['deliveryToStorageLocation'] = transferInventoryData?.transferToStorageLocation.optionValue;
        data['isDeliveryToStorageLocationDisable'] = true;
      }
    }

    setShowTicketDialog({ open: true, data: data });
  };

  const handleInterPlantTransfer = () => {
    setLoadingInterPlantTransfer(true);
    axiosInstance()
      .put(
        `${routes.transferInventory.path}/${transferInventoryData._id}/transfer-inter-plant`,
        dataRows?.map((e) => {
          return { product: e.productId, qty: e.qty };
        })
      )
      .then(({ data: { data } }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: `Inventory Received Successfully`
        });
        updateStatus(TRANSFER_INVENTORY_STATUS.delivered);
        setShowConfirmInterPlantTransfer(false);
        setLoadingInterPlantTransfer(false);
      })
      .catch((error) => {
        setLoadingInterPlantTransfer(false);
        toastConfig.setToastConfig(error);
      });
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  return (
    <Fragment>
      <Box display="flex" justifyContent="space-between" m={1}>
        <PreviewDownload
          fileName={`${routes.transferInventory.title}-${transferInventoryData?.transferNumber}`}
          hideDetailButton={true}
          resource={sidebarResource.transferInventory}
          referenceId={transferInventoryData?._id}
          columns={columns?.filter((e) => ['productName', 'productNumber', 'productDescription', 'productDescription', 'qty']?.includes(e.accessor))}
        />
        <Box display="flex">
          <Button
            variant={'outlined'}
            color="default"
            size="small"
            onClick={openActions}
            className={`new-dropdown-v1`}
            aria-controls="action-menu"
            endIcon={<ExpandMore />}
            disabled={selectedRecords?.length ? false : true}
          >
            Actions
          </Button>
          <Menu
            anchorEl={anchorEl}
            keepMounted
            getContentAnchorEl={null}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left'
            }}
            id="action-menu"
            open={Boolean(anchorEl)}
            onClose={closeActions}
          >
            {interPlantTransfer ? (
              allowedToEdit && canReceive && transferInventoryData?.status !== TRANSFER_INVENTORY_STATUS.delivered && (
                <MenuItem
                  onClick={() => {
                    closeActions()
                    setShowConfirmInterPlantTransfer(true);
                  }}
                >
                  {`Receive`}
                </MenuItem>
              )
            ) : (
              <>
                {allowedToEdit && canLoad && (
                  <MenuItem
                    disabled={selectedRecords.length === 0 || selectedRecords.filter((e: any) => !e?.loadingTicketId).length !== selectedRecords.length}
                    onClick={() => {
                      closeActions()
                      handleLoadingTicketDialog()
                    }}
                  >
                    {`Create Loading Ticket`}
                  </MenuItem>
                )}
                {canReceive && (
                  <MenuItem
                    onClick={() => {
                      closeActions()
                      setShowConfirmBoxReceive(true);
                    }}
                    disabled={
                      selectedRecords.length === 0 ||
                      selectedRecords.filter((e: any) => e?.loadingTicketStatus === DELIVERY_TICKET_STATUS.indTransit).length !== selectedRecords.length
                    }
                  >
                    {`Receive`}
                  </MenuItem>
                )}
              </>
            )}
          </Menu>
        </Box>

      </Box>
      <Box>
        {columns ? (
          <CustomReactTable
            height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
            refreshGrid={fetchData}
            hideAction={!allowedToEdit || transferInventoryData?.status === TRANSFER_INVENTORY_STATUS.delivered}
            hideSelection={!allowedToEdit || transferInventoryData?.status === TRANSFER_INVENTORY_STATUS.delivered}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Box>
      {showTicketDialog.open && (
        <ManageDeliveryTicket
          ticketType={DELIVERY_TICKET_TYPE.loading}
          referenceType={DELIVERY_TICKET_REFERENCE_TYPE.transferInventory}
          referenceData={showTicketDialog.data}
          onClose={() => setShowTicketDialog({ open: false, data: {} })}
          productInventory={selectedRecords?.filter((e) => e.type === 'Asset')}
          products={selectedRecords?.filter((e) => e.type === 'Product')}
          serialNumber={selectedRecords
            ?.filter((e) => e.type === 'Product')
            ?.map((e) => e?.serialNumber?.map((e) => e._id))
            ?.flat()}
          onSuccess={() => {
            setShowTicketDialog({ open: false, data: {} });
            fetchData();
          }}
        />
      )}
      {showConfirmBoxReceive && (
        <ReceiveDialog
          handleClose={() => {
            setShowConfirmBoxReceive(false);
          }}
          handleSucess={() => {
            setShowConfirmBoxReceive(false);
            fetchData();
          }}
          selectedRecords={selectedRecords}
          transferInventoryData={transferInventoryData}
        />
      )}
      {showConfirmInterPlantTransfer && (
        <ConfirmationDialogRaw
          okBtnLoading={loadingInterPlantTransfer}
          open={showConfirmInterPlantTransfer}
          message={`Are you sure you have received inventory?`}
          onClose={() => {
            setShowConfirmInterPlantTransfer(false);
          }}
          onOk={handleInterPlantTransfer}
        />
      )}
    </Fragment>
  );
};

export default LoadingTicket;
