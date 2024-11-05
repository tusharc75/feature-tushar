import { Box, Button, IconButton } from '@material-ui/core';
import Dialog from '@material-ui/core/Dialog';
import moment from 'moment';
import { useEffect, useState } from 'react';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomDialogTransition, PRODUCT_SERIAL_NUMBER_STATUS, dateTimeFormat } from 'src/constants/helpers';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { Autorenew } from '@material-ui/icons';
import RevertQtyDialog from 'src/pages/ProductInventory/History/RevertQtyDialog';

function ProcessLogs({ onClose, logsData, productName, product, referenceType }) {
  const renderedFrom = 'workOrder_consumables_request_process_logs';

  const [fullScreen, setFullScreen] = useState(true);
  const [columns, setColumns] = useState(null);
  const [revertQtyDialog, setRevertQtyDialog] = useState({ open: false, qty: 0, revertedQty: 0, ledgerId: '', serialNumber: [] });

  const { state, dispatch } = useTableReducer({ renderedFrom });

  useEffect(() => {
    fetchColumn();
    fetchData();
  }, []);

  const fetchColumn = async () => {
    const column: any = [
      {
        accessor: 'qty',
        Header: 'Processed Qty',
        primaryField: true,
        width: 150,
        Cell: ({ row }) => {
          return row?.original['qty'] ? <p className="text-truncate">{row?.original['qty']}</p> : <NoDataCell />;
        }
      },
      {
        accessor: 'revertedQty',
        Header: 'Reverted Qty',
        primaryField: true,
        width: 150,
        Cell: ({ row }) => {
          return row?.original['revertedQty'] ? <p className="text-truncate">{row?.original['revertedQty']}</p> : <NoDataCell />;
        }
      },
      {
        accessor: 'user',
        Header: 'Processed By',
        width: 200,
        Cell: ({ row }) => {
          return row?.original['user'] ? (
            <a className="link text-truncate" href={`${routes.userDetail.path}/${row?.original['userId']}`} target="_blank">
              {row?.original['user']}
            </a>
          ) : (
            <NoDataCell />
          );
        }
      },
      {
        accessor: 'date',
        Header: 'Processed Date',
        width: 200,
        Cell: ({ row }) => {
          return row?.original['date'] ? <p className="text-truncate">{moment(row?.original['date']).format(dateTimeFormat)}</p> : <NoDataCell />;
        }
      },
      {
        accessor: 'comment',
        Header: 'Comment',
        width: 200,
        Cell: ({ row }) => {
          return row?.original['comment'] ? <p className="text-truncate">{row?.original['comment']}</p> : <NoDataCell />;
        }
      },
      {
        accessor: 'serialNumber',
        Header: 'Serial Number',
        width: 200,
        Cell: ({ row }) => {
          return (
            <>
              {row?.original['serialNumber']?.length ? (
                <>
                  <p className="text-truncate">{row?.original['serialNumber']?.map((e) => e?.optionLabel).join(', ')}</p>
                </>
              ) : (
                <NoDataCell />
              )}
            </>
          );
        }
      }
    ];
    column.push({
      accessor: 'action',
      Header: 'Actions',
      minWidth: 100,
      width: 100,
      sticky: 'right',
      disableFilters: true,
      disableSortBy: true,
      canDrag: false,
      Cell: ({ row }) =>
        row.original?.qty - (row.original?.revertedQty || 0) > 0 && (
          <Box>
            <HtmlTooltip title="Revert">
              <IconButton
                size="small"
                aria-label="revert"
                onClick={() => {
                  setRevertQtyDialog({
                    open: true,
                    qty: row.original?.qty,
                    revertedQty: row.original?.revertedQty || 0,
                    ledgerId: row.original?._id,
                    serialNumber: row.original?.serialNumber
                  });
                }}
              >
                <Autorenew fontSize="small" color="primary" />
              </IconButton>
            </HtmlTooltip>
          </Box>
        )
    });
    setColumns([...column]);
  };

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });

    const data = JSON.parse(JSON.stringify(logsData));
    data?.forEach((e) => {
      e.userId = e?.user?.optionValue;
      e.user = e?.user?.optionLabel;
    });

    dispatch({ type: 'initialize', data: data, count: data?.length });
    dispatch({ type: 'loading', loading: false });
  };

  return (
    <Dialog
      open
      fullScreen={fullScreen}
      TransitionComponent={CustomDialogTransition}
      maxWidth="md"
      fullWidth
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          onClose();
        }
      }}
    >
      <CustomDialogHeader
        title={`Process Logs - ${productName}`}
        onClose={onClose}
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
        showRequiredLabel={false}
        showManimizeMaximize={true}
      />
      <CustomDialogContent isFooterPresent={false}>
        {columns ? (
          <Box p={2}>
            <Box zIndex={5} width={'100%'} height={'calc(100vh - 200px)'}>
              <CustomReactTable
                height={'calc(100vh - 200px)'}
                columns={columns}
                state={state}
                dispatch={dispatch}
                refreshGrid={fetchData}
                hideSelection={true}
                renderedFrom={renderedFrom}
                isClientSideGrid={true}
              />
            </Box>
          </Box>
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomDialogContent>
      {revertQtyDialog.open && (
        <RevertQtyDialog
          referenceType={referenceType}
          productName={productName}
          product={product}
          qty={revertQtyDialog.qty}
          revertedQty={revertQtyDialog.revertedQty}
          ledgerId={revertQtyDialog.ledgerId}
          onClose={() => {
            setRevertQtyDialog({ open: false, qty: 0, revertedQty: 0, ledgerId: '', serialNumber: [] });
          }}
          onSuccess={() => {
            setRevertQtyDialog({ open: false, qty: 0, revertedQty: 0, ledgerId: '', serialNumber: [] });
            onClose();
          }}
          serialNumber={
            revertQtyDialog.serialNumber
              ?.map((s) => {
                if (s.status === PRODUCT_SERIAL_NUMBER_STATUS.unAvailable) {
                  return s;
                }
              })
              ?.filter(Boolean) || []
          }
        />
      )}
    </Dialog>
  );
}

export default ProcessLogs;
