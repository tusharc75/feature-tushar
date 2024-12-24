import { Box, IconButton, MenuItem } from '@mui/material';
import Add from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import { isArray } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import AssignPackageDialog from 'src/components/AssignRolesDialog/AssignPackageDialog';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { calculateRowsField } from 'src/components/RentalManagment/helper';
import { flattenArray } from 'src/constants/columns';
import { ownerAndColaborator, subleaseMessage } from 'src/constants/messageHelpers';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../../axios/axiosInstance';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import routes from '../../../components/Helpers/Routes';
import { autoCalculateSpecificFields } from '../../../constants/formulaUtility';
import { CHILD_RESOURCE, MATERIAL_TYPE, PRICING_SETUP_TYPE, pricingCondition, sublease } from '../../../constants/helpers';
import QtyDialog from './QtyDialog';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import { FiExternalLink } from 'react-icons/fi';
import { useSetWalkmeData } from 'src/components/CustomIntro';
import { generateAddStepEditProduct } from 'src/pages/Sublease/walkmeSteps';

const Productpackage = ({ subleaseData, setNextStep, setNextStepToolTip, fetchData, renderedFrom, allowedToEdit, stepFullScreen }) => {
  const { setWalkmeData } = useSetWalkmeData();
  const toastConfig = useContext(CustomToastContext);

  const { generateColumns } = useColumns();
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, selectedRecords } = state;

  const [isUpdating, setUpdating] = useState(false);

  const [isProductEdit, setIsProductEdit] = useState({ open: false, isBulkedit: false });

  const [recordToUpdate, setRecordToUpdate] = useState(null);

  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);

  const [material, setMaterial] = useState([]);
  const [addExistingProductDialog, setAddExistingProductDialog] = useState({ open: false, type: '', parentId: null });
  const [columns, setColumns] = useState(null);
  const [allFields, setAllFields] = useState([]);
  const [isRateRequired, setIsRateRequired] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    fetchMaterial();
  }, [columns]);

  const fetchFields = async () => {
    var data = await fetch_child_resource_fields(CHILD_RESOURCE.subleaseProduct, subleaseData?.currency, allowedToEdit);
    setAllFields(JSON.parse(JSON.stringify(data)));
    const newColumns = generateColumns(
      renderedFrom,
      data?.map((e) => {
        return { ...e, fieldName: e.fieldName === 'qty' ? 'qtyDisplay' : e.fieldName };
      }),
      null,
      false,
      subleaseData?.currency
    );
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
        accessor: 'detail',
        Header: 'Detail',
        minWidth: 250,
        width: 250,
        sticky: isMobile || isTablet ? 'none' : 'left',
        Cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {!allowedToEdit ? (
              <p> {row.original.detail}</p>
            ) : (
              <p
                onClick={() => {
                  openMaterial(row.original);
                }}
                className="link text-truncate"
                title={row.original.detail}
              >
                {row.original.detail}
              </p>
            )}
            {row.original?.type === MATERIAL_TYPE.package && allowedToEdit && (
              <>
                <span title={`There are ${row.original?.subRows?.length} product(s) in this package`}>({row.original?.subRows?.length})</span>
                <HtmlTooltip title="Add Product">
                  <IconButton
                    onClick={() => setAddExistingProductDialog({ open: true, type: 'product', parentId: row.original?._id })}
                    size="small"
                    color="primary"
                  >
                    <Add color="disabled" fontSize="small" />
                  </IconButton>
                </HtmlTooltip>
              </>
            )}
            <HtmlTooltip title="Details">
              <IconButton
                size="small"
                aria-label="Details"
                onClick={() => {
                  window.open(
                    `${row.original.type === 'product' ? routes.productDetail.path : routes.packagesDetail.path}/${row.original.materialId}`
                  );
                }}
              >
                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
              </IconButton>
            </HtmlTooltip>
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
    coloum = [...coloum, ...newColumns];
    coloum.push({
      accessor: 'action',
      Header: 'Actions',
      minWidth: 100,
      width: 100,
      sticky: 'right',
      disableFilters: true,
      disableSortBy: true,
      Cell: ({ row }) => (
        <>
          <HtmlTooltip title={allowedToEdit ? 'Edit' : ''}>
            <IconButton
              size="small"
              aria-label="Delete"
              disabled={!allowedToEdit}
              onClick={() => {
                openMaterial(row.original);
              }}
              id={`edit-product-button-${row.index || 0}`}
            >
              <EditIcon fontSize="small" color={!allowedToEdit ? 'disabled' : 'primary'} />
            </IconButton>
          </HtmlTooltip>

          <IconButton
            size="small"
            aria-label="Details"
            disabled={row.original.canDelete ? false : true}
            id={`delete-product-button-${row.index || 0}`}
            onClick={() => {
              const obj: any = [{ id: row.original._id, type: row.original?.type, materialId: row.original?.materialId }];
              if (row.original?.type === 'package' && row.original?.subRows?.length) {
                row.original?.subRows.forEach((element) => {
                  obj.push({ id: element._id, type: element.type, materialId: element.materialId });
                });
              }
              setDeleteData(obj);
            }}
          >
            <DeleteIcon fontSize="small" color={row.original.canDelete ? 'error' : 'disabled'} />
          </IconButton>
        </>
      )
    });
    setColumns(coloum);
  };

  const handleAddWalkmeData = (rows: any[]) => {
    if (allowedToEdit && rows.length > 0) {
      setWalkmeData([generateAddStepEditProduct(0)]);
    }
  };

  const fetchMaterial = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    setNextStep(false);
    setNextStepToolTip(null);
    var data: any = [];
    var inventory: any = [];
    const response = await axiosInstance().get(`${sublease.api}/productpackage/${subleaseData._id}`);
    data = response?.data?.data;
    setMaterial(JSON.parse(JSON.stringify(data.material)));
    inventory = data.inventory;
    const rows = data.material.filter((e) => e.parentId === null);
    rows.forEach((parent, i) => {
      parent.index = i + 1;
      parent.detail = parent.type === MATERIAL_TYPE.product ? parent.productDetail?.productName : parent.packageDetail?.packageName;
      parent.description =
        parent.type === MATERIAL_TYPE.product ? parent.productDetail?.productDescription : parent.packageDetail?.packageDescription;
      parent.qtyDisplay = parent.qty;
      parent.isValid = parent['finalPrice_' + subleaseData?.currency?.toLowerCase()] ? true : !isRateRequired;
      parent.assetQty = inventory?.filter((e) => e._id === parent._id).length;
      parent.hideSelection = parent.assetQty > 0 ? true : false;
      parent.canDelete = parent.assetQty === 0 && allowedToEdit ? true : false;
      if (parent.type === MATERIAL_TYPE.package) {
        const subRows: any = data.material.filter((e) => e.parentId === parent._id);
        var assetQty = 0;
        subRows.forEach((_subRow, j) => {
          _subRow.index = i + 1 + '.' + (j + 1);
          _subRow.detail = _subRow.productDetail?.productName;
          _subRow.description = _subRow.productDetail?.productDescription;
          _subRow.qtyDisplay = `${parent.qty * _subRow.qty}`;
          _subRow.isValid = _subRow['finalPrice_' + subleaseData?.currency?.toLowerCase()] ? true : !isRateRequired;
          _subRow.assetQty = inventory?.filter((e) => e._id === _subRow._id).length;
          _subRow.canDelete = _subRow.assetQty === 0 && allowedToEdit ? true : false;
          if (!_subRow.canDelete) {
            parent.canDelete = false;
          }
          _subRow.hideSelection = _subRow.assetQty > 0 ? true : false;
          assetQty += _subRow.assetQty;
        });
        if (subRows.length === 0) {
          parent.isValid = false;
        }
        parent.assetQty = assetQty;
        parent.hideSelection = subRows.filter((e) => e.hideSelection).length ? true : false;
        parent.subRows = subRows;
      }
    });

    if (rows.filter((_rows) => _rows.isValid === false).length > 0 || rows.length === 0) {
      setNextStep(false);
      setNextStepToolTip(subleaseMessage.addProductPackage);
    } else {
      setNextStep(true);
    }
    handleAddWalkmeData(rows);
    dispatch({ type: 'initialize', data: rows, count: rows?.length });
    dispatch({ type: 'loading', loading: false });
  };

  const handleAdd = async (rows) => {
    setIsSubmitting(true);
    const material: any = [];
    rows.forEach((d) => {
      const element: any = {};
      element.materialId = d._id;
      element.type = addExistingProductDialog.type;
      element.unit = d.unitMain && d.unitMain.length ? d.unitMain[0] : '';
      element.pricingMethod = d.pricingMethodMain && d.pricingMethodMain.length ? d.pricingMethodMain[0] : '';
      element.qty = d.qty ? parseFloat(d.qty) : 1;
      element.estimateStartDate = subleaseData ? subleaseData?.estimateStartDate : new Date();
      element.estimateEndDate = subleaseData ? subleaseData?.estimateEndDate : new Date();
      element.actualStartDate = '';
      element.actualEndDate = '';
      element.actualJobDuration = '';
      element.parentId = addExistingProductDialog.parentId;
      const calValues = autoCalculateSpecificFields({ estimateEndDate: element.estimateEndDate }, element, allFields);
      element.estimateJobDuration = 1;
      if (calValues && calValues['estimateJobDuration']) {
        element.estimateJobDuration = calValues['estimateJobDuration'];
      }
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
        const priceFieldName = `price_${subleaseData?.currency?.toLowerCase()}`;
        element[priceFieldName] = rateResult[0].mrp;
        const calValues = autoCalculateSpecificFields({ [priceFieldName]: rateResult[0].mrp }, element, allFields);
        Object.assign(element, calValues);
      }
    });

    axiosInstance()
      .post(`${sublease.api}/productpackage/${subleaseData._id}`, { material })
      .then(() => {
        setAddExistingProductDialog({ open: false, type: '', parentId: null });
        fetchMaterial();
        fetchData();
        setIsSubmitting(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setIsSubmitting(false);
      });
  };

  const handleSaveData = async (rows: any) => {
    setUpdating(true);
    axiosInstance()
      .put(`${sublease.api}/productpackage/${subleaseData._id}`, { material: rows })
      .then(() => {
        setUpdating(false);
        setIsProductEdit({ open: false, isBulkedit: false });
        fetchMaterial();
      })
      .catch((error) => {
        setUpdating(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleDelete = (rows) => {
    setDeleting(true);
    const ids = rows.map((e) => e.id);
    axiosInstance()
      .put(`${sublease.api}/productpackage/${subleaseData?._id}/delete`, { ids })
      .then(() => {
        setDeleting(false);
        fetchMaterial();
        setDeleteData(null);
      })
      .catch((error) => {
        setDeleting(false);
        toastConfig.setToastConfig(error);
        setDeleteData(null);
      });
  };

  const openMaterial = (rowData) => {
    setIsProductEdit({ open: true, isBulkedit: false });
    setRecordToUpdate(rowData);
  };

  const calculatePrice = (arr: any[]) => {
    if (subleaseData) {
      const data: any = {};
      data.conditionType = [PRICING_SETUP_TYPE.rent];
      const material: any = [];
      arr?.forEach((ele) => {
        const obj = {
          materialId: ele?.materialId,
          materialType: ele?.type,
          qty: ele?.qty,
          pricingMethod: ele?.pricingMethod,
          currency: subleaseData?.currency
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
      data.supplier = [subleaseData?.supplierAccount?.optionValue];
      data.customer = [];
      data.warehouse = [];
      data.address = subleaseData?.shippingAddress?.optionValue ? [subleaseData?.shippingAddress?.optionValue] : [];
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
    if (inputField.hasOwnProperty('qtyDisplay')) {
      inputField['qty'] = inputField['qtyDisplay'];
    }
    if (inputField['qty'] < rowData?.assetQty) {
      toastConfig.setToastConfig({
        open: true,
        type: 'error',
        message: 'The quantity is less than what was assigned.'
      });
      return;
    }
    let rows: any = [{ ...rowData, ...updatedData }];
    rows = await calculateRowsField(flattenArray(dataRows), inputField, allFields, updatedData, subleaseData?.currency);
    handleSaveData(rows);
  };

  const addButtonMenuitems = () => {
    return (
      <>
        <MenuItem
          id="add-existing-products-menu-item"
          onClick={() => {
            setAddExistingProductDialog({ open: true, type: 'product', parentId: null });
          }}
        >
          Add Existing Products
        </MenuItem>
        <MenuItem
          id="add-existing-package-menu-item"
          onClick={() => {
            setAddExistingProductDialog({ open: true, type: 'package', parentId: null });
          }}
        >
          Add Existing Packages
        </MenuItem>
      </>
    );
  };

  const actionButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          color="primary"
          disabled={!Boolean(selectedRecords && selectedRecords.filter((e) => !e.hideSelection).length)}
          onClick={() => {
            setIsProductEdit({ open: true, isBulkedit: true });
          }}
        >
          {'Bulk Edit'}
        </MenuItem>
        <MenuItem
          color="primary"
          disabled={selectedRecords?.length && selectedRecords.every((e) => e.canDelete) ? false : true}
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
          {'Delete'}
        </MenuItem>
      </>
    );
  };

  return (
    <Fragment>
      <DetailsPageHeader
        isAddButtonVisible={true}
        addButtonMenuItems={addButtonMenuitems()}
        addButtonProps={{
          tooltip: !allowedToEdit ? ownerAndColaborator : '',
          disabled: !allowedToEdit
        }}
        isActionButtonVisible={true}
        actionButtonMenuItems={actionButtonMenuItems()}
        actionButtonProps={{
          tooltip: !allowedToEdit ? ownerAndColaborator : 'Actions',
          disabled: selectedRecords?.length || !allowedToEdit ? false : true
        }}
        hasXpadding
      />
      {columns ? (
        <Box zIndex={5} width={'100%'}>
          <CustomReactTable
            height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 395px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            refreshGrid={fetchMaterial}
            setWholeRowsCellColor={(rowData) => (!rowData.isValid ? 'error' : '')}
            hideSelection={!allowedToEdit}
            onSaveEdit={onSaveInlineEdit}
            hideAction={!allowedToEdit}
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
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
        <QtyDialog
          calculatePrice={calculatePrice}
          onClose={() => {
            setIsProductEdit({ open: false, isBulkedit: false });
            setRecordToUpdate(null);
          }}
          isBulkedit={isProductEdit.isBulkedit}
          handleSaveData={handleSaveData}
          subleaseData={subleaseData}
          rowData={recordToUpdate}
          material={material}
          selectedProducts={selectedRecords}
          loading={isUpdating}
        />
      )}
      {addExistingProductDialog.open && addExistingProductDialog.type === 'product' && (
        <AssignProductDialog
          handleCloseDialog={() => setAddExistingProductDialog({ open: false, type: '', parentId: null })}
          onSuccess={(products) => {
            handleAdd(products);
          }}
          serialized={true}
          isSubmitting={isSubmitting}
        />
      )}
      {addExistingProductDialog.open && addExistingProductDialog.type === 'package' && (
        <AssignPackageDialog
          handleClose={() => setAddExistingProductDialog({ open: false, type: '', parentId: null })}
          onSuccess={(rows) => {
            handleAdd(rows);
          }}
          packageType={'product'}
          isSubmitting={isSubmitting}
        />
      )}
    </Fragment>
  );
};

export default Productpackage;
