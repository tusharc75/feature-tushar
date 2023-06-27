import React, { useState, useEffect, useContext, Fragment, useReducer } from 'react';
import {
  Grid,
  Box,
  Button,
  Paper,
  Typography,
  IconButton,
  Tab,
  Tabs,
  ButtonGroup,
  Container,
  InputAdornment,
  TextField,
  MenuItem,
  Menu
} from '@material-ui/core';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { useData } from 'src/StateProvider/Provider';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { bulkAssetCreation, CHILD_RESOURCE } from 'src/constants/helpers';
import EditIcon from '@material-ui/icons/Edit';
import CustomAgGrid, { intialState, reducer } from 'src/components/AgGridComponents/CustomAgGrid';
import { CommonRenderer } from 'src/components/AgGridComponents/CustomAgGridCellRenderers';
import AddExistingProductInventory from '../../Sublease/Productpackage/AddExistingProductInventory';
import GridDeleteIcon from 'src/components/Helpers/GridDeleteIcon';
import CustomAgGridEditable from 'src/components/AgGridComponents/CustomAgGridEditable';
import { isMobile, isTablet } from 'react-device-detect';
import CustomSwipableList from 'src/components/SwipableListComponents/CustomSwipableList';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { prepareDataForGrid } from 'src/constants/helpers';
import { generateColoum } from 'src/constants/columns';
import { ExpandMore } from '@material-ui/icons';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import CustomRenderCell from 'src/components/Helpers/CustomRenderCell';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import BulkAssetCreationQtyDialog from './BulkAssetCreationQtyDialog';
import styles from '../../Leads/Header.module.scss';
import { CURReplaceByCurrencySingle } from 'src/constants/formulaUtility';
import useColumns, { getFrameworkComponents } from 'src/constants/useColumns';

