import { Box, IconButton, MenuItem } from '@material-ui/core';
import InfoIcon from '@material-ui/icons/Info';
import { groupBy, map, uniq } from 'lodash';
import moment from 'moment';
import { FC, Fragment, useContext, useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
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
  TRANSFER_ASSET_STATUS,
  dateTimeFormat,
  deliveryTicket,
  prepareDataForGrid,
  serializedAsset,
  sidebarResource
} from 'src/constants/helpers';
import ManageDeliveryTicket from 'src/pages/DeliveryTicket/ManageDeliveryTicket';
import AddSerializedAsset from 'src/pages/RentalManagement/SerializedAsset/AddSerializedAsset';
import ReplaceAssetReason from '../../../components/RentalManagment/ReplaceAssetReason';
import { FiExternalLink } from 'react-icons/fi';
import LocalShippingIcon from '@material-ui/icons/LocalShipping';
import ReceiveDialog from './ReceiveDialog';

interface LoadingGridProps {
  permissions: any;
  transferAssetData?: any;
  transferAssetId: string | any;
  setNextStep: any;
  currentStep: number;
  updateTransferStatus?: any;
  isTransferEnded: boolean;
  renderedFrom?: string;
  allowedToEdit: boolean;
  canReceive: boolean;
  stepFullScreen: any;
  setAllAssetsDelivered: any;
}

