import { Box, IconButton, MenuItem } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import { Fragment, useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { CHILD_RESOURCE, bulkAssetCreation, prepareDataForGrid } from 'src/constants/helpers';
import { deleteDisable } from 'src/constants/messageHelpers';
import BulkAssetCreationQtyDialog from './BulkAssetCreationQtyDialog';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import { FiExternalLink } from 'react-icons/fi';

const Product = ({ bulkAssetCreationData, setNextStep, renderedFrom, fetchData, handleUpdateData, allowedToEdit }) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { selectedRecords } = state;

  const [columns, setColumns] = useState(null);
  const [addProductDialog, setAddProductDialog] = useState(false);
  const [isAddingProducts, setAddingProducts] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [selectedProductData, setSelectedProductData] = useState(null);
  const [isBulkEdit, setIsBulkEdit] = useState(false);
  const [loadingButton, setLoadingButton] = useState(false);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [showCreateConfirmBox, setShowCreateConfirmBox] = useState(false);

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
            <div className="flex items-center gap-2">
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
                <IconButton
                  size="small"
                  aria-label="Details"
                  onClick={() => {
                    window.open(`${routes.productDetail.path}/${row?.original?.productId}`);
                  }}
                >
                  <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                </IconButton>
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
    var fields = await fetch_child_resource_fields(CHILD_RESOURCE.bulkAssetCreationProduct, bulkAssetCreationData?.currency, allowedToEdit);
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
        fetchData();
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
        productId: d?.productId,
        _id: d?._id,
        qty: d?.qty,
        warehouse: bulkAssetCreationData?.warehouse?.optionValue
      };
    });
    axiosInstance()
      .post(`${bulkAssetCreation.api}/create-assets`, { bulkAssetCreation: tempProducts })
      .then(({ data }) => {
        setShowCreateConfirmBox(false);
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
        setLoadingButton(true);
        toastConfig.setToastConfig(error);
      });
  };

  const addButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          onClick={() => {
            setAddProductDialog(true);
          }}
        >
          Add Existing Products
        </MenuItem>
      </>
    );
  };

  const actionButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          color="primary"
          disabled={selectedRecords.length === 0}
          onClick={() => {
            setIsBulkEdit(true);
            setShowProductDialog(true);
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
          }}
        >
          Delete
        </MenuItem>
        <MenuItem
          color="primary"
          disabled={selectedRecords.length === 0 || loadingButton}
          onClick={() => {
            setShowCreateConfirmBox(true);
          }}
        >
          {`Create ${routes.serializedAsset.title}`}
        </MenuItem>
      </>
    );
  };

  return (
    <Fragment>
      {allowedToEdit && permissions?.bulkAssetCreation?.isUpdate && (
        <>
          <DetailsPageHeader
            isAddButtonVisible={true}
            addButtonMenuItems={addButtonMenuItems()}
            isActionButtonVisible={true}
            actionButtonMenuItems={actionButtonMenuItems()}
            actionButtonProps={{ disabled: selectedRecords?.length ? false : true }}
            hasXpadding
          />
        </>
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
          message={`Are you sure you want to delete?`}
          onClose={() => setShowDeleteConfirmBox(false)}
          onOk={handleDelete}
        />
      )}
      {showCreateConfirmBox && (
        <ConfirmationDialog
          open={showCreateConfirmBox}
          message={`Are you sure you want to create assets?`}
          onClose={() => setShowCreateConfirmBox(false)}
          okBtnLoading={loadingButton}
          onOk={createAsset}
        />
      )}
    </Fragment>
  );
};

export default Product;
