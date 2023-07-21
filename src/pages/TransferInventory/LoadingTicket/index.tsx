import { useState, useContext, useEffect, useReducer, Fragment } from 'react';
import { useHistory, Link } from 'react-router-dom';
import { Grid, Box, IconButton, Button } from '@material-ui/core';
import { isMobile, isTablet } from 'react-device-detect';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import CustomAgGrid, { intialState, reducer } from 'src/components/AgGridComponents/CustomAgGrid';
import { CommonRenderer } from 'src/components/AgGridComponents/CustomAgGridCellRenderers';
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
import CustomSwipableList from 'src/components/SwipableListComponents/CustomSwipableList';
import ManageDeliveryTicket from 'src/pages/DeliveryTicket/ManageDeliveryTicket';
import ReceiveDialog from './ReceiveDialog';
import { useData } from 'src/StateProvider/Provider';
import ConfirmationDialogRaw from 'src/components/Helpers/ConfirmationDialog';
import PreviewDownload from 'src/components/PreviewDownload';

const LoadingTicket = ({ allowedToEdit, transferInventoryData, renderedFrom, updateStatus, canLoad, canReceive }) => {
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();

  const {
    state: { user }
  }: any = useData();

  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;

  const [showTicketDialog, setShowTicketDialog] = useState({ open: false, data: {} });
  const [showConfirmBoxReceive, setShowConfirmBoxReceive] = useState(false);
  const [columns, setColumns] = useState(null);

  const [interPlantTransfer, setInterPlantTransfer] = useState(false);
  const [showConfirmInterPlantTransfer, setShowConfirmInterPlantTransfer] = useState(false);
  const [loadingInterPlantTransfer, setLoadingInterPlantTransfer] = useState(false);

  useEffect(() => {
    fetchFields();
    if (user?.user?.brandPolicy?.storageLocation) {
      if (transferInventoryData?.transferFromPlant?.optionValue === transferInventoryData?.transfertoPlant?.optionValue) {
        setInterPlantTransfer(true);
      }
    }
  }, []);

  useEffect(() => {
    fetchProducts();
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
          field: 'productName',
          primaryField: true,
          headerName: e?.fieldLabel,
          show: true,
          disabled: true,
          cellRenderer: 'productNameRenderer'
        });
      } else if (e?.fieldName === 'serializedProduct') {
        column.push({ field: 'serializedProductShow', headerName: e?.fieldLabel, show: true, cellRenderer: 'commonRenderer' });
      } else {
        column.push({ field: e?.fieldName, headerName: e?.fieldLabel, show: true, cellRenderer: 'commonRenderer' });
      }
    });
    const extracolumns = [
      { field: 'qty', headerName: 'Qty', show: true, disabled: true, cellRenderer: 'commonRenderer' },
      { field: 'serialNumber', headerName: 'Serial Number', show: true, cellRenderer: 'serialNumberRenderer' },
      { field: 'loadingTicket', headerName: 'Loading Ticket', show: true, cellRenderer: 'ticketRenderer' },
      { field: 'status', headerName: 'Status', show: true, cellRenderer: 'commonRenderer' }
    ];
    setColumns([...column, ...extracolumns]);
  };

  const TicketRenderer = (params) =>
    params?.value ? (
      <p className="link text-truncate" title={params.value} onClick={() => window.open(`${routes.deliveryTicketDetail.path}/${params.data.loadingTicketId}`)}>
        {params.value}
      </p>
    ) : (
      <NoDataCell />
    );

  const WarehouseRenderer = (params) =>
    params?.value ? (
      <p className="link text-truncate" title={params.value} onClick={() => window.open(`${routes.warehouseDetail.path}/${params.data?.warehouse?.optionValue}`)}>
        {params.value}
      </p>
    ) : (
      <NoDataCell />
    );

  const InventoryRenderer = (params) => (
    <Fragment>
      <p
        className="link text-truncate"
        title={params.value}
        onClick={() => window.open(`${params.data.type === 'Asset' ? routes.serializedAssetDetail.path : routes.productDetail.path}/${params?.data?._id?.split('_')[0]}`)}
      >
        {params.value}
      </p>
    </Fragment>
  );

  const ProductNameRenderer = (params) => (
    <p className="link text-truncate" title={params.value} onClick={() => window.open(`${routes.productDetail.path}/${params.data?.productId}`)}>
      {params.value}
    </p>
  );

  const fetchProducts = async () => {
    if (gridApi) {
      gridApi.deselectAll();
    }
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

  const SerialNumberRenderer = (params) =>
    params?.data?.serialNumber?.length ? params?.data?.serialNumber?.map((e) => e.serialNumber)?.toString() : <NoDataCell />;

  const frameworkComponents = {
    serialNumberRenderer: SerialNumberRenderer,
    ticketRenderer: TicketRenderer,
    productNameRenderer: ProductNameRenderer,
    inventoryRenderer: InventoryRenderer,
    warehouseRenderer: WarehouseRenderer,
    commonRenderer: CommonRenderer
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

  return (
    <Fragment>
      <Box display="flex" justifyContent="flex-end" m={1}>
        <PreviewDownload
          hideDetailButton={true}
          resource={sidebarResource.transferInventory}
          referenceId={transferInventoryData._id}
          columns={columns?.filter((e) => ['productName', 'productNumber', 'productDescription', 'productDescription', 'qty']?.includes(e.field))} />
        {interPlantTransfer ? (
          <Box ml={1}>
            {allowedToEdit && canReceive && transferInventoryData?.status !== TRANSFER_INVENTORY_STATUS.delivered && (
              <Button
                variant={'contained'}
                color="primary"
                onClick={() => {
                  setShowConfirmInterPlantTransfer(true);
                }}
                size="small"
              >
                {`Receive`}
              </Button>
            )}
          </Box>
        ) : (
          <Box ml={1}>
            {allowedToEdit && canLoad && (
              <Button
                variant={'outlined'}
                color="primary"
                disabled={selectedRecords.length === 0 || selectedRecords.filter((e: any) => !e?.loadingTicketId).length !== selectedRecords.length}
                onClick={handleLoadingTicketDialog}
                size="small"
              >
                {`Create Loading Ticket`}
              </Button>
            )}
            <Box component="span" ml={1} />
            {canReceive && (
              <Button
                variant={'outlined'}
                color="primary"
                onClick={() => {
                  setShowConfirmBoxReceive(true);
                }}
                disabled={
                  selectedRecords.length === 0 ||
                  selectedRecords.filter((e: any) => e?.loadingTicketStatus === DELIVERY_TICKET_STATUS.indTransit).length !== selectedRecords.length
                }
                size="small"
              >
                {`Receive`}
              </Button>
            )}
          </Box>
        )}
      </Box>
      <Box>
        {columns ? (
          isMobile && !isTablet ? (
            <CustomSwipableList
              allowSelection={allowedToEdit || canReceive}
              allowSwipe={true}
              permissions={true}
              primaryField={columns?.find((d: any) => d.primaryField)}
              onClick={(data) => {
                if (data.type === 'Asset') {
                  history.push(`${routes.serializedAssetDetail.path}/${data._id}`);
                } else {
                  history.push(`${routes.productDetail.path}/${data._id}`);
                }
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
                  label: 'Type : ',
                  field: 'type'
                },
                {
                  label: 'Qty : ',
                  field: 'qty'
                },
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
              onClone={() => { }}
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
              allowSelection={allowedToEdit || canReceive}
              renderedFrom={renderedFrom}
              refreshGrid={fetchProducts}
            />
          )
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
            fetchProducts();
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
            fetchProducts();
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
