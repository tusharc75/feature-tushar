import { useState, useContext, useEffect, useReducer, Fragment } from 'react';
import { useHistory, Link } from 'react-router-dom';
import { Grid, Box, IconButton, Button } from '@material-ui/core';
import { Info } from '@material-ui/icons';
import { isMobile, isTablet } from 'react-device-detect';

import HtmlTooltip from 'src/components/CustomTooltipTitle';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import routes from 'src/components/Helpers/Routes';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import CustomAgGrid, { intialState, reducer } from 'src/components/AgGridComponents/CustomAgGrid';
import { CommonRenderer } from 'src/components/AgGridComponents/CustomAgGridCellRenderers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import {
  DELIVERY_FROM_TO_TYPE,
  DELIVERY_TICKET_REFRENCE_TYPE,
  DELIVERY_TICKET_STATUS,
  DELIVERY_TICKET_TYPE,
  gridLoadingTimeout
} from 'src/constants/helpers';
import CustomSwipableList from 'src/components/SwipableListComponents/CustomSwipableList';
import ManageDeliveryTicket from 'src/pages/DeliveryTicket/ManageDeliveryTicket';

const LoadingTicket = ({
  allowedToEdit,
  transferInventoryData,
  setNextStep,
  statusOptions,
  currentStep,
  renderedFrom,
  updateTransferInventoryStatus
}) => {
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();

  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;
  const [downlodingFile, setDownlodingFile] = useState(false);
  const [okBtnLoading, setOkBtnLoading] = useState(false);

  const [statusToUpdate, setStatusToUpdate] = useState({ open: false, isUpdating: false, status: '', message: '' });
  const [anchorEl, setAnchorEl] = useState(null);

  const [showTicketDialog, setShowTicketDialog] = useState({ open: false, data: {} });
  const [showRemoveTicketDialog, setShowRemoveTicketDialog] = useState(false);

  const [uniqueLoadingTicket, setUniqueLoadingTicket] = useState([]);
  const [openDeliveryTicketDialog, setOpenDeliveryTicketDialog] = useState(false);
  const [showProcessDeliveryTicket, setShowProcessDeliveryTicket] = useState(false);

  const [showNonSerializeAsset, setShowNonSerializeAsset] = useState({ open: false, data: {} });
  const [anchorActionEl, setAnchorActionEl] = useState(null);

  useEffect(() => {
    if (!transferInventoryData) return;

    fetchInventories();
  }, [transferInventoryData]);

  const TicketRenderer = (params) =>
    params?.value ? (
      <Link className="link text-truncate" title={params.value} to={`${routes.deliveryTicketDetail.path}/${params.data.loadingTicketId}`}>
        {params.value}
      </Link>
    ) : (
      <NoDataCell />
    );

  const WarehouseRenderer = (params) =>
    params?.value ? (
      <Link className="link text-truncate" title={params.value} to={`${routes.warehouseDetail.path}/${params.data?.warehouse?.optionValue}`}>
        {params.value}
      </Link>
    ) : (
      <NoDataCell />
    );

  const InventoryRenderer = (params) => (
    <Fragment>
      <Link
        className="link text-truncate"
        title={params.value}
        to={`${params.data.type === 'Asset' ? routes.serializedAssetDetail.path : routes.productDetail.path}/${params?.data?._id?.split('_')[0]}`}
      >
        {params.value}
      </Link>
      {params?.data?.nonSerializeAsset && params?.data?.nonSerializeAsset?.length > 0 && (
        <Box ml={1}>
          <HtmlTooltip title={`Non-${routes.serializedAsset.title}`}>
            <IconButton
              size="small"
              onClick={() => {
                setShowNonSerializeAsset({
                  open: true,
                  data: { productName: params?.data?.productName, nonSerializeAsset: params?.data?.nonSerializeAsset }
                });
              }}
            >
              <Info fontSize="small" color={'primary'} />
            </IconButton>
          </HtmlTooltip>
        </Box>
      )}
    </Fragment>
  );

  const ProductNameRenderer = (params) => (
    <Link className="link text-truncate" title={params.value} to={`${routes.productDetail.path}/${params.data?.productId}`}>
      {params.value}
    </Link>
  );

  const columns = [
    {
      field: 'assetNumber',
      headerName: 'Asset Number',
      show: true,
      disabled: true,
      cellRenderer: 'inventoryRenderer'
    },
    { field: 'qty', headerName: 'Qty', show: true, disabled: true, cellRenderer: 'commonRenderer' },
    { field: 'type', headerName: 'Type', show: true, disabled: true, cellRenderer: 'commonRenderer' },
    { field: 'serialNumber', headerName: 'Serial Number', show: true, cellRenderer: 'commonRenderer' },
    { field: 'productName', headerName: 'Product Type', show: true, cellRenderer: 'productNameRenderer' },
    { field: 'loadingTicket', headerName: 'Loading Ticket', show: true, cellRenderer: 'ticketRenderer' },
    { field: 'status', headerName: 'Asset Status', show: true, cellRenderer: 'commonRenderer' }
  ];

  const fetchInventories = () => {
    if (gridApi) {
      gridApi.deselectAll();
    }
    dispatch({ type: 'loading', loading: true });

    axiosInstance()
      .get(`${routes.transferInventory.path}/${transferInventoryData._id}/product`)
      .then(({ data: { data } }) => {
        const { assets, products } = data;

        let rows = [];

        if (assets.length > 0) {
          assets.forEach((asset) => {
            let obj = { ...asset };
            const product = products.find((p) => p._id === asset.parentId);
            obj['assetNumber'] = asset.assetDetail.assetNumber;
            obj['id'] = asset.asset;
            obj['qty'] = 1;
            obj['type'] = 'Asset';
            obj['serialNumber'] = asset.assetDetail.serialNumber;
            obj['productName'] = product?.productDetail.productName;
            obj['productId'] = asset.assetDetail.product;

            rows.push(obj);
          });
        }

        let newProducts = products.filter((p) => p.productDetail.serializedProduct === false);

        if (newProducts.length) {
          newProducts.forEach((product) => {
            let obj = { ...product };
            obj['assetNumber'] = product.productDetail.productName;
            obj['id'] = product.product;
            obj['qty'] = product.qty;
            obj['type'] = 'Product';
            obj['serialNumber'] = product.productDetail.serialNumber;
            obj['productName'] = product?.productDetail.productName;
            obj['productId'] = product.product;

            rows.push(obj);
          });
        }

        dispatch({ type: 'initialize', data: rows, count: rows.length });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      });
  };

  const frameworkComponents = {
    ticketRenderer: TicketRenderer,
    productNameRenderer: ProductNameRenderer,
    inventoryRenderer: InventoryRenderer,
    warehouseRenderer: WarehouseRenderer,
    commonRenderer: CommonRenderer
  };

  const handleLoadingTicketDialog = () => {
    const data = {};
    data['ticketName'] = transferInventoryData.transferNumber;
    data['refrenceId'] = transferInventoryData._id;

    data['pickupFromType'] = DELIVERY_FROM_TO_TYPE.plant;
    data['pickupFrom'] = transferInventoryData.tranferFromPlant.optionValue;
    data['pickupFromAddress'] = transferInventoryData.tranferFromPlant.address;

    data['deliveryToType'] = DELIVERY_FROM_TO_TYPE.plant;
    data['deliveryTo'] = transferInventoryData.tranfertoPlant.optionValue;
    data['deliveryToAddress'] = transferInventoryData.tranfertoPlant.address;

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

    setShowTicketDialog({ open: true, data: data });
  };

  return (
    <Fragment>
      <Box p={1}>
        <Box display="flex" justifyContent="flex-end">
          <Box>
            <Button variant={'outlined'} color="primary" disabled={selectedRecords.length === 0} onClick={handleLoadingTicketDialog} size="small">
              {`Create Loading Ticket`}
            </Button>
          </Box>
        </Box>
      </Box>
      <Box>
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
              refreshGrid={fetchInventories}
            />
          )
        ) : (
          <Box p={2} height={500} bgcolor="white">
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Box>
      {showTicketDialog.open && (
        <ManageDeliveryTicket
          ticketType={DELIVERY_TICKET_TYPE.loading}
          refrenceType={DELIVERY_TICKET_REFRENCE_TYPE.rentalJob}
          refrenceData={showTicketDialog.data}
          onClose={() => setShowTicketDialog({ open: false, data: {} })}
          productInventory={selectedRecords?.filter((e) => e.type === 'Asset')}
          products={selectedRecords?.filter((e) => e.type === 'Product')}
          onSuccess={() => {
            setShowTicketDialog({ open: false, data: {} });
            fetchInventories();
          }}
        />
      )}
    </Fragment>
  );
};

export default LoadingTicket;
