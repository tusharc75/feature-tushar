import { Box, IconButton, Menu, MenuItem } from '@material-ui/core';
import { useState, useEffect, useContext, Fragment } from 'react';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { Button, Typography } from '@material-ui/core';
import moment from 'moment';
import { MATERIAL_REQUEST_STATUS, dateTimeFormat } from 'src/constants/helpers';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { useData } from 'src/StateProvider/Provider';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import { camelCase } from 'lodash';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import QtyDialog from './QtyDialog';
import { ExpandMore } from '@material-ui/icons';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import HistoryIcon from '@material-ui/icons/History';
import ProcessLogs from 'src/pages/WorkOrder/Consumables/ProcessLogs';

import CustomTable, { ColumnsInterface } from 'src/components/CustomTable';

const Request = ({ workOrder }) => {
  const toastConfig = useContext(CustomToastContext);

  const [loading, setLoading] = useState(false);

  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState(null);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [qtyDialog, setQtyDialog] = useState({ open: false, status: null, data: null });
  const [openProcessLogs, setOpenProcessLogs] = useState({ open: false, logs: [], productName: '' });

  const {
    state: { user }
  }: any = useData();

  useEffect(() => {
    fetchColumn();
    fetchData();
  }, [workOrder]);

  const handleUpdateStatus = (status, ids, comment) => {
    setLoading(true);
    axiosInstance()
      .put(`/material-handling/status/${workOrder}`, { status, ids, comment })
      .then(({ data }) => {
        setLoading(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setQtyDialog({ open: false, status: null, data: null });
        fetchData();
      })
      .catch((err) => {
        setLoading(false);
        toastConfig.setToastConfig(err);
      });
  };

  const fetchData = () => {
    setRowsData(null);
    axiosInstance()
      .get(`/material-handling/request/${workOrder}`)
      .then(({ data: { data } }) => {
        data?.forEach((e) => {
          e.productName = e.product?.optionLabel;
          e.productDescription = e.product?.productDescription;
          e.productNumber = e.product?.productNumber;
          e.storageLocationId = e?.storageLocation?.optionValue;
          e.storageLocation = e?.storageLocation?.optionLabel;
          e.requestById = e?.requestBy?.optionValue;
          e.requestBy = e?.requestBy?.optionLabel;
          e.processById = e?.processBy?.optionValue;
          e.processBy = e?.processBy?.optionLabel;
          e.hideSelection = e?.status === MATERIAL_REQUEST_STATUS.requested ? false : true;
        });
        setRowsData(data);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const fetchColumn = async () => {
    setColumns(null);
    // const {
    //   data: { data }
    // } = await axiosInstance().put(`/field/find-field-labels`, {
    //   fields: [
    //     {
    //       resource: 'Product',
    //       fieldNames: ['productName', 'productNumber', 'productDescription']
    //     }
    //   ]
    // });
    // const productFields = data?.find((e) => e.resource === 'Product')?.fieldNames || [];

    const column: ColumnsInterface[] = [
      {
        header: 'Product',
        width: 100,
        render: ({ row }) => {
          return (
            <>
              <Typography className="text-truncate new-table-font">
                <a className="link" href={`${routes.productDetail.path}/${row?.product?.optionValue}`} target="_blank">
                  {row['productName']}
                </a>
              </Typography>
              <Typography className="text-truncate new-table-font">
                <span>{row['productNumber']}</span>
              </Typography>
              <Typography className="text-truncate new-table-font">
                <span>{row['productDescription']}</span>
              </Typography>
            </>
          );
        }
      },
      {
        header: 'Requested Qty',
        width: 100,
        render: ({ row }) => {
          return (
            <>
              <Typography className="text-truncate new-table-font">
                <Typography style={{ fontWeight: 500 }} component="span">
                  {row['qty'] ? row['qty'] : <NoDataCell />}
                </Typography>
              </Typography>
            </>
          );
        }
      },
      {
        header: 'Processed Qty',
        width: 100,
        render: ({ row }) => {
          return (
            <>
              <Typography className="text-truncate new-table-font">
                <Typography style={{ fontWeight: 500 }} component="span">
                  {row['processedQty'] ? row['processedQty'] : <NoDataCell />}
                </Typography>
              </Typography>
            </>
          );
        }
      },
      {
        header: 'Requested By',
        width: 100,
        render: ({ row }) => {
          return (
            <>
              <Typography className="text-truncate new-table-font">
                {row['requestBy'] ? (
                  <a className="link text-truncate new-table-font " href={`${routes.userDetail.path}/${row?.['requestById']}`} target="_blank">
                    {row?.['requestBy']}
                  </a>
                ) : (
                  <NoDataCell />
                )}
              </Typography>
              <Typography className="text-truncate new-table-font ">
                {row['requestDate'] ? <span>{moment(row['requestDate']).format(dateTimeFormat)}</span> : <NoDataCell />}
              </Typography>
            </>
          );
        }
      },
      {
        header: 'Processed By',
        width: 100,
        render: ({ row }) => {
          return (
            <>
              {row['processBy'] ? (
                <>
                  <Typography className="text-truncate new-table-font">
                    <a className="link text-truncate new-table-font " href={`${routes.userDetail.path}/${row?.['processById']}`} target="_blank">
                      {row['processBy']}
                    </a>
                  </Typography>
                  <Typography className="text-truncate new-table-font ">
                    <span>{moment(row['processDate']).format(dateTimeFormat)}</span>
                  </Typography>
                </>
              ) : (
                <NoDataCell />
              )}
            </>
          );
        }
      }
    ];
    if (user?.user?.brandPolicy?.storageLocation) {
      column.push({
        header: 'Storage Location',
        width: 200,
        render: ({ row }) => {
          return row?.['storageLocation'] ? (
            <Typography className="text-truncate new-table-font">
              <a className="link" href={`${routes.storageLocationDetail.path}/${row?.['storageLocationId']}`} target="_blank">
                {row?.['storageLocation']}
              </a>
            </Typography>
          ) : (
            <NoDataCell />
          );
        }
      });
    }
    column.push({
      header: 'Comment',
      width: 150,
      render: ({ row }) => {
        return row['comment'] ? <Typography className="text-truncate new-table-font">{row['comment']}</Typography> : <NoDataCell />;
      }
    });
    column.push({
      header: 'Status',
      width: 150,
      render: ({ row }) => {
        return row['status'] ? <Typography className="text-truncate new-table-font">{row['status']}</Typography> : <NoDataCell />;
      }
    });
    column.push({
      header: 'Action',
      sticky: 'right',
      render: ({ row }) => {
        return (
          <>
            <Box display="flex">
              <Box display="flex" flexGrow={1}>
                {row['status'] === MATERIAL_REQUEST_STATUS.requested && (
                  <Fragment>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      disabled={loading}
                      onClick={() => {
                        setQtyDialog({ open: true, status: MATERIAL_REQUEST_STATUS.processed, data: row });
                      }}
                    >
                      Process
                    </Button>
                    <Box pl={1} />
                    <Button
                      variant="outlined"
                      color="secondary"
                      size="small"
                      disabled={loading}
                      onClick={() => {
                        setQtyDialog({ open: true, status: MATERIAL_REQUEST_STATUS.closed, data: row });
                      }}
                    >
                      Close
                    </Button>
                    <Box pl={1} />
                  </Fragment>
                )}
              </Box>
              <Box>
                {row['processesLogs'] && row['processesLogs']?.length > 0 && (
                  <HtmlTooltip title="View Process Logs">
                    <IconButton
                      size="small"
                      aria-label="Delete"
                      onClick={() => {
                        setOpenProcessLogs({ open: true, logs: row['processesLogs'], productName: row?.productName });
                      }}
                    >
                      <HistoryIcon />
                    </IconButton>
                  </HtmlTooltip>
                )}
              </Box>
            </Box>
          </>
        );
      }
    });
    setColumns([...column]);
  };
  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Box display="flex" justifyContent={'space-between'}>
        <Box>
          <Typography
            variant="subtitle2"
            style={{
              color: 'var(--card-color-primary)',
              fontSize: 15,
              background: 'var(--dark-secondary, #F1F5FF)',
              padding: '8px 40px 8px 10px',
              borderRadius: '8px 4px'
            }}
          >
            Consumables Requests
          </Typography>
        </Box>
        <Box>
          <Button
            disabled={
              selectedRecords?.length > 0 &&
              selectedRecords?.filter((e) => e.status === MATERIAL_REQUEST_STATUS.requested)?.length === selectedRecords?.length
                ? false
                : true
            }
            variant={'outlined'}
            color="default"
            size="small"
            onClick={openActions}
            aria-controls="action-menu"
            endIcon={<ExpandMore />}
          >
            {'Actions'}
          </Button>
          <Menu
            anchorEl={anchorEl}
            keepMounted
            getContentAnchorEl={null}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left'
            }}
            id="action-menu"
            open={Boolean(anchorEl)}
            onClose={closeActions}
          >
            <MenuItem
              onClick={() => {
                setQtyDialog({ open: true, status: MATERIAL_REQUEST_STATUS.processed, data: null });
                closeActions();
              }}
            >
              Process
            </MenuItem>
            <MenuItem
              onClick={() => {
                setQtyDialog({ open: true, status: MATERIAL_REQUEST_STATUS.closed, data: null });
                closeActions();
              }}
            >
              Close
            </MenuItem>
          </Menu>
        </Box>
      </Box>
      <Box pt={2}>
        {rowsData && columns ? (
          <Box zIndex={5} width={'100%'} height={'calc(100vh - 290px)'}>
            <CustomTable
              data={rowsData}
              columns={columns}
              uniqueKey={(data) => data._id}
              onSelect={setSelectedRecords}
              checkBox={true}
              height={'calc(100vh - 290px)'}
            />
          </Box>
        ) : (
          <Box height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Box>
      {qtyDialog.open && (
        <QtyDialog
          open={qtyDialog.open}
          loading={loading}
          onClose={() => setQtyDialog({ open: false, status: null, data: null })}
          status={qtyDialog.status}
          data={qtyDialog.data}
          onSuccess={(data) => {
            if (qtyDialog?.data) {
              handleUpdateStatus(
                qtyDialog.status,
                [{ _id: qtyDialog.data?._id, uniqueId: qtyDialog.data?.uniqueId, qty: parseInt(data?.qty) }],
                data.comment || ''
              );
            } else if (selectedRecords?.length) {
              let rows = selectedRecords?.map((item) => {
                return {
                  _id: item?._id,
                  uniqueId: item?.uniqueId,
                  qty: item?.qty - (item?.processedQty || 0)
                };
              });
              handleUpdateStatus(qtyDialog.status, rows, data.comment || '');
            }
          }}
        />
      )}

      {openProcessLogs.open && (
        <ProcessLogs
          onClose={() => {
            setOpenProcessLogs({ open: false, logs: [], productName: '' });
          }}
          logsData={openProcessLogs.logs}
          productName={openProcessLogs.productName}
        />
      )}
    </>
  );
};

export default Request;
