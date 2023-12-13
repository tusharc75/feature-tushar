import { useState, useEffect, useContext, Fragment } from 'react';
import { Box, Button, IconButton, CircularProgress, MenuItem, Menu } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import { useData } from '../../../StateProvider/Provider';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import Add from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import { sublease, pricingCondition, SUBLEASE_TYPE, SUBLEASE_STATUS, PRICING_SETUP_TYPE } from '../../../constants/helpers';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import QtyDialog from './QtyDialog';
import { autoCalculateSpecificFields } from '../../../constants/formulaUtility';
import { isMobile, isTablet } from 'react-device-detect';
import { MdDelete } from 'react-icons/md';
import { fetch_sublease_product_fields } from '../../../components/Sublease/helper';
import { ExpandMore } from '@material-ui/icons';
import { flattenArray } from 'src/constants/columns';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { calculateRowsField } from 'src/components/RentalManagment/helper';
import EditIcon from '@material-ui/icons/Edit';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import AssignPackageDialog from 'src/components/AssignRolesDialog/AssignPackageDialog';
import { ownerAndColaborator, subleaseMessage } from 'src/constants/messageHelpers';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTableNew';

const Productpackage = ({ subleaseData, setNextStep, setNextStepToolTip, fetchData, isIssued, renderedFrom, allowedToEdit, stepFullScreen }) => {

  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();
  const { generateColumns } = useColumns();
  const { state, dispatch } = useTableReducer();
  const { dataRows, selectedRecords } = state;

  const [isUpdating, setUpdating] = useState(false);

  const [isProductEdit, setIsProductEdit] = useState({ open: false, isBulkedit: false });

  const [recordToUpdate, setRecordToUpdate] = useState(null);

  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);
  const [isIssueing, setIssueing] = useState(false);

  const [material, setMaterial] = useState([]);
  const [addExistingProductDialog, setAddExistingProductDialog] = useState({ open: false, type: '', parentId: null });
  const [columns, setColumns] = useState(null);
  const [allFields, setAllFields] = useState([]);
  const [isRateRequired, setIsRateRequired] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [addAnchorEl, setAddAnchorEl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false)


  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    fetchProductInventory();
  }, [columns]);

  const fetchFields = async () => {
    var data = await fetch_sublease_product_fields(subleaseData?.currency);
    setAllFields(JSON.parse(JSON.stringify(data)));
    const newColumns = generateColumns(renderedFrom, data, null, false, subleaseData?.currency);
    let qtyIndex = newColumns.findIndex((d) => d.accessor === 'qty');
    if (qtyIndex > -1) {
      newColumns[qtyIndex].accessor = 'qtyDisplay';
    }
    let coloum: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>
      },
      {
        accessor: 'detail',
        Header: 'Detail',
        minWidth: 300,
        width: 300,
        sticky: isMobile || isTablet ? 'none' : 'left',
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
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
            {row.original?.type === 'package' && allowedToEdit && (
              <Box ml={1} className="d-flex align-items-center">
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
              </Box>
            )}
            <Box ml={1}>
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
                  <OpenInNewIcon fontSize="small" />
                </IconButton>
              </HtmlTooltip>
            </Box>
          </div>
        ),
        Footer: () => {
          return <>Total</>;
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
              disabled={!allowedToEdit || (subleaseData.type === SUBLEASE_TYPE.vendor && isIssued)}
              onClick={() => {
                openMaterial(row.original);
              }}
            >
              <EditIcon fontSize="small" color={!allowedToEdit || (subleaseData.type === SUBLEASE_TYPE.vendor && isIssued) ? 'disabled' : 'primary'} />
            </IconButton>
          </HtmlTooltip>

          <IconButton
            size="small"
            aria-label="Details"
            disabled={row.original.canDelete ? false : true}
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
            <DeleteIcon fontSize="small" color={row.original.canDelete ? "error" : "disabled"} />
          </IconButton>
        </>
      )
    });
    coloum.forEach((element) => {
      if (element.accessor === 'qtyDisplay') {
        element['Footer'] = (info) => {
          let rows = info.table.getExpandedRowModel().rows;
          const qtyTotal = rows?.filter((f) => !f.original.parentId && f.original.hasOwnProperty(element.accessor) && !isNaN(f.original[element.accessor]))
            .reduce((sum, row) => row.original[element.accessor] + sum, 0);
          return <>{qtyTotal}</>;
        };
      }
    });
    setColumns(coloum);
  };

  const fetchProductInventory = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    setNextStep(false);
    setNextStepToolTip(null)
    var data: any = [];
    var inventory: any = [];
    const response = await axiosInstance().get(`${sublease.api}/productpackage/${subleaseData._id}`);
    data = response?.data?.data;
    setMaterial(JSON.parse(JSON.stringify(data.material)));
    inventory = data.inventory;
    const rows = data.material.filter((e) => e.parentId === null);
    rows.forEach((parent, i) => {
      parent.index = i + 1;
      parent.detail = parent.type === 'product' ? parent.productDetail?.productName : parent.packageDetail?.packageName;
      parent.description = parent.type === 'product' ? parent.productDetail?.productDescription : parent.packageDetail?.packageDescription;
      parent.qtyDisplay = parent.qty;
      parent.isValid = parent['finalPrice_' + subleaseData?.currency?.toLowerCase()] ? true : !isRateRequired;
      parent.assetQty = subleaseData.type === SUBLEASE_TYPE.vendor ? inventory?.filter((e) => e?.inventoryDetail?.product === parent.materialId).length :
        inventory?.filter((e) => e._id === parent._id).length
      parent.hideSelection = parent.assetQty > 0 ? true : false;
      parent.canDelete = parent.assetQty === 0 && allowedToEdit ? true : false;
      if (parent.type === 'package') {
        const subRows: any = data.material.filter((e) => e.parentId === parent._id);
        var assetQty = 0;
        subRows.forEach((_subRow, j) => {
          _subRow.index = i + 1 + '.' + (j + 1);
          _subRow.detail = _subRow.productDetail?.productName;
          _subRow.description = _subRow.productDetail?.productDescription;
          _subRow.qtyDisplay = `${parent.qty * _subRow.qty}`;
          _subRow.isValid = _subRow['finalPrice_' + subleaseData?.currency?.toLowerCase()] ? true : !isRateRequired;
          _subRow.assetQty = subleaseData.type === SUBLEASE_TYPE.vendor ? inventory?.filter((e) => e?.inventoryDetail?.product === _subRow.materialId).length :
            inventory?.filter((e) => e._id === _subRow._id).length
          _subRow.canDelete = _subRow.assetQty === 0 && allowedToEdit ? true : false;
          if (!_subRow.canDelete) {
            parent.canDelete = false
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
    }
    else {
      if (subleaseData?.type === SUBLEASE_TYPE.vendor) {
        if (isIssued) {
          setNextStep(true);
          setNextStepToolTip(null);
        }
        else {
          setNextStep(false);
          setNextStepToolTip(subleaseMessage.startSublease);
        }
      }
      else {
        setNextStep(true);
        setNextStepToolTip(null);
      }
    }
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
        fetchProductInventory();
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
        fetchProductInventory();
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
        fetchProductInventory();
        setAnchorEl(null);
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

  const issueSublease = () => {
    setIssueing(true);
    axiosInstance()
      .put(`${sublease.api}/${subleaseData._id}/issue-sublease`)
      .then(() => {
        setIssueing(false);
        fetchData();
      })
      .catch((error) => {
        setUpdating(false);
        toastConfig.setToastConfig(error);
      });
  };

  const calculatePrice = (arr: any[]) => {
    if (subleaseData) {
      const data: any = {};
      data.conditionType = [PRICING_SETUP_TYPE.rent];
      data.material = arr.map((ele) => ({
        materialId: ele?.materialId,
        materialType: ele?.type,
        qty: ele?.qty,
        pricingMethod: ele?.pricingMethod,
        unit: ele?.unit,
        currency: subleaseData?.currency
      }));
      data.supplier = [subleaseData?.supplierAccount?.optionValue];
      data.customer = [];
      data.warehouse = [];
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
  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
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
    rows = await calculateRowsField(flattenArray(dataRows), inputField, allFields, updatedData);
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
      <Box display="flex" justifyContent="space-between" m={1}>
        <Box display="flex" gridGap={'8px'} flexWrap={'wrap'}>
          <HtmlTooltip title={!allowedToEdit ? ownerAndColaborator : ''}>
            <div>
              <Button
                variant={'outlined'}
                color="primary"
                size="small"
                startIcon={<Add />}
                disabled={!allowedToEdit || (subleaseData.type === SUBLEASE_TYPE.vendor && subleaseData.status === SUBLEASE_STATUS.issued)}
                onClick={openAddActions}
                aria-controls="add-menu">
                {'Add'}
                <ExpandMore fontSize="small" />
              </Button>
            </div>
          </HtmlTooltip>
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
            <MenuItem
              onClick={() => {
                setAddExistingProductDialog({ open: true, type: 'product', parentId: null });
                closeAddActions();
              }}
            >
              Add Existing Products
            </MenuItem>
            <MenuItem
              onClick={() => {
                closeAddActions();
                setAddExistingProductDialog({ open: true, type: 'package', parentId: null });
              }}
            >
              Add Existing Packages
            </MenuItem>
          </Menu>
        </Box>
        <Box display="flex">
          {material?.length && dataRows?.length && !isIssued && !dataRows?.some((f) => !f.isValid) && subleaseData?.type !== SUBLEASE_TYPE.interCompany ? (
            <Box ml={1}>
              <HtmlTooltip title={!allowedToEdit ? ownerAndColaborator : 'Start Sublease'}>
                <Button
                  variant={'contained'}
                  color="primary"
                  size="small"
                  onClick={() => {
                    issueSublease();
                  }}
                  disabled={isIssueing || !allowedToEdit}
                  endIcon={isIssueing && <CircularProgress size={20} color="primary" />}
                >
                  {isMobile && !isTablet ? <MdDelete size={20} /> : 'Start Sublease'}
                </Button>
              </HtmlTooltip>
            </Box>
          ) : null}
          <Box ml={1}>
            <HtmlTooltip title={!allowedToEdit ? ownerAndColaborator : 'Actions'}>
              <Button
                disabled={selectedRecords?.length || !allowedToEdit || (subleaseData.type === SUBLEASE_TYPE.vendor && !isIssued) ? false : true}
                variant={'outlined'}
                color="default"
                size="small"
                onClick={openActions}
                className={` new-dropdown-v1`}
                aria-controls="action-menu"
                endIcon={<ExpandMore />}
              >
                Actions
              </Button>
            </HtmlTooltip>
          </Box>
          <Menu
            anchorEl={anchorEl}
            keepMounted
            getContentAnchorEl={null}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left'
            }}
            id="action-menu"
            open={Boolean(anchorEl)}
            onClose={closeActions}
          >
            <MenuItem
              color="primary"
              disabled={!Boolean(selectedRecords && selectedRecords.filter((e) => !e.hideSelection).length)}
              onClick={() => {
                setAnchorEl(null);
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
          </Menu>
        </Box>
      </Box>
      {columns ? (
        <Box zIndex={5} width={'100%'}>
          <CustomReactTable
            height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 395px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            refreshGrid={fetchProductInventory}
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
      )
      }
      {
        deleteData && (
          <ConfirmationDialog
            open={true}
            message={`Are you sure you want to delete the record(s)?`}
            onClose={() => setDeleteData(null)}
            onOk={() => handleDelete(deleteData)}
            okBtnLoading={isDeleting}
          />
        )
      }
      {
        isProductEdit.open && (
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
        )
      }
      {
        addExistingProductDialog.open && addExistingProductDialog.type === 'product' && (
          <AssignProductDialog
            handleCloseDialog={() => setAddExistingProductDialog({ open: false, type: '', parentId: null })}
            onSuccess={(products) => {
              handleAdd(products);
            }}
            serialized={true}
            isSubmitting={isSubmitting}
          />
        )
      }
      {
        addExistingProductDialog.open && addExistingProductDialog.type === 'package' && (
          <AssignPackageDialog
            handleClose={() => setAddExistingProductDialog({ open: false, type: '', parentId: null })}
            onSuccess={(rows) => {
              handleAdd(rows);
            }}
            packageType={'product'}
            isSubmitting={isSubmitting}
          />
        )
      }
    </Fragment >
  );
};

export default Productpackage;
