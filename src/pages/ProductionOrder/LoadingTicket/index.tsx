import { IconButton, MenuItem } from '@mui/material';
import Box from '@mui/material/Box/Box';
import Grid from '@mui/material/Grid2';import { map, startCase, uniq } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { useData } from 'src/StateProvider/Provider';
import CustomReactTable, { gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../../axios/axiosInstance';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import routes from '../../../components/Helpers/Routes';
import {
  CHILD_RESOURCE,
  DELIVERY_FROM_TO_TYPE,
  DELIVERY_TICKET_REFERENCE_TYPE,
  DELIVERY_TICKET_STATUS,
  DELIVERY_TICKET_TYPE,
  MATERIAL_TYPE,
  deliveryTicket,
  productionOrder
} from '../../../constants/helpers';
import ManageDeliveryTicket from '../../DeliveryTicket/ManageDeliveryTicket';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import { FiExternalLink } from 'react-icons/fi';

const LoadingTicket = ({ productionOrderData, setNextStep, stepFullScreen, renderedFrom, allowedToEdit }) => {
  const toastConfig = useContext(CustomToastContext);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, limit, filters, sorting, selectedRecords, search } = state;

  const [columns, setColumns] = useState(null);
  const [showTicketDialog, setShowTicketDialog] = useState({ open: false, data: {} });
  const { generateColumns } = useColumns();

  const {
    state: { user, permissions }
  }: any = useData();

  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [page, limit, filters, sorting, search]);

  const fetchRecords = async () => {
    setNextStep(false);
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    try {
      const queryString = getQueryString();
      const {
        data: { data, count }
      } = await axiosInstance().get(`${productionOrder.api}/material/${productionOrderData._id}${queryString}`);
      let rows = data.material.filter((e) => e.type === MATERIAL_TYPE.product);

      const {
        data: { data: deliveryTicketList }
      } = await axiosInstance().get(
        `${deliveryTicket.api}/typewise?referenceType=${DELIVERY_TICKET_REFERENCE_TYPE.productionOrder}&referenceId=${productionOrderData._id}&ticketType=${DELIVERY_TICKET_TYPE.loading}`
      );

      const totalPrev = page * limit;
      rows.forEach((parent, i) => {
        parent.index = i + 1 + totalPrev;
        parent.detail = parent.detail ? parent.detail : parent.productDetail?.productName;
        parent.description = parent.description ? parent.description : parent?.productDetail?.productDescription;
        parent.qty = parent.qty;
      });
      deliveryTicketList?.map((obj) => {
        if (obj.ticketType === DELIVERY_TICKET_TYPE.loading) {
          rows.map((d, index) => {
            if (obj?.products?.some((p) => d?.materialId === p?.product && d?._id === p?.uniqueId)) {
              rows[index]['loadingTicket'] = obj?.ticketName;
              rows[index]['loadingTicketId'] = obj?._id;
              rows[index]['loadingTicketStatus'] = obj?.status;
              if (obj?.status === DELIVERY_TICKET_STATUS.delivered) {
                rows[index]['hideSelection'] = true;
              }
            }
          });
        }
      });
      if (rows?.filter((e) => e.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered)?.length === rows?.length) {
        setNextStep(true);
      }
      dispatch({ type: 'initialize', data: rows, count: count });
      dispatch({ type: 'loading', loading: false });
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}`;
    if (isExport) {
      deepFilter = `?`;
    }
    const { filterByIds, deepFilters } = gridFilterParser(filters);

    if (filterByIds?.length) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterByIds)}`;
    }
    if (deepFilters?.length) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(deepFilters))}`;
    }
    if (filterByIds?.length || deepFilters?.length) {
      deepFilter = `${deepFilter}&filterType=and`;
    }
    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }
    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURIComponent(search)}`;
    }
    return deepFilter;
  };

  const fetchFields = async () => {
    const response = await fetch_child_resource_fields(CHILD_RESOURCE.productionOrderDetail, productionOrderData?.currency, false);
    var data = response?.filter((e) => !['detail', 'description', 'workOrderNumber']?.includes(e?.fieldName));
    const newColumns = generateColumns(renderedFrom, data, null, false, productionOrderData?.currency || 'USD');
    let coloum: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: 'left',
        Cell: ({ row }) => <h5 className="text-truncate">{row.original.index}</h5>,
        Footer: () => {
          return <>Total</>;
        }
      },
      {
        accessor: 'type',
        Header: 'Type',
        disableFilters: true,
        sticky: isMobile || isTablet ? 'none' : 'left',
        width: 100,
        Cell: ({ row }) => (row.original['type'] ? <h5>{`${startCase(row.original?.type)} `}</h5> : <NoDataCell />)
      },
      {
        accessor: 'detail',
        Header: ' Details',
        minWidth: 200,
        width: 200,
        sticky: isMobile || isTablet ? 'none' : 'left',
        Cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <h5 className="text-truncate">{row.original?.detail}</h5>
            <Box ml={1}>
              <IconButton
                size="small"
                onClick={() => {
                  window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                }}
              >
                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
              </IconButton>
            </Box>
          </div>
        )
      },
      {
        accessor: 'description',
        Header: 'Description',
        width: 200,
        Cell: ({ row }) => {
          return row.original['description'] ? <h5 className="text-truncate">{row.original.description}</h5> : <NoDataCell />;
        }
      },
      {
        accessor: 'loadingTicket',
        Header: 'Loading Ticket',
        width: 200,
        Cell: ({ row }) =>
          row?.original?.loadingTicket ? (
            <div className="flex items-center gap-2">
              <h5 className="text-truncate">{row?.original?.loadingTicket}</h5>
              <Box ml={1}>
                <IconButton
                  size="small"
                  onClick={() => {
                    window.open(`${routes.deliveryTicketDetail.path}/${row.original.loadingTicketId}`);
                  }}
                >
                  <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                </IconButton>
              </Box>
            </div>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'loadingTicketStatus',
        Header: 'Loading Ticket Status',
        width: 200,
        Cell: ({ row }) =>
          row?.original?.loadingTicketStatus ? <h5 className="text-truncate">{row?.original?.loadingTicketStatus}</h5> : <NoDataCell />
      }
    ];
    coloum = [...coloum, ...newColumns];
    setColumns(coloum);
  };

  const handleDeliveryTicketDialog = () => {
    if (selectedRecords?.length) {
      const data = {};
      data['ticketName'] = productionOrderData?.productionOrderNumber || '';
      data['referenceId'] = productionOrderData._id;
      data['pickupFromType'] = DELIVERY_FROM_TO_TYPE.plant;
      data['pickupFrom'] = productionOrderData?.warehouse?.optionValue;
      data['pickupFromAddress'] = productionOrderData?.warehouse?.optionValue;
      data['deliveryToType'] = DELIVERY_FROM_TO_TYPE.customer;
      data['deliveryTo'] = productionOrderData?.customerAccount?.optionValue;
      data['deliveryToAddress'] = productionOrderData?.shippingAddress?.optionValue;
      data['startDate'] = new Date();
      data['endDate'] = new Date();
      data['isPickupFromDisable'] = true;
      data['isDeliveryToDisable'] = true;
      if (productionOrderData?.processor?.optionValue) {
        data['processor'] = productionOrderData?.processor?.optionValue;
      }
      data['status'] = DELIVERY_TICKET_STATUS.inTransit;
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
      data['warehouse'] = productionOrderData?.warehouse?.optionValue;
      axiosInstance()
        .post(`${deliveryTicket.api}/updatebulk`, data)
        .then(({ data: { data } }) => {
          fetchRecords();
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: `Delivered Successfully`
          });
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
            handleDeliveryTicketDialog();
          }}
          disabled={selectedRecords?.length === 0 || selectedRecords?.some((f) => f.hasOwnProperty('loadingTicketId'))}
        >
          Create Loading Ticket
        </MenuItem>
        <MenuItem
          disabled={
            selectedRecords?.length === 0 ||
            selectedRecords?.filter((e: any) => e?.loadingTicketStatus === DELIVERY_TICKET_STATUS.inTransit).length !== selectedRecords?.length
          }
          onClick={() => {
            handelProcessTickets();
          }}
        >
          Delivered to Customer
        </MenuItem>
      </>
    );
  };

  return (
    <>
      {allowedToEdit && (
        <DetailsPageHeader
          isAddButtonVisible={false}
          isActionButtonVisible={true}
          actionButtonMenuItems={actionButtonMenuItems()}
          actionButtonProps={{ disabled: selectedRecords?.length === 0 }}
          hasXpadding
        />
      )}

      <Grid size={{xs:12, md:12, sm:12}} className="mt-3">
        {columns ? (
          <Box zIndex={5} width={'100%'}>
            <CustomReactTable
              height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 395px)'}
              columns={columns}
              state={state}
              dispatch={dispatch}
              renderedFrom={renderedFrom}
              refreshGrid={fetchRecords}
              hideSelection={!allowedToEdit}
              hideAction={!allowedToEdit}
            />
          </Box>
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Grid>
      {showTicketDialog.open && (
        <ManageDeliveryTicket
          ticketType={DELIVERY_TICKET_TYPE.loading}
          referenceType={DELIVERY_TICKET_REFERENCE_TYPE.productionOrder}
          referenceData={showTicketDialog.data}
          onClose={() => setShowTicketDialog({ open: false, data: {} })}
          assets={[]}
          products={selectedRecords?.map((e) => ({ _id: e?.materialId, qty: e?.qty || 1, uniqueId: e._id }))}
          onSuccess={() => {
            setShowTicketDialog({ open: false, data: {} });
            fetchRecords();
          }}
        />
      )}
    </>
  );
};

export default LoadingTicket;
