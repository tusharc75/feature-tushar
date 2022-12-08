import React from 'react';
import { useState, useEffect, useContext, Fragment } from 'react';
import {
  Grid,
  Box,
  Button,
  IconButton,
  CircularProgress,
  Menu,
  MenuItem,
  Chip,
  MenuList,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Popover
} from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import { useData } from '../../../StateProvider/Provider';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import AddExistingProductInventory from './AddExistingProductInventory';
import CustomReactTable from '../../../components/CustomReactTable/CustomReactTable';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import Add from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import moment from 'moment';
import { rentalManagement, dateFormat, pricingCondition, formatAmountWithCurrency } from '../../../constants/helpers';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import RentalJobQtyDialog, { resetValueZero, sumOnParent } from './RentalJobQtyDialog';
import { autoCalculateSpecificFields } from '../../../constants/formulaUtility';
import { CustomOfflineContext } from '../../../StateProvider/OfflineContext/OfflineContext';
import { objectStore, findOne } from '../../../constants/indexdbhelper';
import { isMobile, isTablet } from 'react-device-detect';
import { MdAdd, MdDelete, MdEdit } from 'react-icons/md';
import { RiEditCircleLine } from 'react-icons/ri';
import { BiChevronDown } from 'react-icons/bi';
import { calculatePrice, calculateRowsField, fetch_rental_product_fields } from '../../../components/RentalManagment/helper';
import { startCase } from 'lodash';
import InfoIcon from '@material-ui/icons/InfoOutlined';
import CalculatePriceDialog from 'src/components/RentalManagment/CalculatePriceDialog';

