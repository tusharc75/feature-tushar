import { Box, IconButton, MenuItem, TextField } from '@material-ui/core';
import Add from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import { Autocomplete } from '@material-ui/lab';
import { startCase } from 'lodash';
import React, { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import AssignPackageDialog from 'src/components/AssignRolesDialog/AssignPackageDialog';
import AssignServiceDialog from 'src/components/AssignRolesDialog/AssignServiceDialog';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { flattenArray } from 'src/constants/columns';
import { ownerAndColaborator, rentalManagementMessage } from 'src/constants/messageHelpers';
import ManagePackageDialog from 'src/pages/Packages/ManagePackageDialog';
import ManageServiceMaster from 'src/pages/ServiceMaster/ManageServiceMaster';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { CustomOfflineContext } from '../../../StateProvider/OfflineContext/OfflineContext';
import { useData } from '../../../StateProvider/Provider';
import axiosInstance from '../../../axios/axiosInstance';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import routes from '../../../components/Helpers/Routes';
import { calculatePrice, calculateRowsField, fetch_rental_product_fields, getNestedSubRows } from '../../../components/RentalManagment/helper';
import { autoCalculateSpecificFields } from '../../../constants/formulaUtility';
import { MATERIAL_TYPE, RENTAL_STATUS, rentalManagement } from '../../../constants/helpers';
import { findOne, objectStore } from '../../../constants/indexdbhelper';
import RentalJobQtyDialog from '../Productpackage/RentalJobQtyDialog';
import Technicians from './Technicians';
import { FiExternalLink } from 'react-icons/fi';
import { useSetWalkmeData } from 'src/components/CustomIntro';

const Services = ({
  rentalManagementData,
  setNextStep,
  setNextStepToolTip,
  renderedFrom,
  stepFullScreen,
  allowedToEdit,
  quotationApproved,
  quotationStatus,
  fetchRentalManagementData,
  rentalPolicyData
}: any) => {
  const toastConfig = useContext(CustomToastContext);
  const { setWalkmeData } = useSetWalkmeData();
  const {
    state: { user, permissions }
  }: any = useData();

  const [isUpdating, setUpdating] = useState(false);

  const [isProductEdit, setIsProductEdit] = useState({ open: false, data: null, showSaveAndNext: false });
  const [isSubmitting, setSubmitting] = useState(false);

  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);

  const [material, setMaterial] = useState([]);
  const [addExistingProductDialog, setAddExistingProductDialog] = useState({ open: false, type: '', parentId: null });
  const [columns, setColumns] = useState(null);
  const [allFields, setAllFields] = useState(null);
  const [isBulkEdit, setIsBulkEdit] = useState(false);

  const [tabValue, setTabValue] = useState(0);
  const [serviceOption, setServiceOption] = useState(null);
  const [selectedServiceOption, setSelectedServiceOption] = useState({ optionLabel: 'All', optionValue: 'All' });

  const { isOffline } = useContext(CustomOfflineContext);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, selectedRecords } = state;
  const { generateColumns } = useColumns();
  const [isRateRequired, setIsRateRequired] = useState(false);

  useEffect(() => {
    fetchFields();
    fetchData();
    setWalkmeData([]);
  }, []);

  useEffect(() => {
    if (allFields) {
      createColumns();
    }
  }, [allFields, allowedToEdit, quotationApproved]);

  const fetchFields = async () => {
    var data = await fetch_rental_product_fields(rentalManagementData?.currency, isOffline);
    setAllFields(JSON.parse(JSON.stringify(data)));
  };

  const createColumns = () => {
    setColumns(null);
    const data = [...allFields]?.filter((f) => f?.isRead);
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
        sticky: isMobile || isTablet ? 'none' : 'left',
        disableFilters: true,
        disabled: true,
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
        disabled: true,
        sticky: isMobile || isTablet ? 'none' : 'left',
        Cell: ({ row, table }) => (
          <div className="flex items-center gap-1">
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
            <span title={`There are ${row.original?.subRows?.length} product(s) in this ${row.original?.type}`}>
              {row.original?.subRows?.length ? `(${row.original?.subRows?.length})` : null}
            </span>
            {!isOffline && allowedToEdit && !quotationApproved && (
              <HtmlTooltip title="Add Existing Service">
                <IconButton
                  onClick={() => setAddExistingProductDialog({ open: true, type: 'service', parentId: row.original?._id })}
                  size="small"
                  color="primary"
                >
                  <Add color="disabled" fontSize="small" />
                </IconButton>
              </HtmlTooltip>
            )}
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
                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
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
                    row.original.assetQty ? 'Asset is already assigned' : row.original?.status ? rentalManagementMessage.loadingAlreadyCreated : ''
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
    try {
      var data: any = [];
      var inventory: any = [];
      var nonSerializeAsset: any = [];

      var nextStepMessage = null;

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
      rows = rows.filter((e) => e.type === MATERIAL_TYPE.service || (e.type === MATERIAL_TYPE.package && e.packageDetail?.packageType === 'Service'));

      const isPriceRequired = allFields?.filter((el) => el.fieldName === 'price' && el.required).length > 0;
      setIsRateRequired(isPriceRequired);

      const currency = rentalManagementData?.currency?.toLowerCase();

      rows.forEach((parent, i) => {
        parent.index = i + 1;
        parent.detail =
          parent.type === MATERIAL_TYPE.product
            ? parent?.productDetail?.productName
            : parent.type === MATERIAL_TYPE.service
              ? parent?.serviceDetail?.serviceName
              : parent?.packageDetail?.packageName;
        parent.description =
          parent.type === MATERIAL_TYPE.service
            ? parent?.serviceDetail?.serviceDescription || ''
            : parent.type === MATERIAL_TYPE.product
              ? parent?.productDetail?.productDescription || ''
              : parent.type === MATERIAL_TYPE.package
                ? parent?.packageDetail?.packageDescription || ''
                : '';
        parent.serializedProduct = parent.type === MATERIAL_TYPE.product ? parent?.productDetail?.serializedProduct : false;
        parent.qtyDisplay = parent.qty;
        parent.isValid = parent[`price_${currency}`] || parent[`finalPrice_${currency}`] ? true : !isPriceRequired;
        if (parent?.type === MATERIAL_TYPE.service && rentalPolicyData?.servicePriceRequired) {
          parent.isValid = parent[`price_${currency}`] || parent[`finalPrice_${currency}`] ? true : false;
        }
        if (!parent.isValid) {
          nextStepMessage = rentalManagementMessage.validPrice;
        }
        parent.assetQty = parent.serializedProduct
          ? inventory?.filter((e) => e._id === parent._id).length
          : nonSerializeAsset?.filter((e) => e._id === parent._id).length;
        parent.hideSelection =
          parent.type === MATERIAL_TYPE.service && parent?.serviceLog ? true : parent.assetQty > 0 ? true : parent?.status ? true : false;
        parent.subRows = generateNestedData(data.material, inventory, nonSerializeAsset, parent, isPriceRequired);
        if (parent.type === MATERIAL_TYPE.package && parent.subRows?.length === 0 && !nextStepMessage) {
          nextStepMessage = rentalManagementMessage.addServiceInPackage;
        }
      });

      if (rows?.length) {
        if (rows.filter((_rows) => _rows.isValid === false).length > 0) {
          if (!nextStepMessage && rentalPolicyData?.servicePriceRequired) {
            if (flattenArray(rows)?.find((e) => e.type === MATERIAL_TYPE.service && !e?.isValid)) {
              nextStepMessage = rentalManagementMessage.validServicePrice;
            }
          }
          setNextStep(false);
          setNextStepToolTip(nextStepMessage);
        } else {
          setNextStep(true);
          setNextStepToolTip(null);
        }
      }
      else {
        if (rows.filter((e) => e.type === MATERIAL_TYPE.product || (e.type === MATERIAL_TYPE.package && e.packageDetail?.packageType !== 'Service'))?.length) {
          setNextStep(true);
          setNextStepToolTip(null);
        }
        else {
          setNextStep(false);
          setNextStepToolTip(rentalManagementMessage.addServicePackage);
        }
      }
      dispatch({ type: 'initialize', data: rows, count: rows?.length });
      dispatch({ type: 'loading', loading: false });

      setServiceOption([
        { optionLabel: 'All', optionValue: 'All' },
        ...rows?.map((s) => {
          return {
            optionLabel: s?.detail,
            optionValue: s?.materialId,
            _id: s?._id
          };
        })
      ]);
      if (selectedServiceOption?.optionValue !== 'All' && !rows?.some((s) => s?.materialId === selectedServiceOption?.optionValue)) {
        setSelectedServiceOption({ optionLabel: 'All', optionValue: 'All' });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const generateNestedData = (material, inventory, nonSerializeAsset, parent, isPriceRequired) => {
    const currency = rentalManagementData?.currency?.toLowerCase();

    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, j) => {
      _subRow.index = parent.index + '.' + (j + 1);
      _subRow.detail =
        _subRow.type === MATERIAL_TYPE.product
          ? _subRow?.productDetail?.productName
          : _subRow.type === MATERIAL_TYPE.service
            ? _subRow?.serviceDetail?.serviceName
            : _subRow?.packageDetail?.packageName;
      _subRow.description =
        _subRow.type === MATERIAL_TYPE.service
          ? _subRow?.serviceDetail?.serviceDescription || ''
          : _subRow.type === MATERIAL_TYPE.product
            ? _subRow?.productDetail?.productDescription || ''
            : _subRow.type === MATERIAL_TYPE.package
              ? _subRow?.packageDetail?.packageDescription || ''
              : '';
      _subRow.serializedProduct = _subRow?.productDetail?.serializedProduct;
      _subRow.qtyDisplay = `${parent.qtyDisplay * _subRow.qty}`;
      _subRow.isValid = _subRow[`price_${currency}`] || _subRow[`finalPrice_${currency}`] ? true : !isPriceRequired;
      if (_subRow?.type === MATERIAL_TYPE.service && rentalPolicyData?.servicePriceRequired) {
        _subRow.isValid = _subRow[`price_${currency}`] || _subRow[`finalPrice_${currency}`] ? true : false;
      }
      _subRow.assetQty = _subRow.serializedProduct
        ? inventory?.filter((e) => e._id === _subRow._id).length
        : nonSerializeAsset?.filter((e) => e._id === _subRow._id).length;
      _subRow.hideSelection =
        _subRow.type === MATERIAL_TYPE.service && _subRow?.serviceLog ? true : _subRow.assetQty > 0 ? true : _subRow?.status ? true : false;
      _subRow.subRows = generateNestedData(material, inventory, nonSerializeAsset, _subRow, isPriceRequired);
    });
    if (subRows.length === 0 && parent.type === MATERIAL_TYPE.package) {
      parent.isValid = false;
    }
    if (subRows?.length && rentalPolicyData?.servicePriceRequired) {
      parent.isValid = subRows.find((e) => e.type === MATERIAL_TYPE.service && !e?.isValid) ? false : parent.isValid;
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
        fetchData();
        if ([RENTAL_STATUS.readyToInvoice, RENTAL_STATUS.invoiced]?.includes(rentalManagementData?.status)) {
          fetchRentalManagementData();
        }
        setSubmitting(false);
      })
      .catch((error) => {
        setAddExistingProductDialog({ open: false, type: '', parentId: null });
        toastConfig.setToastConfig(error);
        setSubmitting(false);
      });
  };

  const handleSaveData = async (rows: any, saveAndNext = false) => {
    setUpdating(true);
    axiosInstance()
      .put(`${rentalManagement.api}/productpackage/${rentalManagementData._id}`, { material: rows })
      .then(() => {
        setUpdating(false);
        fetchData();
        if (saveAndNext) {
          const rowIndex = dataRows?.findIndex((d) => d._id === rows[0]?._id);
          setIsProductEdit({ open: true, data: dataRows[rowIndex + 1], showSaveAndNext: rowIndex + 1 < dataRows?.length - 1 ? true : false });
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
        fetchData();
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

  const onSaveInlineEdit = async (inputField, updatedData) => {
    const rowData = flattenArray(dataRows)?.find((d) => d._id === updatedData._id);
    if (inputField.hasOwnProperty('qtyDisplay')) {
      inputField['qty'] = inputField['qtyDisplay'];
    }
    let rows: any = [{ ...rowData, ...updatedData }];
    rows = await calculateRowsField(material, inputField, allFields, updatedData);
    handleSaveData(rows);
  };

  const addButtonMenuItems = () => {
    return (
      <>
        {permissions?.serviceMaster?.isRead && (
          <MenuItem
            onClick={() => {
              setAddExistingProductDialog({ open: true, type: 'service', parentId: null });
            }}
          >
            Add Existing Services
          </MenuItem>
        )}
        {permissions?.packages?.isRead && (
          <MenuItem
            onClick={() => {
              setAddExistingProductDialog({ open: true, type: 'package', parentId: null });
            }}
          >
            {`Add Existing Service Packages`}
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            setAddExistingProductDialog({ open: true, type: 'newService', parentId: null });
          }}
        >
          Add New Service
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAddExistingProductDialog({ open: true, type: 'newPackage', parentId: null });
          }}
        >
          {`Add New Service Package`}
        </MenuItem>
      </>
    );
  };

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
  };

  const actionButtonMenuItems = () => {
    return (
      <>
        <HtmlTooltip
          title={Boolean(selectedRecords && selectedRecords.length) ? 'Bulk edit selected records' : 'Select records to edit'}
          enterTouchDelay={0}
          arrow
          placement="top"
        >
          <MenuItem
            onClick={() => {
              setIsProductEdit({ open: true, data: null, showSaveAndNext: false });
              setIsBulkEdit(true);
            }}
          >
            Bulk Edit
          </MenuItem>
        </HtmlTooltip>
        <HtmlTooltip
          title={Boolean(selectedRecords && selectedRecords.length) ? 'Delete selected records' : 'Select records to delete'}
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
          tooltip: !allowedToEdit ? ownerAndColaborator : quotationApproved ? `Quotation ${quotationStatus} you can not perform this action` : ``,
          disabled: !allowedToEdit || quotationApproved,
          introWrapper: true,
          introWrapperTitle: 'Click add button',
          introWrapperContent: 'Click add button and select the dropdown option'
        }}
        isActionButtonVisible={true}
        actionButtonMenuItems={actionButtonMenuItems()}
        actionButtonProps={{ disabled: !Boolean(selectedRecords && selectedRecords.filter((e) => !e.hideSelection).length) }}
        hasXpadding
      />

      {columns ? (
        <CustomReactTable
          height={'300px'}
          columns={columns}
          state={state}
          dispatch={dispatch}
          refreshGrid={fetchData}
          setWholeRowsCellColor={(rowData) => (!rowData.isValid ? 'error' : '')}
          hideSelection={isOffline || !allowedToEdit || quotationApproved}
          hideAction={isOffline || !allowedToEdit || quotationApproved}
          renderedFrom={renderedFrom}
          onSaveEdit={onSaveInlineEdit}
          isClientSideGrid={true}
          expander={true}
        />
      ) : (
        <Box py={2} height={300}>
          <CommonSkeleton lenArray={[...Array(2).keys()]} xs={12} sm={12} md={12} lg={12} />
        </Box>
      )}
      {permissions?.employeeMaster?.isRead && (
        <div>
          <Box style={{ maxWidth: '400px' }} mb={2} mt={2}>
            <Autocomplete
              size="small"
              style={{ minWidth: '300px' }}
              fullWidth
              options={serviceOption ? serviceOption : []}
              autoHighlight
              value={selectedServiceOption}
              getOptionLabel={(option: any) => option?.optionLabel || ''}
              getOptionSelected={(option, val) => (option ? option?.optionLabel === val?.optionLabel : false)}
              onChange={(_, val) => {
                let value = val;
                if (!val) {
                  value = { optionLabel: 'All', optionValue: 'All' };
                }
                setSelectedServiceOption(value);
              }}
              renderInput={(params) => <TextField {...params} label={'Select Service'} variant="outlined" />}
            />
          </Box>
          <Box mt={3}>
            <CustomTabs value={tabValue} onChange={handleMainTabChange} style={{ marginBottom: -1 }}>
              <CustomTab value={0} label={'Technicians'} primaryColor={true} />
            </CustomTabs>
            <TabPanel value={tabValue} index={0}>
              <Technicians
                allowedToEdit={allowedToEdit}
                rentalManagementData={rentalManagementData}
                selectedService={selectedServiceOption}
                services={serviceOption}
              />
            </TabPanel>
          </Box>
        </div>
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
          onSuccess={(rows) => {
            handleAdd(rows.map((d) => ({ ...d, detail: d.packageName })));
          }}
          handleClose={() => {
            setAddExistingProductDialog({ open: false, type: '', parentId: null });
          }}
          packageType="service"
          customerAccount={rentalPolicyData?.customerAccountWisePackages ? rentalManagementData?.customerAccount?.optionValue : null}
          isSubmitting={isSubmitting}
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
          rowData={!isBulkEdit ? isProductEdit.data : selectedRecords}
          material={material}
          selectedProducts={selectedRecords}
          loading={isUpdating}
          from={'service'}
          showSaveAndNext={isProductEdit.showSaveAndNext}
          isRateRequired={isRateRequired}
        />
      )}
      {addExistingProductDialog.open && addExistingProductDialog.type === 'service' && (
        <AssignServiceDialog
          onSuccess={(services) => {
            handleAdd(services);
          }}
          handleClose={() => {
            setAddExistingProductDialog({ open: false, type: '', parentId: null });
          }}
          isSubmitting={isSubmitting}
        />
      )}
      {addExistingProductDialog.open && addExistingProductDialog.type === 'newPackage' && (
        <ManagePackageDialog
          isClone={false}
          referenceData={{ packageType: 'Service', customerAccount: rentalManagementData?.customerAccount?.optionValue }}
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
      {addExistingProductDialog.open && addExistingProductDialog.type === 'newService' && (
        <ManageServiceMaster
          isClone={false}
          serviceMasterId={null}
          onClose={() => setAddExistingProductDialog({ open: false, type: '', parentId: null })}
          onSuccess={(data) => {
            const row = data?.data;
            row.type = 'service';
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
