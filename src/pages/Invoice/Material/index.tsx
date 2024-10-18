import { Box, IconButton, MenuItem, MenuList, Popover } from '@material-ui/core';
import Add from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import { camelCase, isArray, startCase } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import AssignPackageDialog from 'src/components/AssignRolesDialog/AssignPackageDialog';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import AssignSerializedAssetDialog from 'src/components/AssignRolesDialog/AssignSerializedAssetDialog';
import AssignServiceDialog from 'src/components/AssignRolesDialog/AssignServiceDialog';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { calculateRowsField, getNestedSubRows } from 'src/components/RentalManagment/helper';
import { flattenArray } from 'src/constants/columns';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../../StateProvider/Provider';
import axiosInstance from '../../../axios/axiosInstance';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import routes from '../../../components/Helpers/Routes';
import { CHILD_RESOURCE, MATERIAL_TYPE, PRICING_SETUP_TYPE, invoice, pricingCondition } from '../../../constants/helpers';
import MaterialDialog from './MaterialDialog';
import AdditionalCostDialog from './AdditionalCostDialog';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import { FiExternalLink } from 'react-icons/fi';
import { autoCalculateSpecificFields } from 'src/constants/formulaUtility';

const Material = ({ invoiceData, fetchInvoiceData, setNextStep, stepFullScreen, allowedToEdit }) => {
  const renderedFrom = `${camelCase(routes?.invoice.title)}_Material`;

  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();
  const [isUpdating, setUpdating] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [materialEdit, setMaterialEdit] = useState({ open: false, data: null, bulkedit: false, showSaveAndNext: false });
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);
  const [material, setMaterial] = useState([]);
  const [addchildDialog, setAddchildDialog] = useState({ open: false, parentId: null, top: null, bottom: null, isSerializedProduct: false });
  const [columns, setColumns] = useState(null);
  const [addDialog, setAddDialog] = useState({ open: false, type: '', parentId: null });
  const [allFields, setAllFields] = useState([]);
  const [assetAssignedProduct, setAssetAssignedProduct] = useState([]);
  const [isRateRequired, setIsRateRequired] = useState(false);
  const [addCostDialog, setAddCostDialog] = useState({ open: false, data: null, showSaveAndNext: false });
  const [costFields, setCostFields] = useState(null);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, selectedRecords } = state;
  const { generateColumns } = useColumns();

  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    fetchData();
  }, [columns]);

  const fetchFields = async () => {
    let data = await fetch_child_resource_fields(CHILD_RESOURCE.invoiceProduct, invoiceData?.currency, allowedToEdit);
    let childFields = await fetch_child_resource_fields(CHILD_RESOURCE.invoiceCost, invoiceData?.currency, allowedToEdit);
    setCostFields(childFields);
    setAllFields(JSON.parse(JSON.stringify(data)));
    const newColumns = generateColumns(renderedFrom, data, null, false, invoiceData?.currency);
    const isPriceRequired = data.filter((el) => el.fieldName === 'price' && el.required).length > 0;
    setIsRateRequired(isPriceRequired);
    let coloum: any = [
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
        disabled: true,
        width: 300,
        sticky: isMobile || isTablet ? 'none' : 'left',
        Cell: ({ row, table }) => (
          <div className="flex items-center gap-2">
            {allowedToEdit ? (
              row.original.detail ? (
                <p
                  onClick={() => {
                    openMaterial(row, table.getRowModel().rows);
                  }}
                  className="link text-truncate"
                  title={row.original?.detail}
                >
                  {row.original?.detail}
                </p>
              ) : (
                <NoDataCell />
              )
            ) : (
              <p className="text-truncate">{row.original?.detail}</p>
            )}

            {[MATERIAL_TYPE.product, MATERIAL_TYPE.package]?.includes(row?.original?.type) && (
              <>
                {row.original?.subRows?.length > 0 && (
                  <span title={`There are ${row.original?.subRows?.length} product(s) in this package`}>({row.original?.subRows?.length})</span>
                )}
                <Box pl={1}>
                  <HtmlTooltip title="Add ">
                    <IconButton
                      onClick={(event) => {
                        if (row.original.type === MATERIAL_TYPE.product && row.original.productDetail.serializedProduct) {
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
              </>
            )}
            {![MATERIAL_TYPE.manualEntry, MATERIAL_TYPE.other]?.includes(row.original['type']) && (
              <IconButton
                size="small"
                onClick={() => {
                  if (row.original.type === MATERIAL_TYPE.service) {
                    window.open(`${routes.serviceMasterDetail.path}/${row.original.materialId}`);
                  } else if (row.original.type === MATERIAL_TYPE.product) {
                    window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                  } else if (row.original.type === MATERIAL_TYPE.serializedAsset) {
                    window.open(`${routes.serializedAssetDetail.path}/${row.original.materialId}`);
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
    coloum = [...coloum, ...newColumns];
    coloum.push({
      accessor: 'action',
      Header: 'Actions',
      minWidth: 100,
      width: 100,
      sticky: 'right',
      disableFilters: true,
      disableSortBy: true,
      canDrag: false,
      Cell: ({ row, table }) => (
        <>
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
          {allowedToEdit && (
            <IconButton
              size="small"
              aria-label="Details"
              onClick={() => {
                const obj: any = [{ id: row.original._id, type: row.original?.type, materialId: row.original?.materialId }];
                getNestedSubRows(obj, row.original);
                setDeleteData(obj);
              }}
            >
              <DeleteIcon fontSize="small" color="error" />
            </IconButton>
          )}
        </>
      )
    });
    setColumns(coloum);
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });

    setNextStep(false);
    var data: any = [];
    let assignedAssets = [];
    const response = await axiosInstance().get(`${invoice.api}/material/${invoiceData._id}`);
    const additionalData = await axiosInstance().get(`${routes.invoice.path}/${invoiceData._id}/additional-cost`);
    let additionalCost = additionalData?.data?.data || [];
    additionalCost = additionalCost?.map((e: any) => {
      return { ...e, type: MATERIAL_TYPE.manualEntry };
    });
    data = response?.data?.data;
    let rows = data.material.filter((e) => !e.parentId);
    rows = [...rows, ...additionalCost];
    assignedAssets = data.material.filter((e) => e.type === MATERIAL_TYPE.serializedAsset && e.parentId);
    setMaterial(JSON.parse(JSON.stringify(data.material)));
    rows.forEach((parent, i) => {
      parent.index = i + 1;
      parent.detail =
        parent.type === MATERIAL_TYPE.product
          ? parent.productDetail?.productName
          : parent.type === MATERIAL_TYPE.package
            ? parent.packageDetail?.packageName
            : parent.type === MATERIAL_TYPE.serializedAsset
              ? parent.serializedAssetDetail?.assetNumber
              : parent.type === MATERIAL_TYPE.service
                ? parent.serviceDetail?.serviceName
                : parent.detail || '';

      parent.description =
        parent.type === MATERIAL_TYPE.product
          ? parent?.productDetail?.productDescription
          : parent.type === MATERIAL_TYPE.package
            ? parent?.packageDetail?.packageDescription
            : parent.type === MATERIAL_TYPE.serializedAsset
              ? parent?.serializedAssetDetail?.product?.productDescription
              : parent.type === MATERIAL_TYPE.service
                ? parent?.serviceDetail?.serviceDescription
                : parent.description || '';

      parent.qty = parent.qty;
      parent.assetQty = assignedAssets.filter((i) => i.parentId === parent._id).length;
      parent.isValid = parent['finalPrice_' + invoiceData?.currency?.toLowerCase()] ? true : !isRateRequired;
      parent.subRows = generateNestedData(data.material, parent);
    });
    if (rows.filter((_rows) => _rows.isValid === false).length > 0 || rows.length === 0) {
      setNextStep(false);
    } else {
      setNextStep(true);
    }
    dispatch({ type: 'initialize', data: rows, count: rows?.length });
    dispatch({ type: 'loading', loading: false });
  };

  const generateNestedData = (material, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, index) => {
      _subRow.index = parent.index + '.' + `${index + 1}`;
      _subRow.detail =
        _subRow.type === MATERIAL_TYPE.product
          ? _subRow.productDetail?.productName
          : _subRow.type === MATERIAL_TYPE.package
            ? _subRow.packageDetail?.packageName
            : _subRow.type === MATERIAL_TYPE.serializedAsset
              ? _subRow.serializedAssetDetail.assetNumber
              : _subRow.type === MATERIAL_TYPE.service
                ? _subRow.serviceDetail?.serviceName
                : _subRow?.detail;
      _subRow.description =
        _subRow.type === MATERIAL_TYPE.product
          ? _subRow?.productDetail?.productDescription
          : _subRow.type === MATERIAL_TYPE.package
            ? _subRow?.packageDetail?.packageDescription
            : _subRow.type === MATERIAL_TYPE.serializedAsset
              ? parent.description
              : _subRow.type === MATERIAL_TYPE.service
                ? _subRow?.serviceDetail?.serviceDescription
                : '';
      _subRow.isValid = _subRow['finalPrice_' + invoiceData?.currency?.toLowerCase()] ? true : false;
      _subRow.subRows = generateNestedData(material, _subRow);
    });
    return subRows;
  };

  const openMaterial = (data, rows) => {
    if (data?.original?.type === MATERIAL_TYPE.manualEntry) {
      setAddCostDialog({ open: true, data: data.original, showSaveAndNext: data?.index < rows?.length - 1 ? true : false });
    } else {
      setMaterialEdit({
        open: true,
        data: data.original,
        bulkedit: false,
        showSaveAndNext: data?.index < rows?.filter((e) => e?.depth === 0)?.length - 1 && data?.depth === 0 ? true : false
      });
    }
  };

  const handleAdd = async (rows) => {
    setIsAdding(true);
    const material: any = [];
    var taxCodeData: any = null;
    if (invoiceData?.taxCode) {
      const {
        data: { data }
      } = await axiosInstance().get(
        `${routes?.taxMaster.path}/by-zipcode?taxCode=${invoiceData?.taxCode?.optionValue}&materialType=${addDialog.type}`
      );
      if (data?.length) {
        taxCodeData = data[0];
      }
    }
    if (addDialog.type === MATERIAL_TYPE.serializedAsset && addDialog.parentId) {
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
        if (taxCodeData && allFields?.find((e) => e.fieldName === 'taxCode')) {
          element.taxCode = taxCodeData?.optionValue;
          element.taxPercentage = taxCodeData?.taxRate || 0;
        }
        if (allFields?.find((e) => e.fieldName === 'pricingMethodMain')) {
          element.pricingMethod = d.pricingMethodMain && d.pricingMethodMain.length ? d.pricingMethodMain[0] : '';
          const calValues = autoCalculateSpecificFields({ pricingMethod: element.pricingMethod }, element, allFields);
          if (calValues && calValues['actualJobDuration']) {
            element.actualJobDuration = calValues['actualJobDuration'];
          }
        }
        material.push(element);
      });
    }
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
        const priceFieldName = `price_${invoiceData?.currency?.toLowerCase()}`;
        element[priceFieldName] = rateResult[0].mrp;
        const calValues = autoCalculateSpecificFields(
          { [priceFieldName]: rateResult[0].mrp, pricingCondition: rateResult[0].conditionId },
          element,
          allFields
        );
        Object.assign(element, calValues);
      }
    });
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
        fetchData();
        fetchInvoiceData();
        setIsAdding(false);
      })
      .catch((error) => {
        setAddDialog({ open: false, type: '', parentId: null });
        setIsAdding(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleAddCost = (rows) => {
    setUpdating(true);
    axiosInstance()
      .post(`${routes.invoice?.path}/${invoiceData?._id}/additional-cost`, [rows])
      .then(({ data }) => {
        setUpdating(false);
        fetchData();
        setAddCostDialog({ open: false, data: null, showSaveAndNext: false });
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

  const handleSaveData = async (rows: any, saveAndNext = false, showNext = false) => {
    try {
      setUpdating(true);
      if (!showNext) {
        const { data } = await axiosInstance().put(`${routes.invoice.path}/material/${invoiceData._id}`, { material: rows });
        fetchData();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
      }
      setUpdating(false);
      if (saveAndNext) {
        const rowIndex = dataRows.findIndex((d) => d._id === rows[0]?._id);

        if (dataRows[rowIndex + 1]?.type === MATERIAL_TYPE.manualEntry) {
          setMaterialEdit({
            open: false,
            data: null,
            bulkedit: false,
            showSaveAndNext: false
          });
          setAddCostDialog({
            open: true,
            data: dataRows[rowIndex + 1],
            showSaveAndNext: rowIndex + 1 < dataRows?.length - 1
          });
        } else {
          setMaterialEdit({
            open: true,
            data: dataRows[rowIndex + 1],
            bulkedit: false,
            showSaveAndNext: rowIndex + 1 < dataRows?.length - 1
          });
        }
      } else {
        setMaterialEdit({
          open: false,
          data: null,
          bulkedit: false,
          showSaveAndNext: false
        });
      }
    } catch (error) {
      setUpdating(false);
      toastConfig.setToastConfig(error);
    }
  };

  const handleSaveCostData = async (rows: any, saveAndNext = false) => {
    setUpdating(true);
    axiosInstance()
      .put(`${routes.invoice?.path}/${invoiceData?._id}/additional-cost`, [rows])
      .then(({ data }) => {
        setUpdating(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });

        if (saveAndNext) {
          const rowIndex = dataRows?.findIndex((d) => d._id === rows[0]?._id);
          if (dataRows[rowIndex + 1]?.type === MATERIAL_TYPE.manualEntry) {
            setAddCostDialog({ open: true, data: dataRows[rowIndex + 1], showSaveAndNext: rowIndex + 1 < dataRows?.length - 1 ? true : false });
          } else {
            setAddCostDialog({ open: false, data: null, showSaveAndNext: false });
            setMaterialEdit({
              open: true,
              data: dataRows[rowIndex + 1],
              bulkedit: false,
              showSaveAndNext: rowIndex + 1 < dataRows?.length - 1 ? true : false
            });
          }
        } else {
          setAddCostDialog({ open: false, data: null, showSaveAndNext: false });
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
        .put(`${invoice.api}/material/${invoiceData?._id}/delete`, { ids: products })
        .then(() => {
          setDeleting(false);
          fetchData();
          fetchInvoiceData();
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
        .put(`${routes?.invoice?.path}/${invoiceData._id}/additional-cost/remove`, { ids: cost })
        .then(({ data }) => {
          fetchData();
          setDeleteData(null);
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data?.message
          });
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const calculatePrice = (arr: any[]) => {
    if (invoiceData) {
      const data: any = {};
      data.conditionType = [invoiceData?.salesOrder ? PRICING_SETUP_TYPE.price : PRICING_SETUP_TYPE.rent];
      const material: any = [];
      arr?.forEach((ele) => {
        const obj = {
          materialId: ele?.materialId,
          materialType: ele?.type,
          qty: ele?.qty,
          pricingMethod: ele?.pricingMethod,
          currency: invoiceData?.currency
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
      data.customer = [invoiceData?.customerAccount?.optionValue];
      data.warehouse = [invoiceData?.warehouse?.optionValue];
      data.address = invoiceData?.shippingAddress?.optionValue ? [invoiceData?.shippingAddress?.optionValue] : [];
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
    const rowData = flattenArray(dataRows)?.find((d) => d._id === updatedData._id);
    let rows: any = [{ ...rowData, ...updatedData }];
    if (rowData?.type === MATERIAL_TYPE.manualEntry) {
      rows = await calculateRowsField(flattenArray(dataRows), inputField, costFields, updatedData, invoiceData?.currency);
      handleSaveCostData(rows[0]);
    } else {
      rows = await calculateRowsField(flattenArray(dataRows), inputField, allFields, updatedData, invoiceData?.currency);
      handleSaveData(rows);
    }
  };

  const addButtonMenuItems = () => {
    return (
      <>
        {permissions?.product?.isRead && (
          <MenuItem
            color="primary"
            onClick={() => {
              setAddDialog({ open: true, type: MATERIAL_TYPE.product, parentId: null });
            }}
          >
            {`Add Existing Products`}
          </MenuItem>
        )}

        {permissions?.packages?.isRead && (
          <MenuItem
            color="primary"
            onClick={() => {
              setAddDialog({ open: true, type: MATERIAL_TYPE.package, parentId: null });
            }}
          >
            {`Add Existing Packages`}
          </MenuItem>
        )}
        {permissions?.serviceMaster?.isRead && (
          <MenuItem
            color="primary"
            onClick={() => {
              setAddDialog({ open: true, type: MATERIAL_TYPE.service, parentId: null });
            }}
          >
            {`Add Existing Services`}
          </MenuItem>
        )}
        <MenuItem
          color="primary"
          onClick={() => {
            setAddDialog({ open: true, type: MATERIAL_TYPE.serializedAsset, parentId: null });
          }}
        >
          {`Add Existing Assets`}
        </MenuItem>
        {costFields?.length > 0 && (
          <MenuItem
            onClick={() => {
              setAddCostDialog({ open: true, data: null, showSaveAndNext: false });
            }}
          >
            Add Manual Entry
          </MenuItem>
        )}
      </>
    );
  };

  const actionButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          disabled={selectedRecords.some((e) => e.type === MATERIAL_TYPE.manualEntry)}
          onClick={() => {
            setMaterialEdit({ open: true, data: selectedRecords?.filter((e) => !e.hideSelection), bulkedit: true, showSaveAndNext: false });
          }}
        >
          Bulk Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            const obj: any = [];
            const dataToDelete = selectedRecords.filter((e) => !e.hideSelection);
            dataToDelete?.forEach((ele) => {
              obj.push({ id: ele._id, type: ele.type, materialId: ele.materialId });
            });
            dataToDelete?.forEach((ele) => {
              getNestedSubRows(obj, ele);
            });
            setDeleteData(obj);
          }}
        >
          Delete
        </MenuItem>
      </>
    );
  };

  return (
    <Fragment>
      <DetailsPageHeader
        isAddButtonVisible={allowedToEdit}
        addButtonMenuItems={addButtonMenuItems()}
        isActionButtonVisible={allowedToEdit}
        actionButtonMenuItems={actionButtonMenuItems()}
        actionButtonProps={{
          disabled: !Boolean(selectedRecords && selectedRecords.filter((e) => !e.hideSelection).length),
          tooltip: Boolean(selectedRecords && selectedRecords.length) ? '' : 'Select records to edit'
        }}
        hasXpadding
      />
      {columns ? (
        <>
          <Box zIndex={5} width={'100%'}>
            <CustomReactTable
              height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 395px)'}
              columns={columns}
              state={state}
              dispatch={dispatch}
              setWholeRowsCellColor={(rowData) => (!rowData.isValid ? 'error' : '')}
              expander={true}
              refreshGrid={fetchData}
              renderedFrom={renderedFrom}
              isClientSideGrid={true}
              onSaveEdit={onSaveInlineEdit}
              hideSelection={!allowedToEdit}
              hideAction={!allowedToEdit}
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
          selectedProducts={selectedRecords}
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
                setAddDialog({ open: true, type: MATERIAL_TYPE.product, parentId: addchildDialog.parentId });
                setAddchildDialog({ open: false, parentId: null, top: null, bottom: null, isSerializedProduct: false });
              }}
            >
              Product
            </MenuItem>
            <MenuItem
              onClick={() => {
                setAddDialog({ open: true, type: MATERIAL_TYPE.package, parentId: addchildDialog.parentId });
                setAddchildDialog({ open: false, parentId: null, top: null, bottom: null, isSerializedProduct: false });
              }}
            >
              Package
            </MenuItem>
            <MenuItem
              onClick={() => {
                setAddDialog({ open: true, type: MATERIAL_TYPE.service, parentId: addchildDialog.parentId });
                setAddchildDialog({ open: false, parentId: null, top: null, bottom: null, isSerializedProduct: false });
              }}
            >
              Services
            </MenuItem>
            {addchildDialog.isSerializedProduct && (
              <MenuItem
                onClick={() => {
                  setAddDialog({ open: true, type: MATERIAL_TYPE.serializedAsset, parentId: addchildDialog.parentId });
                  setAddchildDialog({ open: false, parentId: null, top: null, bottom: null, isSerializedProduct: false });
                }}
              >
                Assets
              </MenuItem>
            )}
          </MenuList>
        </Popover>
      )}
      {addDialog.open && addDialog.type === MATERIAL_TYPE.product && (
        <AssignProductDialog
          handleCloseDialog={() => setAddDialog({ open: false, type: '', parentId: null })}
          onSuccess={(d) => {
            handleAdd(d);
          }}
          isSubmitting={isAdding}
        />
      )}
      {addDialog.open && addDialog.type === MATERIAL_TYPE.service && (
        <AssignServiceDialog
          handleClose={() => setAddDialog({ open: false, type: '', parentId: null })}
          onSuccess={(rows) => {
            handleAdd(rows);
          }}
          isSubmitting={isAdding}
        />
      )}
      {addDialog.open && addDialog.type === MATERIAL_TYPE.package && (
        <AssignPackageDialog
          handleClose={() => setAddDialog({ open: false, type: '', parentId: null })}
          onSuccess={(rows) => {
            handleAdd(rows);
          }}
          isSubmitting={isAdding}
        />
      )}
      {addDialog.open && addDialog.type === MATERIAL_TYPE.serializedAsset && (
        <AssignSerializedAssetDialog
          reference={'invoice'}
          handleClose={() => {
            setAddDialog({ open: false, type: '', parentId: null });
            setAssetAssignedProduct([]);
          }}
          ids={flattenArray(dataRows)
            ?.filter((e) => e.type === MATERIAL_TYPE.serializedAsset)
            ?.map((e) => e.materialId)}
          handleSucess={(rows) => {
            if (addDialog.parentId) {
              handleAdd(
                rows?.map((e) => {
                  return { materialId: e.asset, type: MATERIAL_TYPE.serializedAsset, parentId: e._id };
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
      {addCostDialog.open && (
        <AdditionalCostDialog
          onClose={() => setAddCostDialog({ open: false, data: null, showSaveAndNext: false })}
          handleAddCost={handleAddCost}
          handleUpdateCost={handleSaveCostData}
          invoiceData={invoiceData}
          costData={addCostDialog.data}
          loadingEdit={isUpdating}
          showSaveAndNext={addCostDialog.showSaveAndNext}
        />
      )}
    </Fragment>
  );
};

export default Material;
