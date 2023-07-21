import React, { useReducer, useState, useEffect, useContext, Fragment } from 'react';
import { Button, Box, IconButton } from '@material-ui/core';
import { useHistory, Link } from 'react-router-dom';
import routes from 'src/components/Helpers/Routes';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { CommonRenderer } from 'src/components/AgGridComponents/CustomAgGridCellRenderers';
import CustomAgGrid, { reducer as gridReducer, intialState as gridState } from 'src/components/AgGridComponents/CustomAgGrid';
import axiosInstance from 'src/axios/axiosInstance';
import CustomSwipableList from 'src/components/SwipableListComponents/CustomSwipableList';
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
import CustomAgGridEditable from 'src/components/AgGridComponents/CustomAgGridEditable';
import DeleteIcon from '@material-ui/icons/Delete';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import AddBoxOutlinedIcon from '@material-ui/icons/AddBoxOutlined';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import NoDataCell from 'src/components/Helpers/NoDataCell';

const Products = ({ transferInventoryData, setNextStep, renderedFrom, allowedToEdit, fetchTransferInventoryData, updateStatus }) => {
  const toastConfig = useContext(CustomToastContext);
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
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(gridReducer, gridState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;
  const [isAdding, setIsAdding] = useState(false);
  const [columns, setColumns] = useState(null);

  const history = useHistory();

  const [assignNumber, setAssignNumber] = useState({ open: false, serialNumber: [], qty: 0, product: '' });

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
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
          field: 'productName',
          primaryField: true,
          headerName: e?.fieldLabel,
          show: true,
          disabled: true,
          cellRenderer: 'productNameRenderer'
        });
      } else if (e?.fieldName === 'serializedProduct') {
        column.push({ field: 'serializedProductShow', headerName: e?.fieldLabel, show: true, cellRenderer: 'commonRenderer' });
      } else {
        column.push({ field: e?.fieldName, headerName: e?.fieldLabel, show: true, cellRenderer: 'commonRenderer' });
      }
    });
    column.push({
      field: 'qty',
      headerName: 'Quantity',
      show: true,
      disabled: false,
      cellRenderer: 'commonRenderer',
      cellEditor: 'numericCellEditor',
      filter: false,
      sortable: false,
      editable: permissions?.transferInventory?.isUpdate
    });
    column.push({
      field: 'inventory',
      headerName: 'Inventory',
      show: true,
      filter: false,
      sortable: false,
      cellRenderer: 'commonRenderer'
    });
    column.push({
      field: 'serialNumber',
      headerName: 'Serial Number',
      show: true,
      cellRenderer: 'serialNumberRenderer'
    });
    setColumns([...column]);
  };

  useEffect(() => {
    fetchProducts();
  }, [transferInventoryData]);

  const fetchProducts = async () => {
    setNextStep(false);
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }

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
        fetchProducts();
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
        fetchProducts();
        fetchTransferInventoryData();
      } catch (error) {
        setShowConfirmBox(false);
        setRemovingInventory(false);
        setRemoveData([]);
        toastConfig.setToastConfig(error);
      }
    }
  };

  const ProductNameRenderer = (params) => (
    <p className="link text-truncate" title={params.value} onClick={() => window.open(`/product/detail/${params.data.product}`)}>
      {params.value}
    </p>
  );

  const SerialNumberRenderer = (params) =>
    params?.data?.serialNumber?.length ? params?.data?.serialNumber?.map((e) => e.serialNumber)?.toString() : <NoDataCell />;

  const ActionRenderer = (params) =>
    params?.data?.canDelete ? (
      <Fragment>
        {params?.data?.serializedProduct && (
          <Box pr={1}>
            <HtmlTooltip title={`Assign Serial Number`}>
              <IconButton
                onClick={() => {
                  setAssignNumber({
                    open: true,
                    serialNumber: params?.data?.serialNumber,
                    qty: parseInt(params?.data?.qty),
                    product: params?.data?.productId
                  });
                }}
                size="small"
                color="primary"
              >
                <AddBoxOutlinedIcon color="primary" fontSize="small" />
              </IconButton>
            </HtmlTooltip>
          </Box>
        )}
        <IconButton
          onClick={() => {
            setShowConfirmBox(true);
            setRemoveData([params.data.productId]);
          }}
          size="small"
          color="primary"
        >
          <DeleteIcon color="error" fontSize="small" />
        </IconButton>
      </Fragment>
    ) : null;

  const frameworkComponents = {
    serialNumberRenderer: SerialNumberRenderer,
    commonRenderer: CommonRenderer,
    productNameRenderer: ProductNameRenderer,
    actionsRenderer: ActionRenderer
  };

  const onCellValueChanged = ({ data }) => {
    if (!Number(data?.qty) || Number(data?.qty) <= 0) {
      toastConfig.setToastConfig({
        type: 'error',
        message: 'Please enter valid Qty.',
        open: true
      });
      fetchProducts();
      return;
    }
    if (data.canDelete === false) {
      toastConfig.setToastConfig({
        type: 'error',
        message: "Qty can't be updated",
        open: true
      });
      fetchProducts();
      return;
    }
    if (Number(data.qty) > Number(data.inventory)) {
      toastConfig.setToastConfig({
        type: 'error',
        message: "Qty can't be greater then inventory",
        open: true
      });
      fetchProducts();
      return;
    }
    if (data?.serialNumber?.length && Number(data.qty) < data?.serialNumber?.length) {
      toastConfig.setToastConfig({
        type: 'error',
        message: "Qty can't be less then serial number assigned",
        open: true
      });
      fetchProducts();
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
        fetchProducts();
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  return (
    <React.Fragment>
      {allowedToEdit && [TRANSFER_INVENTORY_STATUS.new, TRANSFER_INVENTORY_STATUS.inProgress]?.includes(transferInventoryData?.status) && (
        <Box display="flex" justifyContent="space-between" m={1}>
          <Button
            variant={'contained'}
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
              variant="outlined"
              size="small"
              color="primary"
              disabled={selectedRecords.length === 0}
              onClick={() => {
                setShowConfirmBox(true);
                setRemoveData(selectedRecords.map((inv: any) => inv?.productId));
              }}
            >
              {'Remove'}
            </Button>
          </Box>
        </Box>
      )}
      <Box mt={1}>
        {columns ? (
          isMobile && !isTablet ? (
            <CustomSwipableList
              allowSelection={allowedToEdit}
              allowSwipe={allowedToEdit}
              permissions={permissions?.transferInventory}
              primaryField={columns?.find((d: any) => d.primaryField)}
              onClick={(data) => {
                history.push(`${routes.productDetail.path}/${data._id}`);
              }}
              dataRows={dataRows}
              selectedRecords={selectedRecords}
              dispatch={dispatch}
              onEdit={(data) => {}}
              extraParamsToCheckDelete={true}
              onDelete={(data) => {}}
              rowCount={rowCount}
              page={page}
              loading={loading}
              chips={[
                {
                  label: 'Quantity: ',
                  field: 'qty'
                },
                {
                  label: 'Serialized Product: ',
                  field: 'serializedProduct'
                }
              ]}
              additionalDetails={[]}
              owerCollaboratorInitialsOrImages="owerCollaboratorInitialsOrImages"
              onCreate={false}
              showClone={false}
              onClone={(data) => {}}
              renderedFrom={renderedFrom}
            />
          ) : (
            <CustomAgGridEditable
              columns={columns}
              dataRows={dataRows}
              frameworkComponents={frameworkComponents}
              setGridApi={setGridApi}
              dispatch={dispatch}
              rowCount={rowCount}
              limit={limit}
              pageSizes={pageSizes}
              page={page}
              allowAction={allowedToEdit}
              actionWidth={120}
              allowSelection={allowedToEdit}
              isClientSideGrid={true}
              loading={loading}
              onCellValueChanged={onCellValueChanged}
              renderedFrom={renderedFrom}
              refreshGrid={fetchProducts}
            />
          )
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Box>
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
            fetchProducts();
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
