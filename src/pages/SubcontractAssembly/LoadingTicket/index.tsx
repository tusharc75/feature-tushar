import { Box, IconButton, MenuItem } from '@mui/material';
import { LocalShipping } from '@mui/icons-material';
import { map, uniq } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { FiExternalLink } from 'react-icons/fi';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
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
  dateFormatToSend,
  deliveryTicket,
  sidebarResource
} from 'src/constants/helpers';
import { subcontractAssemblyActions, subcontractAssemblyMessage } from 'src/constants/messageHelpers';
import ManageDeliveryTicket from 'src/pages/DeliveryTicket/ManageDeliveryTicket';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import { useSetWalkmeData } from 'src/components/CustomIntro';
import ReceiveDateDialog from 'src/pages/SubcontractAssembly/LoadingTicket/ReceiveDateDialog';

const renderedFrom = `${sidebarResource?.subcontractAssembly}_LoadingTicket`;

const LoadingTicket = ({ subcontractAssemblyData, setNextStep, stepFullScreen, allowedToEdit }) => {
  const { setWalkmeData } = useSetWalkmeData();
  const toastConfig = useContext(CustomToastContext);

  const [columns, setColumns] = useState(null);
  const [showTicketDialog, setShowTicketDialog] = useState({ open: false, data: {} });
  const [openMessageDialog, setOpenMessageDialog] = useState({ open: false, errorMessages: [] });
  const [showConformationCancleTicket, setShowConformationCancleTicket] = useState(false);
  const [showConformationDeliverTicket, setShowConformationDeliverTicket] = useState(false);
  const [okBtnLoading, setOkBtnLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { selectedRecords } = state;
  const { generateColumns } = useColumns();

  useEffect(() => {
    fetchFields();
    fetchData();
  }, [subcontractAssemblyData]);

  useEffect(() => {
    setWalkmeData([]);
  }, []);

  const fetchFields = async () => {
    var data = await fetch_child_resource_fields(CHILD_RESOURCE.subcontractAssemblyMaterial, subcontractAssemblyData?.currency, true);
    const newColumns = generateColumns(renderedFrom, data, null, false, subcontractAssemblyData?.currency);

    let column: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: 'left',
        Cell: ({ row }) => (
          <div className="d-flex align-items-center gap-2">
            <p className="text-truncate">{row.original.index}</p>
            {row?.original?.loadingTicketId && (
              <HtmlTooltip title={`Loading Ticket ${row?.original?.loadingTicketStatus}`}>
                <LocalShipping fontSize="small" color={'primary'} />
              </HtmlTooltip>
            )}
          </div>
        ),
        Footer: () => {
          return <>Total</>;
        }
      }
    ];

    let fields;
    const response = await axiosInstance().put(`/field/find-field-labels`, {
      fields: [{ resource: 'Product', fieldNames: ['productName', 'productNumber', 'productDescription'] }]
    });
    fields = response?.data?.data;

    const productFields = fields?.find((e) => e.resource === 'Product')?.fieldNames || [];
    productFields?.forEach((e) => {
      if (e?.fieldName === 'productName') {
        column.push({
          accessor: e?.fieldName,
          Header: e?.fieldLabel,
          width: 200,
          disabled: true,
          sticky: isMobile || isTablet ? 'none' : 'left',
          primaryField: true,
          cell: ({ row, table }) => (
            <div className="flex items-center gap-2">
              <p>{row?.original[e?.fieldName]}</p>
              <IconButton
                size="small"
                onClick={() => {
                  window.open(`${routes.productDetail.path}/${row.original?.materialId}`);
                }}
              >
                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
              </IconButton>
            </div>
          )
        });
      } else {
        column.push({
          accessor: e?.fieldName,
          Header: e?.fieldLabel,
          width: 200,
          cell: ({ row }) => {
            return row.original[e?.fieldName] ? <p className="text-truncate">{row.original[e?.fieldName]}</p> : <NoDataCell />;
          }
        });
      }
    });

    const extracolumns: any = [
      ...newColumns,
      {
        accessor: 'parent',
        Header: 'Parent',
        width: 200,
        Cell: ({ row }) => {
          return row.original['parent'] ? (
            <div>
              <p className="text-truncate">{row.original.parent}</p>
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
      }
    ];

    setColumns([...column, ...extracolumns]);
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });

    setNextStep(false);

    const result = await axiosInstance().get(
      `${deliveryTicket.api}/typewise?referenceType=${DELIVERY_TICKET_REFERENCE_TYPE.subcontractAssembly}&referenceId=${subcontractAssemblyData._id}&ticketType=${DELIVERY_TICKET_TYPE.delivery}`
    );
    const deliveryTicketList = result?.data?.data;

    var material: any = [];
    const response = await axiosInstance().get(`${routes.subcontractAssembly.path}/${subcontractAssemblyData._id}/material`);
    material = response?.data?.data?.material;

    const rows = material.filter((e) => e.parentId != null && MATERIAL_TYPE.product);
    rows.forEach((obj, i) => {
      obj.index = i + 1;
      obj.productName = obj?.productDetail?.productName;
      obj.productDescription = obj?.productDetail?.productDescription;
      obj.productNumber = obj?.productDetail?.productNumber;
      obj.qty = obj.qty;
      obj.uniqueId = obj._id;
      obj.parent = material?.find((m) => m?.parentId === null && m?._id === obj?.parentId)?.productDetail?.productName || '';
      obj.receivedQty = material?.find((m) => m?.parentId === null && m?._id === obj?.parentId)?.receivedQty || 0;
      obj.parentId = null;
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

    if (rows.some((e) => e.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered)) {
      setNextStep(true);
    }

    dispatch({ type: 'initialize', data: rows, count: rows?.length });
    dispatch({ type: 'loading', loading: false });
  };

  const validateAction = (action) => {
    const errorMessages = [];
    var records = [...selectedRecords];
    records?.forEach((e) => {
      if (action === subcontractAssemblyActions.createLoadingTicket) {
        if (e.hasOwnProperty('loadingTicketId')) {
          errorMessages.push({ index: e.index, message: subcontractAssemblyMessage.loadingAlreadyCreated });
        }
      } else if (action === subcontractAssemblyActions.deliveredLoadingTicket) {
        if (!e.hasOwnProperty('loadingTicketId')) {
          errorMessages.push({ index: e.index, message: subcontractAssemblyMessage.loadingNotCreated });
        } else if (e?.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered) {
          errorMessages.push({ index: e.index, message: subcontractAssemblyMessage.loadingAlreadyDelivered });
        }
      } else if (action === subcontractAssemblyActions.cancelLoadingTicket) {
        if (!e.hasOwnProperty('loadingTicketId')) {
          errorMessages.push({ index: e.index, message: subcontractAssemblyMessage.loadingNotCreated });
        } else if (e?.receivedQty) {
          errorMessages.push({ index: e.index, message: subcontractAssemblyMessage.assemblyProductAlreadyReceived });
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
      data['ticketName'] = subcontractAssemblyData.subcontractAssemblyNumber;
      data['referenceId'] = subcontractAssemblyData._id;

      data['pickupFromType'] = DELIVERY_FROM_TO_TYPE.plant;
      data['pickupFrom'] = subcontractAssemblyData?.warehouse?.optionValue;

      data['deliveryToType'] = DELIVERY_FROM_TO_TYPE.supplier;
      data['deliveryTo'] = subcontractAssemblyData?.supplierAccount?.optionValue;
      data['deliveryToAddress'] = subcontractAssemblyData.shippingAddress?.optionValue;

      data['isPickupFromDisable'] = true;
      data['isDeliveryToDisable'] = true;

      setShowTicketDialog({ open: true, data: data });
    }
  };

  const handelDeliverTickets = (receiveDate) => {
    let data = {};
    const loadingTicketIds = uniq(map(selectedRecords, 'loadingTicketId'));
    if (loadingTicketIds.length) {
      data['_ids'] = loadingTicketIds?.map((e) => e);
      data['status'] = DELIVERY_TICKET_STATUS.delivered;
      data['signatures'] = [];
      data['warehouse'] = subcontractAssemblyData?.warehouse?.optionValue;
      data['receiveDate'] = dateFormatToSend(receiveDate);
      setLoading(true);
      axiosInstance()
        .post(`${deliveryTicket.api}/updatebulk`, data)
        .then(({ data: { data } }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: `Delivered Successfully`
          });
          setLoading(false);
          setShowConformationDeliverTicket(false);
          fetchData();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setLoading(false);
        });
    }
  };

  const handelCancleTickets = async () => {
    setOkBtnLoading(true);
    try {
      const inTransitloadingTicketIds = uniq(
        map(
          selectedRecords?.filter((e) => e.loadingTicketStatus === DELIVERY_TICKET_STATUS.inTransit),
          'loadingTicketId'
        )
      );
      if (inTransitloadingTicketIds?.length) {
        await axiosInstance().put(`${deliveryTicket.api}/revert`, { ids: inTransitloadingTicketIds });
      }

      const deliveredloadingTicketIds = uniq(
        map(
          selectedRecords?.filter((e) => e.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered),
          'loadingTicketId'
        )
      );
      if (deliveredloadingTicketIds?.length) {
        await axiosInstance().post(`${deliveryTicket.api}/cancel-delivered-ticket`, { _ids: deliveredloadingTicketIds });
      }

      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: `Cancelled Successfully`
      });
      setOkBtnLoading(false);
      setShowConformationCancleTicket(false);
      fetchData();
    } catch (error) {
      setOkBtnLoading(false);
      toastConfig.setToastConfig(error);
    }
  };

  const actionButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          onClick={() => {
            if (!validateAction(subcontractAssemblyActions.createLoadingTicket)) {
              handleDeliveryTicketDialog();
            }
          }}
          disabled={selectedRecords.length === 0}
        >
          Create Loading Ticket
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (!validateAction(subcontractAssemblyActions.deliveredLoadingTicket)) {
              setShowConformationDeliverTicket(true);
            }
          }}
          disabled={selectedRecords.length === 0}
        >
          Delivered Loading Ticket
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (!validateAction(subcontractAssemblyActions.cancelLoadingTicket)) {
              setShowConformationCancleTicket(true);
            }
          }}
          disabled={selectedRecords.length === 0}
        >
          Cancel Loading Ticket(s)
        </MenuItem>
      </>
    );
  };

  return (
    <>
      <>
        <DetailsPageHeader
          isAddButtonVisible={false}
          isActionButtonVisible={allowedToEdit}
          actionButtonMenuItems={actionButtonMenuItems()}
          actionButtonProps={{ disabled: selectedRecords.length === 0 }}
          hasXpadding
        />
        {columns ? (
          <Box zIndex={5}>
            <CustomReactTable
              height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}
              columns={columns}
              state={state}
              dispatch={dispatch}
              renderedFrom={renderedFrom}
              isClientSideGrid={true}
              refreshGrid={fetchData}
              hideSelection={!allowedToEdit}
              hideAction={!allowedToEdit}
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
            referenceType={DELIVERY_TICKET_REFERENCE_TYPE.subcontractAssembly}
            referenceData={showTicketDialog.data}
            onClose={() => setShowTicketDialog({ open: false, data: {} })}
            products={selectedRecords?.map((e) => {
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
        {showConformationCancleTicket && (
          <ConfirmationDialog
            open={showConformationCancleTicket}
            message={`This action will cancel the complete Loading Ticket(s). Are you sure?`}
            onClose={() => {
              setShowConformationCancleTicket(false);
            }}
            onOk={() => {
              handelCancleTickets();
            }}
            okBtnLoading={okBtnLoading}
          />
        )}

        {showConformationDeliverTicket && (
          <ReceiveDateDialog
            handleClose={() => {
              setShowConformationDeliverTicket(false);
            }}
            handleSucess={(receiveDate) => {
              handelDeliverTickets(receiveDate);
            }}
            loading={loading}
            refrenceData={subcontractAssemblyData}
          />
        )}
      </>
    </>
  );
};

export default LoadingTicket;
