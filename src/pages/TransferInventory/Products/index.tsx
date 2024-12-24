import { Box, IconButton, MenuItem } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import React, { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import {
  DELIVERY_TICKET_REFERENCE_TYPE,
  DELIVERY_TICKET_STATUS,
  DELIVERY_TICKET_TYPE,
  MATERIAL_TYPE,
  TRANSFER_INVENTORY_STATUS,
  deliveryTicket,
  gridLoadingTimeout,
  prepareDataForGrid,
  transferInventory
} from 'src/constants/helpers';
import { deleteDisable, transferInventoryMessage } from 'src/constants/messageHelpers';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import AddInventory from './AddInventory';
import ProductQtyDialog from './ProductQtyDialog';
import AssignSerialNumbersDialog from 'src/components/AssignRolesDialog/AssignSerialNumbersDialog';
import { isMobile, isTablet } from 'react-device-detect';
import { startCase } from 'lodash';
import { FiExternalLink } from 'react-icons/fi';
import { useSetWalkmeData } from 'src/components/CustomIntro';
import { generateAddExistingProduct } from 'src/pages/TransferInventory/walkmeSteps';

const Products = ({
  transferInventoryData,
  setNextStep,
  setNextStepToolTip,
  renderedFrom,
  allowedToEdit,
  fetchTransferInventoryData,
  updateStatus,
  stepFullScreen
}) => {
  const { setWalkmeData } = useSetWalkmeData();
  const toastConfig = useContext(CustomToastContext);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, selectedRecords } = state;
  const {
    state: {
      user: { user, resources },
      permissions
    }
  } = useData();
  const [isRemovingInventory, setRemovingInventory] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState({ open: false, data: [] });
  const [openAddNewInventory, setAddInventoryDialog] = useState(false);

  const [isAdding, setIsAdding] = useState(false);
  const [columns, setColumns] = useState(null);
  const [viewProductEditDialog, setProductEditDialog] = useState({ open: false, productData: null });
  const [assignSerialNumbersDialog, setAssignSerialNumbersDialog] = useState({ open: false, data: null });
  const [isAssigning, setIsAssigning] = useState(false);

  const [productSerialNumbers, setProductSerialNumbers] = useState([]);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = async () => {
    const column: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>,
        Footer: () => {
          return <>Total</>;
        }
      },
      {
        accessor: 'type',
        Header: 'Type',
        disableFilters: true,
        disabled: true,
        sticky: isMobile || isTablet ? 'none' : 'left',
        width: 100,
        Cell: ({ row }) => (row.original['type'] ? <p>{`${startCase(row.original?.type)} `}</p> : <NoDataCell />)
      }
    ];
    const {
      data: { data }
    } = await axiosInstance().put(`/field/find-field-labels`, {
      fields: [
        {
          resource: 'Product',
          fieldNames: ['productName', 'productNumber', 'productDescription', 'serializedProduct']
        }
      ]
    });
    const productFields = data?.find((e) => e.resource === 'Product')?.fieldNames || [];
    productFields?.forEach((e) => {
      if (e?.fieldName === 'productName') {
        column.push({
          accessor: 'productName',
          primaryField: true,
          Header: 'Details',
          Cell: ({ row }) => (
            <div className="flex items-center gap-2">
              {row.original.type === MATERIAL_TYPE.product ? (
                <p
                  className="link text-truncate"
                  title={row.original?.productName}
                  onClick={() => {
                    setProductEditDialog({ open: true, productData: row.original });
                  }}
                >
                  {row.original?.productName}
                </p>
              ) : (
                <p className="text-truncate">{row.original?.productName}</p>
              )}
              {row.original.type === MATERIAL_TYPE.product && (
                <IconButton
                  size="small"
                  onClick={() => {
                    window.open(`/product/detail/${row.original.product}`);
                  }}
                >
                  <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                </IconButton>
              )}
            </div>
          )
        });
      } else if (e?.fieldName === 'serializedProduct') {
        column.push({
          accessor: 'serializedProductShow',
          Header: e?.fieldLabel,
          show: true,
          Cell: ({ row }) => (row.original?.serializedProductShow ? <div>{row.original?.serializedProductShow}</div> : <NoDataCell />)
        });
      } else {
        column.push({
          accessor: e?.fieldName,
          Header: e?.fieldLabel,
          Cell: ({ row }) => (row.original[e?.fieldName] ? <div>{row.original[e?.fieldName]}</div> : <NoDataCell />)
        });
      }
    });
    column.push({
      accessor: 'qty',
      Header: 'Quantity',
      disabled: false,
      Cell: ({ row }) => (row.original?.qty ? <div>{row.original?.qty}</div> : <NoDataCell />),
      filter: false,
      sortable: false,
      editable: permissions?.transferInventory?.isUpdate
    });
    column.push({
      accessor: 'inventory',
      Header: 'Inventory',
      Cell: ({ row }) => (row.original?.inventory ? <div>{row.original?.inventory}</div> : <NoDataCell />)
    });
    setColumns([...column, ActionRenderer]);
  };

  const ActionRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 100,
    width: 100,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (
      <>
        <HtmlTooltip
          title={
            row.original?.canDelete
              ? 'Delete'
              : row?.original?.loadingTicketStatus === DELIVERY_TICKET_STATUS.inTransit
                ? 'Loading ticket is already created'
                : row?.original?.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered
                  ? 'Loading ticket is already delivered'
                  : row?.original?.serialNumber?.length > 0
                    ? 'Serial Number is already assigned'
                    : deleteDisable
          }
        >
          <IconButton
            disabled={!row.original?.canDelete}
            onClick={() => {
              setShowConfirmBox({ open: true, data: [row.original] });
            }}
            size="small"
            color="primary"
          >
            <DeleteIcon fontSize="small" color={row.original?.canDelete ? 'error' : 'disabled'} />
          </IconButton>
        </HtmlTooltip>
      </>
    )
  };

  useEffect(() => {
    fetchData();
  }, [transferInventoryData]);

  const handleAddWalkmeData = (rows: any[]) => {
    if (allowedToEdit) {
      setWalkmeData([generateAddExistingProduct(false, resources?.transferInventory?.titleSingular)]);
    } else {
      setWalkmeData([]);
    }
  };

  const fetchData = async () => {
    setNextStep(false);
    setNextStepToolTip(null);
    dispatch({ type: 'selection', selectedRecords: [] });
    dispatch({ type: 'loading', loading: true });
    const {
      data: { data: deliveryTicketList }
    } = await axiosInstance().get(
      `${deliveryTicket.api}/typewise?referenceType=${DELIVERY_TICKET_REFERENCE_TYPE.transferInventory}&referenceId=${transferInventoryData._id}&ticketType=${DELIVERY_TICKET_TYPE.loading}`
    );
    var deliveryTicketProduct = [];
    deliveryTicketList?.forEach((e) => {
      if (e?.products && e?.products?.length) {
        deliveryTicketProduct = [...deliveryTicketProduct, ...e?.products?.map((p) => ({ ...p, status: e?.status }))];
      }
    });
    axiosInstance()
      .get(`${routes.transferInventory.path}/${transferInventoryData?._id}/product`)
      .then(({ data: { data } }) => {
        let rows = data?.products?.map((u: any, index: any) => {
          let finalObject: any = prepareDataForGrid(u);
          finalObject['index'] = index + 1;
          finalObject['type'] = MATERIAL_TYPE.product;
          finalObject['productId'] = u?.product;
          finalObject['productName'] = u?.productDetail?.productName;
          finalObject['productNumber'] = u?.productDetail?.productNumber;
          finalObject['productDescription'] = u?.productDetail?.productDescription;
          finalObject['serializedProduct'] = u?.productDetail?.serializedProduct;
          finalObject['serializedProductShow'] = u?.productDetail?.serializedProduct ? 'Yes' : 'No';
          finalObject['qty'] = u.qty;
          finalObject['inventory'] = u.inventoryDetail?.inventory || 0;
          finalObject['isChecked'] = false;
          finalObject['allowedToEdit'] = false;
          finalObject['canDelete'] = !data?.assets?.some((e) => e._id === u._id) && !deliveryTicketProduct?.some((e) => e.product === u?.product);
          finalObject['serialNumber'] = data?.serialNumber?.filter((e) => e.product === u?.product);
          finalObject['loadingTicketStatus'] = deliveryTicketProduct?.find((d) => d?.product === u?.product)
            ? deliveryTicketProduct?.find((d) => d?.product === u?.product)?.status
            : '';

          finalObject.subRows = [];
          data?.serialNumber
            ?.filter((e) => e.product === u?.product)
            ?.forEach((e, i) => {
              finalObject.subRows.push({
                _id: e._id,
                index: `${finalObject?.index}.${i + 1}`,
                type: 'serialNumber',
                productName: e?.serialNumber,
                canDelete: finalObject?.canDelete,
                qty: 1
              });
            });
          if (finalObject?.subRows?.length) finalObject.canDelete = false;
          return {
            ...finalObject
          };
        });
        if (rows?.length) {
          const serializedProduct = rows?.filter((e) => e?.serializedProduct);
          if (serializedProduct?.length) {
            if (serializedProduct?.every((r) => r?.qty === r?.serialNumber?.length)) {
              setNextStep(true);
              setNextStepToolTip(null);
            } else {
              setNextStepToolTip(transferInventoryMessage.assignSerialNumbers);
            }
          } else {
            setNextStep(true);
            setNextStepToolTip(null);
          }
        } else {
          setNextStepToolTip(transferInventoryMessage.assignSerialNumbers);
        }
        setProductSerialNumbers(data?.serialNumber);
        handleAddWalkmeData(rows);
        dispatch({ type: 'initialize', data: rows, count: rows?.length });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleSave = (products: any) => {
    setIsAdding(true);
    axiosInstance()
      .post(`${routes.transferInventory.path}/${transferInventoryData?._id}/product`, {
        products
      })
      .then(() => {
        fetchData();
        fetchTransferInventoryData();
        toastConfig.setToastConfig({
          open: true,
          message: 'Records added successfully',
          type: 'success'
        });
        setIsAdding(false);
        closeDialog();
        if (transferInventoryData?.status === TRANSFER_INVENTORY_STATUS.new) {
          updateStatus(TRANSFER_INVENTORY_STATUS.inProgress);
        }
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setIsAdding(false);
      });
  };

  const handleRemove = async () => {
    if (showConfirmBox.data.length > 0) {
      setRemovingInventory(true);
      try {
        if (showConfirmBox.data?.filter((e) => e.type === 'serialNumber')?.length) {
          await axiosInstance().put(`${routes.transferInventory.path}/${transferInventoryData?._id}/serial-number/remove`, {
            ids: showConfirmBox.data?.filter((e) => e.type === 'serialNumber')?.map((e) => e._id)
          });
        } else {
          await axiosInstance().put(`${routes.transferInventory.path}/${transferInventoryData?._id}/product/remove`, {
            ids: showConfirmBox.data?.filter((e) => e.type === MATERIAL_TYPE.product)?.map((e) => e.productId)
          });
        }
        setShowConfirmBox({ open: false, data: [] });
        setRemovingInventory(false);
        fetchData();
        fetchTransferInventoryData();
      } catch (error) {
        setShowConfirmBox({ open: false, data: [] });
        setRemovingInventory(false);
        toastConfig.setToastConfig(error);
      }
    }
  };

  const onSaveEdit = (data, row) => {
    if (!data || !data?.qty || row?.type !== MATERIAL_TYPE.product) return;
    if (row.canDelete === false && row?.loadingTicketStatus) {
      toastConfig.setToastConfig({
        type: 'error',
        message: "Qty can't be updated",
        open: true
      });
      fetchData();
      return;
    }

    if (!Number(row?.qty) || Number(row?.qty) <= 0) {
      toastConfig.setToastConfig({
        type: 'error',
        message: 'Please enter valid Qty.',
        open: true
      });
      fetchData();
      return;
    }
    if (Number(row.qty) > Number(row.inventory)) {
      toastConfig.setToastConfig({
        type: 'error',
        message: "Qty can't be greater then inventory",
        open: true
      });
      fetchData();
      return;
    }
    if (row?.serialNumber?.length && Number(row.qty) < row?.serialNumber?.length) {
      toastConfig.setToastConfig({
        type: 'error',
        message: "Qty can't be less then serial numbers assigned",
        open: true
      });
      fetchData();
      return;
    }
    const rows = dataRows;
    rows?.forEach((d) => {
      if (row?._id === d._id) {
        d.qty = parseInt(data.qty);
      }
    });
    updateQty(row._id, row.qty);
    fetchData();
  };

  const qtyUpdate = ({ data }) => {
    if (!Number(data?.qty) || Number(data?.qty) <= 0) {
      toastConfig.setToastConfig({
        type: 'error',
        message: 'Please enter valid Qty.',
        open: true
      });
      fetchData();
      return;
    }
    if (data.canDelete === false && data?.loadingTicketStatus) {
      toastConfig.setToastConfig({
        type: 'error',
        message: "Qty can't be updated",
        open: true
      });
      fetchData();
      return;
    }
    if (Number(data.qty) > Number(data.inventory)) {
      toastConfig.setToastConfig({
        type: 'error',
        message: "Qty can't be greater then inventory",
        open: true
      });
      fetchData();
      return;
    }
    if (data?.serialNumber?.length && Number(data.qty) < data?.serialNumber?.length) {
      toastConfig.setToastConfig({
        type: 'error',
        message: "Qty can't be less then serial numbers assigned",
        open: true
      });
      fetchData();
      return;
    }

    updateQty(data?._id, data.qty);
  };

  const closeDialog = () => {
    setAddInventoryDialog(false);
  };

  const updateQty = (id: string, qty: string) => {
    axiosInstance()
      .put(`${routes.transferInventory.path}/${transferInventoryData._id}/product`, {
        ids: [id],
        qty: Number(qty)
      })
      .then(() => {
        setProductEditDialog({ open: false, productData: null });
        fetchData();
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleAssignSerialNumbers = (rows) => {
    const data = rows?.map((e) => e?.serialNumber);
    setIsAssigning(true);
    axiosInstance()
      .post(`${transferInventory.api}/${transferInventoryData._id}/serial-number`, {
        serialNumber: data,
        product: assignSerialNumbersDialog?.data[0]?.product
      })
      .then(() => {
        setIsAssigning(false);
        setAssignSerialNumbersDialog({ open: false, data: null });
        fetchData();
      })
      .catch((error) => {
        setIsAssigning(false);
        toastConfig.setToastConfig(error);
      });
  };

  const addButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          onClick={() => {
            setAddInventoryDialog(true);
          }}
          id="add-existing-products-menu-item"
        >
          {`Add Existing Products`}
        </MenuItem>
      </>
    );
  };

  const actionButtonMenuItems = () => {
    return (
      <>
        {selectedRecords?.filter((e) => e?.serializedProduct && e?.qty - e?.serialNumber?.length > 0)?.length > 0 && (
          <MenuItem
            onClick={() => {
              setAssignSerialNumbersDialog({ open: true, data: selectedRecords?.filter((s) => s.type !== 'serialNumber' && s?.serializedProduct) });
            }}
          >
            {`Assign Serial Numbers`}
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            setShowConfirmBox({ open: true, data: selectedRecords });
          }}
          disabled={selectedRecords?.some((s) => !s.canDelete)}
        >
          {`Delete`}
        </MenuItem>
      </>
    );
  };

  return (
    <React.Fragment>
      {allowedToEdit && [TRANSFER_INVENTORY_STATUS.new, TRANSFER_INVENTORY_STATUS.inProgress]?.includes(transferInventoryData?.status) && (
        <>
          <DetailsPageHeader
            isAddButtonVisible
            addButtonMenuItems={addButtonMenuItems()}
            isActionButtonVisible={allowedToEdit}
            actionButtonMenuItems={actionButtonMenuItems()}
            actionButtonProps={{ disabled: selectedRecords?.filter((e) => !e?.hideSelection)?.length ? false : true }}
            hasXpadding
          />
        </>
      )}
      <Box mt={1}>
        {columns ? (
          <CustomReactTable
            height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchData}
            onSaveEdit={onSaveEdit}
            hideAction={!allowedToEdit}
            hideSelection={!allowedToEdit}
            isClientSideGrid={true}
            expander={true}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Box>
      {viewProductEditDialog.open && (
        <ProductQtyDialog
          rowData={viewProductEditDialog?.productData}
          transferInventoryData={transferInventoryData}
          onClose={() => {
            setProductEditDialog({ open: false, productData: null });
          }}
          handleSave={qtyUpdate}
        />
      )}
      {openAddNewInventory && transferInventoryData?.transferFromPlant?.optionValue && (
        <AddInventory
          isAdding={isAdding}
          submit={handleSave}
          close={closeDialog}
          warehouse={transferInventoryData?.transferFromPlant?.optionValue}
          storageLocation={transferInventoryData?.transferFromStorageLocation?.optionValue || null}
          renderedFrom={`${renderedFrom}_sub-1`}
          ignoreIds={dataRows?.map((e) => e.productId)}
        />
      )}
      {showConfirmBox.open && (
        <ConfirmationDialog
          okBtnLoading={isRemovingInventory}
          open={showConfirmBox.open}
          message={`Are you sure you want to remove ?`}
          onClose={() => {
            setShowConfirmBox({ open: false, data: [] });
          }}
          onOk={handleRemove}
        />
      )}
      {assignSerialNumbersDialog.open && (
        <AssignSerialNumbersDialog
          selectedProducts={assignSerialNumbersDialog?.data?.map((s) => ({ ...s, id: s?.product, qty: s?.qty - s?.serialNumber?.length }))}
          handleClose={() => {
            setAssignSerialNumbersDialog({ open: false, data: null });
          }}
          handleSucess={(rows) => {
            handleAssignSerialNumbers(rows);
          }}
          referenceType={'Transfer Inventory'}
          isAssigning={isAssigning}
          filterByPlant={transferInventoryData?.transferFromPlant}
          ids={productSerialNumbers?.map((e) => e._id)}
        />
      )}
    </React.Fragment>
  );
};

export default Products;