const LoadingTicketGrid: FC<LoadingGridProps> = (props) => {
  const {
    permissions,
    transferAssetId,
    transferAssetData,
    setNextStep,
    updateTransferStatus,
    isTransferEnded,
    renderedFrom,
    allowedToEdit,
    canReceive,
    stepFullScreen,
    setAllAssetsDelivered
  } = props;
  const toastConfig = useContext(CustomToastContext);
  const { generateColumns } = useColumns();
  const { state, dispatch } = useTableReducer();
  const { selectedRecords } = state;
  const [isRemovingTicket, setRemovingTicket] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [showConfirmBoxReceive, setShowConfirmBoxReceive] = useState({ open: false, type: null });
  const [showTicketDialog, setShowTicketDialog] = useState({ open: false, data: {} });
  const [addSerializedAssetDialog, setAddSerializedAssetDialog] = useState({ open: false, products: [] });
  const [showReplaceReason, setShowReplaceReason] = useState({ open: false, data: {} });
  const [replaceLoading, setReplaceLoading] = useState(false);
  const [columns, setColumns] = useState(null);
  const [showConformationDeliverdCancleTicket, setShowConformationDeliverdCancleTicket] = useState({ open: false, type: null });
  const [okBtnLoading, setOkBtnLoading] = useState(false);

  useEffect(() => {
    if (transferAssetId) {
      fetchAssetsData();
    }
  }, [transferAssetId]);

  const extraColumn = [
    {
      accessor: 'loadingTicket',
      Header: 'Loading Ticket',
      width: 200,
      Cell: ({ row }) =>
        row?.original?.loadingTicket ? (
          <div className="flex items-center gap-2">
            <p>{row?.original?.loadingTicket}</p>
            <IconButton
              size="small"
              onClick={() => {
                window.open(`${routes.deliveryTicketDetail.path}/${row.original?.loadingTicketId}`);
              }}
            >
              <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
            </IconButton>
          </div>
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
      accessor: 'createDate',
      Header: 'Shipped Date',
      width: 200,
      disableFilters: true,
      disableSortBy: true,
      Cell: ({ row }) =>
        row.original?.createDate ? (
          <div className="createBy" title={`${moment(row.original?.createDate)?.format(dateTimeFormat)}`}>
            {moment(row.original?.createDate)?.format(dateTimeFormat)}
          </div>
        ) : (
          <NoDataCell />
        )
    },
    {
      accessor: 'actualDeliveryDate',
      Header: 'Delivery Date',
      width: 200,
      disableFilters: true,
      disableSortBy: true,
      Cell: ({ row }) =>
        row.original?.actualDeliveryDate ? (
          <div className="createBy" title={`${moment(row.original?.actualDeliveryDate)?.format(dateTimeFormat)}`}>
            {moment(row.original?.actualDeliveryDate)?.format(dateTimeFormat)}
          </div>
        ) : (
          <NoDataCell />
        )
    }
  ];

  const fetchFields = () => {
    setColumns(null);
    axiosInstance()
      .get(`/field?resource=${serializedAsset.resource}`)
      .then(({ data: { data } }) => {
        const newColumns = generateColumns(renderedFrom, data, false);
        newColumns?.forEach((o) => {
          if (o?.accessor === 'assetNumber') {
            o.cell = ({ row }) =>
              row?.original?.assetNumber ? (
                <div
                  className="d-flex md-gap-2  items-center gap-1"
                  style={{
                    backgroundColor: row?.original?.isReplaced
                      ? COLOUR_MASTER.replaceAssetColor.background
                      : [ASSET_STATUS.lost, ASSET_STATUS.scrap, ASSET_STATUS.needRepair, ASSET_STATUS.needRecert].includes(row?.original?.status)
                        ? COLOUR_MASTER.lostAssets.background
                        : ''
                  }}
                >
                  <p className="!flex-shrink"> {row.original?.assetNumber}</p>
                  <IconButton
                    size="small"
                    className=" !flex-shrink-0"
                    onClick={() => {
                      window.open(`${routes.serializedAssetDetail.path}/${row.original?._id}`);
                    }}
                  >
                    <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                  </IconButton>
                  {row?.original?.isReplaced && (
                    <HtmlTooltip
                      enterTouchDelay={0}
                      className="!flex-shrink-0"
                      title={`Replaced Asset ${row?.original?.replaceAsset} Reason-${row?.original?.replaceReason}`}
                    >
                      <InfoIcon fontSize={'small'} color={'primary'} className="!h-[18px] !w-[18px]  md:h-[1rem] md:w-[1rem]" />
                    </HtmlTooltip>
                  )}
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
            sticky: isMobile ? 'none' : 'left',
            Cell: ({ row }) => (
              <div className="d-flex align-items-center gap-2">
                <h5 className="text-truncate">{row?.original?.index}</h5>
                {row?.original?.loadingTicketId && (
                  <HtmlTooltip title={`Loading Ticket ${row?.original?.loadingTicketStatus}`}>
                    <LocalShippingIcon fontSize="small" color={'primary'} />
                  </HtmlTooltip>
                )}
              </div>
            )
          },
          ...newColumns,
          ...extraColumn
        ];
        setColumns(column);
      });
  };

  const fetchAssetsData = async (checkAutoComplete = false) => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    await fetchFields();
    try {
      const result = await axiosInstance().get(`${routes.transferAsset.path}/get-asset/${transferAssetData?._id}`);
      let assetData = result?.data?.data?.assets;
      let replaceAssetLog = result?.data?.data?.replaceAssetLog ? result?.data?.data?.replaceAssetLog : [];
      let ticketData: any = await fetchLoadingTickets();
      ticketData = ticketData.filter((ticket: any) => ticket.ticketType === DELIVERY_TICKET_TYPE.loading);
      for (let i = 0; i < ticketData.length; i++) {
        for (let j = 0; j < assetData.length; j++) {
          if (ticketData[i]?.assets.some((e: any) => assetData[j]._id === e.asset)) {
            assetData[j].loadingTicket = ticketData[i].ticketName;
            assetData[j].loadingTicketId = ticketData[i]._id;
            assetData[j].loadingTicketStatus = ticketData[i].status;
            assetData[j].createDate = ticketData[i]?.createDate || ticketData[i]?.createdBy?.date;
            assetData[j].actualDeliveryDate = ticketData[i].actualDeliveryDate;
          }
        }
      }
      if (replaceAssetLog?.length) {
        assetData?.forEach((element) => {
          const logRes = replaceAssetLog?.filter((e) => e.assetId == element._id);
          if (logRes.length) {
            element.isReplaced = true;
            element.replaceReason = logRes[0]?.replaceReason;
            element.replaceAsset = logRes[0]?.replaceAsset;
          }
        });
      }

      assetData = assetData?.map((d: any, index: number) => {
        let finalObject: any = prepareDataForGrid(d);
        return {
          index: index + 1,
          ...finalObject
        };
      });

      if (assetData?.length && transferAssetData?.transferType !== 'Internal') {
        if (assetData?.filter((asset: any) => asset['loadingTicketStatus'] === DELIVERY_TICKET_STATUS.delivered).length > 0) {
          setNextStep(true);
        } else {
          setNextStep(false);
        }
      }

      if (assetData?.length && transferAssetData?.transferType === 'Internal') {
        if (assetData?.every((e) => e['loadingTicketStatus'] === DELIVERY_TICKET_STATUS.delivered)) {
          setAllAssetsDelivered(true);
        } else {
          setAllAssetsDelivered(false);
        }
      }

      dispatch({ type: 'initialize', data: assetData, count: assetData?.length });
      dispatch({ type: 'loading', loading: false });

      if (checkAutoComplete && transferAssetData?.transferType === 'Internal') {
        if (assetData?.length && assetData?.every((e) => e['loadingTicketStatus'] === DELIVERY_TICKET_STATUS.delivered)) {
          if (transferAssetData?.status !== TRANSFER_ASSET_STATUS.completed) {
            updateTransferStatus(TRANSFER_ASSET_STATUS.completed);
          }
        }
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchLoadingTickets = () =>
    new Promise((resolve, reject) => {
      axiosInstance()
        .get(`${routes.deliveryTicket.path}/typewise?referenceType=${DELIVERY_TICKET_REFERENCE_TYPE.transferAsset}&referenceId=${transferAssetId}`)
        .then(({ data: { data } }) => {
          resolve(data);
        })
        .catch((err) => {
          reject(err);
        });
    });

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

  const handleOpenReplaceAssetReason = (rows) => {
    const data: any = {};
    data.referenceType = 'transferAsset';
    data.referenceId = transferAssetId;
    const assets: any = [];
    selectedRecords?.forEach((element: any) => {
      const result = rows.filter((f) => f.productId === element?.productId && !f.isCounted);
      if (result.length) {
        assets.push({ _id: element._id, status: element.status, deliveryTicketId: element.loadingTicketId, newId: result[0]._id });
        result[0].isCounted = true;
      }
    });
    data.assets = assets;
    setShowReplaceReason({ open: true, data: data });
  };

  const handleReplaceAsset = (reason) => {
    setReplaceLoading(true);
    axiosInstance()
      .post(`${deliveryTicket.api}/replace-assets`, { ...showReplaceReason.data, reason: reason })
      .then(({ data }) => {
        setShowReplaceReason({ open: false, data: [] });
        setAddSerializedAssetDialog({ open: false, products: [] });
        setReplaceLoading(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: `Assets Replaced Successfully`
        });
        fetchAssetsData(true);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handelCancelTickets = () => {
    setOkBtnLoading(true);
    const loadingTicketIds = uniq(
      map(
        selectedRecords?.filter((e) => e.loadingTicketId),
        'loadingTicketId'
      )
    );
    if (loadingTicketIds.length) {
      axiosInstance()
        .put(`${deliveryTicket.api}/revert`, { ids: loadingTicketIds })
        .then(({ data }) => {
          setOkBtnLoading(false);
          setShowConformationDeliverdCancleTicket({ open: false, type: '' });
          fetchAssetsData(true);
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: `Cancelled Successfully`
          });
        })
        .catch((error) => {
          setOkBtnLoading(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  const cancelDeliveredTicket = () => {
    setOkBtnLoading(true);
    const loadingTicketId = uniq(
      map(
        selectedRecords?.filter((e) => e?.loadingTicketId),
        'loadingTicketId'
      )
    );
    if (loadingTicketId.length) {
      let data = {};
      data['_ids'] = loadingTicketId;
      axiosInstance()
        .post(`${deliveryTicket.api}/cancel-delivered-ticket`, data)
        .then(({ data }) => {
          setOkBtnLoading(false);
          setShowConformationDeliverdCancleTicket({ open: false, type: null });
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: `Cancelled Successfully`
          });
          fetchAssetsData(true);
        })
        .catch((error) => {
          setOkBtnLoading(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  const previewDownloadProps = {
    fileName: `${routes.transferAsset.title}-${transferAssetData?.transferAssetNumber}`,
    resource: sidebarResource.transferAsset,
    referenceId: transferAssetId,
    columns: columns?.filter((e) => !extraColumn?.map((e) => e.accessor)?.includes(e?.accessor)),
    hideDetailButton: true,
    defaultColumns: ['assetNumber', 'serialNumber', 'product', 'productDescription', 'status']
  };

  const ActionMenuItems = () => {
    return (
      <>
        <MenuItem
          disabled={
            selectedRecords.length === 0 ||
            selectedRecords.filter((asset) => asset?.hasOwnProperty('loadingTicket')).length > 0 ||
            selectedRecords.filter((asset: any) => asset?.status === 'Lost').length > 0
          }
          onClick={() => {
            const data: any = {};
            data['referenceId'] = transferAssetData._id;
            data['ticketName'] = transferAssetData.transferAssetNumber;
            data['pickupFromType'] = DELIVERY_FROM_TO_TYPE.plant;
            data['pickupFrom'] = transferAssetData?.transferFromPlant?.optionValue;
            data['pickupFromAddress'] = transferAssetData?.transferFromPlant?.address;
            if (transferAssetData?.transferType === 'Internal') {
              data['deliveryToType'] = DELIVERY_FROM_TO_TYPE.plant;
              data['deliveryTo'] = transferAssetData?.transfertoPlant?.optionValue;
              data['deliveryToLabel'] = transferAssetData?.transfertoPlant?.optionLabel;
              data['deliveryToAddress'] = transferAssetData?.plantShipTo?.optionValue;
            } else if (transferAssetData?.transferType === 'External Customer') {
              data['deliveryToType'] = DELIVERY_FROM_TO_TYPE.customer;
              data['deliveryTo'] = transferAssetData?.transfertoCustomer?.optionValue;
              data['deliveryToAddress'] = transferAssetData?.customerShipTo?.optionValue;
            } else if (transferAssetData?.transferType === 'External Supplier') {
              data['deliveryToType'] = DELIVERY_FROM_TO_TYPE.supplier;
              data['deliveryTo'] = transferAssetData?.transfertoSupplier?.optionValue;
              data['deliveryToAddress'] = transferAssetData?.supplierShipTo?.optionValue;
            }
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
            data['isDeliveryToDisable'] = true;
            data['status'] = DELIVERY_TICKET_STATUS.inTransit;
            setShowTicketDialog({ open: true, data: data });
          }}
        >
          Create Loading Ticket
        </MenuItem>
        <MenuItem
          disabled={
            !canReceive ||
            selectedRecords.length === 0 ||
            selectedRecords.filter((e: any) => e?.loadingTicketStatus === DELIVERY_TICKET_STATUS.inTransit).length !== selectedRecords.length
          }
          onClick={() => {
            setShowConfirmBoxReceive({ open: true, type: 'receiveAssets' });
          }}
        >
          Receive Assets
        </MenuItem>
        <MenuItem
          disabled={
            selectedRecords.length === 0 ||
            selectedRecords.filter((e: any) => e?.loadingTicketStatus === DELIVERY_TICKET_STATUS.inTransit).length !== selectedRecords.length
          }
          onClick={() => {
            const products = [];
            selectedRecords?.forEach((element) => {
              const foundProduct = products.filter((e) => e._id === element?.productId);
              if (foundProduct.length) {
                foundProduct[0].qty += 1;
              } else {
                products.push({
                  _id: element?.productId,
                  id: element?.productId,
                  productName: element?.product,
                  qty: 1
                });
              }
            });
            setAddSerializedAssetDialog({ open: true, products: products });
          }}
        >
          Replace Assets
        </MenuItem>
        {permissions?.transferAsset?.isUpdate &&
          selectedRecords.length &&
          selectedRecords?.filter((f) => f.hasOwnProperty('loadingTicket') && f?.loadingTicketStatus === DELIVERY_TICKET_STATUS.new)?.length ===
          selectedRecords?.length ? (
          <MenuItem
            onClick={() => {
              setShowConfirmBox(true);
            }}
          >
            Remove Assets
          </MenuItem>
        ) : null}
        <MenuItem
          disabled={
            selectedRecords.length && selectedRecords?.every((e) => e?.loadingTicketStatus === DELIVERY_TICKET_STATUS.inTransit) ? false : true
          }
          onClick={() => {
            setShowConformationDeliverdCancleTicket({ open: true, type: 'Non-Delivered' });
          }}
        >
          Cancel In-Transit Loading Ticket(s)
        </MenuItem>
        <MenuItem
          disabled={
            !canReceive ||
            selectedRecords.length === 0 ||
            selectedRecords.some((e: any) => e?.loadingTicketStatus !== DELIVERY_TICKET_STATUS.delivered)
          }
          onClick={() => {
            setShowConfirmBoxReceive({ open: true, type: 'changeReceiveDate' });
          }}
        >
          Change Receive Date
        </MenuItem>
        {/* <MenuItem
          disabled={selectedRecords.length && selectedRecords?.every(e => e?.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered) ? false : true}
          onClick={() => {
            setShowConformationDeliverdCancleTicket({ open: true, type: 'Delivered' });
          }}
        >
          Cancel Deliverd Loading Ticket(s)
        </MenuItem> */}
      </>
    );
  };

  return (
    <Fragment>
      <DetailsPageHeader
        isAddButtonVisible={false}
        isActionButtonVisible={allowedToEdit && !isTransferEnded}
        actionButtonMenuItems={<ActionMenuItems />}
        actionButtonProps={{ disabled: selectedRecords.length === 0 }}
        previewDownloadProps={previewDownloadProps}
        hasXpadding
      />
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
          ticketType={DELIVERY_TICKET_TYPE.loading}
          referenceType={DELIVERY_TICKET_REFERENCE_TYPE.transferAsset}
          referenceData={showTicketDialog.data}
          assets={selectedRecords?.filter((e) => !e.loadingTicketId)}
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
      {showConfirmBoxReceive.open && (
        <ReceiveDialog
          handleClose={() => setShowConfirmBoxReceive({ open: false, type: null })}
          selectedRecords={selectedRecords}
          handleSuccess={() => {
            fetchAssetsData(true);
            setShowConfirmBoxReceive({ open: false, type: null });
          }}
          transferAssetId={transferAssetId}
          type={showConfirmBoxReceive.type}
        />
      )}
      {addSerializedAssetDialog.open && (
        <AddSerializedAsset
          addSerializedAsset={handleOpenReplaceAssetReason}
          handleSerializedAssetClose={() => {
            setAddSerializedAssetDialog({ open: false, products: [] });
          }}
          referenceType={transferAssetData?.rentalJob ? 'ReplaceAsset' : 'Transfer Asset'}
          replaceAssets={true}
          referenceData={{
            _id: transferAssetData?._id,
            warehouse: transferAssetData?.transferFromPlant.optionValue
          }}
          isAdding={replaceLoading}
          selectedProducts={addSerializedAssetDialog.products}
          filterByPlant={transferAssetData?.transferFromPlant}
        />
      )}
      {showReplaceReason.open && (
        <ReplaceAssetReason
          handleClose={() => setShowReplaceReason({ open: false, data: {} })}
          loading={replaceLoading}
          handleSucess={(data) => {
            handleReplaceAsset(data?.reason);
          }}
        />
      )}

      {showConformationDeliverdCancleTicket.open && (
        <ConfirmationDialog
          open={showConformationDeliverdCancleTicket.open}
          message={`This action will cancel the complete Loading Ticket(s). Are you sure?`}
          onClose={() => {
            setShowConformationDeliverdCancleTicket({ open: false, type: null });
          }}
          onOk={() => {
            if (showConformationDeliverdCancleTicket.type === 'Delivered') {
              cancelDeliveredTicket();
            } else {
              handelCancelTickets();
            }
          }}
          okBtnLoading={okBtnLoading}
        />
      )}
    </Fragment>
  );
};

export default LoadingTicketGrid;
