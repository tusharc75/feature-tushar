import React, { useState, useEffect, useContext } from 'react';
import { Button, Box, IconButton } from '@material-ui/core';
import { useHistory } from 'react-router-dom';
import routes from 'src/components/Helpers/Routes';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import axiosInstance from 'src/axios/axiosInstance';
import { useData } from 'src/StateProvider/Provider';
import AddInventory from './AddInventory';
import AssignSerialNumber from './AssignSerialNumber';
import {
  gridLoadingTimeout,
  prepareDataForGrid,
  TRANSFER_INVENTORY_STATUS,
  deliveryTicket,
  DELIVERY_TICKET_REFERENCE_TYPE,
  DELIVERY_TICKET_TYPE
} from 'src/constants/helpers';
import DeleteIcon from '@material-ui/icons/Delete';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import AddBoxOutlinedIcon from '@material-ui/icons/AddBoxOutlined';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import ProductQtyDialog from './ProductQtyDialog';
import { deleteDisable } from 'src/constants/messageHelpers';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTableNew';
import { ExpandMore } from '@material-ui/icons';
import { Menu, MenuItem } from '@material-ui/core';


const Products = ({ transferInventoryData, setNextStep, renderedFrom, allowedToEdit, fetchTransferInventoryData, updateStatus, stepFullScreen }) => {

  const toastConfig = useContext(CustomToastContext);
  const { state, dispatch } = useTableReducer();
  const { dataRows, selectedRecords } = state;
  const {
    state: {
      user: { user },
      permissions
    }
  } = useData();
  const [isRemovingInventory, setRemovingInventory] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [removeData, setRemoveData] = useState([]);
  const [openAddNewInventory, setAddInventoryDialog] = useState(false);

  const [isAdding, setIsAdding] = useState(false);
  const [columns, setColumns] = useState(null);
  const [viewProductEditDialog, setProductEditDialog] = useState({ open: false, productData: null });
  const [anchorEl, setAnchorEl] = useState(null);

  const [assignNumber, setAssignNumber] = useState({ open: false, serialNumber: [], qty: 0, product: '' });
  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = async () => {
    const column = [];
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
          Header: e?.fieldLabel,
          show: true,
          disabled: true,
          Cell: ({ row }) => (
            <div>
              {row.original?.canDelete ? (
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
              <Box ml={1}>
                <IconButton
                  size="small"
                  onClick={() => {
                    window.open(`/product/detail/${row.original.product}`);
                  }}
                >
                  <OpenInNewIcon fontSize="small" color="primary" />
                </IconButton>
              </Box>
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
          show: true,
          Cell: ({ row }) => (row.original[e?.fieldName] ? <div>{row.original[e?.fieldName]}</div> : <NoDataCell />)
        });
      }
    });
    column.push({
      accessor: 'qty',
      Header: 'Quantity',
      show: true,
      disabled: false,
      Cell: ({ row }) => (row.original?.qty ? <div>{row.original?.qty}</div> : <NoDataCell />),
      cellEditor: 'numericCellEditor',
      filter: false,
      sortable: false,
      editable: permissions?.transferInventory?.isUpdate
    });
    column.push({
      accessor: 'inventory',
      Header: 'Inventory',
      show: true,
      filter: false,
      sortable: false,
      Cell: ({ row }) => (row.original?.inventory ? <div>{row.original?.inventory}</div> : <NoDataCell />)
    });
    column.push({
      accessor: 'serialNumber',
      Header: 'Serial Number',
      show: true,
      Cell: ({ row }) =>
        row.original?.serialNumber?.length ? <div>{row.original?.serialNumber?.map((e) => e.serialNumber)?.toString()}</div> : <NoDataCell />
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
        {row.original?.serializedProduct && (
          <HtmlTooltip title={`Assign Serial Number`}>
            <span>
              <IconButton
                onClick={() => {
                  setAssignNumber({
                    open: true,
                    serialNumber: row.original?.serialNumber,
                    qty: parseInt(row.original?.qty),
                    product: row.original?.productId
                  });
                }}
                size="small"
                color="primary"
              >
                <AddBoxOutlinedIcon color="primary" fontSize="small" />
              </IconButton>
            </span>
          </HtmlTooltip>
        )}
        <HtmlTooltip title={row.original?.canDelete ? 'Delete' : deleteDisable}>
          <IconButton
            disabled={!row.original?.canDelete}
            onClick={() => {
              setShowConfirmBox(true);
              setRemoveData([row.original?.productId]);
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

  const fetchData = async () => {
    setNextStep(false);
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
        deliveryTicketProduct = [...deliveryTicketProduct, ...e?.products];
      }
    });

    axiosInstance()
      .get(`${routes.transferInventory.path}/${transferInventoryData?._id}/product`)
      .then(({ data: { data } }) => {
        dispatch({ type: 'loading', loading: true });
        let rows = data?.products?.map((u: any) => {
          let finalObject = prepareDataForGrid(u);
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
          finalObject['hideSelection'] = !finalObject['canDelete'];
          finalObject['serialNumber'] = data?.serialNumber?.filter((e) => e.product === u?.product);
          return {
            ...finalObject
          };
        });
        if (rows?.length) {
          setNextStep(true);
        }
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

  const handleRemoveAssets = async () => {
    if (removeData.length > 0) {
      setRemovingInventory(true);
      try {
        await axiosInstance().put(`${routes.transferInventory.path}/${transferInventoryData?._id}/product/remove`, {
          ids: removeData
        });
        setRemoveData([]);
        setShowConfirmBox(false);
        setRemovingInventory(false);
        fetchData();
        fetchTransferInventoryData();
      } catch (error) {
        setShowConfirmBox(false);
        setRemovingInventory(false);
        setRemoveData([]);
        toastConfig.setToastConfig(error);
      }
    }
  };

  const onSaveEdit = (data, row) => {
    if (!data || !data?.qty) return;
    if (row.canDelete === false) {
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
        message: "Qty can't be less then serial number assigned",
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
    if (data.canDelete === false) {
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
        message: "Qty can't be less then serial number assigned",
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

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };


  return (
    <React.Fragment>
      {allowedToEdit && [TRANSFER_INVENTORY_STATUS.new, TRANSFER_INVENTORY_STATUS.inProgress]?.includes(transferInventoryData?.status) && (
        <Box display="flex" justifyContent="space-between" m={1}>
          <Button
            variant={'outlined'}
            color="primary"
            size="small"
            onClick={() => {
              setAddInventoryDialog(true);
            }}
          >
            {`Add Products`}
          </Button>
          <Box display="flex">
            <Button
              variant={'outlined'}
              color="default"
              size="small"
              onClick={openActions}
              className={`new-dropdown-v1`}
              aria-controls="action-menu"
              endIcon={<ExpandMore />}
              disabled={selectedRecords?.filter((e) => !e?.hideSelection)?.length ? false : true}
            >
              Actions
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
                  closeActions()
                  setShowConfirmBox(true);
                  setRemoveData(selectedRecords?.filter((e) => !e?.hideSelection)?.map((inv: any) => inv?.productId));
                }}
              >
                {`Delete`}
              </MenuItem>
            </Menu>
          </Box>
        </Box>
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
      {showConfirmBox && (
        <ConfirmationDialog
          okBtnLoading={isRemovingInventory}
          open={showConfirmBox}
          message={`Are you sure you want to remove product(s)?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleRemoveAssets}
        />
      )}
      {assignNumber.open && (
        <AssignSerialNumber
          handleClose={() => {
            setAssignNumber({ open: false, serialNumber: [], qty: 0, product: '' });
          }}
          handleSuccess={() => {
            setAssignNumber({ open: false, serialNumber: [], qty: 0, product: '' });
            fetchData();
          }}
          product={assignNumber.product}
          serialNumber={assignNumber.serialNumber}
          qty={assignNumber.qty}
          warehouse={transferInventoryData?.transferFromPlant?.optionValue}
          transferInventoryData={transferInventoryData}
        />
      )}
    </React.Fragment>
  );
};

export default Products;
