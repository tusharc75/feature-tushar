import { Box, Button, IconButton, Menu, MenuItem, MenuList, Popover } from '@material-ui/core';
import Add from '@material-ui/icons/Add';
import DateRangeIcon from '@material-ui/icons/DateRange';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import { isArray, startCase, uniqBy } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import AssignPackageDialog from 'src/components/AssignRolesDialog/AssignPackageDialog';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import AssignSerializedAssetDialog from 'src/components/AssignRolesDialog/AssignSerializedAssetDialog';
import AssignServiceDialog from 'src/components/AssignRolesDialog/AssignServiceDialog';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { calculateRowsField, getNestedSubRows } from 'src/components/RentalManagment/helper';
import { flattenArray } from 'src/constants/columns';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../../StateProvider/Provider';
import axiosInstance from '../../../axios/axiosInstance';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import routes from '../../../components/Helpers/Routes';
import { autoCalculateSpecificFields } from '../../../constants/formulaUtility';
import {
  CHILD_RESOURCE,
  MATERIAL_TYPE,
  PRICING_SETUP_TYPE,
  QUOTATION_TYPE,
  SERVICE_TYPE,
  pricingCondition,
  quotation,
  sidebarResource,
  supplierContact
} from '../../../constants/helpers';
import AskSupplierPriceDialog from './AskSupplierPriceDialog';
import PriceRequestDialog from './PriceRequestDialog';
import QuotationQtyDialog from './QuotationQtyDialog';
import AdditionalCostDialog from './AdditionalCostDialog';
import { fetch_child_resource_fields, fetch_child_resource_fields_perm } from 'src/components/ChildResourceField';
import { FiExternalLink } from 'react-icons/fi';
import ManageLeadTime from 'src/components/LeadTime/ManageLeadTime';

