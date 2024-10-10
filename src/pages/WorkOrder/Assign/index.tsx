import { Box, Button, Grid, IconButton, Menu, MenuItem } from '@material-ui/core';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import { FiExternalLink } from 'react-icons/fi';
import { useData } from 'src/StateProvider/Provider';
import { CHILD_RESOURCE, MATERIAL_TYPE, prepareDataForGrid, workOrder } from 'src/constants/helpers';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import { BiChevronDown } from 'react-icons/bi';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import UpdateProductDialog from 'src/pages/WorkOrder/Consumables/UpdateProductDialog';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import AssignSerializedAssetDialog from 'src/components/AssignRolesDialog/AssignSerializedAssetDialog';

const Assign = ({ allowedToEdit, workOrderData }) => {

  let renderedFrom = `${camelCase(routes?.workOrder.title)}_assign`;
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { user, permissions }
  }: any = useData();

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, selectedRecords } = state;
  const { generateColumns } = useColumns();

  const workOrderId = workOrderData?._id;
  const warehouse = workOrderData?.warehouse;
  const [columns, setColumns] = useState(null);
  const [open, setOpen] = useState(false);
  const [updateDialog, setUpdateDialog] = useState({ open: false, data: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [assignAssetDialog, setAssignAssetDialog] = useState(false);

  useEffect(() => {
    fetchColumns();
    fetchData();
  }, [allowedToEdit, workOrderId]);

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
                {hasChildFields && allowedToEdit && row?.original?.type != MATERIAL_TYPE.serializedAsset ? (
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
      }
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
          {allowedToEdit && (
            <>
              {hasChildFields && row?.original?.type != MATERIAL_TYPE.serializedAsset && (
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
                    <EditIcon color="primary" fontSize="small" />
                  </IconButton>
                </HtmlTooltip>
              )}
              <HtmlTooltip title="Delete">
                <IconButton
                  size="small"
                  aria-label="Delete"
                  disabled={row?.original?.assignedAssetQty ? true : false}
                  onClick={() => {
                    setDeleteData([row.original]);
                  }}
                >
                  <DeleteIcon color={row?.original?.assignedAssetQty ? 'disabled' : 'error'} fontSize="small" />
                </IconButton>
              </HtmlTooltip>
            </>
          )}
        </div>
      )
    });
    setColumns([...column, ...newColumns, ...extracolumns]);
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });

    axiosInstance().get(`${workOrder.api}/${workOrderId}/consumable`).then(({ data: { data } }) => {
      const rows = data?.filter((d) => d?.type === MATERIAL_TYPE.product && d?.product?.serializedProduct)?.map((u) => {
        const res: any = {
          ...prepareDataForGrid(u)
        };
        res.productName = u?.product?.optionLabel;
        res.productDescription = u?.product?.productDescription;
        res.productNumber = u?.product?.productNumber;
        res.assignedAssetQty = data?.filter((d) => d?.parentId === u?._id && d?.type === MATERIAL_TYPE.serializedAsset)?.length || 0;
        res.subRows = generateNestedData(data, u);
        return res;
      });
      dispatch({ type: 'initialize', data: rows, count: rows?.length });
      dispatch({ type: 'loading', loading: false });
    }).catch((error) => {
      toastConfig.setToastConfig(error);
    });
  };

  const generateNestedData = (material, parent) => {
    const subRows: any = material.filter((e) => e?.type === MATERIAL_TYPE.serializedAsset && e.parentId === parent._id)?.map((u) => {
      const res: any = {
        ...prepareDataForGrid(u)
      };
      res.productName = u?.serializedAssetDetail?.optionLabel;
      res.serializedAssetId = u?.serializedAssetDetail?.optionValue;
      return res;
    });
    return subRows;
  };

  const onSaveInlineEdit = async (inputField, updatedData) => {
    if (updatedData?.type === MATERIAL_TYPE.serializedAsset) {
      return;
    }
    if (parseInt(inputField.qty) < (updatedData?.assignedAssetQty || 0)) {
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

  const handleSubmit = async (rows) => {
    setIsSubmitting(true);
    await axiosInstance()
      .post(`${workOrder.api}/${workOrderId}/consumable`, rows)
      .then(({ data }) => {
        fetchData();
        setIsSubmitting(false);
        setOpen(false);
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

  const handleUpdate = async (row: any) => {
    setIsSubmitting(true);
    try {
      const data: any = row;
      delete data.workOrder;
      await axiosInstance().put(`${workOrder.api}/${workOrderId}/material/product`, { material: [data] });
      setIsSubmitting(false);
      fetchData();
      setUpdateDialog({ open: false, data: null });
    } catch (error) {
      setIsSubmitting(false);
      toastConfig.setToastConfig(error);
    }
  };

  const handleDelete = async (rows) => {
    setIsDeleting(true);
    const ids = rows.map((e) => e._id);
    axiosInstance()
      .put(`${workOrder.api}/${workOrderId}/consumable/remove`, {
        ids: ids || []
      })
      .then(({ data }) => {
        setIsDeleting(false);
        setDeleteData(null);
        fetchData();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
      })
      .catch((error) => {
        setIsDeleting(false);
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
          {permissions?.product?.isRead && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={() => {
                setOpen(true);
              }}
            >
              Add Products
            </Button>
          )}
          <Box display="flex" ml="auto">
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
              open={Boolean(anchorEl)}
              getContentAnchorEl={null}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left'
              }}
              onClose={handleCloseAction}
            >
              <MenuItem
                disabled={
                  selectedRecords?.filter((r) => r?.type === MATERIAL_TYPE.product && r?.qty - (r?.assignedAssetQty || 0) > 0)?.length > 0
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
                disabled={selectedRecords?.find((s) => s?.assignedAssetQty) ? true : false}
                onClick={() => {
                  setDeleteData(selectedRecords?.filter((s) => !s?.assignedAssetQty));
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
              height={'calc(100vh - 140px)'}
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
      </Grid>
      {open && (
        <AssignProductDialog
          handleCloseDialog={() => {
            setOpen(false);
          }}
          ids={dataRows?.map((d) => d?.materialId) || []}
          onSuccess={(rows) => {
            const data: any = [];
            rows?.forEach((e) => {
              if (parseInt(e.qty)) {
                data.push({ product: e._id, qty: parseInt(e.qty), service: null, uniqueId: null, stepId: null, subType: '' });
              }
            });
            handleSubmit(data);
          }}
          serialized={true}
          extraDeepFilter={[{ field: 'expenseItem', term: 'No' }]}
          isSubmitting={isSubmitting}
        />
      )}
      {updateDialog.open && (
        <UpdateProductDialog
          onClose={() => {
            setUpdateDialog({ open: false, data: null });
          }}
          materialData={updateDialog.data}
          handleUpdate={handleUpdate}
          loadingEdit={isSubmitting}
          workOrderData={workOrderData}
        />
      )}
      {deleteData && (
        <ConfirmationDialog
          open={true}
          message={`Are you sure you want to delete ?`}
          onClose={() => setDeleteData(null)}
          onOk={() => handleDelete(deleteData)}
          okBtnLoading={isDeleting}
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
            ?.filter((r) => r?.type === MATERIAL_TYPE.product && r?.qty - r?.assignedAssetQty > 0)
            ?.map((r) => ({
              _id: r?._id,
              product: r.productId,
              qty: r?.qty - (r?.assignedAssetQty || 0),
              productName: r.productName
            }))}
        />
      )}
    </>
  );
};

export default Assign;
