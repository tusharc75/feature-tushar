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
        });
        setRowsData(data);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const fetchColumn = async () => {
    setColumns(null);
    const column = [];
    const {
      data: { data }
    } = await axiosInstance().put(`/field/find-field-labels`, {
      fields: [
        {
          resource: 'Product',
          fieldNames: ['productName', 'productNumber', 'productDescription']
        }
      ]
    });
    const productFields = data?.find((e) => e.resource === 'Product')?.fieldNames || [];
    productFields?.forEach((e) => {
      if (e?.fieldName === 'productName') {
        column.push({
          accessor: e?.fieldName,
          Header: e?.fieldLabel,
          width: 200,
          Cell: ({ row }) => {
            return row.original[e?.fieldName] ? (
              <a className="link text-truncate" href={`${routes.productDetail.path}/${row.original?.product?.optionValue}`} target="_blank">
                {row.original[e?.fieldName]}
              </a>
            ) : (
              <NoDataCell />
            );
          }
        });
      } else {
        column.push({
          accessor: e?.fieldName,
          Header: e?.fieldLabel,
          width: 200,
          Cell: ({ row }) => {
            return row.original[e?.fieldName] ? <p className="text-truncate">{row.original[e?.fieldName]}</p> : <NoDataCell />;
          }
        });
      }
    });
    const extracolumns: any = [
      {
        accessor: 'qty',
        Header: 'Requested Qty',
        width: 150,
        Cell: ({ row }) => {
          return row.original['qty'] ? <p className="text-truncate">{row.original['qty']}</p> : <NoDataCell />;
        }
      },
      {
        accessor: 'processedQty',
        Header: 'Processed Qty',
        width: 150,
        Cell: ({ row }) => {
          return row.original['processedQty'] ? <p className="text-truncate">{row.original['processedQty']}</p> : <NoDataCell />;
        }
      },
      {
        accessor: 'status',
        Header: 'Status',
        width: 200,
        Cell: ({ row }) => {
          return row.original['status'] ? <p className="text-truncate">{row.original['status']}</p> : <NoDataCell />;
        }
      },
      ...(user?.user?.brandPolicy?.storageLocation
        ? [
            {
              accessor: 'storageLocation',
              Header: 'Storage Location',
              width: 200,
              Cell: ({ row }) => {
                return row?.original['storageLocation'] ? (
                  <a
                    className="link text-truncate"
                    href={`${routes.storageLocationDetail.path}/${row?.original['storageLocationId']}`}
                    target="_blank"
                  >
                    {row?.original['storageLocation']}
                  </a>
                ) : (
                  <NoDataCell />
                );
              }
            }
          ]
        : []),
      {
        accessor: 'requestBy',
        Header: 'Requested By',
        width: 200,
        Cell: ({ row }) => {
          return row?.original['requestBy'] ? (
            <a className="link text-truncate" href={`${routes.userDetail.path}/${row?.original['requestById']}`} target="_blank">
              {row?.original['requestBy']}
            </a>
          ) : (
            <NoDataCell />
          );
        }
      },
      {
        accessor: 'requestDate',
        Header: 'Requested Date',
        width: 200,
        Cell: ({ row }) => {
          return row.original['requestDate'] ? (
            <p className="text-truncate">{moment(row.original['requestDate']).format(dateTimeFormat)}</p>
          ) : (
            <NoDataCell />
          );
        }
      },
      {
        accessor: 'processBy',
        Header: 'Processed By',
        width: 200,
        Cell: ({ row }) => {
          return row?.original['processBy'] ? (
            <a className="link text-truncate" href={`${routes.userDetail.path}/${row?.original['processById']}`} target="_blank">
              {row?.original['processBy']}
            </a>
          ) : (
            <NoDataCell />
          );
        }
      },
      {
        accessor: 'processDate',
        Header: 'Processed Date',
        width: 200,
        Cell: ({ row }) => {
          return row.original['processDate'] ? (
            <p className="text-truncate">{moment(row.original['processDate']).format(dateTimeFormat)}</p>
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
          return row.original['comment'] ? <p className="text-truncate">{row.original['comment']}</p> : <NoDataCell />;
        }
      }
    ];
    extracolumns.push({
      accessor: 'action',
      Header: 'Action',
      minWidth: 240,
      width: 240,
      sticky: 'right',
      disableFilters: true,
      canDrag: false,
      Cell: ({ row }) => {
        return (
          <>
            <Box display="flex">
              <Box display="flex" flexGrow={1}>
                {row.original['status'] === MATERIAL_REQUEST_STATUS.requested && (
                  <Fragment>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      disabled={loading}
                      onClick={() => {
                        setQtyDialog({ open: true, status: MATERIAL_REQUEST_STATUS.processed, data: row.original });
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
                        setQtyDialog({ open: true, status: MATERIAL_REQUEST_STATUS.closed, data: row.original });
                      }}
                    >
                      Close
                    </Button>
                    <Box pl={1} />
                  </Fragment>
                )}
              </Box>
              <Box>
                {row.original['processesLogs'] && row.original['processesLogs']?.length > 0 && (
                  <HtmlTooltip title="View Logs">
                    <IconButton
                      size="small"
                      aria-label="Delete"
                      onClick={() => {
                        setOpenProcessLogs({ open: true, logs: row.original['processesLogs'], productName: row.original?.productName });
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
    setColumns([...column, ...extracolumns]);
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
        <Box />
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
          <Box zIndex={5} width={'100%'} height={'calc(100vh - 345px)'}>
            <CustomReactTable
              height={'calc(100vh - 345px)'}
              columns={columns}
              data={rowsData}
              onSelect={setSelectedRecords}
              childrenProperty="subRows"
              uniqueKey="_id"
              hideSelection={false}
              hideAction={false}
              hideExpander={true}
              renderedFrom={camelCase(routes.materialHandling.title)}
              isClientSideGrid={true}
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
