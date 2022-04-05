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
import { gridLoadingTimeout, prepareDataForGrid } from 'src/constants/helpers';

const InventoryGrid = (props) => {
  const { transferData, updateTransferStatus, setTransferIsEnded, renderedFrom } = props;
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
  const [isCompleting, setCompleting] = useState(false);
  const columns = [
    { field: 'productName', headerName: 'Product Description', show: true, cellRenderer: 'productNameRenderer', primaryField: true },
    {
      field: 'qty',
      headerName: 'Quantity',
      show: true,
      disabled: false,
      cellRenderer: 'commonRenderer',
      cellEditor: 'numericCellEditor',
      editable: true
    }
  ];

  const history = useHistory();

  const closeDialog = () => {
    setAddInventoryDialog(false);
  };

  useEffect(() => {
    if (!transferData) return;
    fetchInventories();
  }, [transferData]);

  const fetchInventories = () => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    axiosInstance()
      .get(`${routes.transferInventory.path}/${transferData._id}/product`)
      .then(({ data: { data } }) => {
        dispatch({ type: 'loading', loading: true });
        let rows = data?.map((u: any) => {
          let finalObject = prepareDataForGrid(u);
          finalObject['productId'] = u._product;
          finalObject['productName'] = u.productDetail.productName;
          finalObject['qty'] = u.qty;

          return {
            ...finalObject
          };
        });

        if (data && data.length === 0 && transferData?.status !== 'New') {
          updateTransferStatus('New');
        } else if (data.length > 0 && !['In Progress', 'Completed'].includes(transferData?.status)) {
          updateTransferStatus('In Progress');
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
      .post(`${routes.transferInventory.path}/${transferData?._id}/product`, {
        products
      })
      .then(() => {
        fetchInventories();
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
        await axiosInstance().put(`${routes.transferInventory.path}/${transferData?._id}/product/remove`, {
          ids: removeData
        });
        setRemoveData([]);
        setShowConfirmBox(false);
        setRemovingInventory(false);
        fetchInventories();
      } catch (error) {
        setShowConfirmBox(false);
        setRemovingInventory(false);
        setRemoveData([]);
        toastConfig.setToastConfig(error);
      }
    }
  };

  const ProductNameRenderer = (params) => (
    <Link className="link" title={params.value} to={`/product/detail/${params.data._id}`}>
      {params.value}
    </Link>
  );

  const ActionRenderer = (params) =>
    permissions?.transferInventory.isUpdate ? (
      <>
        <GridDeleteIcon
          hasDeletePermission={permissions?.transferInventory.isUpdate}
          ownerId={transferData?.createdBy.user._id}
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
    productNameRenderer: ProductNameRenderer,
    actionsRenderer: ActionRenderer
  };

  const completeTransfer = () => {
    setCompleting(true);
    axiosInstance()
      .patch(`${routes.transferInventory.path}/${transferData?._id}/complete`)
      .then(() => {
        toastConfig.setToastConfig({
          open: true,
          message: 'Transfer completed',
          type: 'success'
        });
        setTransferIsEnded(true);
        setCompleting(false);
      })
      .catch((err) => {
        setCompleting(false);
        toastConfig.setToastConfig(err);
      });
  };

  return (
    <React.Fragment>
      <Box display="flex" justifyContent="space-between" mx="4px">
        {permissions?.transferInventory.isUpdate && (
          <Button
            variant={isMobile ? 'text' : 'contained'}
            color="primary"
            size="small"
            style={isMobile && !isTablet ? { color: 'var(--secondary)' } : {}}
            onClick={() => {
              setAddInventoryDialog(true);
            }}
            disabled={isCompleting}
          >
            {isMobile && !isTablet ? <MdAdd size={22} /> : `Add Product`}
          </Button>
        )}
        <Box display="flex">
          {permissions?.transferInventory.isUpdate && (
            <Button
              variant={isMobile ? 'text' : 'contained'}
              size="small"
              color="primary"
              style={isMobile && !isTablet ? { color: 'var(--danger-light)' } : {}}
              disabled={selectedRecords.length === 0 || isCompleting}
              onClick={() => {
                setShowConfirmBox(true);
                setRemoveData(selectedRecords.map((inv: any) => inv?._id));
              }}
            >
              {isMobile && !isTablet ? <IoRemoveCircleOutline size={22} /> : 'Remove Product'}
            </Button>
          )}

          {permissions?.transferInventory.isUpdate && (
            <Button
              className="ml-2"
              variant={isMobile ? 'text' : 'contained'}
              size="small"
              color="primary"
              style={isMobile && !isTablet ? { color: 'var(--secondary)' } : {}}
              disabled={dataRows.length === 0 || isCompleting}
              onClick={completeTransfer}
              startIcon={isCompleting && <CircularProgress color="inherit" size={18} />}
            >
              {isMobile && !isTablet ? <MdDone size={22} /> : 'Complete Transfer'}
            </Button>
          )}
        </Box>
      </Box>

      <Box mt={1}>
        {isMobile && !isTablet ? (
          <CustomSwipableList
            allowSelection={true}
            allowSwipe={true}
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
            onDelete={(data) => {}}
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
            onClone={(data) => {}}
            renderedFrom={renderedFrom}
          />
        ) : (
          <CustomAgGrid
            columns={columns}
            dataRows={dataRows}
            frameworkComponents={frameworkComponents}
            setGridApi={setGridApi}
            dispatch={dispatch}
            rowCount={rowCount}
            limit={limit}
            pageSizes={pageSizes}
            page={page}
            allowAction={permissions?.transferInventory.isUpdate}
            actionWidth={120}
            allowSelection={permissions?.transferInventory.isUpdate}
            isClientSideGrid={true}
            loading={loading}
            // onCellValueChanged={onCellValueChanged}
            renderedFrom={renderedFrom}
            refreshGrid={() => {}}
          />
        )}
      </Box>
      {openAddNewInventory && (
        <AddInventory isAdding={isAdding} submit={handleSave} close={closeDialog} plantId={transferData?.transferFromPlant.optionValue} renderedFrom={`${renderedFrom}_sub-1`} />
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

export default InventoryGrid;
