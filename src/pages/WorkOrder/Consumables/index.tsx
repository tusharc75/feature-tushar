import Box from '@material-ui/core/Box/Box';
import { useState, useEffect, useContext } from 'react';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import routes from '../../../components/Helpers/Routes';
import Grid from '@material-ui/core/Grid/Grid';
import axiosInstance from 'src/axios/axiosInstance';
import {
  CHILD_RESOURCE,
  MATERIAL_SUB_TYPE,
  MATERIAL_TYPE,
  QUOTATION_STATUS,
  WORK_ORDER_TYPE,
  product,
  repairOrder,
  sidebarResource,
  workOrder
} from 'src/constants/helpers';
import { prepareDataForGrid } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { Button, IconButton, Menu, MenuItem } from '@material-ui/core';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import DeleteIcon from '@material-ui/icons/Delete';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import ConsumablesQtyDialog from './ConsumablesQtyDialog';
import QtyRequestLog from './QtyRequestLog';
import HistoryIcon from '@material-ui/icons/History';
import { useData } from 'src/StateProvider/Provider';
import History from '../../ProductInventory/LedgerHistory';
import FormatListBulletedIcon from '@material-ui/icons/FormatListBulleted';
import { BiChevronDown } from 'react-icons/bi';
import UpdateProductDialog from './UpdateProductDialog';
import EditIcon from '@material-ui/icons/Edit';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import ImportExportMenu from 'src/components/Helpers/ImportExportMenu';
import { camelCase, orderBy } from 'lodash';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import { FiExternalLink } from 'react-icons/fi';
import AssignSerializedAssetDialog from 'src/components/AssignRolesDialog/AssignSerializedAssetDialog';

