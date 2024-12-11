import { Box, IconButton, MenuItem } from '@material-ui/core';
import { map, startCase, uniq } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { FiExternalLink } from 'react-icons/fi';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import CustomMessageDialog from 'src/components/MessageDialog';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import {
  CHILD_RESOURCE,
  DELIVERY_FROM_TO_TYPE,
  DELIVERY_TICKET_REFERENCE_TYPE,
  DELIVERY_TICKET_STATUS,
  DELIVERY_TICKET_TYPE,
  MATERIAL_TYPE,
  RESOURCE_LABEL,
  deliveryTicket,
  salesOrder
} from 'src/constants/helpers';
import { salesOrderActions, salesOrderMessage } from 'src/constants/messageHelpers';
import ManageDeliveryTicket from 'src/pages/DeliveryTicket/ManageDeliveryTicket';

const renderedFrom = `${RESOURCE_LABEL.salesOrder}_LoadingTicket`;

const LoadingTicket = ({ salesOrderData, setNextStep, stepFullScreen }) => {
  const toastConfig = useContext(CustomToastContext);

  const [columns, setColumns] = useState(null);
  const [showTicketDialog, setShowTicketDialog] = useState({ open: false, data: {} });
  const [openMessageDialog, setOpenMessageDialog] = useState({ open: false, errorMessages: [] });

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { selectedRecords } = state;
  const { generateColumns } = useColumns();

  const {
    state: { user, permissions }
  }: any = useData();

  useEffect(() => {
    fetchFields();
    fetchData();
  }, [salesOrderData]);

  const fetchFields = async () => {
    var data = await fetch_child_resource_fields(CHILD_RESOURCE.salesOrderProduct, salesOrderData?.currency, true);
    const newColumns = generateColumns(renderedFrom, data, null, false, salesOrderData?.currency);
    let coloum: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 100,
        sticky: 'left',
        disableFilters: false,
        Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>,
        Footer: () => {
          return <>Total</>;
        }
      },
      {
        accessor: 'type',
        Header: 'Type',
        sticky: isMobile || isTablet ? 'none' : 'left',
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <p>{`${startCase(row.original?.type)} `}</p>
          </div>
        )
      },
      {
        accessor: 'detail',
        Header: 'Detail',
        disabled: true,
        sticky: isMobile || isTablet ? 'none' : 'left',
        width: 200,
        Cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <p title={row.original?.detail}>{row.original?.detail}</p>
            <IconButton
              size="small"
              onClick={() => {
                if (row.original.type === 'service') {
                  window.open(`${routes.serviceMasterDetail.path}/${row.original.materialId}`);
                } else if (row.original.type === 'product') {
                  window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                } else {
                  window.open(`${routes.packagesDetail.path}/${row.original.materialId}`);
                }
              }}
            >
              <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
            </IconButton>
          </div>
        )
      },
      {
        accessor: 'description',
        Header: 'Description',
        width: 200,
        Cell: ({ row }) => {
          return row.original['description'] ? (
            <div>
              <p className="text-truncate">{row.original.description}</p>
            </div>
          ) : (
            <NoDataCell />
          );
        }
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
        accessor: 'loadingTicketStatus',
        Header: 'Status',
        Cell: ({ row }) =>
          row?.original?.loadingTicketStatus ? <h5 className="text-truncate">{row?.original?.loadingTicketStatus}</h5> : <NoDataCell />
      },
      {
        accessor: 'leadTime',
        Header: 'Lead Time (Days)',
        Cell: ({ row }) => <div>{<p>{row.original['leadTime'] || 0}</p>}</div>,
        Footer: (info) => {
          let rows = info.table.getExpandedRowModel().rows;
          const total = rows
            ?.filter((f) => f.original.hasOwnProperty('leadTime') && !isNaN(f.original['leadTime']))
            .reduce((sum, row) => parseInt(row.original['leadTime']) + sum, 0);
          return <>{total}</>;
        }
      }
    ];
    coloum = [...coloum, ...newColumns];
    setColumns(coloum);
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });

    setNextStep(false);

    const result = await axiosInstance().get(
      `${deliveryTicket.api}/typewise?referenceType=${DELIVERY_TICKET_REFERENCE_TYPE.salesOrder}&referenceId=${salesOrderData._id}&ticketType=${DELIVERY_TICKET_TYPE.delivery}`
    );
    const deliveryTicketList = result?.data?.data;

    var material: any = [];
    const response = await axiosInstance().get(`${salesOrder.api}/material/${salesOrderData._id}`);
    material = response?.data?.data?.material;

    const rows = material.filter((e) => e.parentId === null && MATERIAL_TYPE.product);
    rows.forEach((parent, i) => {
      parent.index = i + 1;
      parent.detail = parent.productDetail?.productName;
      parent.description = parent?.productDetail?.productDescription;
      parent.leadTime = Array.isArray(parent.leadTime) ? `${parent?.leadTime?.reduce((acc, e) => acc + parseInt(e?.days || 0), 0) || 0}` : 0;
      parent.qty = parent.qty;
      parent.uniqueId = parent._id;
    });

    deliveryTicketList.map((obj) => {
      if (obj.ticketType === DELIVERY_TICKET_TYPE.delivery) {
        rows.map((d, index) => {
          if (obj?.products?.some((p) => p?.product === d?.materialId && p?.uniqueId === d?.uniqueId)) {
            rows[index]['loadingTicket'] = obj?.ticketName;
            rows[index]['loadingTicketId'] = obj?._id;
            rows[index]['loadingTicketStatus'] = obj?.status;
          }
        });
      }
    });

    if (rows.filter((e) => e.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered).length) {
      setNextStep(true);
    }

    dispatch({ type: 'initialize', data: rows, count: rows?.length });
    dispatch({ type: 'loading', loading: false });
  };

  const validateAction = (action) => {
    const errorMessages = [];
    var records = [...selectedRecords];
    records?.forEach((e) => {
      if (action === salesOrderActions.createLoadingTicket) {
        if (e.hasOwnProperty('loadingTicketId')) {
          errorMessages.push({ index: e.index, message: salesOrderMessage.loadingAlreadyCreated });
        }
      } else if (action === salesOrderActions.deliveredLoadingTicket) {
        if (!e.hasOwnProperty('loadingTicketId')) {
          errorMessages.push({ index: e.index, message: salesOrderMessage.loadingNotCreated });
        } else if (e?.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered) {
          errorMessages.push({ index: e.index, message: salesOrderMessage.loadingAlreadyDelivered });
        }
      }
    });
    if (errorMessages?.length) {
      setOpenMessageDialog({ open: true, errorMessages: errorMessages });
      return true;
    }
    return false;
  };

  const handleDeliveryTicketDialog = () => {
    if (selectedRecords.length) {
      const data = {};
      data['ticketName'] = salesOrderData.salesOrderNo;
      data['referenceId'] = salesOrderData._id;

      data['pickupFromType'] = DELIVERY_FROM_TO_TYPE.plant;
      data['pickupFrom'] = salesOrderData?.warehouse?.optionValue;

      data['deliveryToType'] = DELIVERY_FROM_TO_TYPE.customer;
      data['deliveryTo'] = salesOrderData?.customerAccount?.optionValue;
      data['deliveryToAddress'] = salesOrderData.shippingAddress?.optionValue;

      data['isPickupFromDisable'] = true;
      data['isDeliveryToDisable'] = true;

      setShowTicketDialog({ open: true, data: data });
    }
  };

  const handelProcessTickets = () => {
    let data = {};
    const loadingTicketIds = uniq(map(selectedRecords, 'loadingTicketId'));
    if (loadingTicketIds.length) {
      data['_ids'] = loadingTicketIds?.map((e) => e);
      data['status'] = DELIVERY_TICKET_STATUS.delivered;
      data['signatures'] = [];
      data['warehouse'] = salesOrderData?.warehouse?.optionValue;
      data['receiveDate'] = new Date();
      axiosInstance()
        .post(`${deliveryTicket.api}/updatebulk`, data)
        .then(({ data: { data } }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: `Delivered Successfully`
          });
          fetchData();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const actionButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          onClick={() => {
            if (!validateAction(salesOrderActions.createLoadingTicket)) {
              handleDeliveryTicketDialog();
            }
          }}
          disabled={selectedRecords.length === 0}
        >
          Create Loading Ticket
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (!validateAction(salesOrderActions.deliveredLoadingTicket)) {
              handelProcessTickets();
            }
          }}
        >
          Delivered Loading Ticket
        </MenuItem>
      </>
    );
  };

  return (
    <>
      <DetailsPageHeader
        isAddButtonVisible={false}
        isActionButtonVisible={true}
        actionButtonMenuItems={actionButtonMenuItems()}
        actionButtonProps={{ disabled: selectedRecords.length === 0 }}
        hasXpadding
      />
      {columns ? (
        <Box zIndex={5} width={'100%'} mt={3}>
          <CustomReactTable
            height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 395px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
            refreshGrid={fetchData}
          />
        </Box>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}

      {showTicketDialog.open && (
        <ManageDeliveryTicket
          ticketType={DELIVERY_TICKET_TYPE.delivery}
          referenceType={DELIVERY_TICKET_REFERENCE_TYPE.salesOrder}
          referenceData={showTicketDialog.data}
          onClose={() => setShowTicketDialog({ open: false, data: {} })}
          products={selectedRecords
            ?.filter((e) => e.type === 'product')
            ?.map((e) => {
              return { ...e, _id: e.materialId };
            })}
          onSuccess={() => {
            setShowTicketDialog({ open: false, data: {} });
            fetchData();
          }}
        />
      )}

      {openMessageDialog.open && (
        <CustomMessageDialog
          open={openMessageDialog.open}
          errorMessages={openMessageDialog.errorMessages}
          onClose={() => {
            setOpenMessageDialog({ open: false, errorMessages: [] });
          }}
        />
      )}
    </>
  );
};

export default LoadingTicket;
