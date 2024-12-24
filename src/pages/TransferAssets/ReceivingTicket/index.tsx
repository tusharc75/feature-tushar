import { Box, Button, IconButton, MenuItem } from '@mui/material';
import { groupBy, map, uniq } from 'lodash';
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
  ASSET_STATUS,
  COLOUR_MASTER,
  DELIVERY_FROM_TO_TYPE,
  DELIVERY_TICKET_REFERENCE_TYPE,
  DELIVERY_TICKET_STATUS,
  DELIVERY_TICKET_TYPE,
  deliveryTicket,
  prepareDataForGrid,
  serializedAsset,
  sidebarResource,
  TRANSFER_ASSET_STATUS
} from 'src/constants/helpers';
import ManageDeliveryTicket from '../../DeliveryTicket/ManageDeliveryTicket';
import InfoIcon from '@mui/icons-material/Info';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { FiExternalLink } from 'react-icons/fi';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

interface ReceivingGridProps {
  transferAssetData: any;
  transferAssetId: string | any;
  setNextStep: any;
  currentStep: number;
  updateTransferStatus?: any;
  renderedFrom?: string;
  isTransferEnded: boolean;
  allowedToEdit: boolean;
  stepFullScreen: any;
  resources: any;
  setAllAssetsReceived: any;
}

