import React from 'react';
import { useState, useEffect, useContext, Fragment } from 'react';
import { Grid, Box, Button, IconButton, Menu, MenuItem } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import { useData } from '../../../StateProvider/Provider';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import AddExistingProductInventory from './AddExistingProductInventory';
import CustomReactTable from '../../../components/CustomReactTable/CustomReactTable';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import DeleteIcon from '@material-ui/icons/Delete';
import { repairOrder } from '../../../constants/helpers';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import { isMobile, isTablet } from 'react-device-detect';
import RepairOrderQtyDialog from './RepairOrderQtyDialog';
import ManageSerializedAsset from 'src/pages/SerializedAsset/ManageSerializedAsset';
import AssignSerializedAssetDialog from 'src/components/AssignRolesDialog/AssignSerializedAssetDialog';
import { ExpandMore } from '@material-ui/icons';
import { capitalize, sortBy } from 'lodash';
import { getNestedSubRows } from 'src/components/RentalManagment/helper';

const alphabet = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

const Productpackage = ({
  fetchRepairOrderData,
  repairOrderData,
  setNextStep,
  renderedFrom,
  stepFullScreen,
  allowedToEdit,
  allowedToDelete,
  setHasAssetsAdded
}) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();

  const [isUpdating, setUpdating] = useState(false);

  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isProductEdit, setIsProductEdit] = useState({ open: false, isBulkedit: false });
  const [isAddingProducts, setAddingProducts] = useState(false);

  const [recordToUpdate, setRecordToUpdate] = useState(null);

  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);

  const [material, setMaterial] = useState([]);
  const [addExistingProductDialog, setAddExistingProductDialog] = useState({ open: false, type: '', parentId: null, existing: false });

  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState(null);

  const [anchorActionEl, setAnchorActionEl] = useState(null);

  useEffect(() => {
    fetchFields();
  }, [repairOrderData]);

  useEffect(() => {
    fetchData();
  }, [columns]);

  const fetchFields = async () => {
    setColumns(null);
    const coloum: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>,
        Footer: () => {
          return <>Total</>;
        }
      },
      {
        accessor: 'type',
        Header: 'Type',
        width: 70,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.type === 'serializedAsset' ? 'Asset' : capitalize(row.original.type)}</p>
      },
      {
        accessor: 'detail',
        Header: 'Details',
        width: 250,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <a
              className="link text-truncate"
              target="_blank"
              href={`${
                row.original.type === 'service'
                  ? routes.serviceMasterDetail.path
                  : row.original.type === 'product'
                  ? routes.productDetail.path
                  : row.original.type === 'serializedAsset'
                  ? routes.serializedAssetDetail.path
                  : routes.packagesDetail.path
              }/${row.original.materialId}`}
            >
              {row.original.detail}
            </a>
            <Box ml={1} className="d-flex align-items-center">
              <span title={`There are ${row.original?.subRows?.length} product(s) in this ${row.original?.type}`}>
                {row.original?.subRows?.length ? `(${row.original?.subRows?.length})` : null}
              </span>
            </Box>
          </div>
        )
      },
      {
        accessor: 'productName',
        Header: 'Product',
        width: 200,
        Cell: ({ row }) => (
          <div className="d-flex gap-2 align-items-center">
            <p className="text-truncate" title={row.original?.productName}>
              {row.original?.productName ? (
                row.original?.productId ? (
                  <a className="link text-truncate" href={`${routes.productDetail.path}/${row.original?.productId}`} target="_blank">
                    {row.original?.productName}
                  </a>
                ) : (
                  row.original?.productName
                )
              ) : (
                <NoDataCell />
              )}
            </p>
          </div>
        )
      },
      {
        accessor: 'description',
        Header: 'Description',
        width: 200,
        Cell: ({ row }) => {
          return row.original['description'] ? <p className="text-truncate">{row.original.description}</p> : <NoDataCell />;
        }
      },
      {
        accessor: 'status',
        Header: 'Status',
        width: 100,
        Cell: ({ row }) => (row.original['status'] ? <p> {row.original.status}</p> : <NoDataCell />)
      }
    ];
    coloum.push({
      accessor: 'action',
      Header: '',
      minWidth: 70,
      width: 70,
      sticky: 'right',
      disableFilters: true,
      canDrag: false,
      Cell: ({ row }) => (
        <>
          <HtmlTooltip title={allowedToDelete && row.original?.allowedToDelete ? 'Asset is already assigned' : 'Delete'}>
            <IconButton
              size="small"
              aria-label="Details"
              onClick={() => {
                const obj: any = [row.original._id];
                setDeleteData(obj);
              }}
              disabled={allowedToDelete && row.original?.allowedToDelete}
            >
              <DeleteIcon fontSize="small" color={allowedToDelete && row.original?.allowedToDelete ? 'disabled' : 'error'} />
            </IconButton>
          </HtmlTooltip>
        </>
      )
    });
    coloum.forEach((element) => {
      if (element.accessor === 'qty') {
        element['Footer'] = (info) => {
          const qtyTotal = info.rows
            .filter((f) => f.original.parentId === null && f.values.hasOwnProperty(element.accessor) && !isNaN(f.values[element.accessor]))
            .reduce((sum, row) => row.values[element.accessor] + sum, 0);
          return <>{qtyTotal}</>;
        };
      }
    });
    setColumns(coloum);
  };

  const fetchData = async () => {
    setNextStep(false);

    var data: any = [];
    const response = await axiosInstance().get(`${repairOrder.api}/${repairOrderData._id}/product-package`);
    data = response?.data?.data;

    setMaterial(JSON.parse(JSON.stringify(data.material)));

    const rows = data.material.filter((e) => e.parentId === null);

    rows.forEach((parent, i) => {
      parent.index = i + 1;
      parent.detail = `${
        parent.type === 'service'
          ? parent.serviceDetail?.serviceName
          : parent.type === 'product'
          ? parent.productDetail?.productName
          : parent.type === 'serializedAsset'
          ? parent.serializedAssetDetail.assetNumber
          : parent.packageDetail?.packageName
      }`;
      parent.description =
        parent.type === 'service'
          ? parent?.serviceDetail?.serviceDescription || ''
          : parent.type === 'product'
          ? parent?.productDetail?.productDescription || ''
          : parent.type === 'package'
          ? parent?.packageDetail?.packageDescription || ''
          : parent.type === 'serializedAsset'
          ? parent?.serializedAssetDetail?.product?.productDescription || ''
          : '';
      parent.productName = parent?.serializedAssetDetail?.product?.optionLabel || '';
      parent.productId = parent?.serializedAssetDetail?.product?.optionValue || '';
      parent.qtyDisplay = parent.qty;
      parent.isValid = true;
      parent.allowedToDelete = parent.workOrder ? true : false;
      parent.subRows = generateNestedData(data.material, parent);
      parent.status = `${
        parent.type === 'service'
          ? parent.serviceDetail?.status
          : parent.type === 'product'
          ? parent?.productDetail?.status
          : parent.type === 'serializedAsset'
          ? parent?.serializedAssetDetail?.status
          : parent.packageDetail?.status
      }`;
    });

    if (rows.length !== 0) {
      setHasAssetsAdded(true);
      if (rows.filter((_rows) => _rows.isValid === false).length > 0) {
        setNextStep(false);
      } else {
        setNextStep(true);
      }
    } else {
      setHasAssetsAdded(false);
      setNextStep(false);
    }
    setRowsData(rows);
    setSelectedProducts([]);
  };

  const generateNestedData = (material, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    let productIndex = 0;
    let serviceIndex = 0;
    subRows.forEach((_subRow, j) => {
      _subRow.index = parent.index + '.' + `${_subRow.type === 'service' ? alphabet[serviceIndex] : productIndex + 1}`;
      _subRow.detail = `${
        _subRow.type === 'service'
          ? _subRow.serviceDetail?.serviceName
          : _subRow.type === 'product'
          ? _subRow.productDetail?.productName
          : _subRow.type === 'serializedAsset'
          ? _subRow.serializedAssetDetail.assetNumber
          : _subRow.packageDetail?.packageName
      }`;
      _subRow.description =
        _subRow.type === 'service'
          ? _subRow?.serviceDetail?.serviceDescription || ''
          : _subRow.type === 'product'
          ? _subRow?.productDetail?.productDescription || ''
          : _subRow.type === 'package'
          ? _subRow?.packageDetail?.packageDescription || ''
          : '';
      _subRow.productName = _subRow?.serializedAssetDetail?.product?.optionLabel || '';
      _subRow.productId = _subRow?.serializedAssetDetail?.product?.optionValue || '';
      _subRow.qtyDisplay = `${parent.qtyDisplay * _subRow.qty}`;
      _subRow.isValid = true;
      _subRow.hideSelection = true;
      _subRow.subRows = generateNestedData(material, _subRow);
      _subRow.type === 'service' ? serviceIndex++ : productIndex++;
      parent.status = `${
        parent.type === 'service'
          ? parent.serviceDetail?.status
          : parent.type === 'product'
          ? parent.productDetail?.status
          : parent.type === 'serializedAsset'
          ? parent.serializedAssetDetail.status
          : parent.packageDetail?.status
      }`;
    });
    if (subRows.length === 0 && parent.type === 'package') {
      parent.isValid = false;
    }
    if (parent.type === 'package') {
      parent.hideSelection = subRows.filter((e) => e.hideSelection).length ? true : false;
    }
    return sortBy(subRows, ['type']);
  };

  const handleAdd = async (rows) => {
    setAddingProducts(true);
    const material: any = [];
    rows.forEach((d) => {
      const element: any = {};
      element.materialId = d._id;
      element.type = addExistingProductDialog.type;
      element.unit = d.unitMain && d.unitMain.length ? d.unitMain[0] : '';
      element.qty = d.qty ? parseFloat(d.qty) : 1;
      element.parentId = addExistingProductDialog.parentId;
      material.push(element);
    });
    axiosInstance()
      .post(`${repairOrder.api}/${repairOrderData._id}/product-package`, { material })
      .then(() => {
        setAddExistingProductDialog({ open: false, type: '', parentId: null, existing: false });
        fetchData();
        fetchRepairOrderData();
        setAddingProducts(false);
      })
      .catch((error) => {
        setAddExistingProductDialog({ open: false, type: '', parentId: null, existing: false });
        toastConfig.setToastConfig(error);
        setAddingProducts(false);
      });
  };

  const handleSaveData = async (rows: any) => {
    rows.forEach((element) => {
      delete element.index;
      delete element.detail;
      delete element.serializedProduct;
      delete element.qtyDisplay;
      delete element.isValid;
      delete element.hideSelection;
      delete element.assetQty;
      delete element.productDetail;
      delete element.packageDetail;
      delete element.subRows;
    });
    setUpdating(true);
    axiosInstance()
      .put(`${repairOrder.api}/${repairOrderData._id}/product-package`, { material: rows })
      .then(() => {
        setUpdating(false);
        setIsProductEdit({ open: false, isBulkedit: false });
        fetchData();
        fetchRepairOrderData();
      })
      .catch((error) => {
        setUpdating(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleDelete = (rows) => {
    setDeleting(true);
    axiosInstance()
      .put(`${repairOrder.api}/${repairOrderData?._id}/product-package/delete`, { ids: rows })
      .then(() => {
        setDeleting(false);
        fetchData();
        fetchRepairOrderData();
        setDeleteData(null);
      })
      .catch((error) => {
        setDeleting(false);
        toastConfig.setToastConfig(error);
        setDeleteData(null);
      });
  };

  const handleDeleteMultiple = () => {
    const obj: any = [];
    const dataToDelete = selectedProducts && selectedProducts.filter((e) => !e.hideSelection);
    dataToDelete?.forEach((ele) => {
      obj.push(ele._id);
    });
    dataToDelete?.forEach((ele) => {
      getNestedSubRows(obj, ele);
    });
    setDeleteData(obj);
  };

  const openActions = (event) => {
    setAnchorActionEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorActionEl(null);
  };

  return (
    <Fragment>
      {allowedToEdit && (
        <Box display="flex" justifyContent="space-between" flexWrap={'wrap'} gridGap={1} m={1}>
          <Box display="flex" flexWrap={'wrap'}>
            {permissions?.serializedAsset?.isRead && allowedToEdit && (
              <>
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    setAddExistingProductDialog({ open: true, type: 'serializedAsset', parentId: null, existing: false });
                  }}
                >
                  {`Create ${routes.serializedAsset.title}`}
                </Button>
                <Box ml={1} />
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  disabled={rowsData ? false : true}
                  onClick={() => {
                    setAddExistingProductDialog({ open: true, type: 'serializedAsset', parentId: null, existing: true });
                  }}
                >
                  {`Add Existing ${routes.serializedAsset.title}`}
                </Button>
              </>
            )}
          </Box>
          <Box display="flex">
            <Button
              variant="outlined"
              color="default"
              size="small"
              onClick={openActions}
              aria-controls="action-menu"
              disabled={selectedProducts.length === 0}
              endIcon={<ExpandMore />}
            >
              Actions
            </Button>
            <Menu
              anchorEl={anchorActionEl}
              keepMounted
              getContentAnchorEl={null}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left'
              }}
              id="action-menu"
              open={Boolean(anchorActionEl)}
              onClose={closeActions}
            >
              <MenuItem
                disabled={allowedToDelete && selectedProducts?.filter((e) => e.allowedToDelete)?.length === selectedProducts?.length ? true : false}
                onClick={() => {
                  closeActions();
                  handleDeleteMultiple();
                }}
              >
                Delete
              </MenuItem>
            </Menu>
          </Box>
        </Box>
      )}
      {columns && rowsData ? (
        <Box zIndex={5} width={'100%'}>
          <CustomReactTable
            height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 395px)'}
            columns={columns}
            data={rowsData}
            setWholeRowsCellColor={(rowData) => (!rowData.isValid ? 'error' : '')}
            onSelect={setSelectedProducts}
            childrenProperty="subRows"
            uniqueKey="_id"
            hideSelection={!allowedToEdit}
            hideAction={!allowedToEdit}
            renderedFrom="repair_order_product_package"
            isClientSideGrid={true}
            hideExpander={true}
          />
        </Box>
      ) : (
        <Box p={2} height={500} bgcolor="white">
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {deleteData && (
        <ConfirmationDialog
          open={true}
          message={`Are you sure you want to delete the record(s)?`}
          onClose={() => setDeleteData(null)}
          onOk={() => handleDelete(deleteData)}
          okBtnLoading={isDeleting}
        />
      )}
      {isProductEdit.open && (
        <RepairOrderQtyDialog
          onClose={() => {
            setIsProductEdit({ open: false, isBulkedit: false });
            setRecordToUpdate(null);
          }}
          isBulkedit={isProductEdit.isBulkedit}
          handleSaveData={handleSaveData}
          repairOrderData={repairOrderData}
          rowData={recordToUpdate}
          material={material}
          selectedProducts={selectedProducts}
          loading={isUpdating}
        />
      )}
      {addExistingProductDialog.open && addExistingProductDialog.type !== 'serializedAsset' && (
        <AddExistingProductInventory
          renderedFrom={addExistingProductDialog?.type === 'product' ? `${renderedFrom}-product` : `${renderedFrom}-package`}
          isAddingProducts={isAddingProducts}
          addProductInventory={handleAdd}
          handleProductInventoryClose={() => {
            setAddExistingProductDialog({ open: false, type: '', parentId: null, existing: false });
          }}
          type={addExistingProductDialog.type}
          repairOrderData={repairOrderData}
        />
      )}
      {addExistingProductDialog.open && addExistingProductDialog.existing === false && addExistingProductDialog.type === 'serializedAsset' && (
        <ManageSerializedAsset
          onClose={() => setAddExistingProductDialog({ open: false, type: '', parentId: null, existing: false })}
          referenceType={'repairOrder'}
          referenceData={{
            customerAccount: repairOrderData?.customerAccount?.optionValue,
            warehouse: repairOrderData?.warehouse?.optionValue
          }}
          onSuccess={(data) => {
            setAddExistingProductDialog({ open: false, type: '', parentId: null, existing: false });
            handleAdd([data]);
          }}
        />
      )}
      {addExistingProductDialog.open && addExistingProductDialog.existing && addExistingProductDialog.type === 'serializedAsset' && (
        <AssignSerializedAssetDialog
          reference="repairOrder"
          handleClose={() => setAddExistingProductDialog({ open: false, type: '', parentId: null, existing: false })}
          ids={[...rowsData?.filter((e) => e.type === 'serializedAsset')?.map((e: any) => e?.serializedAssetDetail?._id)]}
          referenceData={{
            customerAccount: repairOrderData?.customerAccount?.optionValue,
            warehouse: repairOrderData?.warehouse?.optionValue
          }}
          isAssigning={false}
          handleSucess={handleAdd}
        />
      )}
    </Fragment>
  );
};

export default Productpackage;