const Consumables = ({
  isCreate,
  allowedToEdit,
  service,
  uniqueId,
  stepId,
  serviceName,
  materialSubType = MATERIAL_SUB_TYPE.consumable,
  workOrderData,
  serialNumberRequired = false
}) => {
  let renderedFrom = `${camelCase(routes?.workOrder.title)}_consumable`;

  const workOrderId = workOrderData?._id;
  const warehouse = workOrderData?.warehouse;
  const toastConfig = useContext(CustomToastContext);
  const [columns, setColumns] = useState(null);
  const [consumablesDialog, setConsumablesDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openConsumablesQtyDialog, setOpenConsumablesQtyDialog] = useState(false);
  const [openLogDialog, setOpenLogDialog] = useState({ open: false, product: '', uniqueId: null, data: null });
  const [consumeRequest, setConsumeRequest] = useState(false);
  const [historyDialog, setHistoryDialog] = useState({ open: false, _id: '', product: '', productName: '' });
  const [updateDialog, setUpdateDialog] = useState({ open: false, data: null });
  const [isUpdating, setUpdating] = useState(false);
  const [repairOrderData, setRepairOrderData] = useState(null);
  const [reviseQuotation, setReviseQuotation] = useState(false);
  const [assignAssetDialog, setAssignAssetDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const {
    state: { user, permissions }
  }: any = useData();

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, selectedRecords } = state;
  const { generateColumns } = useColumns();

  useEffect(() => {
    var allowRequest = false;
    if (user?.user?.brandPolicy?.workOrderConsumableRequest) {
      if (
        (warehouse?.manager && warehouse?.manager?.includes(user?.user?._id)) ||
        (warehouse?.materialHandlers && warehouse?.materialHandlers?.includes(user?.user?._id))
      ) {
        allowRequest = false;
      } else {
        allowRequest = true;
      }
    }
    setConsumeRequest(allowRequest);
    fetchColumns();
    fetchData();
    fetchRepairOrderData();
  }, [allowedToEdit, workOrderId, consumeRequest]);

  const handleUpdate = async (row: any) => {
    setUpdating(true);
    try {
      const data: any = row;
      delete data.workOrder;
      await axiosInstance().put(`${workOrder.api}/${workOrderId}/material/product`, { material: [data] });
      setUpdating(false);
      fetchData();
      setUpdateDialog({ open: false, data: null });
    } catch (error) {
      setUpdating(false);
      toastConfig.setToastConfig(error);
    }
  };

  const fetchColumns = async () => {
    let childFields = await fetch_child_resource_fields(CHILD_RESOURCE.workOrderProduct, workOrderData?.currency, allowedToEdit);
    const newColumns = generateColumns(renderedFrom, childFields, null, false, workOrderData?.currency || 'USD');

    const hasChildFields = Array.isArray(childFields) && childFields?.length > 0 ? true : false;

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
          width: 250,
          primaryField: true,
          disabled: true,
          Cell: ({ row }) => {
            return row.original[e?.fieldName] ? (
              <div className="flex items-center gap-2">
                {hasChildFields && allowedToEdit ? (
                  <p
                    className={'link text-truncate'}
                    onClick={() => {
                      setUpdateDialog({
                        open: true,
                        data: row.original
                      });
                    }}
                  >
                    {row.original[e?.fieldName]}
                  </p>
                ) : (
                  <p className={'text-truncate'}>{row.original[e?.fieldName]}</p>
                )}
                <IconButton
                  size="small"
                  onClick={() => {
                    if (row?.original?.type === MATERIAL_TYPE.serializedAsset) {
                      window.open(`${routes.serializedAssetDetail.path}/${row.original?.serializedAssetId}`);
                    } else {
                      window.open(`${routes.productDetail.path}/${row.original?.productId}`);
                    }
                  }}
                >
                  <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                </IconButton>
              </div>
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
    const staticColumn = [
      {
        accessor: 'serializedProduct',
        Header: 'Serialized Product',
        width: 200,
        Cell: ({ row }) => (
          <p className="text-truncate">
            {row?.original?.type === MATERIAL_TYPE.serializedAsset ? <NoDataCell /> : row?.original?.serializedProduct ? 'Yes' : 'No'}
          </p>
        )
      }
    ];
    const extracolumns: any = [
      {
        accessor: 'service',
        Header: 'Service',
        width: 250,
        Cell: ({ row }) =>
          row?.original?.service ? (
            <div className="flex items-center gap-2">
              <p className="text-truncate">{row.original.service}</p>
              <IconButton
                size="small"
                onClick={() => {
                  window.open(`${routes.serviceMasterDetail.path}/${row.original.serviceId}`);
                }}
              >
                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
              </IconButton>
            </div>
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
        primaryField: true,
        editable: allowedToEdit,
        width: 150,
        Cell: ({ row }) => <p className="text-truncate">{row?.original?.qty || <NoDataCell />}</p>
      },
      ...(user?.user?.brandPolicy?.workOrderConsumableRequest && !user?.user?.brandPolicy?.workOrderConsumableConsumeHide
        ? [
            {
              accessor: 'requestedQty',
              Header: 'Requested Qty',
              width: 150,
              Cell: ({ row }) => <p className="text-truncate">{row?.original?.requestedQty || <NoDataCell />}</p>
            }
          ]
        : []),
      ...(!user?.user?.brandPolicy?.workOrderConsumableConsumeHide
        ? [
            {
              accessor: 'consumedQty',
              Header: 'Consumed Qty',
              primaryField: true,
              width: 150,
              Cell: ({ row }) => <p className="text-truncate">{row?.original?.consumedQty || <NoDataCell />}</p>
            }
          ]
        : [])
    ];
    extracolumns.push({
      accessor: 'action',
      Header: 'Actions',
      width: 150,
      minWidth: 150,
      sticky: 'right',
      disableFilters: true,
      disableSortBy: true,
      canDrag: false,
      Cell: ({ row }: any) => (
        <div style={{ display: 'flex', justifyContent: 'right' }}>
          <>
            {!row?.original?.serializedProduct && row?.original?.type != MATERIAL_TYPE.serializedAsset && (
              <>
                {row.original?.isqtyRequestLog && (
                  <HtmlTooltip title="View Requests">
                    <IconButton
                      size="small"
                      aria-label="Requests"
                      onClick={() => {
                        setOpenLogDialog({ open: true, product: row?.original?.productId, uniqueId: row.original._id, data: row.original });
                      }}
                    >
                      <FormatListBulletedIcon fontSize="small" color={'primary'} />
                    </IconButton>
                  </HtmlTooltip>
                )}
                {!user?.user?.brandPolicy?.workOrderConsumableConsumeHide && (
                  <HtmlTooltip title="History">
                    <IconButton
                      size="small"
                      aria-label="History"
                      onClick={() => {
                        setHistoryDialog({
                          open: true,
                          _id: row?.original?._id,
                          product: row?.original?.productId,
                          productName: row?.original?.productName
                        });
                      }}
                    >
                      <HistoryIcon fontSize="small" color={'primary'} />
                    </IconButton>
                  </HtmlTooltip>
                )}
              </>
            )}
          </>

          {allowedToEdit && hasChildFields && row?.original?.type != MATERIAL_TYPE.serializedAsset && (
            <HtmlTooltip title="Edit">
              <IconButton
                size="small"
                aria-label="Edit"
                onClick={() => {
                  setUpdateDialog({
                    open: true,
                    data: row.original
                  });
                }}
              >
                <EditIcon color={'primary'} fontSize="small" />
              </IconButton>
            </HtmlTooltip>
          )}
          {allowedToEdit && (
            <HtmlTooltip title="Delete">
              <IconButton
                size="small"
                aria-label="Delete"
                disabled={row?.original?.consumedQty || row?.original?.requestedQty || row?.original?.assignedAssetQty ? true : false}
                onClick={() => {
                  handleDelete([row.original]);
                }}
              >
                <DeleteIcon
                  color={row?.original?.consumedQty || row?.original?.requestedQty || row?.original?.assignedAssetQty ? 'disabled' : 'error'}
                  fontSize="small"
                />
              </IconButton>
            </HtmlTooltip>
          )}
        </div>
      )
    });
    setColumns([...column, ...staticColumn, ...newColumns, ...extracolumns]);
  };

  const fetchRepairOrderData = async () => {
    axiosInstance()
      .get(`${workOrder.api}/${workOrderId}/consumable/repair-order/quotation`)
      .then(({ data }) => {
        if (data?.data) {
          setRepairOrderData(data?.data);
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });

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
        if (materialSubType === MATERIAL_SUB_TYPE.bom) {
          data = data?.filter((e) => e?.subType === materialSubType);
        } else {
          data = data?.filter((e) => e?.subType !== MATERIAL_SUB_TYPE.bom || e?.product?.serializedProduct);
        }
        let rows = orderBy(data, 'product.serializedProduct')
          ?.filter((d) => !d?.parentId)
          ?.map((u) => {
            let res: any = {
              ...prepareDataForGrid(u)
            };
            res.productName = u?.product?.optionLabel;
            res.productDescription = u?.product?.productDescription;
            res.productNumber = u?.product?.productNumber;
            res.serializedProduct = u?.product?.serializedProduct || false;
            res.assignedAssetQty = data?.filter((d) => d?.parentId === u?._id && d?.type === MATERIAL_TYPE.serializedAsset)?.length || 0;
            res.subRows = generateNestedData(data, u);
            // if (!consumeRequest) {
            //   res.hideSelection = u?.qty - ((u?.consumedQty || 0) + (u?.requestedQty || 0)) === 0 ? true : false;
            // }
            return res;
          });

        dispatch({ type: 'initialize', data: rows, count: rows?.length });
        dispatch({ type: 'loading', loading: false });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const generateNestedData = (material, parent) => {
    const subRows: any = material
      .filter((e) => e?.type === MATERIAL_TYPE.serializedAsset && e.parentId === parent._id)
      ?.map((u) => {
        const res: any = {
          ...prepareDataForGrid(u)
        };
        res.productName = u?.serializedAssetDetail?.optionLabel;
        res.serializedAssetId = u?.serializedAssetDetail?.optionValue;
        return res;
      });
    return subRows;
  };

  const handleSubmit = async (rows) => {
    setIsSubmitting(true);
    await axiosInstance()
      .post(`${workOrder.api}/${workOrderId}/consumable`, rows)
      .then(({ data }) => {
        if (
          repairOrderData &&
          repairOrderData?.addConsumablesQuotation &&
          repairOrderData?.addQuotationStep &&
          repairOrderData?.quotation?.status === QUOTATION_STATUS.acceptByCustomer
        ) {
          setReviseQuotation(true);
        }
        fetchData();
        setIsSubmitting(false);
        setConsumablesDialog(false);
        setAssignAssetDialog(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
      })
      .catch((error) => {
        setIsSubmitting(false);
        toastConfig.setToastConfig(error);
      });
  };

  const createNewVersionQuote = async (quoteId, quoteVersionId) => {
    axiosInstance()
      .post(`/quotation/clone-version/${quoteId}/${quoteVersionId}`)
      .then(() => {})
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
    if (updatedData?.type === MATERIAL_TYPE.serializedAsset) {
      return;
    }
    if (parseInt(inputField.qty) < (updatedData?.consumedQty || 0) + (updatedData?.requestedQty || 0)) {
      toastConfig.setToastConfig({
        open: true,
        type: 'error',
        message: user?.user?.brandPolicy?.workOrderConsumableRequest
          ? 'Quantity can not be less than consumed quantity plus requested quantity'
          : 'Quantity can not be less than consumed quantity'
      });
      return;
    } else if (parseInt(inputField.qty) < (updatedData?.assignedAssetQty || 0)) {
      toastConfig.setToastConfig({
        open: true,
        type: 'error',
        message: 'Quantity can not be less than assigned asset qty'
      });
      return;
    } else if (parseInt(inputField.qty) === 0) {
      toastConfig.setToastConfig({
        open: true,
        type: 'error',
        message: 'Quantity can not be 0'
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

  const handleClickAction = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseAction = () => {
    setAnchorEl(null);
  };

  return (
    <>
      {allowedToEdit && (
        <Box className="mb-3 flex flex-wrap justify-between gap-2">
          {isCreate && permissions?.product?.isRead && (
            <Button variant={'contained'} color="primary" size="small" onClick={() => setConsumablesDialog(true)}>
              {materialSubType === MATERIAL_SUB_TYPE.bom ? `Add BOM` : `Add Products/Consumables`}
            </Button>
          )}
          <Box display="flex" ml={'auto'}>
            <Box ml={1}></Box>
            <ImportExportMenu
              permissions={permissions?.workOrder}
              module="consumables"
              api={`${workOrder.api}/${workOrderId}/consumable`}
              afterImportCompleted={() => {
                fetchData();
              }}
              isExportAllOrSomeFeature={true}
              ids={[]}
              additionalParams={`workOrderIds=${JSON.stringify([workOrderId])}`}
            />
            <Box ml={1}></Box>
            {!user?.user?.brandPolicy?.workOrderConsumableConsumeHide && (
              <Button
                disabled={
                  selectedRecords?.length &&
                  selectedRecords?.every((r) => !r?.serializedProduct && !r?.hideSelection && r?.type === MATERIAL_TYPE.product)
                    ? false
                    : true
                }
                onClick={() => setOpenConsumablesQtyDialog(true)}
                color="primary"
                size="small"
                variant="contained"
              >
                {consumeRequest ? 'Request ' : 'Consume '}{' '}
                {selectedRecords?.filter((e) => !e?.hideSelection && !e?.serializedProduct && e?.type === MATERIAL_TYPE.product).length > 0
                  ? '(' + selectedRecords?.filter((e) => !e?.hideSelection && !e?.serializedProduct && e?.type === MATERIAL_TYPE.product).length + ')'
                  : ''}
              </Button>
            )}
            <Box ml={1}></Box>
            <Button
              variant={'outlined'}
              color="primary"
              size="small"
              onClick={handleClickAction}
              disabled={selectedRecords?.length ? false : true}
              endIcon={<BiChevronDown />}
              className="new-dropdown-v1"
            >
              Actions
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={open}
              getContentAnchorEl={null}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left'
              }}
              onClose={handleCloseAction}
            >
              <MenuItem
                disabled={
                  selectedRecords?.every((s) => s?.serializedProduct && s?.type === MATERIAL_TYPE.product && s?.qty - (s?.assignedAssetQty || 0) > 0)
                    ? false
                    : true
                }
                onClick={() => {
                  setAssignAssetDialog(true);
                  handleCloseAction();
                }}
              >
                Assign {routes.serializedAsset.title}
              </MenuItem>
              <MenuItem
                disabled={selectedRecords?.find((s) => s?.consumedQty || s?.requestedQty || s?.assignedAssetQty) ? true : false}
                onClick={() => {
                  handleDelete(selectedRecords?.filter((s) => !s?.consumedQty && !s?.requestedQty && !s?.assignedAssetQty));
                  handleCloseAction();
                }}
              >
                Delete
              </MenuItem>
            </Menu>
          </Box>
        </Box>
      )}
      <Grid container spacing={2}>
        <Grid item xs={12} md={12} sm={12}>
          {columns ? (
            <CustomReactTable
              height={isCreate ? 'calc(100vh - 140px)' : 'calc(100vh - 345px)'}
              columns={columns}
              state={state}
              dispatch={dispatch}
              refreshGrid={fetchData}
              onSaveEdit={onSaveInlineEdit}
              renderedFrom={renderedFrom}
              isClientSideGrid={true}
              hideSelection={allowedToEdit ? false : true}
              hideExportTable={true}
              expander={true}
            />
          ) : (
            <Box p={2} height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </Grid>
        {consumablesDialog && (
          <AssignProductDialog
            handleCloseDialog={() => setConsumablesDialog(false)}
            ids={materialSubType === MATERIAL_SUB_TYPE.consumable ? dataRows?.map((d) => d?.materialId) || [] : []}
            onSuccess={(rows) => {
              handleSubmit(
                rows
                  ?.filter((r) => parseInt(r?.qty))
                  ?.map((r) => ({
                    product: r?._id,
                    qty: parseInt(r?.qty),
                    service,
                    uniqueId,
                    stepId,
                    subType: materialSubType
                  }))
              );
            }}
            serialized={false}
            extraDeepFilter={[{ field: 'expenseItem', term: 'No' }]}
            isSubmitting={isSubmitting}
          />
        )}
        {openConsumablesQtyDialog && (
          <ConsumablesQtyDialog
            referenceId={workOrderId}
            referenceType={sidebarResource.workOrder}
            onClose={() => setOpenConsumablesQtyDialog(false)}
            onSuccess={() => {
              fetchData();
              setOpenConsumablesQtyDialog(false);
            }}
            warehouse={warehouse}
            selectedRecords={selectedRecords?.filter((e) => !e?.hideSelection && !e?.serializedProduct && e?.type === MATERIAL_TYPE.product)}
            serviceName={serviceName}
            consumeRequest={consumeRequest}
            serialNumberRequired={serialNumberRequired}
          />
        )}
        {openLogDialog.open && (
          <QtyRequestLog
            uniqueId={openLogDialog.uniqueId}
            referenceId={workOrderId}
            referenceType={sidebarResource.workOrder}
            productName={openLogDialog?.data?.productName}
            product={openLogDialog?.product}
            onClose={() => {
              setOpenLogDialog({
                open: false,
                uniqueId: null,
                product: null,
                data: null
              });
              fetchData();
            }}
          />
        )}
        {historyDialog.open && (
          <History
            handleClose={() => setHistoryDialog({ open: false, _id: '', product: '', productName: '' })}
            productName={historyDialog.productName}
            referenceId={workOrderId}
            uniqueId={historyDialog._id}
            product={historyDialog.product}
          />
        )}
        {updateDialog.open && (
          <UpdateProductDialog
            onClose={() => {
              setUpdateDialog({ open: false, data: null });
            }}
            materialData={updateDialog.data}
            handleUpdate={handleUpdate}
            loadingEdit={isUpdating}
            workOrderData={workOrderData}
          />
        )}
        {reviseQuotation && (
          <ConfirmationDialog
            open={reviseQuotation}
            message={`Do you want to revise the Quotation ?`}
            onClose={() => {
              setReviseQuotation(false);
              fetchData();
            }}
            onOk={() => {
              createNewVersionQuote(repairOrderData?.quotation?.quotation, repairOrderData?.quotation?._id);
              setReviseQuotation(false);
            }}
          />
        )}
        {assignAssetDialog && (
          <AssignSerializedAssetDialog
            reference={'workOrder_assign_asset'}
            referenceData={{ warehouse: warehouse?.optionValue }}
            ids={[]}
            handleClose={() => setAssignAssetDialog(false)}
            handleSucess={(rows) => {
              handleSubmit(
                rows?.map((r) => ({
                  product: r?.asset,
                  qty: 1,
                  service: null,
                  uniqueId: null,
                  stepId: null,
                  type: MATERIAL_TYPE.serializedAsset,
                  subType: '',
                  parentId: r?._id
                }))
              );
            }}
            isAssigning={isSubmitting}
            selectedProducts={selectedRecords
              ?.filter((r) => r?.type === MATERIAL_TYPE.product && r?.serializedProduct && r?.qty - r?.assignedAssetQty > 0)
              ?.map((r) => ({
                _id: r?._id,
                product: r.productId,
                qty: r?.qty - (r?.assignedAssetQty || 0),
                productName: r.productName
              }))}
          />
        )}
      </Grid>
    </>
  );
};

export default Consumables;
