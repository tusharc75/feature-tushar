import { Box, IconButton, MenuItem, MenuList, Popover } from '@material-ui/core';
import Add from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { startCase } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { AssetAvailabilityIcon } from 'src/assets/svg/svgIcons';
import AssignSerializedAssetDialog from 'src/components/AssignRolesDialog/AssignSerializedAssetDialog';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import CalculatePriceDialog from 'src/components/RentalManagment/CalculatePriceDialog';
import { flattenArray } from 'src/constants/columns';
import { ownerAndColaborator, quotationApprovedMessage, rentalManagementMessage } from 'src/constants/messageHelpers';
import ManagePackageDialog from 'src/pages/Packages/ManagePackageDialog';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { CustomOfflineContext } from '../../../StateProvider/OfflineContext/OfflineContext';
import { useData } from '../../../StateProvider/Provider';
import axiosInstance from '../../../axios/axiosInstance';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import routes from '../../../components/Helpers/Routes';
import {
  calculateRowsField,
  fetch_rental_cost_fields,
  fetch_rental_product_fields,
  getNestedSubRows
} from '../../../components/RentalManagment/helper';
import { autoCalculateSpecificFields } from '../../../constants/formulaUtility';
import { MATERIAL_TYPE, rentalManagement } from '../../../constants/helpers';
import { findOne, objectStore } from '../../../constants/indexdbhelper';
import AssetAvailability from '../AssetAvailability';
import AddExistingProductInventory from './AddExistingProductInventory';
import RentalJobQtyDialog from './RentalJobQtyDialog';
import AdditionalCostDialog from './AdditionalCostDialog';

