import React from 'react';
import { useState, useEffect, useContext, Fragment } from 'react';
import { Grid, Box, Button, IconButton, CircularProgress, Menu, MenuItem, Chip, ListItemText, Tooltip } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import { useData } from '../../../StateProvider/Provider';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import AssignPackageDialog from 'src/components/AssignRolesDialog/AssignPackageDialog';
import CustomReactTable from '../../../components/CustomReactTable/CustomReactTable';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import Add from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import { rentalManagement } from '../../../constants/helpers';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import { autoCalculateSpecificFields } from '../../../constants/formulaUtility';
import { CustomOfflineContext } from '../../../StateProvider/OfflineContext/OfflineContext';
import { objectStore, findOne } from '../../../constants/indexdbhelper';
import { isMobile, isTablet } from 'react-device-detect';
import { BiChevronDown } from 'react-icons/bi';
import { calculatePrice, calculateRowsField, fetch_rental_product_fields, getNestedSubRows } from '../../../components/RentalManagment/helper';
import AssignServiceDialog from 'src/components/AssignRolesDialog/AssignServiceDialog';
import RentalJobQtyDialog from '../Productpackage/RentalJobQtyDialog';
import { startCase } from 'lodash';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { flattenArray, generateCustomTableColumns } from 'src/constants/columns';
import { ExpandMore } from '@material-ui/icons';
import ManagePackageDialog from 'src/pages/Packages/ManagePackageDialog';
import ManageServiceMaster from 'src/pages/ServiceMaster/ManageServiceMaster';
import EditIcon from '@material-ui/icons/Edit';

