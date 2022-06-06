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
  gridLoadingTimeout,
  deliveryTicket,
  transferInventory,
  TRANSFER_INVENTORY_STATUS
} from 'src/constants/helpers';
import CustomSwipableList from 'src/components/SwipableListComponents/CustomSwipableList';
import ManageDeliveryTicket from 'src/pages/DeliveryTicket/ManageDeliveryTicket';
import { uniq, map, groupBy } from 'lodash';
import { AiFillFilePdf } from 'react-icons/ai';

const LoadingTicket = ({ allowedToEdit, transferInventoryData, renderedFrom, updateStatus, canLoad, canReceive }) => {

  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();

  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;

  const [showTicketDialog, setShowTicketDialog] = useState({ open: false, data: {} });
  const [showConfirmBoxReceive, setShowConfirmBoxReceive] = useState(false);
  const [downloadingFile, setDownlodingFile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [columns, setColumns] = useState(null)

  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchFields = async () => {
    const column = [];
    const productResult = await axiosInstance().get('/field?resource=Product&view=true')
    const productFields = productResult?.data?.data?.filter((e) => ["productName", "productNumber", "serializedProduct"].includes(e?.fieldData?.fieldName));
    productFields?.forEach((e) => {
      if (e?.fieldData?.fieldName === "productName") {
        column.push({ field: "productName", primaryField: true, headerName: e?.fieldData?.fieldLabel, show: true, disabled: true, cellRenderer: "productNameRenderer" })
      }
      if (e?.fieldData?.fieldName === "productNumber") {
        column.push({ field: "productNumber", headerName: e?.fieldData?.fieldLabel, show: true, cellRenderer: "commonRenderer" })
      }
      if (e?.fieldData?.fieldName === "serializedProduct") {
        column.push({ field: "serializedProductShow", headerName: e?.fieldData?.fieldLabel, show: true, cellRenderer: "commonRenderer" })
      }
    })
    const extracolumns = [
      { field: 'qty', headerName: 'Qty', show: true, disabled: true, cellRenderer: 'commonRenderer' },
      { field: 'serialNumber', headerName: 'Serial Number', show: true, cellRenderer: 'serialNumberRenderer' },
      { field: 'loadingTicket', headerName: 'Loading Ticket', show: true, cellRenderer: 'ticketRenderer' },
      { field: 'status', headerName: 'Status', show: true, cellRenderer: 'commonRenderer' },
    ];

    column.push({
      field: 'serialNumber',
      headerName: 'Serial Number',
      show: true,
      cellRenderer: 'serialNumberRenderer',
    });
    setColumns([...column, ...extracolumns])
  }

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
    </Fragment>
  );

  const ProductNameRenderer = (params) => (
    <Link className="link text-truncate" title={params.value} to={`${routes.productDetail.path}/${params.data?.productId}`}>
      {params.value}
    </Link>
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
        `${deliveryTicket.api}/typewise?refrenceType=${DELIVERY_TICKET_REFRENCE_TYPE.transferInventory}&refrenceId=${transferInventoryData._id}&ticketType=${DELIVERY_TICKET_TYPE.loading}`
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
        obj['productName'] = product.productDetail.productName;
        obj['productNumber'] = product.productDetail.productNumber;
        obj['serializedProduct'] = product.productDetail.serializedProduct;
        obj['serializedProductShow'] = product.productDetail.serializedProduct ? "Yes" : "No";
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
          updateStatus(TRANSFER_INVENTORY_STATUS.delivered)
        }
      };

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

  const SerialNumberRenderer = (params) => (
    params?.data?.serialNumber?.length ?
      params?.data?.serialNumber?.map((e) => e.serialNumber)?.toString() :
      <NoDataCell />
  );

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
    data['refrenceId'] = transferInventoryData?._id;

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

    setShowTicketDialog({ open: true, data: data });
  };

  const handelReceiveAssets = () => {
    setIsLoading(true);
    let data = {};
    const loadingTicketIds = uniq(map(selectedRecords, 'loadingTicketId'));
    if (loadingTicketIds.length) {
      data['_ids'] = loadingTicketIds?.map((e) => e);
      data['status'] = DELIVERY_TICKET_STATUS.delivered;
      data['signatures'] = [];
      axiosInstance()
        .post(`${deliveryTicket.api}/updatebulk`, data)
        .then(({ data: { data } }) => {
          fetchProducts();
          setShowConfirmBoxReceive(false);
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: `Assets Received Successfully`
          });
          setIsLoading(false);
        })
        .catch((error) => {
          setIsLoading(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  return (
    <Fragment>
      <Box display="flex" justifyContent="flex-end" p={1}>
        <Button
          onClick={() => {
            setDownlodingFile(true);
            axiosInstance().get(`${transferInventory.api}/${transferInventoryData._id}/pdf`)
              .then(({ data }) => {
                axiosInstance()
                  .get(`user/download?fileName=${data.data.fileName}`, {
                    responseType: 'blob'
                  })
                  .then(({ data }) => {
                    const file = new Blob([data], { type: 'application/pdf' });
                    const fileURL = URL.createObjectURL(file);
                    const pdfWindow = window.open();
                    pdfWindow.location.href = fileURL;
                    toastConfig.setToastConfig({ open: true, type: 'success', message: 'Preview file downloaded successfully.' });
                    setDownlodingFile(false);
                  })
                  .catch((err) => {
                    toastConfig.setToastConfig(err);
                    setDownlodingFile(false);
                  });
              })
              .catch((err) => {
                toastConfig.setToastConfig(err);
                setDownlodingFile(false);
              });
          }}
          variant={'outlined'}
          color="primary"
          type="button"
          size="small"
          disabled={downloadingFile || dataRows.length === 0}
          startIcon={<AiFillFilePdf />}
        >
          {downloadingFile ? 'Please wait...' : 'Preview'}
        </Button>
        <Box ml={1}>
          {(allowedToEdit && canLoad) &&
            <Button
              variant={'outlined'}
              color="primary"
              disabled={selectedRecords.length === 0 || selectedRecords.filter((e: any) => !e?.loadingTicketId).length !== selectedRecords.length}
              onClick={handleLoadingTicketDialog}
              size="small"
            >
              {`Create Loading Ticket`}
            </Button>
          }
          <Box component="span" ml={1} />
          {canReceive &&
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
          }
        </Box>
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
                if (data.type === "Asset") {
                  history.push(`${routes.serializedAssetDetail.path}/${data._id}`);
                }
                else {
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
          <Box p={2} height={500} bgcolor="white">
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Box>
      {showTicketDialog.open && (
        <ManageDeliveryTicket
          ticketType={DELIVERY_TICKET_TYPE.loading}
          refrenceType={DELIVERY_TICKET_REFRENCE_TYPE.transferInventory}
          refrenceData={showTicketDialog.data}
          onClose={() => setShowTicketDialog({ open: false, data: {} })}
          productInventory={selectedRecords?.filter((e) => e.type === 'Asset')}
          products={selectedRecords?.filter((e) => e.type === 'Product')}
          serialNumber={selectedRecords?.filter((e) => e.type === 'Product')?.map((e) => e?.serialNumber?.map((e) => e._id))?.flat()}
          onSuccess={() => {
            setShowTicketDialog({ open: false, data: {} });
            fetchProducts();
          }}
        />
      )}
      {showConfirmBoxReceive && (
        <ConfirmationDialog
          okBtnLoading={isLoading}
          open={showConfirmBoxReceive}
          message={`Are you sure have been received ?`}
          onClose={() => {
            setShowConfirmBoxReceive(false);
          }}
          onOk={handelReceiveAssets}
        />
      )}
    </Fragment>
  );
};

export default LoadingTicket;