const Product = ({ bulkAssetCreationData, setNextStep, setBulkAssetCreationProduct, renderedFrom, fetchData, handleUpdateData, allowedToEdit }) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();
  const [anchorEl, setAnchorEl] = useState(null);

  const [columns, setColumns] = useState([]);

  const [addProductDialog, setAddProductDialog] = useState(false);
  const [isAddingProducts, setAddingProducts] = useState(false);

  const [showProductDialog, setShowProductDialog] = useState(false);
  const [selectedProductData, setSelectedProductData] = useState(null);
  const [isBulkEdit, setIsBulkEdit] = useState(false);

  const [frameWorkComponent, setFrameWorkComponent] = useState(null);
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;
  const [loadingButton, setLoadingButton] = useState(false);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteBulkAssetCreationProduct, setDeleteBulkAssetCreationProduct] = useState([]);

  const { getColumnData } = useColumns();

  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    fetchBulkAssetCreationProduct();
  }, [columns]);

  const fetchFields = async () => {
    const productFieldResponce = await axiosInstance().put(`/field/find-field-labels`, {
      fields: [
        {
          resource: 'Product',
          fieldNames: ['productName', 'productNumber', 'productDescription']
        }
      ]
    });
    var productField = productFieldResponce?.data?.data?.find((e) => e.resource === 'Product')?.fieldNames || [];
    const coloum = [];
    productField?.forEach((ele) => {
      if (ele?.fieldName === 'productName') {
        coloum.push({ field: 'productName', headerName: ele?.fieldLabel, show: true, disabled: true, cellRenderer: 'nameRenderer' });
      } else {
        coloum.push({ field: ele?.fieldName, headerName: ele?.fieldLabel, show: true, cellRenderer: 'commonRenderer' });
      }
    });
    const response = await axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE.bulkAssetCreationProduct}`);
    var fields = response?.data?.data;
    fields = CURReplaceByCurrencySingle(fields, bulkAssetCreationData?.currency ? bulkAssetCreationData?.currency : 'USD');
    let rendererNames = [];
    generateColoum(fields, coloum, rendererNames, false, renderedFrom, getColumnData);
    let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
    tempFrameworkComponent = {
      nameRenderer: NameRenderer,
      commonRenderer: CommonRenderer,
      actionsRenderer: ActionsRenderer,
      ...tempFrameworkComponent
    };
    setFrameWorkComponent({ ...tempFrameworkComponent });
    setColumns([...coloum]);
  };

  const fetchBulkAssetCreationProduct = () => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    setNextStep(false);
    axiosInstance()
      .get(`${bulkAssetCreation.api}/product/${bulkAssetCreationData._id}`)
      .then(({ data: { data } }) => {
        setBulkAssetCreationProduct(JSON.parse(JSON.stringify(data)));
        let rows = data?.map((item, index) => {
          let finalObject = prepareDataForGrid(item);
          finalObject['isChecked'] = selectedRecords.some((s) => s._id === item._id);
          finalObject['allowedToEdit'] = allowedToEdit;
          finalObject['hideSelection'] = !Boolean(item.createdQty === 0 || item.createdQty === undefined);
          let res: any = {
            ...finalObject
          };
          res.productName = item.productDetail?.productName;
          res.productNumber = item.productDetail?.productNumber;
          res.productDescription = item.productDetail?.productDescription;
          res.productDetail = item.productDetail;
          res.actualReceived = item.createdQty || 0;
          if (item?.qty === 0) {
            res.isValid = false;
          } else {
            res.isValid = true;
          }
          return res;
        });
        if (rows.filter((_rows) => _rows.isValid === false).length > 0) {
          setNextStep(false);
        } else {
          setNextStep(true);
        }
        dispatch({ type: 'initialize', data: rows, count: rows.length });
        dispatch({ type: 'loading', loading: false });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };

  const columnState = JSON.parse(localStorage.getItem(renderedFrom));
  if (columnState) {
    columns.forEach((item) => {
      columnState.forEach((d) => {
        if (d.colId === item.field) {
          item.show = !d.hide;
        }
      });
    });
  }

  const NameRenderer = (params) => (
    <span className="d-flex gap-2 align-items-center">
      {(params.data?.actualReceived === undefined || params.data?.actualReceived === 0) && allowedToEdit ? (
        <span
          className="link"
          onClick={() => {
            setShowProductDialog(true);
            setSelectedProductData(params.data);
          }}
        >
          <CustomRenderCell value={params.value} />
        </span>
      ) : (
        <CustomRenderCell value={params.value} />
      )}
      {params.data.productId && allowedToEdit && (
        <HtmlTooltip title="Details">
          <IconButton
            size="small"
            aria-label="Details"
            onClick={() => {
              window.open(`${routes.productDetail.path}/${params.data.productId}`);
            }}
          >
            <OpenInNewIcon fontSize="small" color="primary" />
          </IconButton>
        </HtmlTooltip>
      )}
    </span>
  );

  const ActionsRenderer = (params) => (
    <>
      {(params.data?.actualReceived === undefined || params.data?.actualReceived === 0) && allowedToEdit && (
        <HtmlTooltip title="Edit">
          <IconButton
            size="small"
            aria-label="Clone"
            onClick={() => {
              setShowProductDialog(true);
              setSelectedProductData(params.data);
            }}
          >
            <EditIcon color="primary" />
          </IconButton>
        </HtmlTooltip>
      )}
      {(params.data?.actualReceived === undefined || params.data?.actualReceived === 0) && allowedToEdit && (
        <GridDeleteIcon
          hasDeletePermission={permissions?.bulkAssetCreation?.isUpdate}
          ownerId={user?.user?._id}
          userId={user?.user?._id}
          onDelete={() => {
            setShowDeleteConfirmBox(true);
            setDeleteBulkAssetCreationProduct([params.data._id]);
          }}
          entity="rentalManagement"
        />
      )}
    </>
  );

  const handleAddProduct = (rows) => {
    setAddingProducts(true);
    let tempProductArray = rows.map((d) => ({
      productId: d._id ?? d.productId,
      qty: d.qty ? parseInt(d.qty) : 1
    }));
    axiosInstance()
      .post(`${bulkAssetCreation.api}/product/${bulkAssetCreationData._id}/add`, { products: tempProductArray })
      .then(() => {
        setAddProductDialog(false);
        fetchBulkAssetCreationProduct();
        setAddingProducts(false);
      })
      .catch((error) => {
        setAddProductDialog(false);
        toastConfig.setToastConfig(error);
        setAddingProducts(false);
      });
  };

  const handleUpdateQty = (rows) => {
    axiosInstance()
      .put(`${bulkAssetCreation.api}/product/${bulkAssetCreationData._id}/update`, { products: rows })
      .then(() => {
        setAddProductDialog(false);
        fetchBulkAssetCreationProduct();
        setSelectedProductData(null);
        setAddingProducts(false);
        setShowProductDialog(false);
        setIsBulkEdit(false);
      })
      .catch((error) => {
        setAddProductDialog(false);
        toastConfig.setToastConfig(error);
        setAddingProducts(false);
      });
  };

  const handleDelete = () => {
    setLoadingButton(true);
    axiosInstance()
      .post(`${bulkAssetCreation.api}/product/${bulkAssetCreationData._id}/delete`, { ids: deleteBulkAssetCreationProduct })
      .then(() => {
        fetchBulkAssetCreationProduct();
        setShowDeleteConfirmBox(false);
        setDeleteBulkAssetCreationProduct([]);
        setLoadingButton(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const createAsset = () => {
    setLoadingButton(true);
    let tempProducts = selectedRecords.map((d) => {
      return {
        bulkAssetCreationId: bulkAssetCreationData?._id,
        productMaster: d?.productId,
        qty: d?.qty,
        wareHouse: bulkAssetCreationData?.warehouse?.optionValue
      };
    });
    axiosInstance()
      .post(`${bulkAssetCreation.api}/create-assets`, { bulkAssetCreation: tempProducts })
      .then(({ data }) => {
        fetchBulkAssetCreationProduct();
        fetchData();
        setLoadingButton(false);
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

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  return (
    <Fragment>
      {allowedToEdit && permissions?.bulkAssetCreation?.isUpdate && (
        <Box display="flex" justifyContent="space-between" m={1}>
          <Box display="flex" alignItems="center">
            <Button
              variant={'contained'}
              color="primary"
              size="small"
              onClick={() => {
                setAddProductDialog(true);
              }}
            >
              {`Add Products`}
            </Button>
          </Box>
          <div className="d-flex gap-2">
            <Box display={'flex'} justifyContent="flex-end">
              <Button
                variant={isMobile && !isTablet ? 'text' : 'outlined'}
                color="default"
                size="small"
                onClick={openActions}
                className={`${isMobile && !isTablet ? 'mobile_button' : styles.action_submit_btn} new-dropdown-v1`}
                aria-controls="action-menu"
                endIcon={<ExpandMore />}
              >
                {isMobile && !isTablet ? '' : 'Actions'}
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
                  color="primary"
                  disabled={selectedRecords.length === 0}
                  onClick={() => {
                    setIsBulkEdit(true);
                    setShowProductDialog(true);
                    closeActions();
                  }}
                >
                  Bulk Edit
                </MenuItem>
                <MenuItem
                  color="primary"
                  disabled={selectedRecords.length === 0 || loadingButton}
                  onClick={() => {
                    setShowDeleteConfirmBox(true);
                    setDeleteBulkAssetCreationProduct(selectedRecords.map((d) => d._id));
                    closeActions();
                  }}
                >
                  Delete
                </MenuItem>
                <MenuItem
                  color="primary"
                  disabled={selectedRecords.length === 0 || loadingButton}
                  onClick={() => {
                    createAsset();
                    closeActions();
                  }}
                >
                  {`Create ${routes.serializedAsset.title}`}
                </MenuItem>
              </Menu>
            </Box>
          </div>
        </Box>
      )}
      {columns && frameWorkComponent ? (
        isMobile && !isTablet ? (
          <CustomSwipableList
            allowSelection={allowedToEdit}
            allowSwipe={true}
            permissions={permissions}
            primaryField={columns?.find((d) => d.field === 'productName')}
            onClick={(data) => {
              if ((data?.actualReceived === undefined || data?.actualReceived === 0) && allowedToEdit) {
                setShowProductDialog(true);
                setSelectedProductData(data);
              }
            }}
            dataRows={dataRows}
            selectedRecords={selectedRecords}
            dispatch={dispatch}
            onEdit={(data) => {
              if ((data?.actualReceived === undefined || data?.actualReceived === 0) && allowedToEdit) {
                setShowProductDialog(true);
                setSelectedProductData(data);
              }
            }}
            extraParamsToCheckDelete={true}
            onDelete={(data) => {
              if (allowedToEdit) {
                setShowDeleteConfirmBox(true);
                setDeleteBulkAssetCreationProduct([data._id]);
              }
            }}
            rowCount={rowCount}
            page={page}
            loading={loading}
            chips={[
              {
                label: `Quantity: `,
                field: 'qty',
                forceShow: true
              }
            ]}
            onCreate={null}
            showClone={false}
            fullHeight={true}
            renderedFrom={renderedFrom}
            onClone={() => {}}
          />
        ) : (
          <CustomAgGridEditable
            columns={columns}
            dataRows={dataRows}
            frameworkComponents={frameWorkComponent}
            setGridApi={setGridApi}
            dispatch={dispatch}
            rowCount={rowCount}
            limit={limit}
            pageSizes={pageSizes}
            page={page}
            allowAction={allowedToEdit}
            actionWidth={150}
            allowSelection={allowedToEdit}
            isClientSideGrid={true}
            loading={loading}
            onCellValueChanged={(row) => {
              //handleUpdateOrderProduct(row.data)
            }}
            renderedFrom={renderedFrom}
            refreshGrid={fetchBulkAssetCreationProduct}
            currency={bulkAssetCreationData?.currency?.toLowerCase()}
            fromPurchaseOrderGrid={true}
            rowClassRules={{
              'red-data-row': function (params) {
                return !params?.data?.isValid;
              }
            }}
          />
        )
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {addProductDialog && (
        <AddExistingProductInventory
          isAddingProducts={isAddingProducts}
          addProductInventory={handleAddProduct}
          handleProductInventoryClose={() => {
            setAddProductDialog(false);
          }}
          type={'product'}
          referenceType="bulkAssetCreation"
          renderedFrom={renderedFrom}
          ignoreIds={[]}
        />
      )}
      {showProductDialog && (
        <BulkAssetCreationQtyDialog
          onClose={() => {
            setShowProductDialog(false);
            setIsBulkEdit(false);
            setSelectedProductData(null);
          }}
          onSubmit={handleUpdateQty}
          currency={bulkAssetCreationData?.currency}
          productData={!isBulkEdit ? selectedProductData : selectedRecords}
          bulkEdit={isBulkEdit}
          bulkAssetCreationData={bulkAssetCreationData}
        />
      )}
      {showDeleteConfirmBox && (
        <ConfirmationDialog
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete  ? `}
          onClose={() => setShowDeleteConfirmBox(false)}
          onOk={handleDelete}
        />
      )}
    </Fragment>
  );
};

export default Product;