const Services = ({ rentalManagementData, setNextStep, renderedFrom, stepFullScreen, allowedToEdit }: any) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();

  const [isUpdating, setUpdating] = useState(false);

  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isProductEdit, setIsProductEdit] = useState({ open: false, data: null, showSaveAndNext: false });
  const [isAddingProducts, setAddingProducts] = useState(false);

  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);

  const [material, setMaterial] = useState([]);
  const [addExistingProductDialog, setAddExistingProductDialog] = useState({ open: false, type: '', parentId: null });
  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState(null);
  const [allFields, setAllFields] = useState([]);
  const [isRateRequired, setIsRateRequired] = useState(false);
  const [isBulkEdit, setIsBulkEdit] = useState(false);
  const [addAnchorEl, setAddAnchorEl] = useState(null);

  const { isOffline } = useContext(CustomOfflineContext);

  useEffect(() => {
    fetchFields();
  }, [allowedToEdit]);

  useEffect(() => {
    fetchProductInventory();
  }, [columns]);

  const fetchFields = async () => {
    setColumns(null);
    var data = await fetch_rental_product_fields(rentalManagementData?.currency, isOffline);
    if (!allowedToEdit) {
      data?.forEach((e) => {
        e.isColumnEditable = false;
      });
    }
    setAllFields(JSON.parse(JSON.stringify(data)));
    const newColumns = generateCustomTableColumns(data, rentalManagementData?.currency, renderedFrom);
    let qtyIndex = newColumns.findIndex((d) => d.accessor === 'qty');
    if (qtyIndex > -1) {
      newColumns[qtyIndex].accessor = 'qtyDisplay';
    }
    let column: any = [
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
        disableFilters: true,
        width: 200,
        Cell: ({ row }) =>
          row.original['type'] ? (
            <p>
              {`${startCase(row.original?.type)} `}
              {row.original['type'] === 'product'
                ? row.original?.productDetail?.serializedProduct
                  ? '(Serialized)'
                  : '(Non-Serialized)'
                : row.original?.type === 'package'
                  ? row.original?.packageDetail.packageType === 'Product'
                    ? '(Product)'
                    : '(Service)'
                  : row.original.type === 'service'
                    ? row?.original?.serviceDetail?.serviceType && `(${row?.original?.serviceDetail?.serviceType})`
                    : ''}
            </p>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'detail',
        Header: 'Details',
        minWidth: 300,
        width: 300,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row, rows }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {isOffline || !allowedToEdit ? (
              <p> {row.original.detail}</p>
            ) : (
              <p
                onClick={() => {
                  openMaterial(row, rows)
                }}
                className="link text-truncate"
                title={row.original.detail}
              >
                {row.original.detail}
              </p>
            )}
            {
              <Box ml={1} className="d-flex align-items-center">
                <span title={`There are ${row.original?.subRows?.length} product(s) in this ${row.original?.type}`}>
                  {row.original?.subRows?.length ? `(${row.original?.subRows?.length})` : null}
                </span>
                {!isOffline && allowedToEdit && (
                  <HtmlTooltip title="Add Service">
                    <IconButton
                      onClick={() => setAddExistingProductDialog({ open: true, type: 'service', parentId: row.original?._id })}
                      size="small"
                      color="primary"
                    >
                      <Add color="disabled" fontSize="small" />
                    </IconButton>
                  </HtmlTooltip>
                )}
              </Box>
            }
            {!isOffline && (
              <IconButton
                size="small"
                onClick={() => {
                  if (row.original.type === 'service') {
                    window.open(`${routes.serviceMasterDetail.path}/${row.original.materialId}`);
                  } else if (row.original.type === 'product') {
                    window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                  } else if (row.original.type === 'serializedAsset') {
                    window.open(`${routes.serializedAssetDetail.path}/${row.original.inventory}`);
                  } else {
                    window.open(`${routes.packagesDetail.path}/${row.original.materialId}`);
                  }
                }}
              >
                <OpenInNewIcon fontSize="small" color="primary" />
              </IconButton>
            )}
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
      }
    ];
    const isPriceRequired = data.filter((el) => el.fieldName === 'price' && el.required).length > 0;
    setIsRateRequired(isPriceRequired);
    column = [...column, ...newColumns];
    column.push({
      accessor: 'action',
      Header: 'Actions',
      minWidth: 50,
      width: 50,
      sticky: 'right',
      disableFilters: true,
      canDrag: false,
      Cell: ({ row, rows }) => {
        return (
          <>
            <HtmlTooltip title={(isOffline || !allowedToEdit) ? '' : 'Edit'}>
              <IconButton
                size="small"
                aria-label="Details"
                disabled={(isOffline || !allowedToEdit) ? true : false}
                onClick={() => {
                  openMaterial(row, rows)
                }}
              >
                <EditIcon fontSize="small" color={(isOffline || !allowedToEdit) ? 'disabled' : 'primary'} />
              </IconButton>
            </HtmlTooltip>
            {
              allowedToEdit ? (
                row.original.hideSelection ? (
                  <HtmlTooltip title={'Asset is already assigned'}>
                    <span>
                      <IconButton size="small" aria-label="Details" disabled={true}>
                        <DeleteIcon fontSize="small" color={'disabled'} />
                      </IconButton>
                    </span>
                  </HtmlTooltip>
                ) : (
                  <HtmlTooltip title={'Delete'}>
                    <span>
                      <IconButton
                        size="small"
                        aria-label="Details"
                        onClick={() => {
                          const obj: any = [{ id: row.original._id, type: row.original?.type, materialId: row.original?.materialId }];
                          getNestedSubRows(obj, row.original);
                          setDeleteData(obj);
                        }}
                      >
                        <DeleteIcon fontSize="small" color={'error'} />
                      </IconButton>
                    </span>
                  </HtmlTooltip>
                )
              ) : (
                ''
              )
            }
          </>
        )
      }
    });
    setColumns(column);
  };

  const fetchProductInventory = async () => {
    setNextStep(false);
    var data: any = [];
    var inventory: any = [];
    var nonSerializeAsset: any = [];

    if (isOffline) {
      data = await findOne(objectStore.rentalManagement, rentalManagementData._id);
      inventory = data.productInventory;
    } else {
      const response = await axiosInstance().get(`${rentalManagement.api}/productpackage/${rentalManagementData._id}`);
      data = response?.data?.data;
      setMaterial(JSON.parse(JSON.stringify(data.material)));
      inventory = data.inventory?.filter((e) => !e.isReplaced);
      nonSerializeAsset = data.nonSerializeAsset;
    }
    let rows = data.material.filter((e) => e.parentId === null);
    rows = rows.filter((e) => e.type === 'service' || (e.type === 'package' && e.packageDetail?.packageType === 'Service'));

    rows.forEach((parent, i) => {
      parent.index = i + 1;
      parent.detail =
        parent.type === 'product'
          ? parent?.productDetail?.productName
          : parent.type === 'service'
            ? parent?.serviceDetail?.serviceName
            : parent?.packageDetail?.packageName;
      parent.description =
        parent.type === 'service'
          ? parent?.serviceDetail?.serviceDescription || ''
          : parent.type === 'product'
            ? parent?.productDetail?.productDescription || ''
            : parent.type === 'package'
              ? parent?.packageDetail?.packageDescription || ''
              : '';
      parent.serializedProduct = parent.type === 'product' ? parent?.productDetail?.serializedProduct : false;
      parent.qtyDisplay = parent.qty;
      parent.pricingConditionDisplay = parent.pricingCondition?.optionLabel;
      parent.pricingCondition = parent.pricingCondition?.optionValue;
      parent.isValid = parent['finalPrice_' + rentalManagementData?.currency?.toLowerCase()] ? true : !isRateRequired;
      parent.assetQty = parent.serializedProduct
        ? inventory?.filter((e) => e._id === parent._id).length
        : nonSerializeAsset?.filter((e) => e._id === parent._id).length;
      parent.hideSelection = parent.assetQty > 0 ? true : parent?.status ? true : false;
      parent.subRows = generateNestedData(data.material, inventory, nonSerializeAsset, parent);
    });

    if (rows.filter((_rows) => _rows.isValid === false).length > 0 || rows.length === 0) {
      setNextStep(false);
    } else {
      setNextStep(true);
    }
    if (rows?.length === 0) {
      setNextStep(true);
    }
    setRowsData(rows);
    setSelectedProducts([]);
  };

  const generateNestedData = (material, inventory, nonSerializeAsset, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, j) => {
      _subRow.index = parent.index + '.' + (j + 1);
      _subRow.detail =
        _subRow.type === 'product'
          ? _subRow?.productDetail?.productName
          : _subRow.type === 'service'
            ? _subRow?.serviceDetail?.serviceName
            : _subRow?.packageDetail?.packageName;
      _subRow.description =
        _subRow.type === 'service'
          ? _subRow?.serviceDetail?.serviceDescription || ''
          : _subRow.type === 'product'
            ? _subRow?.productDetail?.productDescription || ''
            : _subRow.type === 'package'
              ? _subRow?.packageDetail?.packageDescription || ''
              : '';
      _subRow.serializedProduct = _subRow?.productDetail?.serializedProduct;
      _subRow.qtyDisplay = `${parent.qtyDisplay * _subRow.qty}`;
      _subRow.pricingConditionDisplay = _subRow.pricingCondition?.optionLabel;
      _subRow.pricingCondition = _subRow.pricingCondition?.optionValue;
      _subRow.isValid = _subRow['finalPrice_' + rentalManagementData?.currency?.toLowerCase()] ? true : !isRateRequired;
      _subRow.assetQty = _subRow.serializedProduct
        ? inventory?.filter((e) => e._id === _subRow._id).length
        : nonSerializeAsset?.filter((e) => e._id === _subRow._id).length;
      _subRow.hideSelection = _subRow.assetQty > 0 ? true : _subRow?.status ? true : false;
      _subRow.subRows = generateNestedData(material, inventory, nonSerializeAsset, _subRow);
    });
    if (subRows.length === 0 && parent.type === 'package') {
      parent.isValid = false;
    }
    if (parent.type === 'package') {
      parent.hideSelection = subRows.filter((e) => e.hideSelection).length ? true : false;
    }
    return subRows;
  };

  const handleAdd = async (rows) => {
    setAddingProducts(true);
    const material: any = [];
    rows.forEach((d) => {
      const element: any = {};
      element.materialId = d._id;
      element.detail = d?.serviceName || d?.packageName || '';
      element.type = d?.type || addExistingProductDialog.type;
      element.unit = d.unitMain && d.unitMain.length ? d.unitMain[0] : d.unit ? d.unit : '';
      element.pricingMethod = d.pricingMethodMain && d.pricingMethodMain.length ? d.pricingMethodMain[0] : d.pricingMethod ? d.pricingMethod : '';
      element.qty = d.qty ? parseFloat(d.qty) : 1;
      element.estimateStartDate = rentalManagementData ? rentalManagementData?.estimateStartDate : new Date();
      element.estimateEndDate = rentalManagementData ? rentalManagementData?.estimateEndDate : new Date();
      element.actualStartDate = '';
      element.actualEndDate = '';
      element.actualJobDuration = '';
      element.parentId = addExistingProductDialog.parentId;
      const calValues = autoCalculateSpecificFields({ pricingMethod: element.pricingMethod }, element, allFields);
      element.estimateJobDuration = 1;
      if (calValues && calValues['estimateJobDuration']) {
        element.estimateJobDuration = calValues['estimateJobDuration'];
      }
      material.push(element);
    });
    if (material.filter((d) => d.listPrice === null || d.listPrice === undefined || d.listPrice === 0).length === 0) {
      AddMaterial(material, []);
    } else {
      const priceData: any = await calculatePrice(rentalManagementData, material);
      AddMaterial(material, priceData);
    }
  };

  const AddMaterial = async (material, priceData) => {
    const tempMaterial = [...material];
    tempMaterial.forEach((element) => {
      const rateResult = priceData?.filter((e) => e.materialId === element.materialId && e.materialType === element.type && e.unit === element.unit);
      if (element.listPrice) {
        const priceFieldName = `price_${rentalManagementData?.currency?.toLowerCase()}`;
        element[priceFieldName] = element.listPrice;
        const calValues = autoCalculateSpecificFields({ [priceFieldName]: element.listPrice }, element, allFields);
        Object.assign(element, calValues);
      } else if (rateResult.length && rateResult[0].mrp) {
        const priceFieldName = `price_${rentalManagementData?.currency?.toLowerCase()}`;
        element[priceFieldName] = rateResult[0].mrp;
        element['pricingCondition'] = rateResult[0].conditionId;
        element['pricingMethod'] = rateResult[0].pricingMethod?.trim();
        const calValues = autoCalculateSpecificFields({ [priceFieldName]: rateResult[0].mrp }, element, allFields);
        Object.assign(element, calValues);
      }
    });
    axiosInstance()
      .post(`${rentalManagement.api}/productpackage/${rentalManagementData._id}`, { material: tempMaterial })
      .then(() => {
        setAddExistingProductDialog({ open: false, type: '', parentId: null });
        fetchProductInventory();
        setAddingProducts(false);
      })
      .catch((error) => {
        setAddExistingProductDialog({ open: false, type: '', parentId: null });
        toastConfig.setToastConfig(error);
        setAddingProducts(false);
      });
  };

  const handleSaveData = async (rows: any, saveAndNext = false) => {
    rows.forEach((element) => {
      element.pricingCondition = element.pricingCondition?.optionValue ? element.pricingCondition?.optionValue : element.pricingCondition; // temporary fix
      delete element.index;
      delete element.detail;
      delete element.serializedProduct;
      delete element.qtyDisplay;
      delete element.pricingConditionDisplay;
      delete element.isValid;
      delete element.hideSelection;
      delete element.assetQty;
      delete element.productDetail;
      delete element.packageDetail;
      delete element.serviceDetail;
      delete element.parentName;
      delete element.subRows;
    });
    setUpdating(true);
    axiosInstance()
      .put(`${rentalManagement.api}/productpackage/${rentalManagementData._id}`, { material: rows })
      .then(() => {
        setUpdating(false);
        fetchProductInventory();
        if (saveAndNext) {
          const rowIndex = rowsData?.findIndex((d) => d._id === rows[0]?._id);
          setIsProductEdit({ open: true, data: rowsData[rowIndex + 1], showSaveAndNext: rowIndex + 1 < rowsData?.length - 1 ? true : false });
        } else {
          setIsProductEdit({ open: false, data: null, showSaveAndNext: false });
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
      .put(`${rentalManagement.api}/productpackage/${rentalManagementData?._id}/delete`, { ids: rows })
      .then(() => {
        setDeleting(false);
        fetchProductInventory();
        setDeleteData(null);
      })
      .catch((error) => {
        setDeleting(false);
        toastConfig.setToastConfig(error);
        setDeleteData(null);
      });
  };

  const openMaterial = (data, rows) => {
    setIsProductEdit({
      open: true,
      data: data.original,
      showSaveAndNext: data?.index < rows?.filter((e) => e?.depth === 0)?.length - 1 && data?.depth === 0 ? true : false
    });
    setIsBulkEdit(false);
  };

  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDeleteMultiple = () => {
    const obj: any = [];
    const dataToDelete = selectedProducts && selectedProducts.filter((e) => !e.hideSelection);
    dataToDelete?.forEach((ele) => {
      obj.push({ id: ele._id, type: ele.type, materialId: ele.materialId });
    });
    dataToDelete?.forEach((ele) => {
      getNestedSubRows(obj, ele);
    });
    setDeleteData(obj);
  };

  const onSaveInlineEdit = async (inputField, updatedData) => {
    const rowData = flattenArray(rowsData)?.find((d) => d._id === updatedData._id);
    if (inputField.hasOwnProperty('qtyDisplay')) {
      inputField['qty'] = inputField['qtyDisplay'];
    }
    let rows: any = [{ ...rowData, ...updatedData }];
    rows = await calculateRowsField(material, inputField, allFields, updatedData);
    handleSaveData(rows);
  };

  const openAddActions = (event) => {
    setAddAnchorEl(event.currentTarget);
  };

  const closeAddActions = () => {
    setAddAnchorEl(null);
  };

  return (
    <Fragment>
      {allowedToEdit && (
        <Box display="flex" justifyContent="space-between" m={1}>
          <Box display="flex" gridGap={'8px'} flexWrap={'wrap'}>
            <Button variant={'outlined'} color="primary" size="small" startIcon={<Add />} onClick={openAddActions} aria-controls="add-menu">
              {'Add'}
              <ExpandMore fontSize="small" />
            </Button>
            <Menu
              anchorEl={addAnchorEl}
              keepMounted
              getContentAnchorEl={null}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left'
              }}
              id="add-menu"
              open={Boolean(addAnchorEl)}
              onClose={closeAddActions}
            >
              {permissions?.serviceMaster?.isRead && (
                <MenuItem
                  onClick={() => {
                    closeAddActions()
                    setAddExistingProductDialog({ open: true, type: 'service', parentId: null });
                  }}
                >
                  Add Services
                </MenuItem>
              )}
              {permissions?.packages?.isRead && (
                <MenuItem
                  onClick={() => {
                    closeAddActions()
                    setAddExistingProductDialog({ open: true, type: 'package', parentId: null });
                  }}
                >
                  {`Add Service Packages`}
                </MenuItem>
              )}
              <MenuItem
                onClick={() => {
                  closeAddActions();
                  setAddExistingProductDialog({ open: true, type: 'newService', parentId: null });
                }}
              >
                Add New Service
              </MenuItem>
              <MenuItem
                onClick={() => {
                  closeAddActions();
                  setAddExistingProductDialog({ open: true, type: 'newPackage', parentId: null });
                }}
              >
                {`Add New Service Package`}
              </MenuItem>
            </Menu>
          </Box>
          <Box display="flex" ml={1}>
            <Button
              variant={'outlined'}
              color="primary"
              size="small"
              onClick={handleClick}
              disabled={!Boolean(selectedProducts && selectedProducts.filter((e) => !e.hideSelection).length)}
              endIcon={<BiChevronDown />}
              className="new-dropdown-v1"
            >
              Actions
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={open}
              getContentAnchorEl={null}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left'
              }}
              onClose={handleClose}
            >
              <HtmlTooltip title={Boolean(selectedProducts && selectedProducts.length) ? 'Bulk edit selected records' : 'Select records to edit'}>
                <MenuItem
                  onClick={() => {
                    setIsProductEdit({ open: true, data: null, showSaveAndNext: false });
                    setIsBulkEdit(true);
                    handleClose();
                  }}
                >
                  Bulk Edit
                </MenuItem>
              </HtmlTooltip>
              <HtmlTooltip title={Boolean(selectedProducts && selectedProducts.length) ? 'Delete selected records' : 'Select records to delete'}>
                <MenuItem
                  disabled={isDeleting}
                  onClick={() => {
                    handleDeleteMultiple();
                    handleClose();
                  }}
                >
                  Delete
                </MenuItem>
              </HtmlTooltip>
            </Menu>
          </Box>
        </Box>
      )}
      {columns && rowsData ? (
        <Box zIndex={5} width={'100%'} height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}>
          <CustomReactTable
            height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}
            columns={columns}
            data={rowsData}
            setWholeRowsCellColor={(rowData) => (!rowData.isValid ? 'error' : '')}
            onSelect={setSelectedProducts}
            childrenProperty="subRows"
            uniqueKey="_id"
            hideSelection={isOffline || !allowedToEdit}
            hideAction={isOffline || !allowedToEdit}
            renderedFrom="rental_management_sevices_1"
            onSaveEdit={onSaveInlineEdit}
            isClientSideGrid={true}
          />
        </Box>
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
      {addExistingProductDialog.open && addExistingProductDialog.type === 'package' && (
        <AssignPackageDialog
          referenceType={renderedFrom}
          onSuccess={(rows) => {
            handleAdd(rows.map((d) => ({ ...d, detail: d.packageName })));
          }}
          handleClose={() => {
            setAddExistingProductDialog({ open: false, type: '', parentId: null });
          }}
          packageType="service"
          ids={[]}
        />
      )}
      {isProductEdit.open && (
        <RentalJobQtyDialog
          onClose={() => {
            setIsProductEdit({ open: false, data: null, showSaveAndNext: false });
            setIsBulkEdit(false);
          }}
          isBulkedit={isBulkEdit}
          handleSaveData={handleSaveData}
          rentalManagementData={rentalManagementData}
          rowData={!isBulkEdit ? isProductEdit.data : selectedProducts}
          material={material}
          selectedProducts={selectedProducts}
          loading={isUpdating}
          from={'service'}
          showSaveAndNext={isProductEdit.showSaveAndNext}
        />
      )}
      {addExistingProductDialog.open && addExistingProductDialog.type === 'service' && (
        <AssignServiceDialog
          reference={'rentalManagement'}
          onSuccess={(services) => {
            handleAdd(services);
          }}
          handleClose={() => {
            setAddExistingProductDialog({ open: false, type: '', parentId: null });
          }}
          ids={[]}
        />
      )}
      {addExistingProductDialog.open && addExistingProductDialog.type === 'newPackage' && (
        <ManagePackageDialog
          isClone={false}
          referenceData={{ packageType: 'Service' }}
          open={addExistingProductDialog.open}
          packageId={null}
          onClose={() => setAddExistingProductDialog({ open: false, type: '', parentId: null })}
          onSuccess={(data) => {
            data.type = 'package'
            data.unitMain = data?.unit;
            data.pricingMethodMain = data?.pricingMethod;
            handleAdd([data]);
            setAddExistingProductDialog({ open: false, type: '', parentId: null });
          }}
          isRedirectToDetailPage={false}
        />
      )}
      {addExistingProductDialog.open && addExistingProductDialog.type === 'newService' && (
        <ManageServiceMaster
          isClone={false}
          serviceMasterId={null}
          onClose={() => setAddExistingProductDialog({ open: false, type: '', parentId: null })}
          onSuccess={(data) => {
            const row = data?.data
            row.type = 'service'
            row.unitMain = row?.unit;
            row.pricingMethodMain = row?.pricingMethod;
            handleAdd([row]);
            setAddExistingProductDialog({ open: false, type: '', parentId: null });
          }}
          isRedirectToDetailPage={false}
        />
      )}
    </Fragment>
  );
};

export default Services;
