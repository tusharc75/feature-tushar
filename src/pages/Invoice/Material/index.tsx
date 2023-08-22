import { useState, useEffect, useContext, Fragment } from 'react';
import { Grid, Box, Button, IconButton, Menu, MenuItem, MenuList, Popover } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import { useData } from '../../../StateProvider/Provider';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import CustomReactTable from '../../../components/CustomReactTable/CustomReactTable';
import Add from '@material-ui/icons/Add';
import { pricingCondition, invoice } from '../../../constants/helpers';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import DeleteIcon from '@material-ui/icons/Delete';
import AddIcon from '@material-ui/icons/Add';
import { isMobile } from 'react-device-detect';
import { ExpandMore, KeyboardArrowDown } from '@material-ui/icons';
import { startCase } from 'lodash';
import { fetch_invoice_product_fields } from 'src/components/Invoice/helper';
import { flattenArray, generateCustomTableColumns } from 'src/constants/columns';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import AssignServiceDialog from 'src/components/AssignRolesDialog/AssignServiceDialog';
import AssignPackageDialog from 'src/components/AssignRolesDialog/AssignPackageDialog';
import AssignSerializedAssetDialog from 'src/components/AssignRolesDialog/AssignSerializedAssetDialog';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import MaterialDialog from './MaterialDialog';
import { calculateRowsField } from 'src/components/RentalManagment/helper';
import EditIcon from '@material-ui/icons/Edit';
import NoDataCell from 'src/components/Helpers/NoDataCell';

