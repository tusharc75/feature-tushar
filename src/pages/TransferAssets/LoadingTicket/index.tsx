import { useState, useReducer, Fragment, useContext, useEffect, FC } from 'react';
import { Button, Box } from '@material-ui/core';
import { Link, useHistory } from 'react-router-dom';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { deliveryTicket, sidebarResource, DELIVERY_TICKET_STATUS, DELIVERY_TICKET_TYPE, DELIVERY_TICKET_REFRENCE_TYPE, DELIVERY_FROM_TO_TYPE } from 'src/constants/helpers';
import { isMobile, isTablet } from 'react-device-detect';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import ManageDeliveryTicket from 'src/pages/DeliveryTicket/ManageDeliveryTicket';
import { CommonRenderer, DateRenderer } from 'src/components/AgGridComponents/CustomAgGridCellRenderers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CustomAgGrid, { reducer, intialState } from 'src/components/AgGridComponents/CustomAgGrid';
import CustomSwipableList from 'src/components/SwipableListComponents/CustomSwipableList';
import { AiFillFilePdf } from 'react-icons/ai';
import { IoMdDownload } from 'react-icons/io';
import { uniq, map, groupBy } from 'lodash';

interface LoadingGridProps {
  fetchAssets: any;
  permissions: any;
  transferAssetData?: any;
  transferAssetId: string | any;
  setNextStep: any;
  setPrevStep: any;
  currentStep: number;
  setTickets?: any;
  setExistingAssets?: any;
  setTransferIsEnded?: any;
  updateTransferStatus?: any;
  handleViewPdf?: any;
  fileDownloading?: boolean;
  isTransferEnded: boolean;
  renderedFrom?: string;
}

