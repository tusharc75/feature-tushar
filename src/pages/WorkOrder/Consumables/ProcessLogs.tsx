import { Box, Button } from '@material-ui/core';
import Dialog from '@material-ui/core/Dialog';
import moment from 'moment';
import { Fragment, useContext, useEffect, useState } from 'react';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { MATERIAL_REQUEST_STATUS, dateTimeFormat } from 'src/constants/helpers';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import { isMobile, isTablet } from 'react-device-detect';
import QtyDialog from './QtyDialog';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

function ProcessLogs({ onClose, logsData, productName, data = null, workOrderId = null }) {
  console.log('logsData', logsData, data);
  const toastConfig = useContext(CustomToastContext);
  const [fullScreen, setFullScreen] = useState(true);
  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState([]);
  const [qtyDialog, setQtyDialog] = useState({ open: false, status: null, data: null, logData: null });

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
      }
    ];
    column.push({
      accessor: 'action',
      Header: 'Action',
      minWidth: 100,
      width: 100,
      sticky: 'right',
      disableFilters: true,
      canDrag: false,
      Cell: ({ row }) =>
        (!row.original?.revertedQty || data?.processedQty > row.original?.revertedQty) &&
        data &&
        workOrderId && (
          <Box display="flex">
            <Box display="flex" flexGrow={1}>
              <Button
                variant="contained"
                color="primary"
                size="small"
                //   disabled={loading}
                onClick={() => {
                  setQtyDialog({ open: true, status: MATERIAL_REQUEST_STATUS.processed, data: data, logData: row?.original });
                }}
              >
                Revert
              </Button>
            </Box>
          </Box>
        )
    });
    setColumns([...column]);
  };

  const fetchData = () => {
    const data = [...logsData];
    data?.forEach((e) => {
      e.userId = e?.user?.optionValue;
      e.user = e?.user?.optionLabel;
    });
    setRowsData(data);
  };

  return (
    <Dialog
      open
      fullScreen={fullScreen}
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
      <CustomDialogContent>
        {rowsData && columns ? (
          <Box p={2}>
            <Box zIndex={5} width={'100%'} height={'calc(100vh - 200px)'}>
              <CustomReactTable
                height={'calc(100vh - 200px)'}
                columns={columns}
                data={rowsData}
                onSelect={() => {}}
                childrenProperty="subRows"
                uniqueKey="_id"
                hideSelection={true}
                hideExpander={true}
                renderedFrom={'workOrder_consumables_request_process_logs'}
                isClientSideGrid={true}
              />
            </Box>
          </Box>
        ) : (
          <Box p={2} height={500} bgcolor="white">
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomDialogContent>
      {qtyDialog.open && (
        <QtyDialog
          open={qtyDialog.open}
          loading={false}
          onClose={() => setQtyDialog({ open: false, status: null, data: null, logData: null })}
          data={qtyDialog.data}
          logData={qtyDialog.logData}
          onSuccess={(data) => {
            data.consumeReqId = qtyDialog.data._id;
            data.processLogId = qtyDialog.logData._id;
            axiosInstance()
              .put(`/material-handling/revert/${workOrderId}`, data)
              .then((res) => {
                setQtyDialog({ open: false, status: null, data: null, logData: null });
                onClose();
              })
              .catch((err) => {
                toastConfig.setToastConfig(err);
              });
          }}
        />
      )}
    </Dialog>
  );
}

export default ProcessLogs;