const Material = ({ invoiceData, setNextStep, renderedFrom, stepFullScreen, updateJobStatus, allowedToEdit }) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();
  const [isUpdating, setUpdating] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [materialEdit, setMaterialEdit] = useState({ open: false, data: null, bulkedit: false, showSaveAndNext: false });
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);
  const [material, setMaterial] = useState([]);
  const [addchildDialog, setAddchildDialog] = useState({ open: false, parentId: null, top: null, bottom: null, isSerializedProduct: false });
  const [columns, setColumns] = useState(null);
  const [addDialog, setAddDialog] = useState({ open: false, type: '', parentId: null });
  const [rowsData, setRowsData] = useState(null);
  const [allFields, setAllFields] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [anchorActionEl, setAnchorActionEl] = useState(null);
  const [assetAssignedProduct, setAssetAssignedProduct] = useState([]);

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    let data = await fetch_invoice_product_fields(invoiceData?.currency);
    if (!allowedToEdit) {
      data?.forEach((e) => {
        e.isColumnEditable = false;
      });
    }
    setAllFields(JSON.parse(JSON.stringify(data)));
    const newColumns = generateCustomTableColumns(data, invoiceData?.currency, renderedFrom);
    let qtyIndex = newColumns.findIndex((d) => d.accessor === 'qty');
    if (qtyIndex > -1) {
      newColumns[qtyIndex].accessor = 'qtyDisplay';
    }
    let coloum: any = [
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
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <p>{`${startCase(row.original?.type)} `}</p>
          </div>
        )
      },
      {
        accessor: 'detail',
        Header: 'Detail',
        minWidth: 300,
        width: 300,
        Cell: ({ row, rows }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {allowedToEdit && row.original.type !== 'serializedAsset' ? (
              <p
                onClick={() => {
                  openMaterial(row, rows);
                }}
                className="link text-truncate"
                title={row.original?.detail}
              >
                {row.original?.detail}
              </p>
            ) : (
              <p className="text-truncate">{row.original?.detail}</p>
            )}

            {row?.original?.type !== 'service' && row.original.type !== 'serializedAsset' && (
              <>
                <Box ml={1} className="d-flex align-items-center">
                  {row.original?.subRows?.length > 0 && (
                    <span title={`There are ${row.original?.subRows?.length} product(s) in this package`}>({row.original?.subRows?.length})</span>
                  )}
                  <Box pl={1}>
                    <HtmlTooltip title="Add ">
                      <IconButton
                        onClick={(event) => {
                          if (row.original.type === 'product' && row.original.productDetail.serializedProduct) {
                            setAddchildDialog({
                              open: true,
                              parentId: row.original?._id,
                              top: event.clientY,
                              bottom: event.clientX,
                              isSerializedProduct: true
                            });
                            setAssetAssignedProduct([row.original]);
                          } else {
                            setAddchildDialog({
                              open: true,
                              parentId: row.original?._id,
                              top: event.clientY,
                              bottom: event.clientX,
                              isSerializedProduct: false
                            });
                          }
                        }}
                        size="small"
                      >
                        <Add color="disabled" fontSize="small" />
                      </IconButton>
                    </HtmlTooltip>
                  </Box>
                </Box>
              </>
            )}
            <Box ml={1}>
              <IconButton
                size="small"
                onClick={() => {
                  if (row.original.type === 'service') {
                    window.open(`${routes.serviceMasterDetail.path}/${row.original.materialId}`);
                  } else if (row.original.type === 'product') {
                    window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                  } else if (row.original.type === 'serializedAsset') {
                    window.open(`${routes.serializedAssetDetail.path}/${row.original.materialId}`);
                  } else {
                    window.open(`${routes.packagesDetail.path}/${row.original.materialId}`);
                  }
                }}
              >
                <OpenInNewIcon fontSize="small" color="primary" />
              </IconButton>
            </Box>
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
    ];
    coloum = [...coloum, ...newColumns];
    coloum.push({
      accessor: 'action',
      Header: 'Actions',
      minWidth: 100,
      width: 100,
      sticky: 'right',
      disableFilters: true,
      canDrag: false,
      Cell: ({ row, rows }) =>
        <>
          <HtmlTooltip title={allowedToEdit ? 'Edit' : ''}>
            <IconButton
              size="small"
              aria-label="Delete"
              disabled={!allowedToEdit}
              onClick={() => {
                openMaterial(row, rows);
              }}
            >
              <EditIcon fontSize="small" color={allowedToEdit ? 'primary' : 'disabled'} />
            </IconButton>
          </HtmlTooltip>
          {
            allowedToEdit && (
              <IconButton
                size="small"
                aria-label="Details"
                onClick={() => {
                  const obj: any = [{ id: row.original._id, type: row.original?.type, materialId: row.original?.materialId }];
                  setDeleteData(obj);
                }}
              >
                <DeleteIcon fontSize="small" color="error" />
              </IconButton>
            )
          }
        </>
    });
    setColumns(coloum);
    fetchInvoiceData();
  };

  const fetchInvoiceData = async () => {
    setNextStep(false);
    var data: any = [];
    let assignedAssets = [];
    const response = await axiosInstance().get(`${invoice.api}/material/${invoiceData._id}`);
    data = response?.data?.data;
    let rows = data.material.filter((e) => !e.parentId);
    assignedAssets = data.material.filter((e) => e.type === 'serializedAsset' && e.parentId);
    setMaterial(JSON.parse(JSON.stringify(data.material)));
    rows.forEach((parent, i) => {
      parent.index = i + 1;
      parent.detail =
        parent.type === 'product'
          ? parent.productDetail?.productName
          : parent.type === 'package'
            ? parent.packageDetail?.packageName
            : parent.type === 'serializedAsset'
              ? parent.serializedAssetDetail?.assetNumber
              : parent.serviceDetail?.serviceName;
      parent.description =
        parent.type === 'product'
          ? parent?.productDetail?.productDescription
          : parent.type === 'package'
            ? parent?.packageDetail?.packageDescription
            : parent.type === 'serializedAsset'
              ? parent?.serializedAssetDetail?.product?.productDescription
              : parent?.serviceDetail?.serviceDescription;
      parent.qty = parent.qty;
      parent.qtyDisplay = parent.qty;
      parent.assetQty = assignedAssets.filter((i) => i.parentId === parent._id).length;
      parent.subRows = generateNestedData(data.material, parent);
    });
    if (rows.filter((_rows) => _rows.isValid === false).length > 0 || rows.length === 0) {
      setNextStep(true);
    } else {
      setNextStep(true);
    }
    setRowsData(rows);
    setSelectedProducts([]);
  };

  const generateNestedData = (material, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, index) => {
      _subRow.index = parent.index + '.' + `${index + 1}`;
      _subRow.detail =
        _subRow.type === 'product'
          ? _subRow.productDetail?.productName
          : _subRow.type === 'package'
            ? _subRow.packageDetail?.packageName
            : _subRow.type === 'serializedAsset'
              ? _subRow.serializedAssetDetail.assetNumber
              : _subRow.serviceDetail?.serviceName;
      _subRow.description =
        _subRow.type === 'product'
          ? _subRow?.productDetail?.productDescription
          : _subRow.type === 'package'
            ? _subRow?.packageDetail?.packageDescription
            : _subRow.type === 'serializedAsset'
              ? parent.description
              : _subRow?.serviceDetail?.serviceDescription;
      _subRow.qty = _subRow.qty;
      _subRow.qtyDisplay = parent.qtyDisplay * _subRow.qty;
      _subRow.subRows = generateNestedData(material, _subRow);
    });
    return subRows;
  };

  const openMaterial = (data, rows) => {
    setMaterialEdit({
      open: true,
      data: data.original,
      bulkedit: false,
      showSaveAndNext: data?.index < rows?.filter((e) => e?.depth === 0)?.length - 1 && data?.depth === 0 ? true : false
    });
  };

  const openActions = (event) => {
    setAnchorActionEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorActionEl(null);
  };

  const openAddMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeAddMenu = () => {
    setAnchorEl(null);
  };

  const handleAdd = async (rows) => {
    setIsAdding(true);
    const material: any = [];
    if (addDialog.type === 'serializedAsset' && addDialog.parentId) {
      rows?.forEach((e) => {
        material.push(e);
      });
    } else {
      rows.forEach((d) => {
        const element: any = {};
        element.materialId = d._id;
        element.type = addDialog.type;
        element.unit = d?.unitMain && d?.unitMain?.length ? d.unitMain[0] : d?.unit ? d?.unit : '';
        element.qty = d.qty ? parseFloat(d.qty) : 1;
        element.parentId = addDialog.parentId;
        material.push(element);
      });
    }
    setAssetAssignedProduct([]);
    axiosInstance()
      .post(`${routes?.invoice?.path}/material/${invoiceData._id}`, { material })
      .then(({ data }) => {
        setAddDialog({ open: false, type: '', parentId: null });
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchInvoiceData();
        setIsAdding(false);
      })
      .catch((error) => {
        setAddDialog({ open: false, type: '', parentId: null });
        setIsAdding(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleSaveData = async (rows: any, saveAndNext = false) => {
    setUpdating(true);
    rows.forEach((element) => {
      delete element.index;
      delete element.detail;
      delete element.qtyDisplay;
      delete element.isValid;
      delete element.hideSelection;
      delete element.productDetail;
      delete element.packageDetail;
      delete element.serviceDetail;
      delete element.subRows;
    });
    axiosInstance()
      .put(`${routes.invoice.path}/material/${invoiceData._id}`, { material: rows })
      .then(({ data }) => {
        setUpdating(false);
        fetchInvoiceData();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        if (saveAndNext) {
          const rowIndex = rowsData.findIndex((d) => d._id === rows[0]?._id);
          setMaterialEdit({
            open: true,
            data: rowsData[rowIndex + 1],
            bulkedit: false,
            showSaveAndNext: rowIndex + 1 < rowsData?.length - 1 ? true : false
          });
        } else {
          setMaterialEdit({ open: false, data: null, bulkedit: false, showSaveAndNext: false });
        }
      })
      .catch((error) => {
        setUpdating(false);
        toastConfig.setToastConfig(error);
      });
  };
  const handleDelete = (rows) => {
    setDeleting(true);
    axiosInstance()
      .put(`${invoice.api}/material/${invoiceData?._id}/delete`, { ids: rows })
      .then(() => {
        setDeleting(false);
        fetchInvoiceData();
        setDeleteData(null);
      })
      .catch((error) => {
        setDeleting(false);
        toastConfig.setToastConfig(error);
        setDeleteData(null);
      });
  };

  const calculatePrice = (arr: any[]) => {
    if (invoiceData) {
      const data: any = {};
      data.conditionType = ['Rent'];
      data.material = arr.map((ele) => ({
        materialId: ele?.materialId,
        materialType: ele?.type,
        qty: ele?.qty,
        pricingMethod: ele?.pricingMethod,
        unit: ele?.unit,
        currency: invoiceData?.currency
      }));
      data.supplier = [];
      data.customer = [invoiceData?.customerAccount?.optionValue];
      data.warehouse = [invoiceData?.warehouse?.optionValue];
      return new Promise((resolve, reject) => {
        axiosInstance()
          .post(pricingCondition.api + `/calculatePrice`, data)
          .then(({ data: { data } }) => {
            resolve(data);
          })
          .catch((err) => {
            reject(err);
          });
      });
    }
  };

  const onSaveInlineEdit = async (inputField, updatedData) => {
    const rowData = flattenArray(rowsData)?.find((d) => d._id === updatedData._id);
    if (inputField.hasOwnProperty('qtyDisplay')) {
      inputField['qty'] = inputField['qtyDisplay'];
    }
    let rows: any = [{ ...rowData, ...updatedData }];
    rows = await calculateRowsField(flattenArray(rowsData), inputField, allFields, updatedData);
    handleSaveData(rows);
  };

  return (
    <Fragment>
      <Box display="flex" justifyContent="space-between" m={1}>
        <Box display="flex" alignItems="center">
          <Button variant="outlined" size="small" onClick={openAddMenu} startIcon={<AddIcon />} color="primary">
            Add
            <ExpandMore fontSize="small" />
          </Button>
          <Menu
            getContentAnchorEl={null}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left'
            }}
            anchorEl={anchorEl}
            keepMounted
            open={Boolean(anchorEl)}
            onClose={closeAddMenu}
          >
            {permissions?.product?.isRead && (
              <MenuItem
                color="primary"
                onClick={() => {
                  setAddDialog({ open: true, type: 'product', parentId: null });
                  closeAddMenu();
                }}
              >
                {`Add Products`}
              </MenuItem>
            )}

            {permissions?.packages?.isRead && (
              <MenuItem
                color="primary"
                onClick={() => {
                  setAddDialog({ open: true, type: 'package', parentId: null });
                  closeAddMenu();
                }}
              >
                {`Add Packages`}
              </MenuItem>
            )}
            {permissions?.serviceMaster?.isRead && (
              <MenuItem
                color="primary"
                onClick={() => {
                  setAddDialog({ open: true, type: 'service', parentId: null });
                  closeAddMenu();
                }}
              >
                {`Add Services`}
              </MenuItem>
            )}
            <MenuItem
              color="primary"
              onClick={() => {
                setAddDialog({ open: true, type: 'serializedAsset', parentId: null });
                closeAddMenu();
              }}
            >
              {`Add Assets`}
            </MenuItem>
          </Menu>
        </Box>
        <Box display="flex">
          <HtmlTooltip title={Boolean(selectedProducts && selectedProducts.length) ? 'Bulk edit selected records' : 'Select records to edit'}>
            <span>
              <Button
                variant="outlined"
                color="primary"
                size="small"
                disabled={!Boolean(selectedProducts && selectedProducts.filter((e) => !e.hideSelection).length)}
                onClick={openActions}
                endIcon={<KeyboardArrowDown fontSize="small" />}
                className="new-dropdown-v1"
              >
                Actions
              </Button>
            </span>
          </HtmlTooltip>
          <Menu
            anchorEl={anchorActionEl}
            keepMounted
            getContentAnchorEl={null}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left'
            }}
            open={Boolean(anchorActionEl)}
            onClose={closeActions}
          >
            <MenuItem
              onClick={() => {
                setMaterialEdit({ open: true, data: selectedProducts?.filter((e) => !e.hideSelection), bulkedit: true, showSaveAndNext: false });
                closeActions();
              }}
            >
              Bulk Edit
            </MenuItem>

            <MenuItem
              onClick={() => {
                const dataToDelete =
                  selectedProducts &&
                  selectedProducts
                    .filter((e) => !e.hideSelection)
                    .map((rec: any) => {
                      const obj: any = {};
                      obj.id = rec._id;
                      obj.type = rec?.type;
                      obj.materialId = rec?.materialId;
                      return obj;
                    });
                setDeleteData(dataToDelete);
                closeActions();
              }}
            >
              Delete
            </MenuItem>
          </Menu>
        </Box>
      </Box>
      {columns && rowsData ? (
        <>
          <Box zIndex={5} width={'100%'}>
            <CustomReactTable
              height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 395px)'}
              columns={columns}
              data={rowsData}
              setWholeRowsCellColor={(rowData) => (!rowData.isValid ? '' : '')}
              onSelect={setSelectedProducts}
              childrenProperty="subRows"
              uniqueKey="_id"
              renderedFrom="invoice_product_package"
              isClientSideGrid={true}
              onSaveEdit={onSaveInlineEdit}
            />
          </Box>
        </>
      ) : (
        <Box p={2} height={500}>
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
      {materialEdit.open && (
        <MaterialDialog
          calculatePrice={calculatePrice}
          onClose={() => {
            setMaterialEdit({ open: false, data: null, bulkedit: false, showSaveAndNext: false });
          }}
          isBulkedit={materialEdit.bulkedit}
          handleSaveData={handleSaveData}
          rowData={materialEdit.data}
          material={material}
          selectedProducts={selectedProducts}
          invoiceData={invoiceData}
          loadingEdit={isUpdating}
          showSaveAndNext={materialEdit.showSaveAndNext}
        />
      )}
      {addchildDialog.open && (
        <Popover
          anchorReference="anchorPosition"
          anchorPosition={{ top: addchildDialog.top, left: addchildDialog.bottom }}
          anchorOrigin={{
            vertical: 'center',
            horizontal: 'left'
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left'
          }}
          open={addchildDialog.open}
          onClose={() => {
            setAddchildDialog({ open: false, parentId: null, top: null, bottom: null, isSerializedProduct: false });
          }}
        >
          <MenuList>
            <MenuItem
              onClick={() => {
                setAddDialog({ open: true, type: 'product', parentId: addchildDialog.parentId });
                setAddchildDialog({ open: false, parentId: null, top: null, bottom: null, isSerializedProduct: false });
              }}
            >
              Product
            </MenuItem>
            <MenuItem
              onClick={() => {
                setAddDialog({ open: true, type: 'package', parentId: addchildDialog.parentId });
                setAddchildDialog({ open: false, parentId: null, top: null, bottom: null, isSerializedProduct: false });
              }}
            >
              Package
            </MenuItem>
            <MenuItem
              onClick={() => {
                setAddDialog({ open: true, type: 'service', parentId: addchildDialog.parentId });
                setAddchildDialog({ open: false, parentId: null, top: null, bottom: null, isSerializedProduct: false });
              }}
            >
              Services
            </MenuItem>
            {addchildDialog.isSerializedProduct && (
              <MenuItem
                onClick={() => {
                  setAddDialog({ open: true, type: 'serializedAsset', parentId: addchildDialog.parentId });
                  setAddchildDialog({ open: false, parentId: null, top: null, bottom: null, isSerializedProduct: false });
                }}
              >
                Assets
              </MenuItem>
            )}
          </MenuList>
        </Popover>
      )}
      {addDialog.open && addDialog.type === 'product' && (
        <AssignProductDialog
          reference="invoice"
          serialized={null}
          productsDialogOpen={addDialog.open}
          productId={null}
          handleCloseDialog={() => setAddDialog({ open: false, type: '', parentId: null })}
          assignedProducts={[]}
          onSuccess={(d) => {
            handleAdd(d);
          }}
        />
      )}
      {addDialog.open && addDialog.type === 'service' && (
        <AssignServiceDialog
          reference={'invoice'}
          referenceId={invoiceData?._id}
          handleClose={() => setAddDialog({ open: false, type: '', parentId: null })}
          ids={[]}
          onSuccess={(rows) => {
            handleAdd(rows);
          }}
        />
      )}
      {addDialog.open && addDialog.type === 'package' && (
        <AssignPackageDialog
          referenceType="invoice"
          handleClose={() => setAddDialog({ open: false, type: '', parentId: null })}
          ids={[]}
          onSuccess={(rows) => {
            handleAdd(rows);
          }}
          packageType={null}
        />
      )}
      {addDialog.open && addDialog.type === 'serializedAsset' && (
        <AssignSerializedAssetDialog
          reference={'invoice'}
          handleClose={() => {
            setAddDialog({ open: false, type: '', parentId: null });
            setAssetAssignedProduct([]);
          }}
          ids={flattenArray(rowsData)
            ?.filter((e) => e.type === 'serializedAsset')
            ?.map((e) => e.materialId)}
          handleSucess={(rows) => {
            if (addDialog.parentId) {
              handleAdd(
                rows?.map((e) => {
                  return { materialId: e.asset, type: 'serializedAsset', parentId: e._id };
                })
              );
            } else {
              handleAdd(rows);
            }
          }}
          isAssigning={isAdding}
          selectedProducts={assetAssignedProduct?.map((i) => {
            return { _id: i._id, product: i.materialId, productName: i.detail, qty: i.assetQty ? i.qty - i.assetQty : i.qty };
          })}
        />
      )}
    </Fragment>
  );
};

export default Material;