const LoadingTicketGrid: FC<LoadingGridProps> = (props) => {
  const {
    permissions,
    fetchAssets,
    transferAssetId,
    transferAssetData,
    setTickets,
    setNextStep,
    setExistingAssets,
    setTransferIsEnded,
    updateTransferStatus,
    handleViewPdf,
    fileDownloading,
    isTransferEnded,
    renderedFrom
  } = props;
  const toastConfig = useContext(CustomToastContext);

  const [assetWithNoTicket, setAssetWithNoTicket] = useState([]);
  const [isRemovingTicket, setRemovingTicket] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [showConfirmBoxReceive, setShowConfirmBoxReceive] = useState(false);

  const history = useHistory();

  const [showTicketDialog, setShowTicketDialog] = useState({ open: false, data: {} });

  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;
  const columns = [
    { field: 'assetNumber', headerName: 'Asset Number', show: true, disabled: true, cellRenderer: 'assetRenderer' },
    { field: 'serialNumber', headerName: 'Serial Number', show: true, cellRenderer: 'commonRenderer' },
    { field: 'loadingTicket', headerName: 'Loading Ticket', show: true, cellRenderer: 'ticketRenderer' },
    { field: 'productDescription', headerName: 'Product Type', show: true, cellRenderer: 'productRenderer' },
    { field: 'status', headerName: 'Status', show: true, cellRenderer: 'commonRenderer' },
    { field: 'loadingTicketStatus', headerName: 'Loading Ticket Status', show: true, cellRenderer: 'commonRenderer' }
  ];

  const AssetRenderer = (params) =>
    params.value ? (
      <Link className="link cursor-pointer" to={`${routes.serializedAssetDetail.path}/${params.data._id}`}>
        <p title={params.value}>{params.value}</p>
      </Link>
    ) : (
      <NoDataCell />
    );

  const TicketRenderer = (params) =>
    params.value ? (
      <Link className="link cursor-pointer" to={`${routes.deliveryTicketDetail.path}/${params.data.loadingTicketId}`}>
        <p title={params.value}>{params.value}</p>
      </Link>
    ) : (
      <NoDataCell />
    );

  const ProductRenderer = (params) =>
    params.value ? (
      <Link className="link cursor-pointer" to={`${routes.productDetail.path}/${params.data.productId}`}>
        <p title={params.value}>{params.value}</p>
      </Link>
    ) : (
      <NoDataCell />
    );

  const frameworkComponents = {
    ticketRenderer: TicketRenderer,
    productRenderer: ProductRenderer,
    assetRenderer: AssetRenderer,
    commonRenderer: CommonRenderer,
    dateRenderer: DateRenderer
  };

  useEffect(() => {
    if (transferAssetId) {
      fetchAssetsData(true);
    }
  }, [transferAssetId]);

  const fetchAssetsData = async (forceRefresh) => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    try {
      let assetData = await fetchAssets(forceRefresh);
      let ticketData: any = await fetchLoadingTickets();
      ticketData = ticketData.filter((ticket: any) => ticket.ticketType === DELIVERY_TICKET_TYPE.loading)
      for (let i = 0; i < ticketData.length; i++) {
        for (let j = 0; j < assetData.length; j++) {
          if (ticketData[i]?.productInventory.some((asset: any) => assetData[j]._id === (typeof asset === 'object' ? asset.optionValue : asset))) {
            assetData[j].loadingTicket = ticketData[i].ticketName;
            assetData[j].loadingTicketId = ticketData[i]._id;
            assetData[j].loadingTicketStatus = ticketData[i].status;
          }
        }
      }
      setExistingAssets(assetData);
      dispatch({ type: 'initialize', data: assetData, count: assetData.length });
      dispatch({ type: 'loading', loading: false });
    } catch (error) {
      dispatch({ type: 'loading', loading: false });
      toastConfig.setToastConfig(error);
    }
  };

  const fetchLoadingTickets = () =>
    new Promise((resolve, reject) => {
      axiosInstance()
        .get(`${routes.deliveryTicket.path}/typewise?refrenceType=Transfer Asset&refrenceId=${transferAssetId}`)
        .then(({ data: { data } }) => {
          resolve(data);
          setTickets(data);
        })
        .catch((err) => {
          reject(err);
        });
    });

  useEffect(() => {
    if (selectedRecords.length > 0) {
      const inventoryWithNoTicket = selectedRecords.filter((asset: any) => !asset?.hasOwnProperty('loadingTicket'));
      setAssetWithNoTicket(inventoryWithNoTicket);
    }
    if (dataRows.length) {
      const inventoryDelivered = dataRows.filter((asset: any) => asset['loadingTicketStatus'] === 'Delivered');
      const inventoryLost = dataRows.filter((asset: any) => asset?.status === 'Lost');
      if (inventoryDelivered.length > 0) {
        setNextStep(true);
      } else {
        setNextStep(false);
      }
      if (transferAssetData?.transferType === 'Internal') {
        if (inventoryDelivered.length === dataRows.filter(d => d.status !== "Lost").length || inventoryLost.length === dataRows.length) {
          setTransferIsEnded(true);
          updateTransferStatus('Completed');
        } else {
          setTransferIsEnded(false);
        }
      }
    }
  }, [dataRows, selectedRecords]);

  const handleRemoveTicket = () => {
    setRemovingTicket(true);
    const groupByCalls = groupBy(selectedRecords, 'loadingTicketId');
    let apiCalls = [];

    Object.keys(groupByCalls).forEach((key) => {
      apiCalls.push(axiosInstance().put(`${deliveryTicket.api}/${key}/assets`, { ids: groupByCalls[key].map((m) => m._id) }));
    });

    Promise.all(apiCalls)
      .then(() => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: `Selected records removed from assiged ${sidebarResource.deliveryTicket}(s)`
        });
        fetchAssetsData(true);
        setRemovingTicket(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      })
      .finally(() => {
        setRemovingTicket(false);
        setShowConfirmBox(false);
      });
  };

  const handelReceiveAssets = () => {
    let data = {}
    const loadingTicketIds = uniq(map(selectedRecords, 'loadingTicketId'));
    if (loadingTicketIds.length) {
      data["_ids"] = loadingTicketIds?.map((e) => e);
      data["status"] = DELIVERY_TICKET_STATUS.delivered
      data["signatures"] = []
      axiosInstance().post(`${deliveryTicket.api}/updatebulk`, data).then(({ data: { data } }) => {
        fetchAssetsData(true)
        setShowConfirmBoxReceive(false)
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: `Assets Received Successfully`
        });
      }).catch((error) => {
        toastConfig.setToastConfig(error);
      });
    }
  }

  return (
    <Fragment>
      <Box display="flex" flexDirection={isMobile ? "row-reverse" : 'row'} justifyContent={isMobile ? "flex-end" : "space-between"} mx="4px">
        <Box>
          {(permissions?.transferAsset?.isRead && !isMobile) && !isMobile && (
            <Button
              variant={"outlined"}
              color="primary"
              type="button"
              size="small"
              startIcon={<AiFillFilePdf />}
              disabled={fileDownloading}
              onClick={() => {
                handleViewPdf(false);
              }}
            >
              {fileDownloading ? 'Please wait...' : 'Preview'}
            </Button>
          )}
          <Box component="span" mx={1} />
          {permissions?.transferAsset?.isRead && (
            <Button
              variant={isMobile && !isTablet ? "text" : "outlined"}
              color="primary"
              type="button"
              size="small"
              style={isMobile && !isTablet ? { color: "var(--warning-darken)" } : {}}
              startIcon={isMobile ? '' : <IoMdDownload />}
              disabled={fileDownloading}
              onClick={() => {
                handleViewPdf(true);
              }}
            >
              {isMobile && !isTablet ? <IoMdDownload size={20} /> : fileDownloading ? 'Please wait...' : 'Download'}
            </Button>
          )}
          <Box component="span" mx={1} />
        </Box>
        {!isTransferEnded && <Box >
          {permissions?.transferAsset.isUpdate && (
            <Fragment>
              <Button
                variant="contained"
                size="small"
                color="primary"
                disabled={
                  selectedRecords.length === 0 ||
                  selectedRecords.filter((asset) => asset?.hasOwnProperty('loadingTicket')).length > 0 ||
                  selectedRecords.filter((asset: any) => asset?.status === 'Lost').length > 0
                }
                onClick={() => {
                  const data: any = {}
                  data["refrenceId"] = transferAssetData._id
                  data["ticketName"] = transferAssetData.transferAssetNumber
                  data["pickupFromType"] = DELIVERY_FROM_TO_TYPE.plant;
                  data["pickupFrom"] = transferAssetData?.transferFromPlant?.optionValue;
                  data["pickupFromAddress"] = transferAssetData?.transferFromPlant?.address;
                  if (transferAssetData?.transferType === "Internal") {
                    data["deliveryToType"] = DELIVERY_FROM_TO_TYPE.plant;
                    data["deliveryTo"] = transferAssetData?.transfertoPlant?.optionValue;
                    data["deliveryToAddress"] = transferAssetData?.plantShipTo?.optionValue;
                    data["status"] = DELIVERY_TICKET_STATUS.indTransit;
                  }
                  else if (transferAssetData?.transferType === "External Customer") {
                    data["deliveryToType"] = DELIVERY_FROM_TO_TYPE.customer;
                    data["deliveryTo"] = transferAssetData?.transfertoCustomer?.optionValue;
                    data["deliveryToAddress"] = transferAssetData?.customerShipTo?.optionValue;
                  }
                  else if (transferAssetData?.transferType === "External Supplier") {
                    data["deliveryToType"] = DELIVERY_FROM_TO_TYPE.supplier;
                    data["deliveryTo"] = transferAssetData?.transfertoSupplier?.optionValue;
                    data["deliveryToAddress"] = transferAssetData?.supplierShipTo?.optionValue;
                  }
                  data["wellName"] = transferAssetData?.wellName?.optionValue;
                  data["afeNumber"] = transferAssetData?.afeNumber;
                  if (transferAssetData?.processor?.optionValue) {
                    data["processor"] = transferAssetData?.processor?.optionValue;
                  }
                  data["isPickupFromDisable"] = true;
                  data["isDeliveryToDisable"] = true;
                  setShowTicketDialog({ open: true, data: data })
                }}
              >
                Create Loading Ticket
              </Button>
              <Box component="span" mx={1} />
              <Button
                variant="contained"
                size="small"
                color="primary"
                disabled={selectedRecords.length === 0 ||
                  selectedRecords.filter((e: any) => e?.loadingTicketStatus === DELIVERY_TICKET_STATUS.indTransit).length !== selectedRecords.length}
                onClick={() => { setShowConfirmBoxReceive(true) }}
              >
                Receive Assets
              </Button>
            </Fragment>
          )}
          <Box component="span" mx={1} />
          {permissions?.transferAsset.isUpdate && (selectedRecords.length && selectedRecords?.filter(f => f.hasOwnProperty("loadingTicket") &&
            f?.loadingTicketStatus === DELIVERY_TICKET_STATUS.new)?.length === selectedRecords?.length) ?
            <Button
              variant="contained"
              size="small"
              color="primary"
              onClick={() => setShowConfirmBox(true)}
            >
              Remove Loading Ticket
            </Button> : null}
        </Box>}
      </Box>

      <Box mt={1}>
        {isMobile && !isTablet ? (
          <CustomSwipableList
            allowSelection={true}
            allowSwipe={true}
            permissions={permissions.transferAsset}
            primaryField={columns?.find((d) => d.field)}
            onClick={(data) => {
              history.push(`${routes.serializedAssetDetail.path}/${data._id}`);
            }}
            dataRows={dataRows}
            selectedRecords={selectedRecords}
            dispatch={dispatch}
            onEdit={(data) => {
              // history.push(`${routes.rentalManagementDetail.path}/${data._id}?openEdit=true`)
            }}
            extraParamsToCheckDelete={true}
            onDelete={(data) => { }}
            rowCount={rowCount}
            page={page}
            loading={loading}
            chips={[
              {
                label: "Status: ",
                field: "status",
              },
              {
                label: 'Loading Ticket : ',
                field: 'loadingTicket',
                onClick: (data: any) => history.push(`${routes.deliveryTicketDetail.path}/${data.loadingTicketId}`),
              }
            ]}
            additionalDetails={[]}
            owerCollaboratorInitialsOrImages="owerCollaboratorInitialsOrImages"
            onCreate={false}
            showClone={false}
            onClone={(data) => { }}
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
            actionWidth={100}
            allowSelection={true}
            isClientSideGrid={true}
            loading={loading}
            renderedFrom={renderedFrom}
            refreshGrid={() => fetchAssetsData(true)}
          />
        )}
      </Box>
      {showTicketDialog.open && (
        <ManageDeliveryTicket
          ticketType={DELIVERY_TICKET_TYPE.loading}
          refrenceType={DELIVERY_TICKET_REFRENCE_TYPE.transferAsset}
          refrenceData={showTicketDialog.data}
          productInventory={assetWithNoTicket}
          onClose={() => setShowTicketDialog({ open: false, data: {} })}
          onSuccess={() => {
            setShowTicketDialog({ open: false, data: {} });
            fetchAssetsData(true);
          }}
        />
      )}
      {showConfirmBox && (
        <ConfirmationDialog
          okBtnLoading={isRemovingTicket}
          open={showConfirmBox}
          message={`Are you sure you want to remove loading ticket(s)?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleRemoveTicket}
        />
      )}
      {showConfirmBoxReceive && (
        <ConfirmationDialog
          okBtnLoading={isRemovingTicket}
          open={showConfirmBoxReceive}
          message={`Are you sure you want to receive assets?`}
          onClose={() => {
            setShowConfirmBoxReceive(false);
          }}
          onOk={handelReceiveAssets}
        />
      )}
    </Fragment>
  );
};

export default LoadingTicketGrid;