const Productpackage = ({ quotationData, fetchQuotationData, setNextStep, renderedFrom, stepFullScreen, version, allowedToEdit, updateDOASetup }) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();
  const { generateColumns } = useColumns();
  const { state, dispatch } = useTableReducer();
  const { dataRows, selectedRecords } = state;
  const [isUpdating, setUpdating] = useState(false);

  const [isProductEdit, setIsProductEdit] = useState({ open: false, isBulkedit: false, showSaveAndNext: false });
  const [isSubmitting, setSubmitting] = useState(false);
  const [recordToUpdate, setRecordToUpdate] = useState(null);

  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);

  const [material, setMaterial] = useState([]);
  const [addDialog, setAddDialog] = useState({ open: false, type: '', parentId: null });
  const [addchildDialog, setAddchildDialog] = useState({
    open: false,
    parentId: null,
    parentType: null,
    serializedProduct: false,
    top: null,
    bottom: null
  });
  const [columns, setColumns] = useState(null);
  const [allFields, setAllFields] = useState([]);
  const [requestDialog, setRequestDialog] = useState(false);
  const [askSupplierPriceDialog, setAskSupplierPriceDialog] = useState(false);
  const [supplierContactData, setSupplierContactData] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [leadTimeDialog, setLeadTimeDialog] = useState({ open: false, data: null });
  const [products, setProducts] = useState([]);
  const [isRateRequired, setIsRateRequired] = useState(false);
  const [showCostDialog, setShowCostDialog] = useState({ open: false, showSaveAndNext: false });
  const [costFields, setCostFields] = useState([]);
  const versionId = quotationData?.versions[version]?._id || null;

  useEffect(() => {
    fetchFields();
  }, [version]);

  useEffect(() => {
    if (version) {
      fetchData();
    }
  }, [version, columns]);

  const fetchFields = async () => {
    var data = await fetch_child_resource_fields_perm(CHILD_RESOURCE.quotationProduct, quotationData?.currency, allowedToEdit);
    setAllFields(JSON.parse(JSON.stringify(data)));
    data = data?.filter((f) => f?.isRead);
    var c_fields = await fetch_child_resource_fields_perm(CHILD_RESOURCE.quotationCost, quotationData?.currency, allowedToEdit);
    c_fields = c_fields?.filter((f) => f?.isRead);
    setCostFields(c_fields);
    const newColumns: any = generateColumns(renderedFrom, data, null, false, quotationData?.currency);
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
        sticky: isMobile || isTablet ? 'none' : 'left',
        width: 100,
        Cell: ({ row }) =>
          <div>
            <p className="text-truncate">
              {row.original.type === MATERIAL_TYPE.serializedAsset ? 'Asset' : `${startCase(row.original.type)} `}
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
          </div>
      },
      {
        accessor: 'detail',
        Header: 'Details',
        minWidth: 300,
        width: 300,
        disabled: true,
        sticky: isMobile || isTablet ? 'none' : 'left',
        Cell: ({ row, table }) => (
          <div className="flex items-center gap-2">
            {row.original.type === MATERIAL_TYPE.serializedAsset || !allowedToEdit ? (
              <p>{row.original?.detail}</p>
            ) : (
              <p
                onClick={() => {
                  openMaterial(row, table.getRowModel().rows);
                }}
                className="link text-truncate"
                title={row.original?.detail}
              >
                {row.original?.detail}
              </p>
            )}
            {row.original?.subRows?.length ? (
              <>
                <span>({row.original?.subRows?.length})</span>
              </>
            ) : null}
            {allowedToEdit && ![MATERIAL_TYPE.serializedAsset, MATERIAL_TYPE.manualEntry]?.includes(row.original.type) && (
              quotationData?.type === QUOTATION_TYPE.fieldJob &&
                row.original.type === MATERIAL_TYPE.product ? null :
                <HtmlTooltip title="Add ">
                  <IconButton
                    onClick={(event) =>
                      setAddchildDialog({
                        open: true,
                        parentId: row.original?._id,
                        parentType: row.original.type,
                        serializedProduct: row.original?.serializedProduct,
                        top: event.clientY,
                        bottom: event.clientX
                      })
                    }
                    size="small"
                  >
                    <Add color="disabled" fontSize="small" />
                  </IconButton>
                </HtmlTooltip>
            )}
            {row.original.type !== MATERIAL_TYPE.manualEntry && (
              <IconButton
                size="small"
                onClick={() => {
                  window.open(
                    `${row.original.type === MATERIAL_TYPE.serializedAsset
                      ? routes.serializedAssetDetail.path
                      : row.original.type === MATERIAL_TYPE.product
                        ? routes.productDetail.path
                        : row.original.type === MATERIAL_TYPE.package
                          ? routes.packagesDetail.path
                          : routes.serviceMasterDetail.path
                    }/${row.original.materialId}`
                  );
                }}
              >
                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
              </IconButton>
            )}
          </div>
        )
      },
      {
        accessor: 'leadTime',
        Header: 'Lead Time (Days)',
        Cell: ({ row }) => <div> {(row.original['leadTime'] ? <p>{row.original['leadTime']}</p> : 0)} </div>,
        Footer: (info) => {
          let rows = info.table.getExpandedRowModel().rows;
          const total = rows
            ?.filter((f) => f.original.hasOwnProperty('leadTime') && !isNaN(f.original['leadTime']))
            .reduce((sum, row) => parseInt(row.original['leadTime']) + sum, 0);
          return <div>{total}</div>;
        }
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
      minWidth: 100,
      width: 150,
      sticky: 'right',
      disableFilters: true,
      disableSortBy: true,
      canDrag: false,
      Cell: ({ row, table }) => (
        <>
          {row.original.type !== MATERIAL_TYPE.serializedAsset && (
            <HtmlTooltip title={allowedToEdit ? 'Edit' : ''}>
              <IconButton
                size="small"
                aria-label="Delete"
                disabled={!allowedToEdit}
                onClick={() => {
                  openMaterial(row, table.getRowModel().rows);
                }}
              >
                <EditIcon fontSize="small" color={allowedToEdit ? 'primary' : 'disabled'} />
              </IconButton>
            </HtmlTooltip>
          )}
          {!row.original.hideSelection && (
            <>
              {row.original.type !== MATERIAL_TYPE.serializedAsset && (
                <IconButton
                  size="small"
                  aria-label="Details"
                  onClick={() => {
                    setLeadTimeDialog({ open: true, data: row.original });
                  }}
                >
                  <DateRangeIcon fontSize="small" color="primary" />
                </IconButton>
              )}
              <HtmlTooltip title={'Delete'}>
                <IconButton
                  size="small"
                  aria-label="Delete"
                  onClick={() => {
                    const obj: any = [{ id: row.original._id, type: row.original?.type, materialId: row.original?.materialId }];
                    getNestedSubRows(obj, row.original);
                    setDeleteData(obj);
                  }}
                >
                  <DeleteIcon fontSize="small" color="error" />
                </IconButton>
              </HtmlTooltip>
            </>
          )}
        </>
      )
    });
    setColumns(column);
  };

  const fetchData = async () => {
    setNextStep(false);
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    var data: any = [];
    const response = await axiosInstance().get(`${quotation.api}/productpackage/${quotationData._id}/${versionId}`);
    const additionalCost = await axiosInstance().get(`${quotation.api}/additionalcost/${quotationData._id}/${versionId}`);
    const additionalData = additionalCost?.data?.data || [];
    const updatedAdditionalData = additionalData?.map((e: any) => {
      return { ...e, type: MATERIAL_TYPE.manualEntry };
    })

    data = response?.data?.data;
    setMaterial(JSON.parse(JSON.stringify(data.material)));
    let rows = data.material.filter((e) => e.parentId === null);
    rows = [...rows, ...updatedAdditionalData]
    rows.forEach((parent, i) => {
      parent.index = i + 1;
      parent.detail = `${parent.type === MATERIAL_TYPE.serializedAsset
        ? parent.serializedAssetDetail?.assetNumber
        : parent.type === MATERIAL_TYPE.product
          ? parent.productDetail?.productName
          : parent.type === MATERIAL_TYPE.service
            ? parent.serviceDetail?.serviceName
            : parent.type === MATERIAL_TYPE.package
              ? parent.packageDetail?.packageName
              : parent.detail
        }`;
      parent.description =
        parent.type === MATERIAL_TYPE.service
          ? parent?.serviceDetail?.serviceDescription || ''
          : parent.type === MATERIAL_TYPE.product
            ? parent?.productDetail?.productDescription || ''
            : parent.type === MATERIAL_TYPE.package
              ? parent?.packageDetail?.packageDescription || ''
              : parent.description;
      parent.serializedProduct = parent?.productDetail?.serializedProduct || false;
      parent.qtyDisplay = parent.qty;
      parent.leadTimeData = Array.isArray(parent.leadTime) ? parent.leadTime : [];
      parent.leadTime = Array.isArray(parent.leadTime) ? `${parent?.leadTime?.reduce((acc, e) => acc + parseInt(e?.days || 0), 0) || 0}` : 0;
      parent.isValid = parent['finalPrice_' + quotationData?.currency?.toLowerCase()] ? true : !isRateRequired;
      parent.subRows = generateNestedData(data.material, parent);
    });
    if (rows.filter((_rows) => _rows.isValid === false).length > 0 || rows.length === 0) {
      setNextStep(false);
    } else {
      setNextStep(true);
    }
    dispatch({ type: 'initialize', data: rows, count: rows?.length });
    dispatch({ type: 'loading', loading: false });
    updateDOASetup(data?.doasetup);
  };

  const generateNestedData = (material, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, index) => {
      _subRow.index = parent.index + '.' + `${index + 1}`;
      _subRow.detail = `${_subRow.type === MATERIAL_TYPE.serializedAsset
        ? _subRow.serializedAssetDetail?.assetNumber
        : _subRow.type === MATERIAL_TYPE.product
          ? _subRow.productDetail?.productName
          : _subRow.type === MATERIAL_TYPE.service
            ? _subRow.serviceDetail?.serviceName
            : _subRow.packageDetail?.packageName
        }`;
      _subRow.description =
        _subRow.type === MATERIAL_TYPE.service
          ? _subRow?.serviceDetail?.serviceDescription || ''
          : _subRow.type === MATERIAL_TYPE.product
            ? _subRow?.productDetail?.productDescription || ''
            : _subRow.type === MATERIAL_TYPE.package
              ? _subRow?.packageDetail?.packageDescription || ''
              : '';
      _subRow.serializedProduct = _subRow?.productDetail?.serializedProduct || false;
      _subRow.qtyDisplay = _subRow.qty * parent.qty;
      _subRow.leadTimeData = Array.isArray(_subRow.leadTime) ? _subRow.leadTime : [];
      _subRow.leadTime = Array.isArray(_subRow.leadTime) ? `${_subRow?.leadTime?.reduce((acc, e) => acc + parseInt(e?.days || 0), 0) || 0}` : 0;
      _subRow.isValid = _subRow['finalPrice_' + quotationData?.currency?.toLowerCase()] ? true : !isRateRequired;

      if (_subRow.type === MATERIAL_TYPE.serializedAsset) {
        _subRow.isValid = true;
      }
      _subRow.subRows = generateNestedData(material, _subRow);
    });
    if (subRows.length === 0 && parent.type === MATERIAL_TYPE.package) {
      parent.isValid = false;
    }
    if (parent.type === MATERIAL_TYPE.package) {
      parent.hideSelection = subRows.filter((e) => e.hideSelection).length ? true : false;
    }
    return subRows;
  };

  const handleAdd = async (rows) => {
    setSubmitting(true);
    const material: any = [];
    rows.forEach((d) => {
      const element: any = {};
      element.materialId = d._id;
      element.type = addDialog.type;
      if (addDialog.type !== MATERIAL_TYPE.serializedAsset) {
        element.unit = d?.unit && d?.unitMain?.length ? d?.unitMain[0] : '';
        if (quotationData?.estimateStartDate && quotationData?.estimateEndDate) {
          element.pricingMethod = d.pricingMethodMain && d.pricingMethodMain.length ? d.pricingMethodMain[0] : '';
          element.estimateStartDate = quotationData?.estimateStartDate;
          element.estimateEndDate = quotationData?.estimateEndDate;
          const calValues = autoCalculateSpecificFields({ pricingMethod: element.pricingMethod }, element, allFields);
          element.estimateJobDuration = 1;
          if (calValues && calValues['estimateJobDuration']) {
            element.estimateJobDuration = calValues['estimateJobDuration'];
          }
        }
      }
      element.qty = d.qty ? parseFloat(d.qty) : 1;
      element.parentId = addDialog?.parentId || d.parentId;
      material.push(element);
    });

    const priceData: any = await calculatePrice(material);
    material.forEach((element) => {
      const rateResult = priceData?.filter(
        (e) =>
          e.materialId === element.materialId &&
          e.materialType === element.type &&
          e.unit === element.unit &&
          e.pricingMethod === element.pricingMethod
      );
      if (rateResult.length && rateResult[0].mrp) {
        const priceFieldName = `price_${quotationData?.currency?.toLowerCase()}`;
        element[priceFieldName] = rateResult[0].mrp;
        const calValues = autoCalculateSpecificFields(
          { [priceFieldName]: rateResult[0].mrp, pricingCondition: rateResult[0].conditionId },
          element,
          allFields
        );
        Object.assign(element, calValues);
      }
    });

    axiosInstance()
      .post(`${quotation.api}/productpackage/${quotationData._id}/${versionId}`, { material })
      .then(() => {
        setAddDialog({ open: false, type: '', parentId: null });
        fetchData();
        fetchQuotationData(version);
        setSubmitting(false);
      })
      .catch((error) => {
        setSubmitting(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleAddCost = (rows) => {
    setUpdating(true);
    axiosInstance()
      .post(`${quotation.api}/additionalcost/${quotationData._id}/${versionId}/add`, { additionalCost: rows })
      .then(({ data }) => {
        setUpdating(false);
        fetchData();
        setShowCostDialog({ open: false, showSaveAndNext: false });
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
      })
      .catch((error) => {
        setUpdating(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleSaveData = async (rows: any, saveAndNext = false) => {
    setUpdating(true);
    axiosInstance()
      .put(`${quotation.api}/productpackage/${quotationData._id}/${versionId}`, { material: rows })
      .then(({ data }) => {
        setUpdating(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        if (saveAndNext) {
          const row = flattenArray(dataRows).find((ele) => ele._id === rows[0]?._id);
          if (!row?.parentId) {
            const rowIndex = dataRows.findIndex((d) => d._id === rows[0]?._id);
            setRecordToUpdate(dataRows[rowIndex + 1]);
            if (dataRows[rowIndex + 1]?.type === MATERIAL_TYPE.manualEntry) {
              setIsProductEdit({
                open: false,
                isBulkedit: false,
                showSaveAndNext: false
              });
              setShowCostDialog({ open: true, showSaveAndNext: rowIndex + 1 < dataRows?.length - 1 ? true : false });
            } else {
              setIsProductEdit({
                open: true,
                isBulkedit: false,
                showSaveAndNext: rowIndex + 1 < dataRows?.length - 1 ? true : false
              });
            }
          } else {
            const allSubRowData = flattenArray(dataRows).filter((ele) => ele.parentId === row.parentId);
            const subRowIdx = allSubRowData?.findIndex((d) => d._id === row?._id);
            setRecordToUpdate(allSubRowData[subRowIdx + 1]);
            setIsProductEdit({
              open: true,
              isBulkedit: false,
              showSaveAndNext: subRowIdx + 1 < allSubRowData?.length - 1 ? true : false
            });
          }
        } else {
          setIsProductEdit({ open: false, isBulkedit: false, showSaveAndNext: false });
        }
        fetchData();
      })
      .catch((error) => {
        setUpdating(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleSaveCostData = async (rows: any, saveAndNext = false) => {
    setUpdating(true);
    axiosInstance()
      .put(`${quotation.api}/additionalcost/${quotationData._id}/${versionId}/update`, { additionalCost: rows })
      .then(({ data }) => {
        setUpdating(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });

        if (saveAndNext) {
          const rowIndex = dataRows.findIndex((d) => d._id === rows[0]?._id);
          setRecordToUpdate(dataRows[rowIndex + 1]);
          if (dataRows[rowIndex + 1]?.type === MATERIAL_TYPE.manualEntry) {
            setShowCostDialog({ open: true, showSaveAndNext: rowIndex + 1 < dataRows?.length - 1 ? true : false });
          } else {
            setShowCostDialog({ open: false, showSaveAndNext: false });
            setIsProductEdit({
              open: true,
              isBulkedit: false,
              showSaveAndNext: rowIndex + 1 < dataRows?.length - 1 ? true : false
            });
          }
        } else {
          setShowCostDialog({ open: false, showSaveAndNext: false });
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
    const cost = rows?.filter((ele) => ele.type === MATERIAL_TYPE.manualEntry).map((e) => e?.id)
    const products = rows?.filter((ele) => ele.type !== MATERIAL_TYPE.manualEntry)

    if (products?.length) {
      axiosInstance()
        .put(`${quotation.api}/productpackage/${quotationData?._id}/${versionId}/delete`, { ids: products })
        .then(() => {
          setDeleting(false);
          fetchData();
          fetchQuotationData(version);
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
        .post(`${quotation.api}/additionalcost/${quotationData._id}/${versionId}/delete`, { ids: cost })
        .then(({ data }) => {
          setDeleting(false);
          fetchData();
          fetchQuotationData(version);
          setDeleteData(null);
        })
        .catch((error) => {
          setDeleting(false);
          toastConfig.setToastConfig(error);
          setDeleteData(null);
        });
    }

  };

  const openMaterial = (row, rows) => {
    let showSaveAndNext;
    if (row.depth != 0) {
      const allRows = rows.filter((ele) => ele.parentId === row.parentId);
      showSaveAndNext = row?.index < allRows.length - 1 ? true : false;
    } else {
      showSaveAndNext = row?.index < rows?.filter((e) => e?.depth === 0)?.length - 1 && row?.depth === 0 ? true : false;
    }
    if (row?.original?.type === MATERIAL_TYPE.manualEntry) {
      setShowCostDialog({ open: true, showSaveAndNext: row?.index < rows?.length - 1 ? true : false });
    } else {
      setIsProductEdit({
        open: true,
        isBulkedit: false,
        showSaveAndNext: showSaveAndNext
      });
    }

    setRecordToUpdate(row.original);
  };

  const calculatePrice = (arr: any[]) => {
    if (quotationData) {
      const data: any = {};
      data.conditionType = quotationData.type === QUOTATION_TYPE.salesOrder ? [PRICING_SETUP_TYPE.price] : [PRICING_SETUP_TYPE.rent];
      const material: any = [];
      arr?.forEach((ele) => {
        const obj = {
          materialId: ele?.materialId,
          materialType: ele?.type,
          qty: ele?.qty,
          pricingMethod: ele?.pricingMethod,
          currency: quotationData?.currency
        };
        if (isArray(ele?.unit)) {
          ele?.unit?.forEach((e) => {
            material.push({ ...obj, unit: e });
          });
        } else {
          material.push({ ...obj, unit: ele?.unit });
        }
      });
      data.material = material;
      data.supplier = [];
      data.customer = [quotationData?.customerAccount?.optionValue];
      data.warehouse = [quotationData?.warehouse?.optionValue];
      data.address = quotationData?.shippingAddress?.optionValue ? [quotationData?.shippingAddress?.optionValue] : [];
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

  const handelAskPriceToSupplier = (content, contactId, selectedFields = [], otherAttachments = []) => {
    let data: any = {
      material: selectedRecords?.map((d) => {
        return {
          _id: d?._id,
          materialId: d?.materialId,
          type: d?.type,
          parentId: d?.parentId
        };
      }),
      quotationId: quotationData?._id,
      protected: true,
      body: content ? content : '',
      supplierContact: contactId,
      requiredFields: selectedFields,
      versionId: versionId,
      attachment: otherAttachments
    };

    axiosInstance()
      .post(`/quotation/supplier-price-request/ask-price-supplier`, data)
      .then(() => {
        toastConfig.setToastConfig({
          message: `Email has been sent to suppliers`,
          type: 'success',
          open: true
        });
        setAskSupplierPriceDialog(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const onSaveInlineEdit = async (inputField, updatedData) => {
    const rowData = flattenArray(dataRows)?.find((d) => d._id === updatedData._id);
    let rows: any = [{ ...rowData, ...updatedData }];

    if (rowData?.type === MATERIAL_TYPE.manualEntry) {
      rows = await calculateRowsField(flattenArray(dataRows), inputField, costFields, updatedData);
      handleSaveCostData(rows);
    } else {
      rows = await calculateRowsField(flattenArray(dataRows), inputField, allFields, updatedData);
      handleSaveData(rows);
    }
  };

  useEffect(() => {
    var serializedProduct = flattenArray(selectedRecords)?.filter((e) => e.type === MATERIAL_TYPE.product && e?.serializedProduct);
    var serializedAsset = flattenArray(selectedRecords)?.filter((d) => d.type === MATERIAL_TYPE.serializedAsset);
    serializedProduct = uniqBy(serializedProduct, '_id');
    const products = serializedProduct?.map((m) => {
      const alreadyAssets = serializedAsset.filter((e) => e?.parentId === m?._id) || [];
      return {
        parentId: m._id,
        product: m.materialId,
        productName: m?.detail,
        qty: m.qtyDisplay - (alreadyAssets?.length || 0)
      };
    });
    setProducts([...products?.filter((e) => e.qty > 0)]);
  }, [selectedRecords]);

  const addButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          onClick={() => {
            setAddDialog({ open: true, type: 'product', parentId: null });
          }}
        >
          Add Existing Products
        </MenuItem>
        {quotationData?.type !== QUOTATION_TYPE.fieldJob && (
          <MenuItem
            onClick={() => {
              setAddDialog({ open: true, type: 'package', parentId: null });
            }}
          >
            Add Existing Packages
          </MenuItem>
        )}
        {quotationData?.type === QUOTATION_TYPE.rentalJob && !user?.user?.brandPolicy?.rentalService ? null : (
          <MenuItem
            onClick={() => {
              setAddDialog({ open: true, type: 'service', parentId: null });
            }}
          >
            Add Existing Services
          </MenuItem>
        )}
        {costFields?.length > 0 &&
          <MenuItem
            onClick={() => {
              setShowCostDialog({ open: true, showSaveAndNext: false });
            }}
          >
            Add Manual Entry
          </MenuItem>
        }
      </>
    );
  };

  const actionButtonMenuItems = () => {
    return (
      <>
        {quotationData?.type === QUOTATION_TYPE.rentalJob && (
          <MenuItem
            disabled={products.length ? false : true}
            onClick={() => {
              setAddDialog({ open: true, type: MATERIAL_TYPE.serializedAsset, parentId: null });
            }}
          >
            Assign Assets
          </MenuItem>
        )}
        <MenuItem
          disabled={selectedRecords.length === 0 || selectedRecords.some((e) => e.type === MATERIAL_TYPE.manualEntry)}
          onClick={() => {
            let tempSupplierAccountId = [];
            selectedRecords?.forEach((element) => {
              element?.supplierAccount?.forEach((e) => {
                if (tempSupplierAccountId.findIndex((d) => d === e?.optionValue) === -1) {
                  tempSupplierAccountId.push(e?.optionValue);
                }
              });
            });
            axiosInstance()
              .get(
                `${supplierContact.contactApi}?filterById=${JSON.stringify([
                  { field: 'accountName', term: { $in: tempSupplierAccountId } }
                ])}&filterType=and`
              )
              .then(({ data: { data, count } }) => {
                setSupplierContactData(data);
                setAskSupplierPriceDialog(true);
              })
              .catch((error) => {
                toastConfig.setToastConfig(error);
              });
          }}
        >
          Ask Supplier to Quote
        </MenuItem>
        <MenuItem
          onClick={() => {
            setSelectedType('Supplier');
            setRequestDialog(true);
          }}
        >
          View Supplier Quote
        </MenuItem>
        {/* <MenuItem
                onClick={() => {
                  setSelectedType('Customer');
                  setRequestDialog(true);
                }}
              >
                View Customer Price
              </MenuItem> */}
        <MenuItem
          disabled={!Boolean(selectedRecords && selectedRecords.filter((e) => !e.hideSelection).length && !selectedRecords.some((e) => e.type === MATERIAL_TYPE.manualEntry))}
          onClick={() => {
            setIsProductEdit({ open: true, isBulkedit: true, showSaveAndNext: false });
          }}
        >
          Bulk Edit
        </MenuItem>
        <MenuItem
          disabled={!Boolean(selectedRecords && selectedRecords.filter((e) => !e.hideSelection).length) || isDeleting}
          onClick={() => {
            const dataToDelete =
              selectedRecords &&
              selectedRecords
                .filter((e) => !e.hideSelection)
                .map((rec: any) => {
                  const obj: any = {};
                  obj.id = rec._id;
                  obj.type = rec?.type;
                  obj.materialId = rec?.materialId;
                  return obj;
                });
            setDeleteData(dataToDelete);
          }}
        >
          Delete
        </MenuItem>
      </>
    );
  };

  const handleSaveLeadTime = (data) => {
    setSubmitting(true)
    const value = {
      leadTime: data?.steps || [],
      _id: leadTimeDialog?.data?._id
    };
    let api = '';
    if (quotationData?.type === 'Manual Entry') {
      api = `${quotation.api}/additionalcost/${quotationData?._id}/${versionId}/lead-time`
    } else {
      api = `${quotation.api}/productpackage/${quotationData?._id}/${versionId}/lead-time`
    }
    axiosInstance()
      .put(api, value)
      .then((res) => {
        setSubmitting(false);
        setLeadTimeDialog({ open: false, data: null });
        fetchData()
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: 'Lead time updated successfully'
        });
      })
      .catch((err) => {
        setSubmitting(false);
        toastConfig.setToastConfig(err);
      });
  }

  return (
    <Fragment>
      <DetailsPageHeader
        isAddButtonVisible={allowedToEdit}
        addButtonMenuItems={addButtonMenuItems()}
        isActionButtonVisible={allowedToEdit}
        actionButtonMenuItems={actionButtonMenuItems()}
        actionButtonProps={{ disabled: dataRows?.length > 0 ? false : true }}
        hasXpadding
      />
      {columns ? (
        <Box zIndex={5} width={'100%'}>
          <CustomReactTable
            height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 395px)'}
            columns={columns}
            state={state}
            setWholeRowsCellColor={(rowData) => (!rowData.isValid ? 'error' : '')}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchData}
            isClientSideGrid={true}
            onSaveEdit={onSaveInlineEdit}
            hideSelection={!allowedToEdit}
            hideAction={!allowedToEdit}
            expander={true}
          />
        </Box>
      ) : (
        <Box height={500}>
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
        <QuotationQtyDialog
          calculatePrice={calculatePrice}
          onClose={() => {
            setIsProductEdit({ open: false, isBulkedit: false, showSaveAndNext: false });
            setRecordToUpdate(null);
          }}
          isBulkedit={isProductEdit.isBulkedit}
          handleSaveData={handleSaveData}
          loadingEdit={isUpdating}
          quotationData={quotationData}
          rowData={recordToUpdate}
          material={material}
          selectedProducts={selectedRecords}
          showSaveAndNext={isProductEdit?.showSaveAndNext}
        />
      )}
      {showCostDialog.open && (
        <AdditionalCostDialog
          onClose={() => {
            setShowCostDialog({ open: false, showSaveAndNext: false });
            setRecordToUpdate(null);
          }}
          handleAddCost={handleAddCost}
          handleUpdateCost={handleSaveCostData}
          currency={quotationData?.currency}
          costData={recordToUpdate}
          loadingEdit={isUpdating}
          showSaveAndNext={showCostDialog.showSaveAndNext}
        />
      )}
      {addDialog.open && addDialog.type === 'product' && (
        <AssignProductDialog
          handleCloseDialog={() => setAddDialog({ open: false, type: '', parentId: null })}
          onSuccess={(d) => {
            handleAdd(d);
          }}
          serialized={quotationData?.type === QUOTATION_TYPE.fieldJob ? false : null}
          isSubmitting={isSubmitting}
        />
      )}
      {addDialog.open && addDialog.type === MATERIAL_TYPE.serializedAsset && (
        <AssignSerializedAssetDialog
          reference="quotation"
          referenceData={{
            fromDate: quotationData?.estimateStartDate,
            toDate: quotationData?.estimateEndDate,
            warehouse: quotationData?.warehouse?.optionValue
          }}
          handleClose={() => setAddDialog({ open: false, type: '', parentId: null })}
          ids={[...dataRows?.filter((e) => e.type === MATERIAL_TYPE.serializedAsset)?.map((e: any) => e?.serializedAssetDetail?._id)]}
          isAssigning={isSubmitting}
          handleSucess={(rows) => {
            if (products?.length) {
              const dataToAddFormat = rows?.map((d) => {
                return { ...d, _id: d?.asset, qty: 1 };
              });
              handleAdd([...dataToAddFormat]);
            }
          }}
          selectedProducts={products}
        />
      )}
      {addDialog.open && addDialog.type === 'service' && (
        <AssignServiceDialog
          handleClose={() => setAddDialog({ open: false, type: '', parentId: null })}
          onSuccess={(rows) => {
            handleAdd(rows);
          }}
          extraStaticFilter={quotationData?.type === QUOTATION_TYPE.fieldJob ? [{ field: 'serviceType', term: SERVICE_TYPE.fieldService }] : []}
          isSubmitting={isSubmitting}
        />
      )}
      {addDialog.open && addDialog.type === 'package' && (
        <AssignPackageDialog
          handleClose={() => setAddDialog({ open: false, type: '', parentId: null })}
          onSuccess={(rows) => {
            handleAdd(rows);
          }}
          isSubmitting={isSubmitting}
        />
      )}
      {requestDialog && selectedType && (
        <PriceRequestDialog
          quoteData={quotationData}
          versionId={versionId}
          type={selectedType}
          handleClose={() => setRequestDialog(false)}
          onSuccess={() => {
            fetchFields();
            setRequestDialog(false);
          }}
        />
      )}
      {askSupplierPriceDialog && (
        <AskSupplierPriceDialog
          setAskSupplierPriceDialog={setAskSupplierPriceDialog}
          askSupplierPriceDialog={askSupplierPriceDialog}
          handelAskPriceToSupplier={handelAskPriceToSupplier}
          supplierContactData={supplierContactData}
          fields={allFields}
        />
      )}
      {leadTimeDialog.open && (
        <ManageLeadTime
          onClose={() => {
            setLeadTimeDialog({ open: false, data: null });
          }}
          onSuccess={(data) => {
            handleSaveLeadTime(data)
          }}
          referenceType={sidebarResource.quotation}
          referenceId={null}
          referenceData={leadTimeDialog?.data}
          referenceLabel={leadTimeDialog?.data?.detail ||
            leadTimeDialog?.data?.productDetail?.productName ||
            leadTimeDialog?.data?.serviceDetail?.serviceName ||
            leadTimeDialog?.data?.packageDetail?.packageName ||
            'Lead Time Status'}
          loading={isSubmitting}
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
            setAddchildDialog({ open: false, parentId: null, parentType: null, serializedProduct: false, top: null, bottom: null });
          }}
        >
          <MenuList>
            <MenuItem
              onClick={() => {
                setAddDialog({ open: true, type: 'product', parentId: addchildDialog.parentId });
                setAddchildDialog({ open: false, parentId: null, parentType: null, serializedProduct: false, top: null, bottom: null });
              }}
            >
              Add Existing Products
            </MenuItem>
            {quotationData?.type !== QUOTATION_TYPE.fieldJob && (
              <MenuItem
                onClick={() => {
                  setAddDialog({ open: true, type: 'package', parentId: addchildDialog.parentId });
                  setAddchildDialog({ open: false, parentId: null, parentType: null, serializedProduct: false, top: null, bottom: null });
                }}
              >
                Add Existing Packages
              </MenuItem>
            )}
            {quotationData?.type === QUOTATION_TYPE.rentalJob && !user?.user?.brandPolicy?.rentalService ? null :
              quotationData?.type === QUOTATION_TYPE.fieldJob ? null : (
                <MenuItem
                  onClick={() => {
                    setAddDialog({ open: true, type: 'service', parentId: addchildDialog.parentId });
                    setAddchildDialog({ open: false, parentId: null, parentType: null, serializedProduct: false, top: null, bottom: null });
                  }}
                >
                  Add Existing Services
                </MenuItem>
              )}
          </MenuList>
        </Popover>
      )}
    </Fragment>
  );
};

export default Productpackage;