const Productpackage = ({
  rentalManagementData,
  setNextStep,
  setNextStepToolTip,
  renderedFrom,
  stepFullScreen,
  allowedToEdit,
  quotationApproved
}) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();

  const [isUpdating, setUpdating] = useState(false);

  const [isProductEdit, setIsProductEdit] = useState({ open: false, data: null, showSaveAndNext: false });
  const [isAddingProducts, setAddingProducts] = useState(false);

  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);

  const [material, setMaterial] = useState([]);
  const [isInlineEdit, setIsInlineEdit] = useState(false);
  const [addExistingProductDialog, setAddExistingProductDialog] = useState({ open: false, type: '', parentId: null });
  const [columns, setColumns] = useState(null);
  const [allFields, setAllFields] = useState(null);
  const [addchildDialog, setAddchildDialog] = useState({ open: false, parentId: null, top: null, bottom: null });
  const [showConfirmationDialog, setShowConfirmationDialog] = useState({ open: false, data: null });
  const [priceDataDialog, setPriceDataDialog] = useState({ open: false, material: null });
  const [isBulkEdit, setIsBulkEdit] = useState(false);
  const [openAssetAvailibility, setOpenAssetAvailibility] = useState(false);
  const [costFields, setCostFields] = useState([]);
  const [showCostDialog, setShowCostDialog] = useState({ open: false, data: null, showSaveAndNext: false });

  const { state, dispatch } = useTableReducer();
  const { dataRows, selectedRecords } = state;

  const { generateColumns } = useColumns();
  const [addExistingAssets, setAddExistingAssets] = useState(false);

  const { isOffline } = useContext(CustomOfflineContext);
  const [isRateRequired, setIsRateRequired] = useState(false);

  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    fetchData();
  }, [allFields]);

  useEffect(() => {
    if (allFields) {
      createColumns();
    }
  }, [allFields, allowedToEdit, quotationApproved]);

  const fetchFields = async () => {
    var { visibleFields } = await fetch_rental_product_fields(rentalManagementData?.currency, isOffline);
    const fields = await fetch_rental_cost_fields(rentalManagementData.currency, isOffline);
    setCostFields(fields);
    setAllFields(JSON.parse(JSON.stringify(visibleFields)));
  };

  const createColumns = () => {
    setColumns(null);
    const data = [...allFields];
    if (!allowedToEdit || quotationApproved) {
      data?.forEach((e) => {
        e.isColumnEditable = false;
      });
    }
    const newColumns = generateColumns(
      renderedFrom,
      data?.map((e) => {
        return { ...e, fieldName: e.fieldName === 'qty' ? 'qtyDisplay' : e.fieldName };
      }),
      null,
      false,
      rentalManagementData?.currency
    );
    let column: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>,
        Footer: () => {
          return <>Total</>;
        }
      },
      {
        accessor: 'type',
        Header: 'Type',
        disableFilters: true,
        disabled: true,
        sticky: isMobile || isTablet ? 'none' : 'left',
        width: 200,
        Cell: ({ row }) =>
          row.original['type'] ? (
            <p>
              {`${startCase(row.original?.type)} `}
              {row.original['type'] === MATERIAL_TYPE.product
                ? row.original?.productDetail?.serializedProduct
                  ? '(Serialized)'
                  : '(Non-Serialized)'
                : row.original?.type === MATERIAL_TYPE.package
                  ? row.original?.packageDetail.packageType === 'Product'
                    ? '(Product)'
                    : '(Service)'
                  : row.original.type === MATERIAL_TYPE.service
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
        disabled: true,
        sticky: isMobile || isTablet ? 'none' : 'left',
        Cell: ({ row, table }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {isOffline || !allowedToEdit || quotationApproved ? (
              <p> {row.original.detail}</p>
            ) : (
              <p
                onClick={() => {
                  openMaterial(row, table.getRowModel().rows);
                }}
                className="link text-truncate"
                title={row.original.detail}
              >
                {row.original.detail}
              </p>
            )}
            {row.original.type !== MATERIAL_TYPE.manualEntry && (
              <Box ml={1} className="d-flex align-items-center">
                <span title={`There are ${row.original?.subRows?.length} product(s) in this ${row.original?.type}`}>
                  {row.original?.subRows?.length ? `(${row.original?.subRows?.length})` : null}
                </span>
                {!isOffline && allowedToEdit && !quotationApproved && (
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
            )}
            {!isOffline && row.original.type !== MATERIAL_TYPE.manualEntry && (
              <IconButton
                size="small"
                onClick={() => {
                  if (row.original.type === MATERIAL_TYPE.service) {
                    window.open(`${routes.serviceMasterDetail.path}/${row.original.materialId}`);
                  } else if (row.original.type === MATERIAL_TYPE.product) {
                    window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                  } else if (row.original.type === MATERIAL_TYPE.serializedAsset) {
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
    column = [...column, ...newColumns];
    column.push({
      accessor: 'action',
      Header: 'Actions',
      minWidth: 100,
      width: 100,
      sticky: 'right',
      disableFilters: true,
      disableSortBy: true,
      canDrag: false,
      Cell: ({ row, table }) => {
        return (
          <>
            <HtmlTooltip title={isOffline || !allowedToEdit || quotationApproved ? '' : 'Edit'}>
              <IconButton
                size="small"
                aria-label="Details"
                disabled={isOffline || !allowedToEdit || quotationApproved ? true : false}
                onClick={() => {
                  openMaterial(row, table.getRowModel().rows);
                }}
              >
                <EditIcon fontSize="small" color={isOffline || !allowedToEdit || quotationApproved ? 'disabled' : 'primary'} />
              </IconButton>
            </HtmlTooltip>
            {allowedToEdit || !quotationApproved ? (
              row.original.hideSelection ? (
                <HtmlTooltip
                  title={
                    row.original?.assetQty ? (row?.original?.productDetail?.serializedProduct ? 'Asset is already assigned' : 'Serial Number is already assigned') : row.original?.status ? rentalManagementMessage.loadingAlreadyCreated : ''
                  }
                >
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
            )}
          </>
        );
      }
    });
    setColumns(column);
  };

  const fetchData = async () => {
    setNextStep(false);
    setNextStepToolTip(null);
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    var data: any = [];
    var additionalCosts: any = [];
    var inventory: any = [];
    var nonSerializeAsset: any = [];
    var productSerialNumbers: any = [];
    var nextStepMessage = null;
    if (isOffline) {
      data = await findOne(objectStore.rentalManagement, rentalManagementData._id);
      // data = data?.additionalCost;
      inventory = data.productInventory;
    } else {
      const response = await axiosInstance().get(`${rentalManagement.api}/productpackage/${rentalManagementData._id}`);
      const additionalData = await axiosInstance().get(`${rentalManagement.api}/additionalcost/${rentalManagementData._id}`);
      data = response?.data?.data;
      additionalCosts = additionalData?.data?.data;
      additionalCosts = additionalCosts?.map((e: any) => {
        return { ...e, type: MATERIAL_TYPE.manualEntry };
      });
      setMaterial(JSON.parse(JSON.stringify(data.material)));
      inventory = data.inventory?.filter((e) => !e.isReplaced);
      nonSerializeAsset = data.nonSerializeAsset;
      productSerialNumbers = data.productSerialNumbers;
    }

    let rows = data.material.filter((e) => e.parentId === null).filter((e) => e.type !== MATERIAL_TYPE.service);
    let products = rows.filter((e) => e.type === MATERIAL_TYPE.product && !e?.isConsumbale);
    let packages = rows.filter((e) => e.type === MATERIAL_TYPE.package && e.packageDetail?.packageType !== 'Service');

    rows = [...products, ...packages, ...additionalCosts];

    const isPriceRequired = allFields?.filter((el) => el.fieldName === 'price' && el.required).length > 0;
    setIsRateRequired(isPriceRequired);

    rows.forEach((parent, i) => {
      parent.index = i + 1;
      parent.detail = `${parent.type === MATERIAL_TYPE.service
        ? parent.serviceDetail
          ? parent.serviceDetail?.serviceName
          : parent.packageDetail?.packageName
        : parent.type === MATERIAL_TYPE.product
          ? parent.productDetail?.productName
          : parent.type === MATERIAL_TYPE.manualEntry
            ? parent.detail
            : parent.packageDetail?.packageName
        }`;
      parent.description =
        parent.type === MATERIAL_TYPE.service
          ? parent?.serviceDetail?.serviceDescription || ''
          : parent.type === MATERIAL_TYPE.product
            ? parent?.productDetail?.productDescription || ''
            : parent.type === MATERIAL_TYPE.package
              ? parent?.packageDetail?.packageDescription || ''
              : parent.description;
      parent.serializedProduct = parent.type === MATERIAL_TYPE.product ? parent.productDetail?.serializedProduct : false;
      parent.qtyDisplay = parent.qty;
      parent.isValid = parent['finalPrice_' + rentalManagementData?.currency?.toLowerCase()] ? true : !isPriceRequired;
      if (!parent.isValid) {
        nextStepMessage = rentalManagementMessage.validPrice;
      }
      parent.assetQty = parent.serializedProduct
        ? inventory?.filter((e) => e._id === parent._id).length + productSerialNumbers?.filter((e) => e._id === parent._id).length
        : nonSerializeAsset?.filter((e) => e._id === parent._id).length;
      parent.hideSelection = parent?.assetQty > 0 ||
        data.inventory?.filter((e) => e.isReplaced && e._id === parent._id)?.length ? true : parent?.status ? true : false;
      parent.subRows = generateNestedData(data.material, inventory, nonSerializeAsset, productSerialNumbers, parent, isPriceRequired);
      if (parent.type === MATERIAL_TYPE.package && parent.subRows?.length === 0 && !nextStepMessage) {
        nextStepMessage = rentalManagementMessage.addProductInPackage;
      }
    });

    if (rows.filter((_rows) => _rows.isValid === false).length > 0 || rows.length === 0) {
      setNextStep(false);
      setNextStepToolTip(nextStepMessage || rentalManagementMessage.addProductPackage);
    } else {
      setNextStep(true);
      setNextStepToolTip(null);
    }
    dispatch({ type: 'initialize', data: rows, count: rows?.length });
    dispatch({ type: 'loading', loading: false });
  };

  const generateNestedData = (material, inventory, nonSerializeAsset, productSerialNumbers, parent, isPriceRequired) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, j) => {
      _subRow.index = parent.index + '.' + (j + 1);
      _subRow.detail = `${_subRow.type === MATERIAL_TYPE.service
        ? _subRow.serviceDetail?.serviceName
        : _subRow.type === MATERIAL_TYPE.package
          ? _subRow.packageDetail?.packageName
          : _subRow.type === MATERIAL_TYPE.product
            ? _subRow.productDetail?.productName
            : ''
        } `;
      _subRow.description =
        _subRow.type === MATERIAL_TYPE.service
          ? _subRow?.serviceDetail?.serviceDescription || ''
          : _subRow.type === MATERIAL_TYPE.product
            ? _subRow?.productDetail?.productDescription || ''
            : _subRow.type === MATERIAL_TYPE.package
              ? _subRow?.packageDetail?.packageDescription || ''
              : '';
      _subRow.serializedProduct = _subRow?.productDetail?.serializedProduct;
      _subRow.qtyDisplay = `${parent.qtyDisplay * _subRow.qty} `;
      _subRow.isValid = _subRow['finalPrice_' + rentalManagementData?.currency?.toLowerCase()] ? true : !isPriceRequired;
      _subRow.assetQty = _subRow.serializedProduct
        ? inventory?.filter((e) => e._id === _subRow._id).length + productSerialNumbers?.filter((e) => e._id === _subRow._id).length
        : nonSerializeAsset?.filter((e) => e._id === _subRow._id).length;
      _subRow.hideSelection = _subRow?.assetQty > 0 ? true : _subRow?.status ? true : false;
      _subRow.subRows = generateNestedData(material, inventory, nonSerializeAsset, productSerialNumbers, _subRow, isPriceRequired);
    });
    if (subRows.length === 0 && parent.type === MATERIAL_TYPE.package) {
      parent.isValid = false;
    }
    if (subRows?.length && !parent.hideSelection) {
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
      element.type = d?.type || addExistingProductDialog.type;
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
  };

  const handleAddAsset = async (rows) => {
    setAddingProducts(true);
    const assetIds = rows?.map((item) => item._id);
    axiosInstance()
      .post(`${rentalManagement.api}/productpackage/${rentalManagementData._id}/assets`, {
        ids: assetIds
      })
      .then(() => {
        setAddExistingAssets(false);
        setAddingProducts(false);
        fetchData();
      })
      .catch((error) => {
        setAddingProducts(false);
        toastConfig.setToastConfig(error);
      });
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
        delete element.listPrice;
      });
    }
    axiosInstance()
      .post(`${rentalManagement.api}/productpackage/${rentalManagementData._id}`, { material: tempMaterial })
      .then(() => {
        setAddExistingProductDialog({ open: false, type: '', parentId: null });
        fetchData();
        setAddingProducts(false);
        setPriceDataDialog({ open: false, material: null });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setAddingProducts(false);
        setPriceDataDialog({ open: false, material: null });
      });
  };

  const handleAddCost = (rows) => {
    setUpdating(true);
    axiosInstance()
      .post(`${rentalManagement.api}/additionalcost/${rentalManagementData._id}/add`, { additionalCost: rows })
      .then(() => {
        fetchData();
        setShowCostDialog({ open: false, data: null, showSaveAndNext: false });
        setUpdating(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setUpdating(false);
      });
  };

  const handleSaveData = async (rows: any, saveAndNext = false) => {
    setUpdating(true);
    axiosInstance()
      .put(`${rentalManagement.api}/productpackage/${rentalManagementData._id}`, { material: rows })
      .then(() => {
        fetchData();
        if (saveAndNext) {
          const row = flattenArray(dataRows).find((ele) => ele._id === rows[0]?._id);
          if (!row?.parentId) {
            const rowIndex = dataRows?.findIndex((d) => d._id === rows[0]?._id);
            if (dataRows[rowIndex + 1]?.type === MATERIAL_TYPE.manualEntry) {
              setIsProductEdit({
                open: false,
                data: null,
                showSaveAndNext: false
              });
              setShowCostDialog({ open: true, data: dataRows[rowIndex + 1], showSaveAndNext: rowIndex + 1 < dataRows?.length - 1 ? true : false });
            } else {
              setIsProductEdit({ open: true, data: dataRows[rowIndex + 1], showSaveAndNext: rowIndex + 1 < dataRows?.length - 1 ? true : false });
            }
          } else {
            const allSubRowData = flattenArray(dataRows).filter((ele) => ele.parentId === row.parentId);
            const subRowIdx = allSubRowData?.findIndex((d) => d._id === row?._id);
            setIsProductEdit({
              open: true,
              data: allSubRowData[subRowIdx + 1],
              showSaveAndNext: subRowIdx + 1 < allSubRowData?.length - 1 ? true : false
            });
          }
        } else {
          setIsProductEdit({ open: false, data: null, showSaveAndNext: false });
        }
        setUpdating(false);
        setIsBulkEdit(false);
      })
      .catch((error) => {
        setUpdating(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleSaveCostData = async (rows: any, saveAndNext = false) => {
    setUpdating(true);
    axiosInstance()
      .put(`${rentalManagement.api}/additionalcost/${rentalManagementData._id}/update`, { additionalCost: rows })
      .then(({ data }) => {
        setUpdating(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });

        if (saveAndNext) {
          const rowIndex = dataRows.findIndex((d) => d._id === rows[0]?._id);
          if (dataRows[rowIndex + 1]?.type === MATERIAL_TYPE.manualEntry) {
            setShowCostDialog({ open: true, data: dataRows[rowIndex + 1], showSaveAndNext: rowIndex + 1 < dataRows?.length - 1 ? true : false });
          } else {
            setShowCostDialog({ open: false, data: null, showSaveAndNext: false });
            setIsProductEdit({
              open: true,
              data: dataRows[rowIndex + 1],
              showSaveAndNext: rowIndex + 1 < dataRows?.length - 1 ? true : false
            });
          }
        } else {
          setShowCostDialog({ open: false, data: null, showSaveAndNext: false });
        }
        fetchData();
      })
      .catch((error) => {
        setUpdating(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleDelete = (rows) => {
    setDeleting(true);
    const cost = rows?.filter((ele) => ele.type === MATERIAL_TYPE.manualEntry).map((e) => e?.id);
    const products = rows?.filter((ele) => ele.type !== MATERIAL_TYPE.manualEntry);
    if (products?.length) {
      axiosInstance()
        .put(`${rentalManagement.api}/productpackage/${rentalManagementData?._id}/delete`, { ids: products })
        .then(() => {
          setDeleting(false);
          fetchData();
          setDeleteData(null);
        })
        .catch((error) => {
          setDeleting(false);
          toastConfig.setToastConfig(error);
          setDeleteData(null);
        });
    }
    if (cost?.length) {
      axiosInstance()
        .post(`${rentalManagement.api}/additionalcost/${rentalManagementData._id}/delete`, { ids: cost })
        .then(() => {
          fetchData();
          setDeleting(false);
          setDeleteData(null);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setDeleteData(null);
        });
    }
  };

  const openMaterial = (data, rows) => {
    let showSaveAndNext;
    if (data.depth != 0) {
      const allRows = rows.filter((ele) => ele.parentId === data.parentId);
      showSaveAndNext = data?.index < allRows.length - 1 ? true : false;
    } else {
      showSaveAndNext = data?.index < rows?.filter((e) => e?.depth === 0)?.length - 1 && data?.depth === 0 ? true : false;
    }
    if (data?.original?.type === MATERIAL_TYPE.manualEntry) {
      setShowCostDialog({ open: true, data: data.original, showSaveAndNext: data?.index < rows?.length - 1 ? true : false });
    } else {
      setIsProductEdit({
        open: true,
        data: data.original,
        showSaveAndNext: showSaveAndNext
      });
    }
    setIsBulkEdit(false);
  };

  const handleOpen = (data) => {
    setIsProductEdit({ open: true, data: data, showSaveAndNext: false });
    setIsBulkEdit(false);
  };

  const handleDeleteMultiple = () => {
    const obj: any = [];
    const dataToDelete = selectedRecords && selectedRecords.filter((e) => !e.hideSelection);
    dataToDelete?.forEach((ele) => {
      obj.push({ id: ele._id, type: ele.type, materialId: ele.materialId });
    });
    dataToDelete?.forEach((ele) => {
      getNestedSubRows(obj, ele);
    });
    setDeleteData(obj);
  };

  const onSaveInlineEdit = (inputField, updatedData) => {
    setIsInlineEdit(true);
    const currency = rentalManagementData?.currency.toLowerCase();
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

    for (const field of Object.keys(inputField)) {
      if (inputField[field] === '' || isNaN(inputField[field])) {
        requiredItems.push(field);
      }
    }

    if (requiredItems.length > 0 && updatedData.type !== MATERIAL_TYPE.manualEntry) {
      handleOpen({
        ...updatedData,
        detail: updatedData.type === 'product' ? updatedData?.productDetail?.productName : updatedData?.packageDetail?.packageName
      });
    } else {
      onConfirmSave(inputField, updatedData);
    }
  };

  const onConfirmSave = async (inputField, updatedData) => {
    const rowData = flattenArray(dataRows)?.find((d) => d._id === updatedData._id);
    if (rowData.parentId && !showConfirmationDialog.open && isRateRequired) {
      setShowConfirmationDialog({
        open: true,
        data: {
          inputField,
          updatedData
        }
      });
    } else {
      if (inputField.hasOwnProperty('qtyDisplay')) {
        inputField['qty'] = inputField['qtyDisplay'];
        if (rowData.hideSelection && inputField['qty'] < rowData?.assetQty) {
          toastConfig.setToastConfig({
            open: true,
            type: 'error',
            message: 'The quantity is less than what was assigned.'
          });
          setShowConfirmationDialog({ open: false, data: {} });
          return;
        }
      }
      let rows: any = [{ ...rowData, ...updatedData }];
      if (updatedData.type === MATERIAL_TYPE.manualEntry) {
        rows = await calculateRowsField(flattenArray(dataRows), inputField, costFields, updatedData);
        handleSaveCostData(rows);
      } else {
        rows = await calculateRowsField(material, inputField, allFields, updatedData);
        handleSaveData(rows);
      }
      setShowConfirmationDialog({ open: false, data: {} });
    }
  };

  const addButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          onClick={() => {
            setAddExistingProductDialog({ open: true, type: 'product', parentId: null });
          }}
        >
          Add Existing Products
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAddExistingProductDialog({ open: true, type: 'package', parentId: null });
          }}
        >
          Add Existing Packages
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAddExistingProductDialog({ open: true, type: 'newPackage', parentId: null });
          }}
        >
          Add New Product Package
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAddExistingAssets(true);
          }}
        >
          {`Add Existing ${routes.serializedAsset.title}`}
        </MenuItem>
        {costFields?.length > 0 && (
          <MenuItem
            onClick={() => {
              setShowCostDialog({ open: true, data: null, showSaveAndNext: false });
            }}
          >
            Add Manual Entry
          </MenuItem>
        )}
      </>
    );
  };

  const rightSideContents = () => {
    return (
      <>
        {flattenArray(dataRows)?.filter((e) => e?.serializedProduct)?.length > 0 && (
          <HtmlTooltip title="Check Assets Availability" arrow placement="top">
            <IconButton
              size="small"
              aria-label="Details"
              onClick={() => {
                setOpenAssetAvailibility(true);
              }}
            >
              <AssetAvailabilityIcon color={'var(--dark-primary-text, #163340)'} size={24} />
            </IconButton>
          </HtmlTooltip>
        )}
      </>
    );
  };

  const actionButtonmenuItems = () => {
    return (
      <>
        <HtmlTooltip
          title={
            Boolean(selectedRecords && selectedRecords.filter((e) => !e.hideSelection).length)
              ? 'Bulk edit selected records'
              : 'Select records to edit'
          }
          enterTouchDelay={0}
          arrow
          placement="top"
        >
          <MenuItem
            disabled={selectedRecords.some((e) => e.type === MATERIAL_TYPE.manualEntry)}
            onClick={() => {
              setIsProductEdit({ open: true, data: null, showSaveAndNext: false });
              setIsBulkEdit(true);
            }}
          >
            Bulk Edit
          </MenuItem>
        </HtmlTooltip>
        <HtmlTooltip
          title={
            Boolean(selectedRecords && selectedRecords.filter((e) => !e.hideSelection).length)
              ? 'Delete selected records'
              : 'Select records to delete'
          }
          enterTouchDelay={0}
          arrow
          placement="top"
        >
          <MenuItem
            disabled={isDeleting}
            onClick={() => {
              handleDeleteMultiple();
            }}
          >
            Delete
          </MenuItem>
        </HtmlTooltip>
      </>
    );
  };

  return (
    <Fragment>
      <DetailsPageHeader
        isAddButtonVisible={true}
        addButtonMenuItems={addButtonMenuItems()}
        addButtonProps={{
          disabled: !allowedToEdit || quotationApproved,
          tooltip: !allowedToEdit ? ownerAndColaborator : quotationApproved ? quotationApprovedMessage : ``
        }}
        isActionButtonVisible={true}
        actionButtonMenuItems={actionButtonmenuItems()}
        actionButtonProps={{ disabled: !Boolean(selectedRecords && selectedRecords.filter((e) => !e.hideSelection).length) }}
        rightSideContents={rightSideContents()}
        hasXpadding
      />

      {columns ? (
        <Box zIndex={5}>
          <CustomReactTable
            height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            refreshGrid={fetchData}
            setWholeRowsCellColor={(rowData) => (!rowData.isValid ? 'error' : '')}
            hideSelection={isOffline || !allowedToEdit || quotationApproved}
            hideAction={isOffline || !allowedToEdit || quotationApproved}
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
            onSaveEdit={onSaveInlineEdit}
            expander={true}
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
      {isProductEdit.open && (
        <RentalJobQtyDialog
          onClose={() => {
            setIsProductEdit({ open: false, data: null, showSaveAndNext: false });
            setIsBulkEdit(false);
            if (isInlineEdit) {
              setIsInlineEdit(false);
            }
          }}
          isBulkedit={isBulkEdit}
          handleSaveData={handleSaveData}
          rentalManagementData={rentalManagementData}
          rowData={!isBulkEdit ? isProductEdit.data : selectedRecords}
          material={material}
          selectedProducts={selectedRecords.filter((e) => !e.hideSelection)}
          loading={isUpdating}
          showSaveAndNext={isProductEdit.showSaveAndNext}
          from={'product'}
          isInlineEdit={isInlineEdit}
          isRateRequired={isRateRequired}
        />
      )}
      {addExistingProductDialog.open && addExistingProductDialog.type === 'newPackage' && (
        <ManagePackageDialog
          referenceData={{ packageType: 'Product', customerAccount: rentalManagementData?.customerAccount?.optionValue }}
          isClone={false}
          open={addExistingProductDialog.open}
          packageId={null}
          onClose={() => setAddExistingProductDialog({ open: false, type: '', parentId: null })}
          onSuccess={(data) => {
            data.type = 'package';
            data.unitMain = data?.unit;
            data.pricingMethodMain = data?.pricingMethod;
            handleAdd([data]);
            setAddExistingProductDialog({ open: false, type: '', parentId: null });
          }}
          isRedirectToDetailPage={false}
        />
      )}
      {addExistingAssets && (
        <AssignSerializedAssetDialog
          reference={'rentalJob'}
          referenceData={{ warehouse: rentalManagementData?.warehouse?.optionValue, rentalJob: rentalManagementData._id }}
          isAssigning={isAddingProducts}
          handleClose={() => setAddExistingAssets(false)}
          handleSucess={handleAddAsset}
          ids={[]}
        />
      )}
      {addExistingProductDialog.open && addExistingProductDialog.type !== 'newPackage' && (
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
              Add Existing Products
            </MenuItem>
            <MenuItem
              onClick={() => {
                setAddExistingProductDialog({ open: true, type: 'package', parentId: addchildDialog.parentId });
                setAddchildDialog({ open: false, parentId: null, top: null, bottom: null });
              }}
            >
              Add Existing Packages
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
            onConfirmSave(showConfirmationDialog.data?.inputField, showConfirmationDialog.data?.updatedData);
          }}
          onClose={() => {
            setShowConfirmationDialog({ open: false, data: {} });
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
      {openAssetAvailibility && (
        <AssetAvailability
          rentalId={rentalManagementData?._id}
          handleClose={() => {
            setOpenAssetAvailibility(false);
          }}
        />
      )}
      {showCostDialog.open && (
        <AdditionalCostDialog
          onClose={() => {
            setShowCostDialog({ open: false, data: null, showSaveAndNext: false });
          }}
          handleAddCost={handleAddCost}
          handleUpdateCost={handleSaveCostData}
          currency={rentalManagementData?.currency}
          costData={showCostDialog.data}
          loadingEdit={isUpdating}
          showSaveAndNext={showCostDialog.showSaveAndNext}
        />
      )}
    </Fragment>
  );
};

export default Productpackage;