const Productpackage = ({
  rentalManagementData,
  setNextStep,
  currencySymbol,
  isTabletScreen,
  isSmallScreen,
  showActivity,
  renderedFrom,
  stepFullScreen,
  allowedToEdit
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
  const [addExistingProductDialog, setAddExistingProductDialog] = useState({ open: false, type: '', parentId: null });
  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState(null);
  const [allFields, setAllFields] = useState([]);
  const [isRateRequired, setIsRateRequired] = useState(false);
  const [addchildDialog, setAddchildDialog] = useState({ open: false, parentId: null, top: null, bottom: null });
  const [showConfirmationDialog, setShowConfirmationDialog] = useState({open: false, data: null});
  const [priceDataDialog, setPriceDataDialog] = useState({ open: false, material: null });

  const { isOffline } = useContext(CustomOfflineContext);

  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    fetchProductInventory();
  }, [columns]);

  const fetchFields = async () => {
    var { fields: data, allFields } = await fetch_rental_product_fields(rentalManagementData?.currency, isOffline);
    setAllFields(JSON.parse(JSON.stringify(allFields)));
    const coloum: any = [
      {
        accessor: 'srno',
        Header: 'Index',
        width: 70,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.srno}</p>,
        Footer: () => {
          return <>Total</>;
        }
      },
      {
        accessor: 'type',
        Header: 'Type',
        disableFilters: true,
        sticky: isMobile ? 'none' : 'left',
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
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {isOffline || !allowedToEdit ? (
              <p> {row.original.detail}</p>
            ) : (
              <p
                onClick={() => {
                  handleOpen(row.original);
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
                  <HtmlTooltip title="Add ">
                    <IconButton
                      onClick={(event) => setAddchildDialog({ open: true, parentId: row.original?._id, top: event.clientY, bottom: event.clientX })}
                      size="small"
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
                  } else if (row.original.type === 'asset') {
                    window.open(`${routes.serializedAssetDetail.path}/${row.original.inventory}`);
                  } else {
                    window.open(`${routes.packagesDetail.path}/${row.original.materialId}`);
                  }
                }}
              >
                <InfoIcon fontSize="small" color="primary" />
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

    data.forEach((element) => {
      if (element.fieldName === 'price' && element.required) {
        setIsRateRequired(true);
      }
      if (element.type === 'date') {
        coloum.push({
          accessor: element.fieldName,
          Header: element.fieldLabel,
          disableFilters: true,
          Cell: ({ row }) => {
            return row.original[element.fieldName] && isNaN(row.original[element.fieldName]) ? (
              <p>{moment(row.original[element.fieldName]?.slice(0, 10)).format(dateFormat)}</p>
            ) : (
              <NoDataCell />
            );
          }
        });
      } else if (element.type === 'converter' || element.type === 'currencyAmount' || element.isConverter === true) {
        if (element.type !== 'currencyAmount' && (element.type === 'converter' || element.isConverter === true)) {
          element.displayUnits.forEach((_unit) => {
            let fieldName = element.fieldName + '_' + _unit.toLowerCase();
            let fieldLabel = element.fieldLabel + ' ' + _unit;
            coloum.push({
              accessor: fieldName,
              Header: fieldLabel,
              Cell: ({ row }) => (row.original[fieldName] ? <p>{row.original[fieldName]}</p> : <NoDataCell />)
            });
          });
        } else if (element.type === 'currencyAmount' && (element.type === 'converter' || element.isConverter === true)) {
          element.displayUnits.forEach((_unit) => {
            element.displayCurrency.forEach((_currency) => {
              let fieldName = element.fieldName + '_' + _currency.toLowerCase() + '_' + _unit.toLowerCase();
              let fieldLabel = element.fieldLabel + ' ' + _unit + '/' + _currency;
              coloum.push({
                accessor: fieldName,
                Header: fieldLabel,
                Cell: ({ row }) =>
                  row.original[fieldName] ? (
                    <p>{formatAmountWithCurrency(rentalManagementData?.currency, row.original[fieldName])?.amountWithouCurrencyCode}</p>
                  ) : (
                    <NoDataCell />
                  )
              });
            });
          });
        } else if (element.type === 'currencyAmount') {
          element.displayCurrency.forEach((_currency) => {
            let fieldName = element.fieldName + '_' + _currency.toLowerCase();
            let fieldLabel = element.fieldLabel + ' ' + _currency;
            coloum.push({
              accessor: fieldName,
              Header: fieldLabel,
              Cell: ({ row }) =>
                row.original[fieldName] ? (
                  <p>{formatAmountWithCurrency(rentalManagementData?.currency, row.original[fieldName])?.amountWithouCurrencyCode}</p>
                ) : (
                  <NoDataCell />
                ),
              Footer: (info) => {
                const total = info?.rows
                  ?.filter((f) => f.original.parentId === null && f.values.hasOwnProperty(fieldName) && !isNaN(f.values[fieldName]))
                  .reduce((sum, row) => row.values[fieldName] + sum, 0);
                return (
                  <>
                    {currencySymbol} {formatAmountWithCurrency(rentalManagementData?.currency, total)?.amountWithouCurrencyCode ?? total}
                  </>
                );
              }
            });
          });
        }
      } else {
        if (element.fieldName === 'qty') {
          element.fieldName = 'qtyDisplay';
        }
        if (element.fieldName === 'pricingCondition') {
          element.fieldName = 'pricingConditionDisplay';
        }
        coloum.push({
          accessor: element.fieldName,
          Header: element.fieldLabel,
          Cell: ({ row }) => (row.original[element.fieldName] ? <p>{row.original[element.fieldName]}</p> : <NoDataCell />)
        });
      }
    });
    {
      isMobile ? (
        <Box display={'none'} />
      ) : (
        coloum.push({
          accessor: 'action',
          Header: '',
          minWidth: 50,
          width: 50,
          sticky: 'right',
          disableFilters: true,
          canDrag: false,
          Cell: ({ row }) => (
            <HtmlTooltip title={row.original.hideSelection && !allowedToEdit ? '' : 'Edit'}>
              <IconButton
                size="small"
                aria-label="Details"
                disabled={row.original.hideSelection && !allowedToEdit}
                onClick={() => {
                  const obj: any = [{ id: row.original._id, type: row.original?.type, materialId: row.original?.materialId }];
                  getNestedSubRows(obj, row.original);
                  setDeleteData(obj);
                }}
              >
                <DeleteIcon fontSize="small" color="error" />
              </IconButton>
            </HtmlTooltip>
          )
        })
      );
    }
    coloum.forEach((element) => {
      if (element.accessor === `price_${rentalManagementData?.currency?.toLowerCase()}`) {
        element.editable = allowedToEdit;
      }
      if (element.accessor === 'qtyDisplay') {
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
      inventory = data.inventory;
      nonSerializeAsset = data.nonSerializeAsset;
    }
    let rows = data.material.filter((e) => e.parentId === null).filter((e) => e.type !== 'service');
    let products = rows.filter((e) => e.type === 'product' && !e?.isConsumbale);
    let packages = rows.filter((e) => e.type === 'package' && e.packageDetail?.packageType !== 'Service');

    rows = [...products, ...packages];

    rows.forEach((parent, i) => {
      parent.srno = i + 1;
      parent.detail = `${
        parent.type === 'service'
          ? parent.serviceDetail
            ? parent.serviceDetail?.serviceName
            : parent.packageDetail?.packageName
          : parent.type === 'product'
          ? parent.productDetail?.productName
          : parent.packageDetail?.packageName
      }`;
      parent.description =
        parent.type === 'service'
          ? parent?.serviceDetail?.serviceDescription || ''
          : parent.type === 'product'
          ? parent?.productDetail?.productDesc || ''
          : parent.type === 'package'
          ? parent?.packageDetail?.packageDescription || ''
          : '';
      parent.serializedProduct = parent.type === 'product' ? parent.productDetail?.serializedProduct : false;
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

    setRowsData(rows);
    setSelectedProducts([]);
  };

  const generateNestedData = (material, inventory, nonSerializeAsset, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, j) => {
      _subRow.srno = parent.srno + '.' + (j + 1);
      _subRow.detail = `${
        _subRow.type === 'service'
          ? _subRow.serviceDetail?.serviceName
          : _subRow.type === 'package'
          ? _subRow.packageDetail?.packageName
          : _subRow.type === 'product'
          ? _subRow.productDetail?.productName
          : ''
      } `;
      _subRow.description =
        _subRow.type === 'service'
          ? _subRow?.serviceDetail?.serviceDescription || ''
          : _subRow.type === 'product'
          ? _subRow?.productDetail?.productDesc || ''
          : _subRow.type === 'package'
          ? _subRow?.packageDetail?.packageDescription || ''
          : '';
      _subRow.serializedProduct = _subRow?.productDetail?.serializedProduct;
      _subRow.qtyDisplay = `${parent.qtyDisplay * _subRow.qty} `;
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

  const getNestedSubRows = (obj, original) => {
    if (original?.subRows?.length) {
      original?.subRows.forEach((element) => {
        obj.push({ id: element._id, type: element.type, materialId: element.materialId });
        getNestedSubRows(obj, element);
      });
    }
  };

  const handleAdd = async (rows) => {
    setAddingProducts(true);
    const material: any = [];
    rows.forEach((d) => {
      const element: any = {};
      element.materialId = d._id;
      element.detail = d.type === 'product' ? d?.productName : d.type === 'package' ? d?.packageName : '';
      element.type = addExistingProductDialog.type;
      element.unit = d.unitMain && d.unitMain.length ? d.unitMain[0] : '';
      element.pricingMethod = d.pricingMethodMain && d.pricingMethodMain.length ? d.pricingMethodMain[0] : '';
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
      element.listPrice = d.listPrice ? d.listPrice : null;
      material.push(element);
    });
    if (material.filter((d) => d.listPrice === null).length === 0) {
      AddMaterial(material, []);
    } else {
      setPriceDataDialog({ open: true, material: material });
    }
    // const priceData: any = await calculatePrice(
    //   rentalManagementData,
    //   material.filter((d) => d.listPrice === null)
    // );
    // material.forEach((element) => {
    //   const rateResult = priceData?.filter(
    //     (e) =>
    //       e.materialId === element.materialId &&
    //       e.materialType === element.type &&
    //       e.unit === element.unit &&
    //       e.pricingMethod === element.pricingMethod
    //   );
    //   if (element.listPrice) {
    //     const priceFieldName = `price_${rentalManagementData?.currency?.toLowerCase()}`;
    //     element[priceFieldName] = element.listPrice;
    //     const calValues = autoCalculateSpecificFields({ [priceFieldName]: element.listPrice }, element, allFields);
    //     Object.assign(element, calValues);
    //   } else if (rateResult.length && rateResult[0].mrp) {
    //     const priceFieldName = `price_${rentalManagementData?.currency?.toLowerCase()}`;
    //     element[priceFieldName] = rateResult[0].mrp;
    //     const calValues = autoCalculateSpecificFields({ [priceFieldName]: rateResult[0].mrp }, element, allFields);
    //     Object.assign(element, calValues);
    //   }
    // });

    // axiosInstance()
    //   .post(`${rentalManagement.api}/productpackage/${rentalManagementData._id}`, { material })
    //   .then(() => {
    //     setAddExistingProductDialog({ open: false, type: '', parentId: null });
    //     fetchProductInventory();
    //     setAddingProducts(false);
    //   })
    //   .catch((error) => {
    //     setAddExistingProductDialog({ open: false, type: '', parentId: null });
    //     toastConfig.setToastConfig(error);
    //     setAddingProducts(false);
    //   });
  };

  const AddMaterial = async (material, priceData) => {
    const tempMaterial = [...material];
    if (priceData) {
      tempMaterial.forEach((element) => {
        const rateResult = priceData?.filter(
          (e) => e.materialId === element.materialId && e.materialType === element.type && e.unit === element.unit
        );
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
    }
    axiosInstance()
      .post(`${rentalManagement.api}/productpackage/${rentalManagementData._id}`, { material: tempMaterial })
      .then(() => {
        setAddExistingProductDialog({ open: false, type: '', parentId: null });
        fetchProductInventory();
        setAddingProducts(false);
        setPriceDataDialog({ open: false, material: null });
      })
      .catch((error) => {
        setAddExistingProductDialog({ open: false, type: '', parentId: null });
        toastConfig.setToastConfig(error);
        setAddingProducts(false);
        setPriceDataDialog({ open: false, material: null });
      });
  };

  const handleSaveData = async (rows: any) => {
    rows.forEach((element) => {
      element.pricingCondition = element.pricingCondition?.optionValue ? element.pricingCondition?.optionValue : element.pricingCondition; // temporary fix
      delete element.srno;
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
        setIsProductEdit({ open: false, isBulkedit: false });
        fetchProductInventory();
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

  const handleOpen = (rowData) => {
    setIsProductEdit({ open: true, isBulkedit: false });
    setRecordToUpdate(rowData);
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

  const onSaveEdit = (inputField, updatedData) => {
    const currency = rentalManagementData?.currency.toLowerCase()
    const requiredItems = [];
    allFields.forEach(({ fieldName, required, type }) => {
      fieldName = type === 'currencyAmount' ? `${fieldName}_${currency}` : fieldName;
      if (required) {
        if (isNaN(updatedData[fieldName]) && !updatedData[fieldName]) {
          requiredItems.push(fieldName);
        } else if (!isNaN(updatedData[fieldName]) && updatedData[fieldName] <= 0) {
          requiredItems.push(fieldName);
        }
      }
    });

    if (requiredItems.length > 0) {
      handleOpen({ ...updatedData });
    } else {
      onConfirmSave(inputField, updatedData)
    }
  };

  const onConfirmSave = (inputField, updatedData) => {
    const currency = rentalManagementData?.currency.toLowerCase();
    const rowData = material.find((d) => d._id === updatedData._id)
      if (rowData.parentId && !showConfirmationDialog.open) {
        setShowConfirmationDialog({open: true, data: {
          inputField, updatedData
        }});
      } else {
        let rows: any = [{ ...rowData, ...updatedData }]
        if (rowData.type === "package") {
          const product = material.filter((e) => e.parentId === rowData._id)
          resetValueZero(product, allFields)
          rows = [...rows, ...product]
        }
        else if (rowData.type === "product" && rowData.parentId) {
          if (updatedData[`totalPrice_${currency}`] !== rowData[`totalPrice_${currency}`]) {
            const packages: any = material.filter((e) => e._id === rowData.parentId)
            const product: any = material.filter((e) => e.parentId === rowData.parentId)
            product.forEach((element) => {
              if (element._id === rowData._id) {
                for (let key in updatedData) {
                  element[key] = updatedData[key];
                }
              }
            })
            sumOnParent(packages, product, allFields, currency)
            rows = [...rows, ...packages]
          }
        }
        rows = calculateRowsField(material, inputField, allFields, updatedData);
        handleSaveData(rows)
        setShowConfirmationDialog({open: false, data: {}});
      }
  }

  return (
    <Fragment>
      <Grid container spacing={2}>
        {allowedToEdit && (
          <Grid item xs={12} md={12} sm={12}>
            <Box display="flex" justifyContent="space-between" m={1} mb={0}>
              <Box display="flex">
                {permissions?.product?.isRead && (
                  <Button
                    color="primary"
                    size="small"
                    disabled={isOffline}
                    variant={isMobile && !isTablet ? 'outlined' : 'contained'}
                    style={isMobile && !isTablet ? { color: 'var(--info-dark)' } : {}}
                    onClick={() => {
                      setAddExistingProductDialog({ open: true, type: 'product', parentId: null });
                    }}
                  >
                    {isMobile && !isTablet ? 'Product' : `Add Products`}
                  </Button>
                )}
                <Box mx={isMobile ? 0.5 : 1} />
                {permissions?.packages?.isRead && (
                  <Button
                    color="primary"
                    size="small"
                    variant={isMobile && !isTablet ? 'outlined' : 'contained'}
                    style={isMobile && !isTablet ? { color: 'var(--info-dark)' } : {}}
                    disabled={isOffline}
                    onClick={() => {
                      setAddExistingProductDialog({ open: true, type: 'package', parentId: null });
                    }}
                  >
                    {isMobile && !isTablet ? 'Package' : `Add Product ${routes.packages.title}`}
                  </Button>
                )}
              </Box>
              <Box display="flex">
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  id="demo-positioned-button"
                  onClick={handleClick}
                  disabled={!Boolean(selectedProducts && selectedProducts.filter((e) => !e.hideSelection).length)}
                  endIcon={<BiChevronDown />}
                >
                  Actions
                </Button>
                <Menu
                  anchorEl={anchorEl}
                  keepMounted
                  open={open}
                  onClose={handleClose}
                  getContentAnchorEl={null}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right'
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right'
                  }}
                >
                  <HtmlTooltip
                    title={
                      Boolean(selectedProducts && selectedProducts.filter((e) => !e.hideSelection).length)
                        ? 'Bulk edit selected records'
                        : 'Select records to edit'
                    }
                  >
                    <MenuItem
                      onClick={() => {
                        setIsProductEdit({ open: true, isBulkedit: true });
                        handleClose();
                      }}
                    >
                      Bulk Edit
                    </MenuItem>
                  </HtmlTooltip>
                  <HtmlTooltip
                    title={
                      Boolean(selectedProducts && selectedProducts.filter((e) => !e.hideSelection).length)
                        ? 'Delete selected records'
                        : 'Select records to delete'
                    }
                  >
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
          </Grid>
        )}
        <Grid item xs={12} md={12} sm={12}>
          {columns && rowsData ? (
            <Box
              zIndex={5}
              width={
                stepFullScreen
                  ? '100%'
                  : isTabletScreen
                  ? 'calc(100vw)'
                  : isSmallScreen
                  ? 'calc(100vw)'
                  : showActivity
                  ? '100%'
                  : 'calc(100vw - 103px)'
              }
              height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 345px)'}
            >
              <CustomReactTable
                height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 345px)'}
                columns={columns}
                data={rowsData}
                setWholeRowsCellColor={(rowData) => (!rowData.isValid ? 'error' : '')}
                onSelect={setSelectedProducts}
                childrenProperty="subRows"
                uniqueKey="_id"
                hideSelection={isOffline || !allowedToEdit}
                renderedFrom="rental_management_product_package"
                isClientSideGrid={true}
                onSaveEdit={onSaveEdit}
                material={material}
              />
            </Box>
          ) : (
            <Box p={2} height={500} bgcolor="white">
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </Grid>
      </Grid>
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
        <RentalJobQtyDialog
          onClose={() => {
            setIsProductEdit({ open: false, isBulkedit: false });
            setRecordToUpdate(null);
          }}
          isBulkedit={isProductEdit.isBulkedit}
          handleSaveData={handleSaveData}
          rentalManagementData={rentalManagementData}
          rowData={recordToUpdate}
          material={material}
          selectedProducts={selectedProducts.filter((e) => !e.hideSelection)}
          loading={isUpdating}
          from={'product'}
        />
      )}
      {addExistingProductDialog.open && (
        <AddExistingProductInventory
          renderedFrom={addExistingProductDialog?.type === 'product' ? `${renderedFrom}-product` : `${renderedFrom}-package`}
          isAddingProducts={isAddingProducts}
          addProductInventory={handleAdd}
          handleProductInventoryClose={() => {
            setAddExistingProductDialog({ open: false, type: '', parentId: null });
          }}
          productInventory={[]}
          type={addExistingProductDialog.type}
          rentalManagementData={rentalManagementData}
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
            setAddchildDialog({ open: false, parentId: null, top: null, bottom: null });
          }}
        >
          <MenuList>
            <MenuItem
              onClick={() => {
                setAddExistingProductDialog({ open: true, type: 'product', parentId: addchildDialog.parentId });
                setAddchildDialog({ open: false, parentId: null, top: null, bottom: null });
              }}
            >
              Product
            </MenuItem>
            <MenuItem
              onClick={() => {
                setAddExistingProductDialog({ open: true, type: 'package', parentId: addchildDialog.parentId });
                setAddchildDialog({ open: false, parentId: null, top: null, bottom: null });
              }}
            >
              Package
            </MenuItem>
            {/* <MenuItem
              onClick={() => {
                setAddExistingProductDialog({ open: true, type: 'service', parentId: addchildDialog.parentId })
                setAddchildDialog({ open: false, parentId: null, top: null, bottom: null })
              }
              }
            >
              Services
            </MenuItem> */}
          </MenuList>
        </Popover>
      )}
      {showConfirmationDialog.open && (
        <ConfirmationDialog
          open={true}
          message="Would you prefer to override the product-level price configuration?"
          onOk={() => {
            onConfirmSave(showConfirmationDialog.data?.inputField, showConfirmationDialog.data?.updatedData)
          }}
          onClose={() => {
            setShowConfirmationDialog({open: false, data: {}});
          }}
        />
      )}
      {priceDataDialog.open && (
        <CalculatePriceDialog
          referenceData={rentalManagementData}
          material={priceDataDialog.material}
          handleSucess={(data) => {
            AddMaterial(priceDataDialog.material, data);
          }}
          onClose={() => {
            AddMaterial(priceDataDialog.material, null);
            setPriceDataDialog({ open: false, material: null });
          }}
        />
      )}
    </Fragment>
  );
};

export default Productpackage;
