import { Box, Button, IconButton, Typography } from '@material-ui/core';
import Dialog from '@material-ui/core/Dialog';
import moment from 'moment';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { MATERIAL_REQUEST_STATUS, RESOURCE_LABEL, dateTimeFormat, sidebarResource } from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import ProcessLogs from './ProcessLogs';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import HistoryIcon from '@material-ui/icons/History';
import QtyWithdrawalDialog from './QtyWithdrawalDialog';

function QtyRequestLog({ onClose, referenceId, referenceType, uniqueId, productName, product }) {

  const [fullScreen, setFullScreen] = useState(true);
  const [columns, setColumns] = useState(null);
  const toastConfig = useContext(CustomToastContext);
  const [rowsData, setRowsData] = useState([]);
  const [withdrawalQtyDialog, setWithdrawalQtyDialog] = useState({ open: false, data: null });

  const {
    state: { user }
  }: any = useData();

  const [openProcessLogs, setOpenProcessLogs] = useState({ open: false, logs: [] });

  useEffect(() => {
    fetchColumn();
    fetchData();
  }, [referenceId, uniqueId]);

  const fetchColumn = async () => {
    setColumns(null)
    const column: any = [
      {
        accessor: 'requestDate',
        Header: 'Requested Date',
        primaryField: true,
        width: 200,
        Cell: ({ row }) => {
          return row?.original['requestDate'] ? (
            <p className="text-truncate">{moment(row?.original['requestDate']).format(dateTimeFormat)}</p>
          ) : (
            <NoDataCell />
          );
        }
      },
      {
        accessor: 'requestBy',
        Header: 'Requested By',
        width: 200,
        Cell: ({ row }) => {
          return row?.original['requestBy'] ?
            <a className="link text-truncate" href={`${routes.userDetail.path}/${row?.original['requestById']}`} target="_blank">
              {row?.original['requestBy']}
            </a> : <NoDataCell />;
        }
      },
      {
        accessor: 'qty',
        Header: 'Requested Qty',
        primaryField: true,
        width: 150,
        Cell: ({ row }) => {
          return row?.original['qty'] ? <p className="text-truncate">{row?.original['qty']}</p> : <NoDataCell />;
        }
      },
      {
        accessor: 'processedQty',
        Header: 'Processed Qty',
        primaryField: true,
        width: 150,
        Cell: ({ row }) => {
          return row?.original['processedQty'] ? <p className="text-truncate">{row?.original['processedQty']}</p> : <NoDataCell />;
        }
      },
      {
        accessor: 'status',
        Header: 'Status',
        primaryField: true,
        width: 150,
        Cell: ({ row }) => {
          return row?.original['status'] ? <p className="text-truncate">{row?.original['status']}</p> : <NoDataCell />;
        }
      },
      ...(user?.user?.brandPolicy?.storageLocation
        ? [
          {
            accessor: 'storageLocation',
            Header: 'Storage Location',
            width: 200,
            Cell: ({ row }) => {
              return row?.original['storageLocation'] ?
                <a className="link text-truncate" href={`${routes.storageLocationDetail.path}/${row?.original['storageLocationId']}`} target="_blank">
                  {row?.original['storageLocation']}
                </a> : <NoDataCell />;
            }
          }
        ]
        : []),
      {
        accessor: 'processBy',
        Header: 'Processed By',
        width: 200,
        Cell: ({ row }) => {
          return row?.original['processBy'] ?
            <a className="link text-truncate" href={`${routes.userDetail.path}/${row?.original['processById']}`} target="_blank">
              {row?.original['processBy']}
            </a> : <NoDataCell />;
        }
      },
      {
        accessor: 'processDate',
        Header: 'Processed Date',
        width: 200,
        Cell: ({ row }) => {
          return row?.original['processDate'] ? (
            <p className="text-truncate">{moment(row?.original['processDate']).format(dateTimeFormat)}</p>
          ) : (
            <NoDataCell />
          );
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
        accessor: 'action',
        Header: 'Actions',
        width: 150,
        minWidth: 150,
        sticky: 'right',
        disableFilters: true,
        canDrag: false,
        Cell: ({ row }: any) => (
          <div style={{ display: 'flex', justifyContent: 'right' }}>
            {row.original['status'] === MATERIAL_REQUEST_STATUS.requested && (
              <Button
                variant="contained"
                color="primary"
                size="small"
                onClick={() => {
                  setWithdrawalQtyDialog({ open: true, data: row.original })
                }}
              >
                Close
              </Button>
            )}
            {row.original["processesLogs"] && row.original["processesLogs"]?.length > 0 && (
              <Box ml={1}>
                <HtmlTooltip title="View Logs">
                  <IconButton
                    size="small"
                    aria-label="Delete"
                    onClick={() => {
                      setOpenProcessLogs({ open: true, logs: row.original["processesLogs"] });
                    }}
                  >
                    <HistoryIcon />
                  </IconButton>
                </HtmlTooltip>
              </Box>
            )}
          </div>
        )
      }
    ];
    setColumns([...column]);
  };

  const fetchData = () => {
    axiosInstance()
      .get(`/material-handling/request?referenceId=${referenceId}&referenceType=${referenceType}`)
      .then(({ data: { data } }) => {
        const filteredData = data?.filter((e) => e.uniqueId === uniqueId);
        filteredData?.forEach((e) => {
          e.storageLocationId = e?.storageLocation?.optionValue;
          e.storageLocation = e?.storageLocation?.optionLabel;
          e.requestById = e?.requestBy?.optionValue;
          e.requestBy = e?.requestBy?.optionLabel;
          e.processById = e?.processBy?.optionValue;
          e.processBy = e?.processBy?.optionLabel;
        });
        setRowsData(filteredData);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <>
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
          title={`Requests - ${productName}`}
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
                  onSelect={() => { }}
                  childrenProperty="subRows"
                  uniqueKey="_id"
                  hideSelection={true}
                  hideAction={false}
                  hideExpander={true}
                  renderedFrom={'workOrder_consumables_request'}
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
        {openProcessLogs.open &&
          <ProcessLogs
            onClose={() => {
              setOpenProcessLogs({ open: false, logs: [] })
            }}
            logsData={openProcessLogs.logs}
            productName={productName}
            product={product}
          />
        }
      </Dialog>
      {withdrawalQtyDialog.open &&
        <QtyWithdrawalDialog
          onSuccess={() => {
            setWithdrawalQtyDialog({ open: false, data: null })
            fetchColumn()
            fetchData()
          }}
          onClose={() => {
            setWithdrawalQtyDialog({ open: false, data: null })
          }}
          data={withdrawalQtyDialog.data}
          workOrderId={referenceId}
        />}
    </>
  );
}

export default QtyRequestLog;
