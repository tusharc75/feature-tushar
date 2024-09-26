import { Box, IconButton } from '@material-ui/core';
import { AddCircleOutline, Autorenew, Visibility } from '@material-ui/icons';
import HistoryIcon from '@material-ui/icons/History';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import {
  CHILD_RESOURCE,
  DELIVERY_TICKET_REFERENCE_TYPE,
  DELIVERY_TICKET_STATUS,
  DELIVERY_TICKET_TYPE,
  SUBCONTRACT_ASSEMBLY_STATUS,
  deliveryTicket,
  sidebarResource
} from 'src/constants/helpers';
import ReceivingCostDialog from 'src/pages/SubcontractAssembly/Receiving/ReceivingCostDialog';
import ViewCost from 'src/pages/SubcontractAssembly/Receiving/ViewCost';
import History from '../../ProductInventory/LedgerHistory';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { FiExternalLink } from 'react-icons/fi';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';

const renderedFrom = `${camelCase(routes?.subcontractAssembly.title)}_Receiving`;

const Receiving = ({ subcontractAssemblyData, stepFullScreen, fetchParentData, allowedToEdit }) => {
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { generateColumns } = useColumns();

  const [columns, setColumns] = useState(null);
  const [costDialog, setCostDialog] = useState({ open: false, _id: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewCost, setViewCost] = useState({ open: false, data: null, title: null });
  const [historyDialog, setHistoryDialog] = useState({ open: false, _id: '', product: '', productName: '' });
  const [showConformationReject, setShowConformationReject] = useState({ open: false, _id: null });

  useEffect(() => {
    fetchFields();
    fetchData();
  }, [subcontractAssemblyData]);

  const fetchFields = async () => {
    var data = await fetch_child_resource_fields(CHILD_RESOURCE.subcontractAssemblyMaterial, subcontractAssemblyData?.currency, true);
    const newColumns = generateColumns(renderedFrom, data, null, false, subcontractAssemblyData?.currency);

    let column: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>,
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
        accessor: 'action',
        Header: 'Actions',
        minWidth: 110,
        width: 110,
        sticky: 'right',
        disableFilters: true,
        disableSortBy: true,
        canDrag: false,
        Cell: ({ row }) => {
          return (
            <div className="flex items-center gap-2">
              {row?.original?.receivedQty <= 0 && (
                <HtmlTooltip title={row?.original?.canReceive ? 'Receive' : ''}>
                  <IconButton
                    size="small"
                    aria-label="Receive"
                    disabled={row?.original?.canReceive && allowedToEdit ? false : true}
                    onClick={() => {
                      setCostDialog({ open: true, _id: row?.original?._id });
                    }}
                  >
                    <AddCircleOutline fontSize="small" color={row?.original?.canReceive && allowedToEdit ? 'primary' : 'disabled'} />
                  </IconButton>
                </HtmlTooltip>
              )}
              {row?.original?.receivedQty > 0 && allowedToEdit && ![SUBCONTRACT_ASSEMBLY_STATUS.closed].includes(subcontractAssemblyData?.status) && (
                <HtmlTooltip title={'Revert'}>
                  <span>
                    <IconButton
                      size="small"
                      aria-label="Revert"
                      onClick={() => {
                        setShowConformationReject({ open: true, _id: row?.original?._id });
                      }}
                    >
                      <Autorenew fontSize="small" color="primary" />
                    </IconButton>
                  </span>
                </HtmlTooltip>
              )}
              {row?.original?.receivedQty > 0 && (
                <HtmlTooltip title={'View History'}>
                  <span>
                    <IconButton
                      size="small"
                      aria-label="history"
                      onClick={() => {
                        setHistoryDialog({
                          open: true,
                          _id: row?.original?._id,
                          product: row?.original?.materialId,
                          productName: row?.original?.productDetail?.productName
                        });
                      }}
                    >
                      <HistoryIcon fontSize="small" color={'primary'} />
                    </IconButton>
                  </span>
                </HtmlTooltip>
              )}
              {row?.original?.receivedQty > 0 && (
                <HtmlTooltip title={'View Cost'}>
                  <span>
                    <IconButton
                      size="small"
                      aria-label="cost"
                      onClick={() => {
                        setViewCost({ open: true, data: row?.original?.cost, title: row?.original?.productName });
                      }}
                    >
                      <Visibility fontSize="small" color={'primary'} />
                    </IconButton>
                  </span>
                </HtmlTooltip>
              )}
            </div>
          );
        }
      }
    ];

    setColumns([...column, ...extracolumns]);
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    let data;
    const response = await axiosInstance().get(`${routes.subcontractAssembly.path}/${subcontractAssemblyData?._id}/material`);
    data = response?.data?.data?.material;

    const result = await axiosInstance().get(
      `${deliveryTicket.api}/typewise?referenceType=${DELIVERY_TICKET_REFERENCE_TYPE.subcontractAssembly}&referenceId=${subcontractAssemblyData._id}&ticketType=${DELIVERY_TICKET_TYPE.delivery}`
    );
    const deliveryTicketList = result?.data?.data;

    let rows = data?.filter((d: any) => !d.parentId);
    rows.forEach((parent, i) => {
      const consumables = data?.filter((d) => d?.parentId === parent?._id);
      parent.index = i + 1;
      parent.productName = parent?.productDetail?.productName;
      parent.productDescription = parent?.productDetail?.productDescription;
      parent.productNumber = parent?.productDetail?.productNumber;
      parent.receivedQty = parent?.receivedQty || 0;
      parent.canReceive =
        consumables?.length > 0 &&
        consumables?.every((d) =>
          deliveryTicketList
            ?.filter((dt) => dt.ticketType === DELIVERY_TICKET_TYPE.delivery && dt.status === DELIVERY_TICKET_STATUS.delivered)
            .some((_d) => _d?.products?.map((p) => p?.product).includes(d?.materialId) && _d?.products?.map((p) => p?.uniqueId)?.includes(d?._id))
        );
    });

    dispatch({ type: 'initialize', data: rows, count: rows?.length });
    dispatch({ type: 'loading', loading: false });
  };

  const handelReject = () => {
    setIsSubmitting(true);
    axiosInstance()
      .put(`${routes.subcontractAssembly.path}/${subcontractAssemblyData?._id}/material/reject`, { ids: [showConformationReject?._id] })
      .then((res) => {
        fetchData();
        fetchParentData();
        setIsSubmitting(false);
        setShowConformationReject({ open: false, _id: null });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setIsSubmitting(false);
        setShowConformationReject({ open: false, _id: null });
      });
  };

  const previewDownloadProps = {
    fileName: `${routes.subcontractAssembly.title}-${subcontractAssemblyData?.subcontractAssemblyNumber}`,
    resource: sidebarResource.subcontractAssembly,
    referenceId: subcontractAssemblyData._id,
    columns: columns,
    isSendEmail: false
  };

  return (
    <>
      <DetailsPageHeader isAddButtonVisible={false} isActionButtonVisible={false} previewDownloadProps={previewDownloadProps} hasXpadding />
      {columns ? (
        <Box zIndex={5} width={'100%'}>
          <CustomReactTable
            height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
            refreshGrid={fetchData}
            hideSelection={true}
          />
        </Box>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {costDialog.open && (
        <ReceivingCostDialog
          onClose={() => {
            setCostDialog({ open: false, _id: null });
          }}
          onSuccess={() => {
            fetchData();
            fetchParentData();
            setCostDialog({ open: false, _id: null });
          }}
          _id={costDialog._id}
          subcontractAssemblyData={subcontractAssemblyData}
        />
      )}
      {historyDialog.open && (
        <History
          handleClose={() => setHistoryDialog({ open: false, _id: '', product: '', productName: '' })}
          productName={historyDialog.productName}
          referenceId={subcontractAssemblyData?._id}
          uniqueId={historyDialog._id}
          product={historyDialog.product}
        />
      )}
      {viewCost.open && (
        <ViewCost
          data={viewCost.data}
          title={viewCost.title}
          onClose={() => {
            setViewCost({ open: false, data: null, title: null });
          }}
          subcontractAssemblyData={subcontractAssemblyData}
        />
      )}
      {showConformationReject.open && (
        <ConfirmationDialog
          open={showConformationReject.open}
          message={`Are you sure you want to revert the receive action?`}
          onClose={() => {
            setShowConformationReject({ open: false, _id: null });
          }}
          onOk={() => {
            handelReject();
          }}
          okBtnLoading={isSubmitting}
        />
      )}
    </>
  );
};

export default Receiving;
