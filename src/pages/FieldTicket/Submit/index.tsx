import { Box, Button, IconButton } from '@material-ui/core';
import HistoryIcon from '@material-ui/icons/History';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { camelCase, startCase } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CommentDialog from 'src/components/CommentDialog';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { CHILD_RESOURCE, FIELD_TICKET_STATUS, MATERIAL_TYPE, fieldTicket, sidebarResource } from 'src/constants/helpers';
import ManageSubmit from './ManageSubmit';
import ViewLogs from './ViewLogs';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';

const Submit = ({ stepFullScreen, fieldTicketData, allowedToEdit, fetchData }) => {
  const renderedFrom = `${camelCase(routes?.fieldTicket.title)}_Submit`;

  const toastConfig = useContext(CustomToastContext);
  const [columns, setColumns] = useState(null);
  const [submitDialog, setSubmitDialog] = useState(false);
  const [commentDialog, setCommentDialog] = useState(false);
  const [viewLogsDialog, setViewLogsDialog] = useState(false);

  const { state, dispatch } = useTableReducer();
  const { generateColumns } = useColumns();

  useEffect(() => {
    fetchFields();
    fetchGridData();
  }, [fieldTicketData]);

  const fetchFields = async () => {
    setColumns(null);
    var fields = await fetch_child_resource_fields(CHILD_RESOURCE.fieldTicketMateial, fieldTicketData?.currency, false);

    const newColumns = generateColumns(renderedFrom, fields, null, false, fieldTicketData?.currency);
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
      },
      {
        accessor: 'type',
        Header: 'Type',
        disabled: true,
        sticky: isMobile || isTablet ? 'none' : 'left',
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <p>{`${startCase(row.original?.type)} `}</p>
          </div>
        )
      },
      {
        accessor: 'detail',
        Header: 'Details',
        minWidth: 300,
        width: 300,
        disabled: true,
        sticky: isMobile || isTablet ? 'none' : 'left',
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <p title={row.original.detail}>{row.original.detail}</p>
            {![MATERIAL_TYPE.manualEntry].includes(row.original.type) && (
              <Box ml={1} className="flex-shrink-0">
                <IconButton
                  size="small"
                  onClick={() => {
                    if (row.original.type === MATERIAL_TYPE.service) {
                      window.open(`${routes.serviceMasterDetail.path}/${row.original.materialId}`);
                    } else if (row.original.type === MATERIAL_TYPE.product) {
                      window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                    } else if (row.original.type === MATERIAL_TYPE.serializedAsset) {
                      window.open(`${routes.serializedAssetDetail.path}/${row.original.materialId}`);
                    }
                  }}
                >
                  <OpenInNewIcon fontSize="small" color="primary" />
                </IconButton>
              </Box>
            )}
          </div>
        )
      },
      {
        accessor: 'description',
        Header: 'Description',
        width: 200,
        Cell: ({ row }) => {
          return row.original['description'] ? <p className="text-truncate">{row.original.description}</p> : <NoDataCell />;
        }
      }
    ];
    column = [...column, ...newColumns];
    setColumns(column);
  };

  const fetchGridData = async () => {
    dispatch({ type: 'loading', loading: true });

    const materialResponse = await axiosInstance().get(`${fieldTicket.api}/${fieldTicketData?._id}/material`);
    const costResponse = await axiosInstance().get(`${fieldTicket.api}/${fieldTicketData?._id}/cost`);

    const material = [...materialResponse?.data?.data?.material];
    const costs = costResponse?.data?.data || [];

    material?.forEach((parent, i) => {
      parent.index = i + 1;
      parent.detail = parent?.productDetail?.productName || parent?.serviceDetail?.serviceName || parent?.serializedAssetDetail?.assetNumber || '';
      parent.description = parent?.productDetail?.productDescription || parent?.serviceDetail?.serviceDescription || '';
      parent.qty = parent.qty;
      parent.type = parent.type;
    });
    costs?.forEach((ele, i) => {
      ele.index = i + 1 + material?.length;
      ele.detail = ele.description || '';
      ele.description = ele.description || '';
      ele.type = MATERIAL_TYPE.manualEntry;
    });
    dispatch({ type: 'initialize', data: [...material, ...costs], count: [...material, ...costs]?.length });
    dispatch({ type: 'loading', loading: false });
  };

  const handleReOpen = async (data: any) => {
    await axiosInstance()
      .patch(`${fieldTicket.api}/status/${fieldTicketData._id}`, {
        status: FIELD_TICKET_STATUS.inProgress,
        oldStatus: fieldTicketData?.status,
        comment: data
      })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
        fetchData();
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const previewDownloadProps = {
    fileName: `${routes.fieldTicket.title}-${fieldTicketData?.fieldTicketNumber}`,
    hideDetailButton: true,
    resource: sidebarResource.fieldTicket,
    referenceId: fieldTicketData?._id,
    columns: columns,
    isSendEmail: true,
    defaultColumns: [
      'type',
      'detail',
      'estimateStartDate',
      'estimateEndDate',
      'pricingMethod',
      'qty',
      `price_${fieldTicketData?.currency?.toLowerCase()}`,
      `finalPrice_${fieldTicketData?.currency?.toLowerCase()}`
    ]
  };

  const RightSideContents = () => {
    return (
      <>
        {allowedToEdit && (
          <Fragment>
            {(fieldTicketData.status === FIELD_TICKET_STATUS.new || fieldTicketData.status === FIELD_TICKET_STATUS.inProgress) && (
              <Button
                variant="contained"
                color="primary"
                size="small"
                onClick={() => {
                  setSubmitDialog(true);
                }}
              >
                Submit
              </Button>
            )}
            {fieldTicketData.status === FIELD_TICKET_STATUS.readyToInvoice && (
              <Button variant="contained" color="primary" size="small" onClick={() => setCommentDialog(true)}>
                Re-Open
              </Button>
            )}
          </Fragment>
        )}
        <HtmlTooltip title="View Logs">
          <IconButton size="small" aria-label="Delete" onClick={() => setViewLogsDialog(true)}>
            <HistoryIcon />
          </IconButton>
        </HtmlTooltip>
      </>
    );
  };

  return (
    <>
      <DetailsPageHeader
        isAddButtonVisible={false}
        isActionButtonVisible={false}
        previewDownloadProps={previewDownloadProps}
        rightSideContents={<RightSideContents />}
        hasXpadding
      />

      {columns ? (
        <Box zIndex={5} width={'100%'}>
          <CustomReactTable
            height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            refreshGrid={fetchGridData}
            hideSelection={true}
            hideAction={true}
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
          />
        </Box>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(3).keys()]} xs={12} sm={12} md={12} lg={12} />
        </Box>
      )}
      {submitDialog && (
        <ManageSubmit
          fieldTicketData={fieldTicketData}
          onClose={() => {
            setSubmitDialog(false);
          }}
          onSuccess={() => {
            setSubmitDialog(false);
            fetchData();
          }}
        />
      )}
      {commentDialog && (
        <CommentDialog
          required={true}
          handleSubmit={(data) => {
            handleReOpen(data);
            setCommentDialog(false);
          }}
          handleClose={() => {
            setCommentDialog(false);
          }}
        />
      )}

      {viewLogsDialog && (
        <ViewLogs
          fieldTicketData={fieldTicketData}
          handleClose={() => {
            setViewLogsDialog(false);
          }}
        />
      )}
    </>
  );
};

export default Submit;
