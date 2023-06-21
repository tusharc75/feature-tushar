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

import CustomTableWithCard, { CardInterface, ColumnInterface, createBodyColumns } from 'src/components/CustomTableWithCard';

const Request = ({ workOrder }) => {
  const toastConfig = useContext(CustomToastContext);

  const [loading, setLoading] = useState(false);

  const [rowsData, setRowsData] = useState(null);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [qtyDialog, setQtyDialog] = useState({ open: false, status: null, data: null });
  const [openProcessLogs, setOpenProcessLogs] = useState({ open: false, logs: [], productName: '', product: '', data: null });
  const [accessor, setAccessor] = useState<CardInterface | null>(null);

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
    setAccessor(null);

    const columns: ColumnInterface[] = [
      {
        headerName: 'Requested By:',
        field: 'requestBy',
        cellRenderer: 'linkColWithDate',
        dateAccessor: 'requestDate',
        cellRendererParams: {
          openInNewTab: true,
          pathName: routes.userDetail.path,
          property: 'requestById'
        }
      },
      {
        headerName: 'Processed By:',
        field: 'processBy',
        cellRenderer: 'linkColWithDate',
        dateAccessor: 'processDate',
        cellRendererParams: {
          openInNewTab: true,
          pathName: routes.userDetail.path,
          property: 'processById'
        }
      },
      {
        headerName: 'Requested Qty:',
        field: 'qty',
        cellRenderer: 'commonRenderer'
      },
      {
        headerName: 'Processed Qty:',
        field: 'processedQty',
        cellRenderer: 'commonRenderer'
      },
      {
        headerName: 'Comment:',
        field: 'comment',
        cellRenderer: 'commonRenderer'
      }
    ];

    const accessor: CardInterface = {
      name: (row) => (
        <Typography component={'h6'}>
          Product Type :{' '}
          <a className="link" href={`${routes.productDetail.path}/${row?.product?.optionValue}`} target="_blank">
            {row['productName']}
          </a>
        </Typography>
      ),

      headerColumns: [
        {
          style: { marginRight: 'auto' },
          render: (row) => row['status'],
          component: (row) => (row['status'] === 'Processed' ? 'completedChip' : 'pendingChip')
        },
        {
          render: (row) => {
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
                          style={{ boxShadow: 'unset' }}
                          className="no-shadow"
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
                            setOpenProcessLogs({
                              open: true,
                              logs: row['processesLogs'],
                              productName: row?.productName,
                              product: row?.product?.optionValue,
                              data: row
                            });
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
        }
      ],
      bodyColumns: [...createBodyColumns({ columns: columns, exclude: [], xs: 6, sm: 4, md: 4, lg: 2 })]
    };
    if (user?.user?.brandPolicy?.storageLocation) {
      accessor.bodyColumns.push({
        render: (row) => (
          <>
            <Typography>Storage Location:</Typography>
            <Typography>
              {row?.['storageLocation'] ? (
                <a className="link" href={`${routes.storageLocationDetail.path}/${row?.['storageLocationId']}`} target="_blank">
                  {row?.['storageLocation']}
                </a>
              ) : (
                '---'
              )}
            </Typography>
          </>
        ),
        xs: 6,
        sm: 4,
        md: 4,
        lg: 2
      });
    }
    setAccessor(accessor);
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
              fontWeight: 700
            }}
          >
            Consumables Requests
          </Typography>
        </Box>
        <Box>
          <Button
            variant={'outlined'}
            className="new-dropdown-v1"
            color="default"
            size="small"
            aria-controls="action-menu"
            onClick={openActions}
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
              disabled={
                selectedRecords?.length > 0 &&
                selectedRecords?.filter((e) => e.status === MATERIAL_REQUEST_STATUS.requested)?.length === selectedRecords?.length
                  ? false
                  : true
              }
              onClick={() => {
                setQtyDialog({ open: true, status: MATERIAL_REQUEST_STATUS.processed, data: null });
                closeActions();
              }}
            >
              Process
            </MenuItem>
            <MenuItem
              disabled={
                selectedRecords?.length > 0 &&
                selectedRecords?.filter((e) => e.status === MATERIAL_REQUEST_STATUS.requested)?.length === selectedRecords?.length
                  ? false
                  : true
              }
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
        {rowsData && accessor ? (
          <Box zIndex={5} width={'100%'} height={'calc(100vh - 290px)'}>
            <CustomTableWithCard
              data={rowsData}
              accessor={accessor}
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
            setOpenProcessLogs({ open: false, logs: [], productName: '', product: '', data: null });
            fetchData();
          }}
          logsData={openProcessLogs.logs}
          productName={openProcessLogs.productName}
          product={openProcessLogs.product}
        />
      )}
    </>
  );
};

export default Request;