const ReceivingTicketGrid: FC<ReceivingGridProps> = (props) => {
  const {
    transferAssetId,
    transferAssetData,
    setNextStep,
    updateTransferStatus,
    isTransferEnded,
    renderedFrom,
    allowedToEdit,
    stepFullScreen,
    resources,
    setAllAssetsReceived
  } = props;
  const toastConfig = useContext(CustomToastContext);
  const { generateColumns } = useColumns();
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, selectedRecords } = state;
  const [assetWithNoTicket, setAssetWithNoTicket] = useState([]);
  const [loadingTicketsNotDelivered, setLoadingTicketsNotDelivered] = useState([]);

  const [showTicketDialog, setShowTicketDialog] = useState({ open: false, data: {} });
  const [showConfirmBoxReceive, setShowConfirmBoxReceive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        newColumns?.forEach((o) => {
          if (o?.accessor === 'assetNumber') {
            o.cell = ({ row }) =>
              row?.original?.assetNumber ? (
                <div
                  className="flex items-center gap-2"
                  style={{
                    backgroundColor: row?.original?.isReplaced
                      ? COLOUR_MASTER.replaceAssetColor.background
                      : [ASSET_STATUS.lost, ASSET_STATUS.scrap, ASSET_STATUS.needRepair, ASSET_STATUS.needRecert].includes(row?.original?.status)
                        ? COLOUR_MASTER.lostAssets.background
                        : ''
                  }}
                >
                  <p> {row.original?.assetNumber}</p>
                  <IconButton
                    size="small"
                    onClick={() => {
                      window.open(`${routes.serializedAssetDetail.path}/${row.original?._id}`);
                    }}
                  >
                    <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                  </IconButton>
                  {row?.original?.isReplaced && (
                    <Box>
                      <HtmlTooltip enterTouchDelay={0} title={`Replaced Asset ${row?.original?.replaceAsset} Reason-${row?.original?.replaceReason}`}>
                        <InfoIcon fontSize="small" color={'primary'} />
                      </HtmlTooltip>
                    </Box>
                  )}
                </div>
              ) : (
                <NoDataCell />
              );
          } else if (o?.accessor === 'product') {
            o.cell = ({ row }) =>
              row?.original?.product ? (
                <div className="flex items-center gap-2">
                  <p> {row.original?.product}</p>
                  <IconButton
                    size="small"
                    onClick={() => {
                      window.open(`${routes.productDetail.path}/${row.original?.productId}`);
                    }}
                  >
                    <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                  </IconButton>
                </div>
              ) : (
                <NoDataCell />
              );
          }
        });
        const column = [
          {
            accessor: 'index',
            Header: 'Index',
            width: 70,
            sticky: 'left',
            Cell: ({ row }) => (
              <div className="d-flex align-items-center gap-2">
                <h5 className="text-truncate">{row?.original?.index}</h5>
                {row?.original?.loadingTicketId && !row?.original?.receivingTicketId && (
                  <HtmlTooltip title={`Loading Ticket ${row?.original?.loadingTicketStatus}`}>
                    <LocalShippingIcon fontSize="small" color={'primary'} />
                  </HtmlTooltip>
                )}
                {row?.original?.receivingTicketId && (
                  <HtmlTooltip title={`Receiving Ticket ${row?.original?.receivingTicketStatus}`}>
                    <LocalShippingIcon fontSize="small" color={'primary'} className="[transform:scaleX(-1)_!important]" />
                  </HtmlTooltip>
                )}
              </div>
            ),
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
      fetchAssetsData();
    }
  }, [transferAssetId]);

  const fetchAssets = () =>
    new Promise((resolve, reject) => {
      axiosInstance()
        .get(`${routes.transferAsset.path}/get-asset/${transferAssetId}`)
        .then(({ data: { data } }) => {
          data = [
            ...data?.assets?.map((d: any) => ({
              ...d,
              productDescription: d?.product?.optionLabel ?? '',
              productId: d?.product?.optionValue ?? '',
              isChecked: false
            }))
          ];
          resolve(data);
        })
        .catch((error) => {
          reject(error);
        });
    });

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

  const fetchAssetsData = async (checkAutoComplete = false) => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    await fetchFields();
    try {
      let assetData: any = await fetchAssets();
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
      if (assetData?.length && transferAssetData?.transferType.includes('External')) {
        if (assetData?.every((e) => e['receivingTicketStatus'] === DELIVERY_TICKET_STATUS.delivered)) {
          setAllAssetsReceived(true);
        } else {
          setAllAssetsReceived(false);
        }
      }
      dispatch({ type: 'initialize', data: assetData, count: assetData?.length });
      dispatch({ type: 'loading', loading: false });
      if (checkAutoComplete && transferAssetData?.transferType === 'External') {
        if (assetData?.length && assetData?.every((e) => e['receivingTicketStatus'] === DELIVERY_TICKET_STATUS.delivered)) {
          if (transferAssetData?.status !== TRANSFER_ASSET_STATUS.completed) {
            updateTransferStatus(TRANSFER_ASSET_STATUS.completed);
          }
        }
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  useEffect(() => {
    if (selectedRecords.length > 0) {
      const inventoryWithNoTicket = selectedRecords.filter(
        (asset: any) => !asset?.hasOwnProperty('receivingTicket') && asset?.loadingTicketStatus === 'Delivered'
      );
      const loadingTicketsNotDelivered = selectedRecords.filter((asset: any) => asset?.loadingTicketStatus !== 'Delivered');
      setLoadingTicketsNotDelivered(loadingTicketsNotDelivered);
      setAssetWithNoTicket(inventoryWithNoTicket);
    }
  }, [dataRows, selectedRecords]);

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
    data['status'] = DELIVERY_TICKET_STATUS.inTransit;
    setShowTicketDialog({ open: true, data: data });
  };

  const previewDownloadProps = {
    fileName: `${resources?.transferAsset?.titleSingular}-${transferAssetData?.transferAssetNumber}`,
    resource: sidebarResource.transferAsset,
    referenceId: transferAssetId,
    columns: columns?.filter((e) => ['assetNumber', 'product', 'productDescription', 'status']?.includes(e?.accessor)),
    hideDetailButton: true
  };

  const ActionMenuItems = () => {
    return (
      <>
        <MenuItem
          disabled={
            selectedRecords.length === 0 ||
            assetWithNoTicket.length === 0 ||
            loadingTicketsNotDelivered.length > 0 ||
            selectedRecords.filter((asset: any) => asset?.status === ASSET_STATUS.lost).length > 0 ||
            selectedRecords.filter((asset: any) => asset.hasOwnProperty('receivingTicket')).length > 0
          }
          onClick={createReceivingTicket}
        >
          Create Receiving Ticket
        </MenuItem>
        <MenuItem
          disabled={
            selectedRecords.length === 0 ||
            selectedRecords.filter((e: any) => e?.receivingTicketStatus === DELIVERY_TICKET_STATUS.inTransit).length !== selectedRecords.length
          }
          onClick={() => {
            setShowConfirmBoxReceive(true);
          }}
        >
          Receive Assets
        </MenuItem>
      </>
    );
  };

  const handelReceiveAssets = () => {
    let data = {};
    setIsSubmitting(true);
    const loadingTicketIds = uniq(map(selectedRecords, 'receivingTicketId'));
    if (loadingTicketIds.length) {
      data['_ids'] = loadingTicketIds?.map((e) => e);
      data['status'] = DELIVERY_TICKET_STATUS.delivered;
      data['signatures'] = [];
      axiosInstance()
        .post(`${deliveryTicket.api}/updatebulk`, data)
        .then(({ data: { data } }) => {
          fetchAssetsData(true);
          setShowConfirmBoxReceive(false);
          setIsSubmitting(false);
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: `Assets Received Successfully`
          });
        })
        .catch((error) => {
          setIsSubmitting(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  return (
    <Fragment>
      {allowedToEdit && (
        <>
          <DetailsPageHeader
            isAddButtonVisible={false}
            previewDownloadProps={previewDownloadProps}
            hasXpadding
            isActionButtonVisible={allowedToEdit && !isTransferEnded}
            actionButtonMenuItems={<ActionMenuItems />}
            actionButtonProps={{ disabled: selectedRecords.length === 0 }}
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
      {showConfirmBoxReceive && (
        <ConfirmationDialog
          okBtnLoading={isSubmitting}
          open={showConfirmBoxReceive}
          message={`Are you sure you want to receive ${selectedRecords?.length == 1 ? 'asset' : 'assets'}?`}
          onClose={() => {
            setShowConfirmBoxReceive(false);
          }}
          onOk={handelReceiveAssets}
        />
      )}
    </Fragment>
  );
};

export default ReceivingTicketGrid;
