import { useState, useEffect, useContext, Fragment } from 'react';
import { Box, Button, IconButton, MenuItem, Menu } from '@material-ui/core';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { useData } from 'src/StateProvider/Provider';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { bulkAssetCreation, CHILD_RESOURCE } from 'src/constants/helpers';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { prepareDataForGrid } from 'src/constants/helpers';
import { ExpandMore } from '@material-ui/icons';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import BulkAssetCreationQtyDialog from './BulkAssetCreationQtyDialog';
import { CURReplaceByCurrencySingle } from 'src/constants/formulaUtility';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import { deleteDisable } from 'src/constants/messageHelpers';
import NoDataCell from 'src/components/Helpers/NoDataCell';

const Product = ({ bulkAssetCreationData, setNextStep, setBulkAssetCreationProduct, renderedFrom, fetchData, handleUpdateData, allowedToEdit }) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();

  const { state, dispatch } = useTableReducer();
  const { selectedRecords } = state;

  const [anchorEl, setAnchorEl] = useState(null);
  const [columns, setColumns] = useState(null);
  const [addProductDialog, setAddProductDialog] = useState(false);
  const [isAddingProducts, setAddingProducts] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [selectedProductData, setSelectedProductData] = useState(null);
  const [isBulkEdit, setIsBulkEdit] = useState(false);
  const [loadingButton, setLoadingButton] = useState(false);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteBulkAssetCreationProduct, setDeleteBulkAssetCreationProduct] = useState([]);

  const { generateColumns } = useColumns();

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
    let coloum = [];
    productField?.forEach((ele) => {
      if (ele?.fieldName === 'productName') {
        coloum.push({
          accessor: 'productName',
          Header: ele?.fieldLabel,
          disabled: true,
          Cell: ({ row }) => (
            <div className="d-flex gap-2 align-items-center">
              {(row?.original?.actualReceived === undefined || row?.original?.actualReceived === 0) && allowedToEdit ? (
                <h5
                  className="link text-truncate"
                  onClick={() => {
                    setShowProductDialog(true);
                    setSelectedProductData(row?.original);
                  }}
                >
                  {row?.original?.productName}
                </h5>
              ) : (
                <h5 className="text-truncate">{row?.original?.productName}</h5>
              )}
              {row?.original?.productId && allowedToEdit && (
                <HtmlTooltip title="Details">
                  <IconButton
                    size="small"
                    aria-label="Details"
                    onClick={() => {
                      window.open(`${routes.productDetail.path}/${row?.original?.productId}`);
                    }}
                  >
                    <OpenInNewIcon fontSize="small" color="primary" />
                  </IconButton>
                </HtmlTooltip>
              )}
            </div>
          )
        });
      } else {
        coloum.push({
          accessor: ele?.fieldName,
          Header: ele?.fieldLabel,
          Cell: ({ row }) => (row?.original[ele?.fieldName] ? <h5 className="text-truncate">{row?.original[ele?.fieldName]}</h5> : <NoDataCell />)
        });
      }
    });
    const response = await axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE.bulkAssetCreationProduct}`);
    var fields = response?.data?.data;
    fields = CURReplaceByCurrencySingle(fields, bulkAssetCreationData?.currency ? bulkAssetCreationData?.currency : 'USD');
    const newColumns = generateColumns(renderedFrom, fields, routes.bulkAssetCreationDetail.path);
    setColumns([...coloum, ...newColumns, ActionsRenderer]);
  };

  const fetchBulkAssetCreationProduct = () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
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

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 100,
    width: 100,
    sticky: 'right',
    Cell: ({ row }) => (
      <>
        <HtmlTooltip title={(row?.original?.actualReceived === undefined || row?.original?.actualReceived === 0) && allowedToEdit ? 'Edit' : ''}>
          <span>
            <IconButton
              size="small"
              aria-label="Clone"
              disabled={!((row?.original?.actualReceived === undefined || row?.original?.actualReceived === 0) && allowedToEdit)}
              onClick={() => {
                setShowProductDialog(true);
                setSelectedProductData(row?.original);
              }}
            >
              <EditIcon
                fontSize="small"
                color={(row?.original?.actualReceived === undefined || row?.original?.actualReceived === 0) && allowedToEdit ? 'primary' : 'disabled'}
              />
            </IconButton>
          </span>
        </HtmlTooltip>

        <HtmlTooltip
          title={
            (row?.original?.actualReceived === undefined || row?.original?.actualReceived === 0) && allowedToEdit
              ? permissions?.bulkAssetCreation?.isUpdate
                ? 'Delete'
                : deleteDisable
              : ''
          }
        >
          <span>
            <IconButton
              size="small"
              aria-label="Delete"
              disabled={
                !(
                  (row?.original?.actualReceived === undefined || row?.original?.actualReceived === 0) &&
                  allowedToEdit &&
                  permissions?.bulkAssetCreation?.isUpdate
                )
              }
              onClick={() => {
                setShowDeleteConfirmBox(true);
                setDeleteBulkAssetCreationProduct([row?.original?._id]);
              }}
            >
              <DeleteIcon
                fontSize="small"
                color={
                  (row?.original?.actualReceived === undefined || row?.original?.actualReceived === 0) &&
                    allowedToEdit &&
                    permissions?.bulkAssetCreation?.isUpdate
                    ? 'error'
                    : 'disabled'
                }
              />
            </IconButton>
          </span>
        </HtmlTooltip>
      </>
    )
  };

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
        <Box m={1} className="flex flex-wrap gap-2 justify-between">
          <Box>
            <Button
              variant={'contained'}
              color="primary"
              size="small"
              onClick={() => {
                setAddProductDialog(true);
              }}
            >
              {`Add Existing Products`}
            </Button>
          </Box>
          <Box display={'flex'} justifyContent="flex-end">
            <Button
              variant={'outlined'}
              color="default"
              disabled={selectedRecords?.length ? false : true}
              size="small"
              onClick={openActions}
              className={`new-dropdown-v1`}
              aria-controls="action-menu"
              endIcon={<ExpandMore />}
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
        </Box>
      )}
      {columns ? (
        <CustomReactTable
          height={'calc(100vh - 393px)'}
          columns={columns}
          state={state}
          dispatch={dispatch}
          renderedFrom={renderedFrom}
          refreshGrid={fetchBulkAssetCreationProduct}
          hideAction={!allowedToEdit}
          hideSelection={!allowedToEdit}
          isClientSideGrid={true}
        />
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {addProductDialog && (
        <AssignProductDialog
          handleCloseDialog={() => setAddProductDialog(false)}
          onSuccess={(products) => {
            handleAddProduct(products);
          }}
          serialized={true}
          isSubmitting={isAddingProducts}
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
