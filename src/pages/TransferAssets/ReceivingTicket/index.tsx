import React, { useState, useReducer, Fragment, useContext, useEffect, FC } from 'react';
import { Button, Box } from '@material-ui/core';
import { Link, useHistory } from 'react-router-dom';

import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { deliveryTicket, sidebarResource, DELIVERY_TICKET_STATUS, DELIVERY_TICKET_TYPE, DELIVERY_TICKET_REFRENCE_TYPE, DELIVERY_FROM_TO_TYPE } from 'src/constants/helpers';
import { isMobile, isTablet } from 'react-device-detect';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { groupBy } from 'lodash';
import ManageDeliveryTicket from '../../DeliveryTicket/ManageDeliveryTicket';
import { CommonRenderer, DateRenderer } from 'src/components/AgGridComponents/CustomAgGridCellRenderers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CustomAgGrid, { reducer, intialState } from 'src/components/AgGridComponents/CustomAgGrid';
import CustomSwipableList from 'src/components/SwipableListComponents/CustomSwipableList';
import { AiFillFilePdf } from 'react-icons/ai';
import { IoMdDownload } from 'react-icons/io';

interface ReceivingGridProps {
  fetchAssets: any;
  permissions: any;
  transferAssetData: any;
  transferAssetId: string | any;
  setNextStep: any;
  setPrevStep: any;
  setTransferIsEnded?: any;
  currentStep: number;
  setTickets: any;
  updateTransferStatus?: any;
  handleViewPdf?: any;
  fileDownloading?: boolean;
  renderedFrom?: string;
  isTransferEnded: boolean;
  allowedToEdit: boolean;
}

