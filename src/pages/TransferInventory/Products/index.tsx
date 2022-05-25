import React, { useReducer, useState, useEffect, useContext } from 'react';
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
import { gridLoadingTimeout, prepareDataForGrid, TRANSFER_INVENTORY_STATUS, deliveryTicket, DELIVERY_TICKET_REFRENCE_TYPE, DELIVERY_TICKET_TYPE } from 'src/constants/helpers';
import CustomAgGridEditable from 'src/components/AgGridComponents/CustomAgGridEditable';
import { CheckboxRenderer } from '../../../components/AgGridComponents/CustomAgGridCellRenderers';
import DeleteIcon from '@material-ui/icons/Delete';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';

const Products = ({ transferInventoryData, setNextStep, renderedFrom, allowedToEdit, fetchTransferInventoryData }) => {
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
  const [columns, setColumns] = useState(null)

  const history = useHistory();

  useEffect(() => {
    fetchFields()
  }, []);

  const fetchFields = async () => {
    const column = [];
    const productResult = await axiosInstance().get('/field?resource=Product&view=true')
    const productFields = productResult?.data?.data?.filter((e) => ["productName", "productNumber", "serializedProduct"].includes(e?.fieldData?.fieldName));
    productFields?.forEach((e) => {
      if (e?.fieldData?.fieldName === "productName") {
        column.push({ field: "productName", primaryField: true, headerName: e?.fieldData?.fieldLabel, show: true, disabled: true, cellRenderer: "nameRenderer" })
      }
      if (e?.fieldData?.fieldName === "productNumber") {
        column.push({ field: "productNumber", headerName: e?.fieldData?.fieldLabel, show: true, cellRenderer: "commonRenderer" })
      }
      if (e?.fieldData?.fieldName === "serializedProduct") {
        column.push({ field: "serializedProduct", headerName: e?.fieldData?.fieldLabel, show: true, cellRenderer: "checkboxRenderer" })
      }
    })
    column.push({
      field: 'qty',
      headerName: 'Quantity',
      show: true,
      disabled: false,
      cellRenderer: 'commonRenderer',
      cellEditor: 'numericCellEditor',
      editable: permissions?.transferInventory?.isUpdate
    });
    setColumns([...column])
  }

  useEffect(() => {
    fetchProducts()
  }, [transferInventoryData]);

  const fetchProducts = async () => {
    setNextStep(false);
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }

    const { data: { data: deliveryTicketList } } = await axiosInstance().get(`${deliveryTicket.api}/typewise?refrenceType=${DELIVERY_TICKET_REFRENCE_TYPE.transferInventory}&refrenceId=${transferInventoryData._id}&ticketType=${DELIVERY_TICKET_TYPE.loading}`);
    var deliveryTicketProduct = []
    deliveryTicketList?.forEach((e) => {
      if (e?.products && e?.products?.length) {
        deliveryTicketProduct = [...deliveryTicketProduct, ...e?.products]
      }
    })

    axiosInstance()
      .get(`${routes.transferInventory.path}/${transferInventoryData?._id}/product`)
      .then(({ data: { data } }) => {
        dispatch({ type: 'loading', loading: true });
        let rows = data?.products?.map((u: any) => {
          let finalObject = prepareDataForGrid(u);
          finalObject['productId'] = u?.product;
          finalObject['productName'] = u?.productDetail?.productName;
          finalObject['productNumber'] = u?.productDetail?.productNumber;
          finalObject['serializedProduct'] = u?.productDetail?.serializedProduct;
          finalObject['qty'] = u.qty;
          finalObject['inventory'] = u.inventoryDetail?.inventory || 0;
          finalObject['isChecked'] = false;
          finalObject['allowedToEdit'] = false;
          finalObject['canDelete'] = !data?.assets?.some((e) => e._id === u._id) && !deliveryTicketProduct?.some((e) => e.product === u?.product);
          finalObject['hideSelection'] = !finalObject['canDelete'];
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
        fetchTransferInventoryData()
        toastConfig.setToastConfig({
          open: true,
          message: 'Records added successfully',
          type: 'success'
        });
        setIsAdding(false);
        closeDialog();
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
        fetchTransferInventoryData()
      } catch (error) {
        setShowConfirmBox(false);
        setRemovingInventory(false);
        setRemoveData([]);
        toastConfig.setToastConfig(error);
      }
    }
  };

  const NameRenderer = (params) => (
    <Link className="link" title={params.value} to={`/product/detail/${params.data.product}`}>
      {params.value}
    </Link>
  );

  const ActionRenderer = (params) =>
    params?.data?.canDelete ? (
      <IconButton
        onClick={() => {
          setShowConfirmBox(true);
          setRemoveData([params.data._id]);
        }}
        size="small"
        color="primary"
      >
        <DeleteIcon color="error" fontSize="small" />
      </IconButton>
    ) : null;

  const frameworkComponents = {
    commonRenderer: CommonRenderer,
    nameRenderer: NameRenderer,
    checkboxRenderer: CheckboxRenderer,
    actionsRenderer: ActionRenderer
  };

  const onCellValueChanged = ({ data }) => {
    if (data.canDelete === false) {
      toastConfig.setToastConfig({
        type: 'warning',
        message: "Qty can't be updated",
        open: true
      });
      return;
    }
    if (Number(data.qty) > Number(data.inventory)) {
      toastConfig.setToastConfig({
        type: 'warning',
        message: "Qty can't be greater then inventory",
        open: true
      });
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
      {allowedToEdit && [TRANSFER_INVENTORY_STATUS.new, TRANSFER_INVENTORY_STATUS.inTransit]?.includes(transferInventoryData?.status) && (
        <Box display="flex" justifyContent="space-between" p={1}>
          <Button
            variant={'contained'}
            color="primary"
            size="small"
            onClick={() => {
              setAddInventoryDialog(true);
            }}
          >
            {`Add Product`}
          </Button>
          <Box display="flex">
            <Button
              variant="outlined"
              size="small"
              color="primary"
              disabled={selectedRecords.length === 0}
              onClick={() => {
                setShowConfirmBox(true);
                setRemoveData(selectedRecords.map((inv: any) => inv?._id));
              }}
            >
              {'Remove'}
            </Button>
          </Box>
        </Box>
      )}
      <Box mt={1}>
        {columns ?
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
              onEdit={(data) => {
              }}
              extraParamsToCheckDelete={true}
              onDelete={(data) => { }}
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
              onClone={(data) => { }}
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
              refreshGrid={() => { }}
            />
          )
          : <Box p={2} height={500} bgcolor="white">
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        }
      </Box>
      {openAddNewInventory && transferInventoryData?.transferFromPlant?.optionValue && (
        <AddInventory
          existingProducts={dataRows}
          isAdding={isAdding}
          submit={handleSave}
          close={closeDialog}
          plantId={transferInventoryData?.transferFromPlant.optionValue}
          renderedFrom={`${renderedFrom}_sub-1`}
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
    </React.Fragment>
  );
};

export default Products;
