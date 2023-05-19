import Box from '@material-ui/core/Box/Box';
import { useState, useEffect, useReducer, useContext, Fragment } from 'react';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import routes from '../../../components/Helpers/Routes';
import Grid from '@material-ui/core/Grid/Grid';
import axiosInstance from 'src/axios/axiosInstance';
import { workOrder } from 'src/constants/helpers';
import { prepareDataForGrid } from 'src/constants/helpers';
import { camelCase, set } from 'lodash';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { Button, IconButton } from '@material-ui/core';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import DeleteIcon from '@material-ui/icons/Delete';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import ConsumablesQtyDialog from './ConsumablesQtyDialog';
import QtyRequestLog from './QtyRequestLog';
import HistoryIcon from '@material-ui/icons/History';
import { useData } from 'src/StateProvider/Provider';

const Consumables = ({ workOrderId, warehouse, isCreate, allowedToEdit, service, uniqueId, stepId, serviceName }) => {
  let renderedFrom = camelCase(routes?.workOrder.title + 'workOrder_consumables');

  const toastConfig = useContext(CustomToastContext);
  const [dataRows, setDataRows] = useState(null);
  const [columns, setColumns] = useState(null);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [consumablesDialog, setConsumablesDialog] = useState(false);
  const [openConsumablesQtyDialog, setOpenConsumablesQtyDialog] = useState(false);
  const [openLogDialog, setOpenLogDialog] = useState({ open: false, uniqueId: null, data: null });

  const [consumeRequest, setConsumeRequest] = useState(false);

  const {
    state: { user }
  }: any = useData();

  useEffect(() => {
    var allowRequest = false;
    if (user?.user?.brandPolicy?.workOrderConsumableRequest) {
      allowRequest = true;
    }
    setConsumeRequest(allowRequest)
    fetchColumns(allowRequest);
    fetchData();
  }, [allowedToEdit, workOrderId]);

  const fetchColumns = async (allowRequest) => {
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
              <a className="link text-truncate" href={`${routes.productDetail.path}/${row.original?.productId}`} target="_blank">
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
        accessor: 'service',
        Header: 'Service',
        width: 200,
        Cell: ({ row }) =>
          row?.original?.service ? (
            <p className="text-truncate" title={row?.original?.service}>
              <a className="link text-truncate" href={`${routes.serviceMasterDetail.path}/${row.original.serviceId}`} target="_blank">
                {row.original.service}
              </a>
            </p>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'stepName',
        Header: 'Step Name',
        width: 200,
        Cell: ({ row }) => <p className="text-truncate">{row?.original?.stepName || <NoDataCell />}</p>
      },
      {
        accessor: 'qty',
        Header: 'Qty',
        editable: allowedToEdit,
        width: 150,
        Cell: ({ row }) => <p className="text-truncate">{row?.original?.qty || <NoDataCell />}</p>
      },
      ...(allowRequest
        ? [
          {
            accessor: 'requestedQty',
            Header: 'Requested Qty',
            width: 150,
            Cell: ({ row }) => <p className="text-truncate">{row?.original?.requestedQty || <NoDataCell />}</p>
          }
        ]
        : []),
      {
        accessor: 'consumedQty',
        Header: 'Consumed Qty',
        width: 150,
        Cell: ({ row }) => <p className="text-truncate">{row?.original?.consumedQty || <NoDataCell />}</p>
      },
      {
        accessor: 'action',
        Header: 'Action',
        width: 100,
        minWidth: 100,
        sticky: 'right',
        disableFilters: true,
        canDrag: false,
        Cell: ({ row }: any) => (
          <div style={{ display: 'flex', justifyContent: 'right' }}>
            {row.original?.isqtyRequestLog && (
              <HtmlTooltip title="View Logs">
                <IconButton
                  size="small"
                  aria-label="Delete"
                  onClick={() => {
                    setOpenLogDialog({ open: true, uniqueId: row.original._id, data: row.original });
                  }}
                >
                  <HistoryIcon />
                </IconButton>
              </HtmlTooltip>
            )}
            {allowedToEdit && (
              <HtmlTooltip title="Delete">
                <IconButton
                  size="small"
                  aria-label="Delete"
                  disabled={row?.original?.consumedQty || row?.original?.requestedQty ? true : false}
                  onClick={() => {
                    handleDelete([row.original]);
                  }}
                >
                  <DeleteIcon color={row?.original?.consumedQty || row?.original?.requestedQty ? 'disabled' : 'error'} />
                </IconButton>
              </HtmlTooltip>
            )}
          </div>
        )
      }
    ];

    setColumns([...column, ...extracolumns]);
  };

  const fetchData = async () => {
    setDataRows(null);
    var query = ``;
    if (service && uniqueId) {
      query = query + `?service=${service}&uniqueId=${uniqueId}`;
    }
    if (stepId) {
      query = query + `&stepId=${stepId}`;
    }
    axiosInstance()
      .get(`${workOrder.api}/${workOrderId}/consumable${query}`)
      .then(({ data: { data } }) => {
        let rows = data.map((u) => {
          let res: any = {
            ...prepareDataForGrid(u)
          };
          res.productName = u?.product?.optionLabel;
          res.productDescription = u?.product?.productDescription;
          res.productNumber = u?.product?.productNumber;
          res.hideSelection = u?.qty - ((u?.consumedQty || 0) + (u?.requestedQty || 0)) === 0 ? true : false;
          return res;
        });
        setDataRows(rows);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleSubmit = async (rows) => {
    const data: any = [];
    rows?.forEach((e) => {
      if (parseInt(e.qty)) {
        data.push({ product: e._id, qty: parseInt(e.qty), service, uniqueId, stepId });
      }
    });
    axiosInstance()
      .post(`${workOrder.api}/${workOrderId}/consumable`, data)
      .then(({ data }) => {
        fetchData();
        setConsumablesDialog(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleDelete = async (rows) => {
    const ids = rows.map((e) => e._id);
    axiosInstance()
      .put(`${workOrder.api}/${workOrderId}/consumable/remove`, {
        ids: ids || []
      })
      .then(({ data }) => {
        fetchData();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const onSaveInlineEdit = async (inputField, updatedData) => {
    if (parseInt(inputField.qty) < ((updatedData?.consumedQty || 0) + (updatedData?.requestedQty || 0))) {
      toastConfig.setToastConfig({
        open: true,
        type: 'error',
        message: 'Qty can not be less than consumed qty'
      });
      return;
    } else if (parseInt(inputField.qty) === 0) {
      toastConfig.setToastConfig({
        open: true,
        type: 'error',
        message: 'Qty can not be 0'
      });
      return;
    }
    inputField.qty = parseInt(inputField.qty);
    axiosInstance()
      .put(`${workOrder.api}/${workOrderId}/consumable/update-qty`, [
        {
          product: updatedData?.productId,
          ...inputField,
          _id: updatedData._id
        }
      ])
      .then(({ data }) => {
        fetchData();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <>
      {allowedToEdit && (
        <Box display="flex" justifyContent="space-between" mb={2}>
          <Box display="flex" gridGap={'8px'} flexWrap={'wrap'}>
            {isCreate && (
              <Button variant={'contained'} color="primary" size="small" onClick={() => setConsumablesDialog(true)}>
                Add Products/Consumables
              </Button>
            )}
          </Box>
          <Box display="flex" ml={1}>
            <Button
              disabled={selectedRecords?.filter((e) => !e?.hideSelection).length === 0}
              onClick={() => setOpenConsumablesQtyDialog(true)}
              color="primary"
              size="small"
              variant="contained"
            >
              {consumeRequest ? 'Request ' : 'Consume '}{' '}
              {selectedRecords?.filter((e) => !e?.hideSelection).length > 0
                ? '(' + selectedRecords?.filter((e) => !e?.hideSelection).length + ')'
                : ''}
            </Button>
          </Box>
        </Box>
      )}
      <Grid container spacing={2}>
        <Grid item xs={12} md={12} sm={12}>
          {columns && dataRows ? (
            <CustomReactTable
              height={isCreate ? 'calc(100vh - 140px)' : 'calc(100vh - 345px)'}
              columns={columns}
              data={dataRows}
              setWholeRowsCellColor={(rowData) => (!rowData.isValid ? '' : '')}
              onSelect={setSelectedRecords}
              childrenProperty="subRows"
              uniqueKey="_id"
              onSaveEdit={onSaveInlineEdit}
              renderedFrom={renderedFrom}
              isClientSideGrid={true}
              hideExpander={true}
              hideSelection={allowedToEdit ? false : true}
            />
          ) : (
            <Box p={2} height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </Grid>
        {consumablesDialog && (
          <AssignProductDialog
            productsDialogOpen={consumablesDialog}
            productId={workOrderId}
            reference={'workOrder'}
            handleCloseDialog={() => setConsumablesDialog(false)}
            assignedProducts={dataRows?.map((d) => d?.materialId) || []}
            renderedFrom={'workOrder_consumables'}
            onSuccess={(rows) => {
              handleSubmit(rows);
            }}
            serialized={false}
          />
        )}
        {openConsumablesQtyDialog && (
          <ConsumablesQtyDialog
            workOrderId={workOrderId}
            onClose={() => setOpenConsumablesQtyDialog(false)}
            onSuccess={() => {
              fetchData();
              setOpenConsumablesQtyDialog(false);
            }}
            warehouse={warehouse}
            selectedRecords={selectedRecords?.filter((e) => !e?.hideSelection)}
            serviceName={serviceName}
            consumeRequest={consumeRequest}
          />
        )}
        {openLogDialog.open && (
          <QtyRequestLog
            uniqueId={openLogDialog.uniqueId}
            workOrderId={workOrderId}
            renderedFrom={renderedFrom}
            productName={openLogDialog?.data?.productName}
            onClose={() => {
              setOpenLogDialog({
                open: false,
                uniqueId: null,
                data: null
              });
            }}
          />
        )}
      </Grid>
    </>
  );
};

export default Consumables;
