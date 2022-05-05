import React, { useReducer, useState, useEffect, useContext } from 'react';
import { Button, Box, CircularProgress } from '@material-ui/core';
import { useHistory, Link } from 'react-router-dom';
import routes from 'src/components/Helpers/Routes';
import GridDeleteIcon from 'src/components/Helpers/GridDeleteIcon';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { CommonRenderer } from 'src/components/AgGridComponents/CustomAgGridCellRenderers';
import CustomAgGrid, { reducer as gridReducer, intialState as gridState } from 'src/components/AgGridComponents/CustomAgGrid';
import axiosInstance from 'src/axios/axiosInstance';
import CustomSwipableList from 'src/components/SwipableListComponents/CustomSwipableList';
import { IoRemoveCircleOutline } from 'react-icons/io5';
import { MdAdd, MdDone } from 'react-icons/md';
import { useData } from 'src/StateProvider/Provider';
import AddInventory from './AddInventory';
import { gridLoadingTimeout, prepareDataForGrid, TRANSFER_INVENTORY_STATUS } from 'src/constants/helpers';
import CustomAgGridEditable from 'src/components/AgGridComponents/CustomAgGridEditable';
import { CheckboxRenderer } from '../../../components/AgGridComponents/CustomAgGridCellRenderers';

const Products = ({ transferInventoryData, setNextStep, renderedFrom, allowedToEdit }) => {
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
  const [columns, setColumns] = useState([])

  const history = useHistory();

  useEffect(() => {
    fetchFields()
  }, []);

  const fetchFields = async () => {
    const productResult = await axiosInstance().get('/field?resource=Product&view=true')
    const productFields = productResult?.data?.data?.filter((e) => ["productName", "productNumber", "serializedProduct"].includes(e?.fieldData?.fieldName));
    productFields?.forEach((e) => {
      if (e?.fieldData?.fieldName === "productName") {
        columns.push({ field: "productName", headerName: e?.fieldData?.fieldLabel, show: true, disabled: true, cellRenderer: "nameRenderer" })
      }
      if (e?.fieldData?.fieldName === "productNumber") {
        columns.push({ field: "productNumber", headerName: e?.fieldData?.fieldLabel, show: true, cellRenderer: "commonRenderer" })
      }
      if (e?.fieldData?.fieldName === "serializedProduct") {
        columns.push({ field: "serializedProduct", headerName: e?.fieldData?.fieldLabel, show: true, cellRenderer: "checkboxRenderer" })
      }
    })
    columns.push({
      field: 'qty',
      headerName: 'Quantity',
      show: true,
      disabled: false,
      cellRenderer: 'commonRenderer',
      cellEditor: 'numericCellEditor',
      editable: permissions?.transferInventory?.isUpdate
    });
    setColumns([...columns])
  }

  useEffect(() => {
    if (!transferInventoryData) return;
    let timeout = setTimeout(fetchProducts, 200);
    return () => clearTimeout(timeout);
  }, [transferInventoryData]);

  const fetchProducts = () => {
    setNextStep(false);
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    axiosInstance()
      .get(`${routes.transferInventory.path}/${transferInventoryData._id}/product`)
      .then(({ data: { data } }) => {
        dispatch({ type: 'loading', loading: true });
        let rows = data?.products.map((u: any) => {
          let finalObject = prepareDataForGrid(u);
          finalObject['productId'] = u?.product;
          finalObject['productName'] = u?.productDetail?.productName;
          finalObject['productNumber'] = u?.productDetail?.productNumber;
          finalObject['serializedProduct'] = u?.productDetail?.serializedProduct;
          finalObject['qty'] = u.qty;
          finalObject['inventory'] = u.inventoryDetail?.inventory || 0;
          return {
            ...finalObject
          };
        });
        if (rows?.length) {
          setNextStep(true);
        }
        dispatch({ type: 'initialize', data: rows, count: data.count });
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
    [TRANSFER_INVENTORY_STATUS.new, TRANSFER_INVENTORY_STATUS.inTransit]?.includes(transferInventoryData?.status) ? (
      <>
        <GridDeleteIcon
          hasDeletePermission={permissions?.transferInventory?.isUpdate}
          ownerId={transferInventoryData?.createdBy.user._id}
          userId={user?.user?._id}
          onDelete={() => {
            setShowConfirmBox(true);
            setRemoveData([params.data._id]);
          }}
          entity=""
        />
      </>
    ) : null;

  const frameworkComponents = {
    commonRenderer: CommonRenderer,
    nameRenderer: NameRenderer,
    checkboxRenderer: CheckboxRenderer,
    actionsRenderer: ActionRenderer
  };

  const onCellValueChanged = ({ data }) => {
    if (Number(data.qty) > Number(data.inventory)) {
      toastConfig.setToastConfig({
        type: 'warning',
        message: "Qty can't be greater then inventory",
        open: true
      });
      return;
    }
    updateQTY(data?._id, data.qty);
  };

  const closeDialog = () => {
    setAddInventoryDialog(false);
  };

  const updateQTY = (id: string, qty: string) => {
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
        <Box display="flex" justifyContent="space-between" mx="4px">
          <Button
            variant={isMobile ? 'text' : 'contained'}
            color="primary"
            size="small"
            style={isMobile && !isTablet ? { color: 'var(--secondary)' } : {}}
            onClick={() => {
              setAddInventoryDialog(true);
            }}
          >
            {isMobile && !isTablet ? <MdAdd size={22} /> : `Add Product`}
          </Button>

          <Box display="flex">
            <Button
              variant={isMobile ? 'text' : 'contained'}
              size="small"
              color="primary"
              style={isMobile && !isTablet ? { color: 'var(--danger-light)' } : {}}
              disabled={selectedRecords.length === 0}
              onClick={() => {
                setShowConfirmBox(true);
                setRemoveData(selectedRecords.map((inv: any) => inv?._id));
              }}
            >
              {isMobile && !isTablet ? <IoRemoveCircleOutline size={22} /> : 'Remove Product'}
            </Button>
          </Box>
        </Box>
      )}
      <Box mt={1}>
        {isMobile && !isTablet ? (
          <CustomSwipableList
            allowSelection={allowedToEdit}
            allowSwipe={allowedToEdit}
            permissions={permissions?.transferInventory}
            primaryField={columns?.find((d: any) => d.primaryField)}
            onClick={(data) => {
              history.push(`${routes.serializedAssetDetail.path}/${data._id}`);
            }}
            dataRows={dataRows}
            selectedRecords={selectedRecords}
            dispatch={dispatch}
            onEdit={(data) => {
              // history.push(`${routes.rentalManagementDetail.path}/${data._id}?openEdit=true`)
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
        )}
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
          message={`Are you sure you want to remove inventory(s)?`}
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
