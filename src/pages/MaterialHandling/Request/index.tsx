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

import CustomTable from 'src/components/CustomTable';

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
    column.push({
      header: 'Product',
      width: 300,
      render: ({ row }) => {
        return (
          <>
            <Typography
              className="text-truncate new-table-font "
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minWidth: 'max-content' }}
            >
              <Typography style={{ fontWeight: 500, marginRight: 3 }} component="span">
                Product Name:
              </Typography>
              <a className="link" href={`${routes.productDetail.path}/${row?.product?.optionValue}`} target="_blank">
                {row['productName'] || <NoDataCell />}
              </a>
            </Typography>
            <Typography
              className="text-truncate new-table-font "
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minWidth: 'max-content' }}
            >
              <Typography style={{ fontWeight: 500, marginRight: 3 }} component="span">
                Part Number:
              </Typography>
              <span>{row['productNumber'] || <NoDataCell />}</span>
            </Typography>
            <Typography
              className="text-truncate new-table-font "
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minWidth: 'max-content' }}
            >
              <Typography style={{ fontWeight: 500, marginRight: 3 }} component="span">
                Description:
              </Typography>
              <span>{row['productDescription'] || <NoDataCell />}</span>
            </Typography>
          </>
        );
      }
    });

    const extracolumns: any = [
      {
        header: 'Qty',
        width: 300,
        render: ({ row }) => {
          return (
            <>
              <Typography
                className="text-truncate new-table-font "
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minWidth: 'max-content' }}
              >
                <Typography style={{ fontWeight: 500, marginRight: 3 }} component="span">
                  Requested Qty:
                </Typography>
                {row['qty'] ? <span>{row['qty']}</span> : <NoDataCell />}
              </Typography>
              <Typography
                className="text-truncate new-table-font "
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minWidth: 'max-content' }}
              >
                <Typography style={{ fontWeight: 500, marginRight: 3 }} component="span">
                  Processed Qty:
                </Typography>
                {row['processedQty'] ? <span>{row['processedQty']}</span> : <NoDataCell />}
              </Typography>
            </>
          );
        }
      },

      {
        header: 'Details',
        width: 200,
        render: ({ row }) => {
          return (
            <>
              <Typography
                className="text-truncate new-table-font "
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minWidth: 'max-content' }}
              >
                <Typography style={{ fontWeight: 500, marginRight: 3 }} component="span">
                  Requested By:
                </Typography>
                {row['requestBy'] ? (
                  <a className="link text-truncate new-table-font " href={`${routes.userDetail.path}/${row?.['requestById']}`} target="_blank">
                    {row?.['requestBy']}
                  </a>
                ) : (
                  <NoDataCell />
                )}
              </Typography>
              <Typography
                className="text-truncate new-table-font "
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minWidth: 'max-content' }}
              >
                <Typography style={{ fontWeight: 500, marginRight: 3 }} component="span">
                  Processed By:
                </Typography>
                {row['processBy'] ? (
                  <a className="link text-truncate new-table-font " href={`${routes.userDetail.path}/${row?.['processById']}`} target="_blank">
                    {row?.['processBy']}
                  </a>
                ) : (
                  <NoDataCell />
                )}
              </Typography>
              <Typography
                className="text-truncate new-table-font "
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minWidth: 'max-content' }}
              >
                <Typography style={{ fontWeight: 500, marginRight: 3 }} component="span">
                  Comment:
                </Typography>
                {row['comment'] ? <span>{row['comment']}</span> : <NoDataCell />}
              </Typography>
            </>
          );
        }
      },

      {
        header: 'Date',
        width: 200,
        render: ({ row }) => {
          return (
            <>
              <Typography className="text-truncate new-table-font ">
                <Typography style={{ fontWeight: 500, marginRight: 3 }} component="span">
                  Requested Date:
                </Typography>
                {row['requestDate'] ? <span>{moment(row['requestDate']).format(dateTimeFormat)}</span> : <NoDataCell />}
              </Typography>
              <Typography className="text-truncate new-table-font ">
                <Typography style={{ fontWeight: 500, marginRight: 3 }} component="span">
                  Processed Date:
                </Typography>
                {row['processDate'] ? <span>{moment(row['processDate']).format(dateTimeFormat)}</span> : <NoDataCell />}
              </Typography>
            </>
          );
        }
      }
    ];

    if (user?.user?.brandPolicy?.storageLocation) {
      extracolumns.push({
        header: 'Storage Location',
        width: 250,
        render: ({ row }) => {
          return row?.['storageLocation'] ? (
            <a
              className="link text-truncate new-table-font "
              href={`${routes.storageLocationDetail.path}/${row?.['storageLocationId']}`}
              target="_blank"
            >
              {row?.['storageLocation']}
            </a>
          ) : (
            <NoDataCell />
          );
        }
      });
    }
    extracolumns.push({
      header: 'Status',
      primaryField: true,
      width: 200,
      render: ({ row }) => {
        return row['status'] ? <p className="text-truncate new-table-font ">{row['status']}</p> : <NoDataCell />;
      }
    });
    extracolumns.push({
      header: 'Action',
      minWidth: 240,
      width: 240,
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
            {/* <CustomReactTable
              height={'calc(100vh - 290px)'}
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
            /> */}
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
