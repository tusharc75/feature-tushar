import { Box, Button } from '@material-ui/core';
import { groupBy } from 'lodash';
import { FC, Fragment, useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import {
  DELIVERY_FROM_TO_TYPE,
  DELIVERY_TICKET_REFERENCE_TYPE,
  DELIVERY_TICKET_STATUS,
  DELIVERY_TICKET_TYPE,
  deliveryTicket,
  prepareDataForGrid,
  serializedAsset,
  sidebarResource
} from 'src/constants/helpers';
import ManageDeliveryTicket from '../../DeliveryTicket/ManageDeliveryTicket';
interface ReceivingGridProps {
  fetchAssets: any;
  permissions: any;
  transferAssetData: any;
  transferAssetId: string | any;
  setNextStep: any;
  setTransferIsEnded?: any;
  currentStep: number;
  setTickets: any;
  updateTransferStatus?: any;
  renderedFrom?: string;
  isTransferEnded: boolean;
  allowedToEdit: boolean;
  stepFullScreen: any;
}

const ReceivingTicketGrid: FC<ReceivingGridProps> = (props) => {
  const {
    permissions,
    fetchAssets,
    transferAssetId,
    transferAssetData,
    setTickets,
    setNextStep,
    setTransferIsEnded,
    updateTransferStatus,
    isTransferEnded,
    renderedFrom,
    allowedToEdit,
    stepFullScreen
  } = props;
  const toastConfig = useContext(CustomToastContext);
  const { generateColumns } = useColumns();
  const { state, dispatch } = useTableReducer();
  const { dataRows, selectedRecords } = state;
  const [assetWithNoTicket, setAssetWithNoTicket] = useState([]);
  const [loadingTicketsNotDelivered, setLoadingTicketsNotDelivered] = useState([]);

  const [showTicketDialog, setShowTicketDialog] = useState({ open: false, data: {} });

  const [isRemovingTicket, setRemovingTicket] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [columns, setColumns] = useState(null);

  const fetchFields = () => {
    setColumns(null);
    axiosInstance()
      .get(`/field?resource=${serializedAsset.resource}`)
      .then(({ data: { data } }) => {
        const newColumns = generateColumns(
          renderedFrom,
          data?.filter((d) => ['assetNumber', 'serialNumber', 'product', 'productDescription', 'status']?.includes(d?.fieldData?.fieldName))
        );

        const column = [
          {
            accessor: 'index',
            Header: 'Index',
            width: 70,
            sticky: 'left',
            Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>,
            Footer: () => {
              return <>Total</>;
            }
          },
          ...newColumns,
          {
            accessor: 'loadingTicket',
            Header: 'Loading Ticket',
            width: 300,
            Cell: ({ row }) =>
              row?.original?.loadingTicket ? (
                <p
                  title={row?.original?.loadingTicket}
                  className="link cursor-pointer"
                  onClick={() => window.open(`${routes.deliveryTicketDetail.path}/${row?.original?.loadingTicketId}`)}
                >
                  {row?.original?.loadingTicket}
                </p>
              ) : (
                <NoDataCell />
              )
          },
          {
            accessor: 'loadingTicketStatus',
            Header: 'Loading Ticket Status',
            primaryField: true,
            width: 200,
            Cell: ({ row }) => <p className="text-truncate">{row?.original?.loadingTicketStatus || <NoDataCell />}</p>
          },
          {
            accessor: 'receivingTicket',
            Header: 'Receiving Ticket',
            primaryField: true,
            width: 300,
            Cell: ({ row }) =>
              row?.original?.receivingTicket ? (
                <p
                  title={row?.original?.receivingTicket}
                  className="link cursor-pointer"
                  onClick={() => window.open(`${routes.deliveryTicketDetail.path}/${row?.original?.receivingTicketId}`)}
                >
                  {row?.original?.receivingTicket}
                </p>
              ) : (
                <NoDataCell />
              )
          },
          {
            accessor: 'receivingTicketStatus',
            Header: 'Receiving Ticket Status',
            width: 200,
            Cell: ({ row }) => <p className="text-truncate">{row?.original?.receivingTicketStatus || <NoDataCell />}</p>
          }
        ];
        setColumns(column);
      });
  };

  useEffect(() => {
    if (transferAssetId) {
      fetchAssetsData(true);
    }
  }, [transferAssetId]);

  const fetchAssetsData = async (forceRefresh) => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    await fetchFields();

    try {
      let assetData = await fetchAssets(forceRefresh);
      let ticketData: any = await fetchLoadingTickets();
      const loadingTicket = ticketData.filter((ticket: any) => ticket.ticketType === DELIVERY_TICKET_TYPE.loading);
      const receivingTicket = ticketData.filter((ticket: any) => ticket.ticketType === DELIVERY_TICKET_TYPE.receiving);
      for (let i = 0; i < receivingTicket.length; i++) {
        for (let j = 0; j < assetData.length; j++) {
          if (receivingTicket[i]?.assets.some((e: any) => assetData[j]._id === e.asset)) {
            assetData[j].receivingTicket = receivingTicket[i].ticketName;
            assetData[j].receivingTicketId = receivingTicket[i]._id;
            assetData[j].receivingTicketStatus = receivingTicket[i].status;
          }
        }
      }
      for (let i = 0; i < loadingTicket.length; i++) {
        for (let j = 0; j < assetData.length; j++) {
          if (loadingTicket[i]?.assets.some((e: any) => assetData[j]._id === e.asset)) {
            assetData[j].loadingTicket = loadingTicket[i].ticketName;
            assetData[j].loadingTicketId = loadingTicket[i]._id;
            assetData[j].loadingTicketStatus = loadingTicket[i].status;
          }
        }
      }
      assetData = assetData?.map((d: any, index: number) => {
        let finalObject: any = prepareDataForGrid(d);
        return {
          index: index + 1,
          ...finalObject
        };
      });
      dispatch({ type: 'initialize', data: assetData, count: assetData?.length });
      dispatch({ type: 'loading', loading: false });
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchLoadingTickets = () =>
    new Promise((resolve, reject) => {
      axiosInstance()
        .get(`${routes.deliveryTicket.path}/typewise?referenceType=Transfer Asset&referenceId=${transferAssetId}`)
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

    if (dataRows?.length > 0) {
      const inventoryWithNoTicket = dataRows?.filter((asset: any) => !asset?.hasOwnProperty('receivingTicket'));
      const inventoryDelivered = dataRows?.filter((asset: any) => asset?.receivingTicketStatus === 'Delivered');
      if (inventoryWithNoTicket.length > 0) {
        setNextStep(false);
      } else {
        setNextStep(true);
      }
      if (transferAssetData?.transferType.includes('External')) {
        if (inventoryDelivered.length === dataRows?.filter((d) => d.status !== 'Lost').length) {
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

  const createReceivingTicket = () => {
    const data: any = {};
    data['referenceId'] = transferAssetData._id;
    data['ticketName'] = transferAssetData.transferAssetNumber;

    if (transferAssetData?.transferType === 'Internal') {
      data['pickupFromType'] = DELIVERY_FROM_TO_TYPE.plant;
      data['pickupFrom'] = transferAssetData?.transfertoPlant?.optionValue;
      data['pickupFromAddress'] = transferAssetData?.plantShipTo?.optionValue;
    } else if (transferAssetData?.transferType === 'External Customer') {
      data['pickupFromType'] = DELIVERY_FROM_TO_TYPE.customer;
      data['pickupFrom'] = transferAssetData?.transfertoCustomer?.optionValue;
      data['pickupFromAddress'] = transferAssetData?.customerShipTo?.optionValue;
    } else if (transferAssetData?.transferType === 'External Supplier') {
      data['pickupFromType'] = DELIVERY_FROM_TO_TYPE.supplier;
      data['pickupFrom'] = transferAssetData?.transfertoSupplier?.optionValue;
      data['pickupFromAddress'] = transferAssetData?.supplierShipTo?.optionValue;
    }

    data['deliveryToType'] = DELIVERY_FROM_TO_TYPE.plant;
    data['deliveryTo'] = transferAssetData?.transferFromPlant?.optionValue;
    data['deliveryToAddress'] = transferAssetData?.transferFromPlant?.address;

    data['wellName'] = transferAssetData?.wellName?.optionValue;

    if (transferAssetData?.wellNumber) {
      if (transferAssetData?.wellNumber?.optionValue) {
        data['wellNumber'] = transferAssetData?.wellNumber?.optionValue;
      } else {
        data['wellNumber'] = transferAssetData?.wellNumber?.map((e) => e?.optionValue);
      }
    }

    data['afeNumber'] = transferAssetData?.afeNumber;
    if (transferAssetData?.processor?.optionValue) {
      data['processor'] = transferAssetData?.processor?.optionValue;
    }
    data['isPickupFromDisable'] = true;
    data['isDeliveryToDisable'] = false;
    setShowTicketDialog({ open: true, data: data });
  };

  const previewDownloadProps = {
    fileName: `${routes.transferAsset.title}-${transferAssetData?.transferAssetNumber}`,
    resource: sidebarResource.transferAsset,
    referenceId: transferAssetId,
    columns: columns?.filter((e) => ['assetNumber', 'product', 'productDescription', 'status']?.includes(e?.accessor)),
    hideDetailButton: true
  };

  const rightSideContents = () => {
    return (
      <>
        {!isTransferEnded && (
          <>
            {permissions?.transferAsset?.isUpdate && (
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
                onClick={createReceivingTicket}
              >
                Create Receiving Ticket
              </Button>
            )}
            {permissions?.transferAsset?.isUpdate &&
            selectedRecords.length &&
            selectedRecords?.filter((f) => f.hasOwnProperty('receivingTicket') && f?.receivingTicketStatus === DELIVERY_TICKET_STATUS.new)?.length ===
              selectedRecords?.length ? (
              <Button variant="contained" size="small" color="primary" onClick={() => setShowConfirmBox(true)}>
                Remove Receiving Ticket
              </Button>
            ) : null}
          </>
        )}
      </>
    );
  };

  return (
    <Fragment>
      {allowedToEdit && (
        <>
          <DetailsPageHeader
            isAddButtonVisible={false}
            isActionButtonVisible={false}
            previewDownloadProps={previewDownloadProps}
            rightSideContents={rightSideContents()}
            hasXpadding
          />
        </>
      )}
      <Box mt={1}>
        {columns ? (
          <Box zIndex={5} width={'100%'}>
            <CustomReactTable
              height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 395px)'}
              columns={columns}
              state={state}
              dispatch={dispatch}
              hideSelection={!allowedToEdit}
              hideAction={true}
              refreshGrid={fetchAssetsData}
              renderedFrom={renderedFrom}
              isClientSideGrid={true}
            />
          </Box>
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Box>
      {showTicketDialog.open && (
        <ManageDeliveryTicket
          ticketType={DELIVERY_TICKET_TYPE.receiving}
          referenceType={DELIVERY_TICKET_REFERENCE_TYPE.transferAsset}
          referenceData={showTicketDialog.data}
          assets={assetWithNoTicket}
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
