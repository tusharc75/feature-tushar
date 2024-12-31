import { Box, IconButton } from '@mui/material';
import { Help, LocalShipping } from '@mui/icons-material';
import { camelCase } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import { FiExternalLink } from 'react-icons/fi';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import {
  ASSET_STATUS,
  COLOUR_MASTER,
  DELIVERY_FROM_TO_TYPE,
  DELIVERY_TICKET_REFERENCE_TYPE,
  DELIVERY_TICKET_STATUS,
  DELIVERY_TICKET_TYPE,
  deliveryTicket,
  gridLoadingTimeout,
  INVENTORY_OWNER_TYPE,
  rentalManagement,
  sidebarResource
} from 'src/constants/helpers';
import ManageDeliveryTicket from 'src/pages/DeliveryTicket/ManageDeliveryTicket';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const Assets = ({ rentalManagementData, onSuccess }) => {
  const renderedFrom = `${camelCase(sidebarResource.scheduleAndDispatch)}_${camelCase(sidebarResource.rentalManagement)}_asset`;
  const toastConfig = useContext(CustomToastContext);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows } = state;
  const [columns, setColumns] = useState(null);
  const [showTicketDialog, setShowTicketDialog] = useState({ open: false, ticketType: null, data: null });
  useEffect(() => {
    fetchData();
    fetchColumns();
  }, [rentalManagementData]);

  const fetchColumns = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().put(`/field/find-field-labels`, {
        fields: [
          {
            resource: sidebarResource.product,
            fieldNames: ['productName']
          },
          {
            resource: sidebarResource.serializedAsset,
            fieldNames: [
              'serialNumber',
              'position',
              'wellNumber',
              'mtrAttached',
              'warehouse',
              'jobCount',
              'currentGpsLocation',
              'currentGpsWellNames'
            ]
          }
        ]
      });

      const productFields = data?.find((d) => d.resource === sidebarResource.product)?.fieldNames || [];
      const assetFields = data?.find((d) => d.resource === sidebarResource.serializedAsset)?.fieldNames || [];
      const column: any = [
        {
          accessor: 'index',
          Header: 'Index',
          minWidth: 100,
          width: 100,
          disabled: true,
          Cell: ({ row }) => (
            <div
              className="d-flex align-items-center gap-2"
              style={{
                backgroundColor:
                  row?.original?.warehouseId &&
                    row?.original?.warehouseId !== rentalManagementData?.warehouse?.optionValue &&
                    !row?.original?.loadingTicketId
                    ? COLOUR_MASTER.transferAsset.background
                    : [ASSET_STATUS.lost, ASSET_STATUS.scrap, ASSET_STATUS.needRepair, ASSET_STATUS.needRecert]?.includes(row?.original?.status)
                      ? COLOUR_MASTER.lostAssets.background
                      : ''
              }}
            >
              <h5 className="text-truncate">{row?.original?.index}</h5>
              {row?.original?.loadingTicketId && !row?.original?.receivingTicketId && (
                <HtmlTooltip title={`Loading Ticket ${row?.original?.loadingTicketStatus}`}>
                  <LocalShipping fontSize="small" color={'primary'} />
                </HtmlTooltip>
              )}
              {row?.original?.receivingTicketId && (
                <HtmlTooltip title={`Receiving Ticket ${row?.original?.receivingTicketStatus}`}>
                  <LocalShipping fontSize="small" color={'primary'} className="[transform:scaleX(-1)_!important]" />
                </HtmlTooltip>
              )}

              {row?.original?.warehouseId &&
                row?.original?.warehouseId !== rentalManagementData?.warehouse?.optionValue &&
                !row?.original?.loadingTicketId && (
                  <HtmlTooltip title="Will be shipped from different facility">
                    <IconButton size="small">
                      <Help fontSize="small" color="primary" />
                    </IconButton>
                  </HtmlTooltip>
                )}
            </div>
          )
        },
        {
          accessor: 'assetNumber',
          Header: 'Details',
          disabled: true,
          Cell: ({ row }) => (
            <div className="flex items-center gap-2">
              <h5 className="text-truncate" title={row?.original?.assetNumber}>
                {row?.original?.assetNumber}
              </h5>
              <IconButton
                size="small"
                onClick={() => {
                  window.open(`${routes.serializedAssetDetail.path}/${row?.original?._id}`);
                }}
              >
                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
              </IconButton>
            </div>
          )
        },
        {
          accessor: 'displayType',
          Header: 'Type',
          disabled: true,
          Cell: ({ row }) => (row?.original?.displayType ? <h5 className="text-truncate">{row?.original?.displayType}</h5> : <NoDataCell />)
        },
        {
          accessor: 'productName',
          Header: productFields?.find((f) => f.fieldName === 'productName')?.fieldLabel || 'Product Name',
          Cell: ({ row }) =>
            row?.original?.productName ? (
              <div className="flex items-center gap-2">
                <h5 className="text-truncate">{row?.original?.productName}</h5>
                <IconButton
                  size="small"
                  onClick={() => {
                    window.open(`${routes.productDetail.path}/${row?.original?.materialId}`);
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
          accessor: 'qty',
          Header: 'Qty',
          disabled: true,
          Cell: ({ row }) => <h5 className="text-truncate">{row?.original?.qty || <NoDataCell />}</h5>
        },
        {
          accessor: 'description',
          Header: 'Description',
          Cell: ({ row }) => (row?.original?.description ? <h5 className="text-truncate">{row?.original?.description}</h5> : <NoDataCell />)
        },
        {
          accessor: 'warehouse',
          Header: assetFields?.find((f) => f.fieldName === 'warehouse')?.fieldLabel || 'Plant',
          Cell: ({ row }) =>
            row?.original?.warehouse ? (
              <div className="flex items-center gap-2">
                <h5 className="text-truncate">{row?.original?.warehouse}</h5>
                <IconButton
                  size="small"
                  onClick={() => {
                    window.open(`${routes.warehouseDetail.path}/${row?.original?.warehouseId}`);
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
          accessor: 'loadingTicket',
          Header: 'Loading Ticket',
          Cell: ({ row }) =>
            row?.original?.loadingTicket ? (
              <div className="flex items-center gap-2">
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
        },
        {
          accessor: 'receivingTicket',
          Header: 'Receiving Ticket',
          Cell: ({ row }) =>
            row?.original?.receivingTicket ? (
              <div className="flex items-center gap-2">
                <h5 className="text-truncate">{row?.original?.receivingTicket}</h5>
                <IconButton
                  size="small"
                  onClick={() => {
                    window.open(`${routes.deliveryTicketDetail.path}/${row?.original?.receivingTicketId}`);
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
          accessor: 'rentalAssetStatus',
          Header: 'Rental Asset Status',
          Cell: ({ row }) =>
            row?.original?.rentalAssetStatus ? <h5 className="text-truncate">{row?.original?.rentalAssetStatus}</h5> : <NoDataCell />
        },
        {
          accessor: 'status',
          Header: 'Asset Status',
          Cell: ({ row }) => (row?.original?.status ? <h5 className="text-truncate">{row?.original?.status}</h5> : <NoDataCell />)
        }
      ];
      setColumns(column);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    try {
      const response = await axiosInstance().get(`${rentalManagement.api}/${rentalManagementData._id}/inventory`);
      const result = await axiosInstance().get(
        `${deliveryTicket.api}/typewise?referenceType=${DELIVERY_TICKET_REFERENCE_TYPE.rentalJob}&referenceId=${rentalManagementData._id}`
      );
      let productAssets = response?.data?.data;
      productAssets = productAssets
        .map((d) => ({
          ...d.inventory,
          uniqueId: d._id,
          rentalAssetStatus: d?.status,
          startDate: d?.startDate,
          description: d?.product?.productDescription
        }))
        .map((u) => ({
          ...u,
          type: 'Asset',
          displayType: 'Asset',
          qty: 1,
          productName: u?.product?.optionLabel,
          materialId: u?.product?.optionValue,
          warehouse: u?.warehouse?.optionLabel,
          warehouseId: u?.warehouse?.optionValue,
          currentOwner: u?.currentOwner,
          startDate: u?.startDate
        }));
      let deliveryTicketList = result?.data?.data;
      deliveryTicketList.map((obj) => {
        if (obj.ticketType === DELIVERY_TICKET_TYPE.loading) {
          productAssets.map((d, index) => {
            if (obj?.assets?.some((p) => p?.asset === d?._id && p?.uniqueId === d?.uniqueId)) {
              productAssets[index]['loadingTicket'] = obj?.ticketName;
              productAssets[index]['loadingTicketId'] = obj?._id;
              productAssets[index]['loadingTicketStatus'] = obj?.status;
            }
          });
        }
        if (obj.ticketType === DELIVERY_TICKET_TYPE.receiving) {
          productAssets.map((d, index) => {
            if (obj?.assets?.some((p) => p?.asset === d?._id && p?.uniqueId === d?.uniqueId)) {
              productAssets[index]['receivingTicket'] = obj?.ticketName;
              productAssets[index]['receivingTicketId'] = obj?._id;
              productAssets[index]['receivingTicketStatus'] = obj?.status;
            }
          });
        }
      });
      productAssets?.forEach((e, index) => {
        e.index = index + 1;
      });

      dispatch({ type: 'initialize', data: productAssets, count: productAssets.length });
      setTimeout(() => {
        dispatch({ type: 'loading', loading: false });
      }, gridLoadingTimeout);
    } catch (error) {
      dispatch({ type: 'loading', loading: false });
      toastConfig.setToastConfig(error);
    }
  };

  const handleLoadingTicket = () => {
    const loadingTicketRecords = dataRows?.filter((d) => !d.loadingTicketId);

    if (loadingTicketRecords.length) {
      const data = {};
      data['ticketName'] = rentalManagementData.rentalJobName;
      data['referenceId'] = rentalManagementData._id;

      if (loadingTicketRecords[0].warehouseId) {
        data['pickupFromType'] = DELIVERY_FROM_TO_TYPE.plant;
        data['pickupFrom'] = loadingTicketRecords[0].warehouseId;
        data['pickupFromAddress'] = loadingTicketRecords[0].currentLocation?.optionValue;
      } else if (loadingTicketRecords[0].currentOwnerType === INVENTORY_OWNER_TYPE.customerAccount) {
        data['pickupFromType'] = DELIVERY_FROM_TO_TYPE.customer;
        data['pickupFrom'] = loadingTicketRecords[0].currentOwner;
        data['pickupFromAddress'] = loadingTicketRecords[0].currentLocation?.optionValue;
      } else if (loadingTicketRecords[0].currentOwnerType === INVENTORY_OWNER_TYPE.supplierAccount) {
        data['pickupFromType'] = DELIVERY_FROM_TO_TYPE.supplier;
        data['pickupFrom'] = loadingTicketRecords[0].currentOwner;
        data['pickupFromAddress'] = loadingTicketRecords[0].currentLocation?.optionValue;
      }

      data['deliveryToType'] = DELIVERY_FROM_TO_TYPE.customer;
      data['deliveryTo'] = rentalManagementData?.customerAccount?.optionValue;
      data['deliveryToAddress'] = rentalManagementData.shippingAddress?.optionValue;

      data['startDate'] = rentalManagementData?.estimateStartDate;
      data['endDate'] = rentalManagementData?.estimateStartDate;
      data['isPickupFromDisable'] = true;
      data['isDeliveryToDisable'] = true;
      data['status'] = DELIVERY_TICKET_STATUS.delivered;

      if (rentalManagementData?.afeNumber) {
        data['afeNumber'] = rentalManagementData?.afeNumber;
      }
      if (rentalManagementData?.processor?.optionValue) {
        data['processor'] = rentalManagementData?.processor?.optionValue;
      }
      setShowTicketDialog({ open: true, ticketType: DELIVERY_TICKET_TYPE.loading, data: data });
    }
  };
  const handleReceivingTicket = () => {
    const receivingTicketRecords = dataRows?.filter(
      (d) => d?.loadingTicketId && d?.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered && !d?.receivingTicketId
    );
    if (receivingTicketRecords.length) {
      const data = {};
      data['ticketName'] = rentalManagementData.rentalJobName;
      data['referenceId'] = rentalManagementData._id;
      data['pickupFromType'] = DELIVERY_FROM_TO_TYPE.customer;
      data['pickupFrom'] = rentalManagementData?.customerAccount?.optionValue;
      data['pickupFromAddress'] = receivingTicketRecords[0]?.currentLocation?.optionValue;
      data['deliveryToType'] = DELIVERY_FROM_TO_TYPE.plant;

      data['deliveryTo'] = rentalManagementData?.warehouse?.optionValue;
      data['deliveryToAddress'] = rentalManagementData?.warehouse?.address;

      data['startDate'] = rentalManagementData?.estimateStartDate;
      data['endDate'] = rentalManagementData?.estimateStartDate;
      data['isPickupFromDisable'] = true;
      data['status'] = DELIVERY_TICKET_STATUS.delivered;

      if (rentalManagementData?.padName?.optionValue) {
        data['padName'] = rentalManagementData?.padName?.optionValue;
      }
      if (rentalManagementData?.wellName?.optionValue) {
        data['wellName'] = rentalManagementData?.wellName?.optionValue;
      }
      // if (receivingTicketRecords?.find((e) => !isEmpty(e?.wellNumber))) {
      //   data['wellNumber'] = getUniqueWellNumber(selectedRecords);
      // } else if (rentalManagementData?.wellNumber) {
      //   if (rentalManagementData?.wellNumber?.optionValue) {
      //     data['wellNumber'] = rentalManagementData?.wellNumberId;
      //   } else {
      //     data['wellNumber'] = rentalManagementData?.wellNumber?.map((e) => e?.optionValue);
      //   }
      // }
      if (rentalManagementData?.afeNumber) {
        data['afeNumber'] = rentalManagementData?.afeNumber;
      }
      if (rentalManagementData?.processor?.optionValue) {
        data['processor'] = rentalManagementData?.processor?.optionValue;
      }

      setShowTicketDialog({ open: true, ticketType: DELIVERY_TICKET_TYPE.receiving, data: data });
    }
  };

  return (
    <Fragment>
      {columns ? (
        <div>
          <CustomReactTable
            height={'calc(100vh - 393px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
            refreshGrid={fetchData}
            hideAction={true}
            hideSelection={true}
          />
          <div className="mt-4 flex justify-end gap-2">
            {dataRows?.some((d) => !d?.loadingTicketId) && (
              <ThemeButton
                disabled={!dataRows?.some((d) => !d?.loadingTicketId)}
                buttonType="theme"
                onClick={() => handleLoadingTicket()}
              >
                Dispatch
              </ThemeButton>
            )}
            {dataRows?.some((d) => d?.loadingTicketId && d?.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered && !d?.receivingTicketId) && (
              <ThemeButton disabled={false} buttonType="theme" onClick={() => handleReceivingTicket()}>
                Receive
              </ThemeButton>
            )}
          </div>
        </div>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {showTicketDialog.open && (
        <ManageDeliveryTicket
          ticketType={showTicketDialog.ticketType}
          referenceType={DELIVERY_TICKET_REFERENCE_TYPE.rentalJob}
          referenceData={showTicketDialog.data}
          onClose={() => setShowTicketDialog({ open: false, ticketType: null, data: {} })}
          assets={
            showTicketDialog.ticketType === DELIVERY_TICKET_TYPE.loading
              ? dataRows?.filter((e) => !e.loadingTicketId)
              : dataRows?.filter((e) => e.loadingTicketId && e?.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered && !e?.receivingTicketId)
          }
          onSuccess={() => {
            setShowTicketDialog({ open: false, ticketType: null, data: {} });
            fetchData();
            onSuccess();
          }}
        />
      )}
    </Fragment>
  );
};

export default Assets;