const ReceivingTicketGrid: FC<ReceivingGridProps> = (props) => {
  const {
    permissions,
    fetchAssets,
    transferAssetId,
    setPrevStep,
    transferAssetData,
    setTickets,
    setNextStep,
    setTransferIsEnded,
    updateTransferStatus,
    handleViewPdf,
    fileDownloading,
    isTransferEnded,
    renderedFrom,
    allowedToEdit
  } = props;
  const toastConfig = useContext(CustomToastContext);

  const [assetWithNoTicket, setAssetWithNoTicket] = useState([]);
  const [loadingTicketsNotDelivered, setLoadingTicketsNotDelivered] = useState([]);

  const [showTicketDialog, setShowTicketDialog] = useState({ open: false, data: {} });

  const [isRemovingTicket, setRemovingTicket] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);

  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;

  const columns = [
    { field: 'assetNumber', headerName: 'Asset Number', show: true, disabled: true, cellRenderer: 'assetRenderer' },
    { field: 'serialNumber', headerName: 'Serial Number', show: true, cellRenderer: 'commonRenderer' },
    { field: 'loadingTicket', headerName: 'Loading Ticket', show: true, cellRenderer: 'ticketRenderer' },
    { field: 'status', headerName: 'Status', show: true, cellRenderer: 'commonRenderer' },
    { field: 'receivingTicket', headerName: 'Receiving Ticket', show: true, cellRenderer: 'receivingRenderer' },
    { field: 'receivingTicketStatus', headerName: 'Receiving Ticket Status', show: true, cellRenderer: 'commonRenderer' },
    { field: 'loadingTicketStatus', headerName: 'Loading Ticket Status', show: true, cellRenderer: 'commonRenderer' }
  ];

  const history = useHistory();

  const AssetRenderer = (params) =>
    params.value ? (
      <Link className="link cursor-pointer" to={`${routes.serializedAssetDetail.path}/${params.data._id}`}>
        <p title={params.value}>{params.value}</p>
      </Link>
    ) : (
      <NoDataCell />
    );

  const LoadingTicketRenderer = (params) =>
    params.value ? (
      <Link className="link cursor-pointer" to={`${routes.deliveryTicketDetail.path}/${params.data.loadingTicketId}`}>
        <p title={params.value}>{params.value}</p>
      </Link>
    ) : (
      <NoDataCell />
    );

  const ReceivingTicketRenderer = (params) =>
    params.value ? (
      <Link className="link cursor-pointer" to={`${routes.deliveryTicketDetail.path}/${params.data.receivingTicketId}`}>
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
    ticketRenderer: LoadingTicketRenderer,
    receivingRenderer: ReceivingTicketRenderer,
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
      const loadingTicket = ticketData.filter((ticket: any) => ticket.ticketType === DELIVERY_TICKET_TYPE.loading)
      const receivingTicket = ticketData.filter((ticket: any) => ticket.ticketType === DELIVERY_TICKET_TYPE.receiving)
      for (let i = 0; i < receivingTicket.length; i++) {
        for (let j = 0; j < assetData.length; j++) {
          if (receivingTicket[i]?.productInventory.some((asset: any) => assetData[j]._id === (typeof asset === 'object' ? asset.optionValue : asset))) {
            assetData[j].receivingTicket = receivingTicket[i].ticketName;
            assetData[j].receivingTicketId = receivingTicket[i]._id;
            assetData[j].receivingTicketStatus = receivingTicket[i].status;
          }
        }
      }
      for (let i = 0; i < loadingTicket.length; i++) {
        for (let j = 0; j < assetData.length; j++) {
          if (
            loadingTicket[i]?.productInventory.some((asset: any) => assetData[j]._id === (typeof asset === 'object' ? asset.optionValue : asset))
          ) {
            assetData[j].loadingTicket = loadingTicket[i].ticketName;
            assetData[j].loadingTicketId = loadingTicket[i]._id;
            assetData[j].loadingTicketStatus = loadingTicket[i].status;
          }
        }
      }
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
        })
        .catch((err) => {
          reject(err);
        });
    });

  useEffect(() => {
    if (selectedRecords.length > 0) {
      const inventoryWithNoTicket = selectedRecords.filter(
        (asset: any) => !asset?.hasOwnProperty('receivingTicket') && asset?.loadingTicketStatus === 'Delivered'
      );
      const loadingTicketsNotDelivered = selectedRecords.filter((asset: any) => asset?.loadingTicketStatus !== 'Delivered');
      setLoadingTicketsNotDelivered(loadingTicketsNotDelivered);
      setAssetWithNoTicket(inventoryWithNoTicket);
    }

    if (dataRows.length > 0) {
      const inventoryWithNoTicket = dataRows.filter((asset: any) => !asset?.hasOwnProperty('receivingTicket'));
      const inventoryDelivered = dataRows.filter((asset: any) => asset?.receivingTicketStatus === 'Delivered');
      if (inventoryWithNoTicket.length > 0) {
        setNextStep(false);
      } else {
        setNextStep(true);
      }
      if (transferAssetData?.transferType.includes('External')) {
        if (inventoryDelivered.length === dataRows.filter(d => d.status !== "Lost").length) {
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
    const groupByCalls = groupBy(selectedRecords, 'receivingTicketId');
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

  return (
    <Fragment>
      {allowedToEdit && <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} justifyContent="space-between" mx="4px">
        <Box>
          {(permissions?.transferAsset?.isRead && !isMobile) && !isMobile && (
            <Button
              variant={isMobile && !isTablet ? "text" : "outlined"}
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
              variant={isMobile && !isTablet ? 'text' : 'outlined'}
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
        </Box>
        {!isTransferEnded && <Box marginTop={isMobile ? 2 : 0}>
          {permissions?.transferAsset.isUpdate && (
            <Button
              variant="contained"
              size="small"
              color="primary"
              disabled={
                selectedRecords.length === 0 ||
                assetWithNoTicket.length === 0 ||
                loadingTicketsNotDelivered.length > 0 ||
                selectedRecords.filter((asset: any) => asset?.status === 'Lost').length > 0 ||
                selectedRecords.filter((asset: any) => asset.hasOwnProperty('receivingTicket')).length > 0
              }
              onClick={() => {
                const data: any = {}
                data["refrenceId"] = transferAssetData._id
                data["ticketName"] = transferAssetData.transferAssetNumber

                if (transferAssetData?.transferType === "Internal") {
                  data["pickupFromType"] = DELIVERY_FROM_TO_TYPE.plant;
                  data["pickupFrom"] = transferAssetData?.transfertoPlant?.optionValue;
                  data["pickupFromAddress"] = transferAssetData?.plantShipTo?.optionValue;
                }
                else if (transferAssetData?.transferType === "External Customer") {
                  data["pickupFromType"] = DELIVERY_FROM_TO_TYPE.customer;
                  data["pickupFrom"] = transferAssetData?.transfertoCustomer?.optionValue;
                  data["pickupFromAddress"] = transferAssetData?.customerShipTo?.optionValue;
                }
                else if (transferAssetData?.transferType === "External Supplier") {
                  data["pickupFromType"] = DELIVERY_FROM_TO_TYPE.supplier;
                  data["pickupFrom"] = transferAssetData?.transfertoSupplier?.optionValue;
                  data["pickupFromAddress"] = transferAssetData?.supplierShipTo?.optionValue;
                }

                data["deliveryToType"] = DELIVERY_FROM_TO_TYPE.plant;
                data["deliveryTo"] = transferAssetData?.transferFromPlant?.optionValue;
                data["deliveryToAddress"] = transferAssetData?.transferFromPlant?.address;

                data["wellName"] = transferAssetData?.wellName?.optionValue;
                data["afeNumber"] = transferAssetData?.afeNumber;
                if (transferAssetData?.processor?.optionValue) {
                  data["processor"] = transferAssetData?.processor?.optionValue;
                }
                data["isPickupFromDisable"] = true;
                data["isDeliveryToDisable"] = false;
                setShowTicketDialog({ open: true, data: data })
              }}
            >
              Create Receiving Ticket
            </Button>
          )}
          <Box component="span" mx={1} />
          {permissions?.transferAsset.isUpdate && selectedRecords.length && selectedRecords?.filter(f => f.hasOwnProperty("receivingTicket") &&
            f?.receivingTicketStatus === DELIVERY_TICKET_STATUS.new)?.length === selectedRecords?.length ? (
            <Button
              variant="contained"
              size="small"
              color="primary"
              onClick={() => setShowConfirmBox(true)}
            >
              Remove Receiving Ticket
            </Button>
          ) : null}
        </Box>}
      </Box>}
      <Box mt={1}>
        {isMobile && !isTablet ? (
          <CustomSwipableList
            allowSelection={true}
            allowSwipe={true}
            permissions={permissions}
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
              },
              {
                label: 'Receiving Ticket : ',
                field: 'receivingTicket',
                onClick: (data: any) => history.push(`${routes.deliveryTicketDetail.path}/${data.receivingTicketId}`),
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
          ticketType={DELIVERY_TICKET_TYPE.receiving}
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
          message={`Are you sure you want to remove asset(s)?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleRemoveTicket}
        />
      )}
    </Fragment>
  );
};

export default ReceivingTicketGrid;
