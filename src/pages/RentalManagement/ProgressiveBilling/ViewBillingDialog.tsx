import { useState, useEffect, useContext, Fragment } from 'react';
import Grid from '@mui/material/Grid2';
import Button from '@mui/material/Button';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../../axios/axiosInstance';
import { Box, Dialog, IconButton, Menu, MenuItem } from '@mui/material';
import { getNestedSubRows } from 'src/components/RentalManagment/helper';
import { isMobile, isTablet } from 'react-device-detect';
import routes from 'src/components/Helpers/Routes';
import {
  CHILD_RESOURCE,
  CustomDialogTransition,
  MATERIAL_TYPE,
  checkIsAllowedToDelete,
  checkIsAllowedToEdit,
  invoice,
  rentalManagement,
  sidebarResource
} from 'src/constants/helpers';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import RentalJobQtyDialog from '../Productpackage/RentalJobQtyDialog';
import { Delete, ExpandMore } from '@mui/icons-material';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import { camelCase, startCase } from 'lodash';
import EditIcon from '@mui/icons-material/Edit';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import PreviewDownload from 'src/components/PreviewDownload';
import { autoCalculateSpecificFields } from 'src/constants/formulaUtility';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import { useData } from 'src/StateProvider/Provider';
import { FiExternalLink } from 'react-icons/fi';
import { DeleteButton } from 'src/components/Helpers/Buttons';

const ViewBillingDialog = ({ rentalManagementData, invoiceId, onClose, onSuccess, allowCreateInvoice, isLatestInvoice }) => {
  const renderedFrom = `${camelCase(sidebarResource.rentalManagementInvoice)}_view_invoice`;

  const toastConfig = useContext(CustomToastContext);

  const [material, setMaterial] = useState([]);
  const [columns, setColumns] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [isLoadingUpdate, setIsLoadingUpdate] = useState(false);
  const [isProductEdit, setIsProductEdit] = useState({ open: false, rowData: null });
  const [viewBillDialogConfirm, setViewBillDialogConfirm] = useState({ open: false, rows: [] });
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, selectedRecords } = state;
  const { generateColumns } = useColumns();
  const [allFields, setAllFields] = useState([]);

  const {
    state: { user, permissions, resources }
  }: any = useData();

  const [invoiceData, setInvoiceData] = useState(null);

  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [allowedToDelete, setAllowedToDelete] = useState(false);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchInvoiceData();
  }, [invoiceId]);

  useEffect(() => {
    if (invoiceData) {
      fetchFields();
    }
  }, [invoiceData]);

  useEffect(() => {
    if (columns && invoiceData) {
      fetchData();
    }
  }, [columns, invoiceData]);

  const fetchInvoiceData = async () => {
    try {
      let data;
      const response: any = await axiosInstance().get(`${invoice.api}/${invoiceId}`);
      data = response?.data?.data;
      setAllowedToEdit(checkIsAllowedToEdit(user, sidebarResource.invoice, data) && permissions?.invoice?.isUpdate && allowCreateInvoice);
      setAllowedToDelete(
        permissions?.invoice?.isDelete &&
        checkIsAllowedToDelete(user, sidebarResource.invoice, data.owner.optionValue) &&
        data?.canDelete &&
        allowCreateInvoice
      );
      setInvoiceData(data);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchFields = async () => {
    try {
      let data = await fetch_child_resource_fields(CHILD_RESOURCE.invoiceProduct, invoiceData?.currency, false);
      setAllFields(JSON.parse(JSON.stringify(data)));
      const newColumns = generateColumns(
        renderedFrom,
        data?.map((e) => {
          return { ...e, fieldName: e.fieldName === 'qty' ? 'qtyDisplay' : e.fieldName };
        }),
        null,
        false,
        invoiceData?.currency
      );
      var column: any = [
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
          width: 200,
          disableFilters: true,
          sticky: isMobile || isTablet ? 'none' : 'left',
          disabled: true,
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
          disabled: true,
          width: 300,
          sticky: isMobile || isTablet ? 'none' : 'left',
          Cell: ({ row }) => (
            <div className="flex items-center gap-1">
              <p className="text-truncate" title={row.original?.detail}>
                {row.original?.detail}
              </p>
              {![MATERIAL_TYPE.manualEntry, MATERIAL_TYPE.other]?.includes(row.original['type']) && (
                <Box ml={1}>
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
                    <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                  </IconButton>
                </Box>
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
        Cell: ({ row }) => (
          <Grid container spacing={1}>
            {row.original['type'] !== MATERIAL_TYPE.other && row.original.isEditable && row.original.qty > 1 && (
              <>
                <IconButton
                  size="small"
                  aria-label="Details"
                  onClick={() => {
                    setIsProductEdit({ open: true, rowData: row.original });
                  }}
                >
                  <EditIcon color="primary" />
                </IconButton>
                <Box ml={1} />
              </>
            )}
            {row.original['type'] !== MATERIAL_TYPE.other && (
              <IconButton
                disabled={!isLatestInvoice}
                size="small"
                aria-label="Details"
                onClick={() => {
                  const obj: any = [{ id: row.original._id, type: row.original?.type, materialId: row.original?.materialId }];
                  getNestedSubRows(obj, row.original);
                  setViewBillDialogConfirm({ open: true, rows: obj });
                }}
              >
                <Delete fontSize="small" color={isLatestInvoice ? 'error' : 'disabled'} />
              </IconButton>
            )}
          </Grid>
        )
      });
      setColumns(column);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });

    var data: any = [];
    const response = await axiosInstance().get(`${invoice.api}/material/${invoiceId}`);
    data = response?.data?.data;

    const responseAdditionalCostData = await axiosInstance().get(`${invoice.api}/${invoiceId}/additional-cost`);
    let additionalCostData = responseAdditionalCostData?.data?.data;

    const rows = data.material.filter((e) => e.parentId === null);
    rows.forEach((parent, i) => {
      parent.index = i + 1;
      parent.detail = `${parent.type === MATERIAL_TYPE.product
        ? parent.productDetail?.productName
        : parent.type === MATERIAL_TYPE.package
          ? parent.packageDetail?.packageName
          : parent.type === MATERIAL_TYPE.serializedAsset
            ? parent.serializedAssetDetail?.assetNumber
            : parent.serviceDetail?.serviceName
        }`;
      parent.description =
        parent.type === MATERIAL_TYPE.service
          ? parent?.serviceDetail?.serviceDescription || ''
          : parent.type === MATERIAL_TYPE.product
            ? parent?.productDetail?.productDescription || ''
            : parent.type === MATERIAL_TYPE.package
              ? parent?.packageDetail?.packageDescription || ''
              : parent.type === MATERIAL_TYPE.serializedAsset
                ? `${parent.serializedAssetDetail?.product?.optionLabel}-${parent.serializedAssetDetail?.product?.productDescription || ''}`
                : '';
      parent.isEditable = ['Per Day', 'Per Week', 'Per Month'].includes(parent?.pricingMethod) ? false : true;
      parent.qtyDisplay = parent.qty;
      parent.subRows = generateNestedData(data.material, parent);
    });
    if (additionalCostData?.length > 0) {
      additionalCostData?.forEach((element) => {
        element.index = rows.length + 1;
        element.detail = element.detail;
        element.description = element.description;
        element.type = MATERIAL_TYPE.manualEntry;
        element.qtyDisplay = element.qty;
        element.materialId = element?._id;
        element.parentId = null;
        rows.push(element);
      });
    }

    dispatch({ type: 'initialize', data: rows, count: rows?.length });
    dispatch({ type: 'loading', loading: false });
  };

  const generateNestedData = (material, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, j) => {
      _subRow.index = parent.index + '.' + (j + 1);
      _subRow.detail = `${_subRow?.type === MATERIAL_TYPE.product
        ? _subRow?.productDetail?.productName
        : _subRow?.type === MATERIAL_TYPE.package
          ? _subRow?.packageDetail?.packageName
          : _subRow?.type === MATERIAL_TYPE.serializedAsset
            ? _subRow?.serializedAssetDetail?.assetNumber
            : _subRow?.type === MATERIAL_TYPE.service
              ? _subRow?.serviceDetail?.serviceName
              : _subRow?.type === MATERIAL_TYPE.other
                ? _subRow.detail
                : ''
        }`;
      _subRow.description =
        _subRow.type === MATERIAL_TYPE.service
          ? _subRow?.serviceDetail?.serviceDescription || ''
          : _subRow.type === MATERIAL_TYPE.product
            ? _subRow?.productDetail?.productDescription || ''
            : _subRow.type === MATERIAL_TYPE.package
              ? _subRow?.packageDetail?.packageDescription || ''
              : _subRow.type === MATERIAL_TYPE.serializedAsset
                ? _subRow.serializedAssetDetail?.product?.productDescription || ''
                : '';
      _subRow.isEditable = false;
      _subRow.qtyDisplay = _subRow?.type === MATERIAL_TYPE.other ? '' : `${parent.qtyDisplay * _subRow.qty}`;
      _subRow.hideSelection = _subRow?.type === MATERIAL_TYPE.other ? true : false;
      _subRow.subRows = generateNestedData(material, _subRow);
    });
    return subRows;
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSaveData = async (rows: any) => {
    const data = {
      invoiceId: invoiceData?._id,
      _id: rows[0]?._id
    };
    const calValues = autoCalculateSpecificFields({ qty: rows[0]?.qty }, isProductEdit.rowData, allFields);
    Object.assign(data, calValues);
    setIsLoadingUpdate(true);
    axiosInstance()
      .put(`${rentalManagement.api}/${rentalManagementData._id}/progressive-billing/update-qty`, data)
      .then((res) => {
        setIsLoadingUpdate(false);
        setIsProductEdit({ open: false, rowData: null });
        fetchData();
        onSuccess();
      })
      .catch((error) => {
        setIsLoadingUpdate(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleDeleteData = async (rows) => {
    const data = {
      invoiceId: invoiceData?._id,
      materialIds: rows?.map((e) => e.materialId) || []
    };
    axiosInstance()
      .put(`${rentalManagement.api}/${rentalManagementData._id}/progressive-billing/remove`, data)
      .then((res) => {
        fetchData();
        fetchInvoiceData();
        setViewBillDialogConfirm({ open: false, rows: [] });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleDeleteInvoice = async () => {
    setIsSubmitting(true);
    axiosInstance()
      .put(`${invoice.api}/remove`, { ids: [invoiceId] })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setShowDeleteConfirmBox(false);
        setIsSubmitting(false);
        onSuccess();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setIsSubmitting(false);
      });
  };

  return (
    <Fragment>
      <Dialog fullScreen={true} TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={true}>
        <CustomDialogHeader title={`Invoice Number : ${invoiceData?.invoiceNumber}`} onClose={onClose} showRequiredLabel={false}></CustomDialogHeader>
        <CustomDialogContent>
          <Fragment>
            <Box display="flex" justifyContent="space-between" p={1}>
              {invoiceData && (
                <PreviewDownload
                  fileName={`${resources?.invoice?.titleSingular}-${invoiceData?.invoiceNumber}`}
                  resource={sidebarResource.invoice}
                  referenceId={invoiceData?._id}
                  columns={columns}
                  isSendEmail={true}
                  hideDetailButton={dataRows?.find((e) => e?.subRows?.length) ? false : true}
                />
              )}
              <Box display="flex" alignItems="center">
                {allowedToDelete && <DeleteButton text="Delete" onClick={() => setShowDeleteConfirmBox(true)} />}
                <Box ml={1} />
                {allowedToEdit && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleClick}
                    aria-controls="action-menu"
                    disabled={selectedRecords?.length && isLatestInvoice ? false : true}
                    endIcon={<ExpandMore />}
                    className="new-dropdown-v1"
                  >
                    Actions
                  </Button>
                )}
                <Menu
                  id="action-menu"
                  anchorEl={anchorEl}
                  keepMounted
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right'
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right'
                  }}
                >
                  <MenuItem
                    onClick={() => {
                      setAnchorEl(null);
                      const obj: any = [];
                      selectedRecords?.forEach((ele) => {
                        obj.push({ id: ele._id, type: ele.type, materialId: ele.materialId });
                      });
                      selectedRecords?.forEach((ele) => {
                        getNestedSubRows(obj, ele);
                      });
                      setViewBillDialogConfirm({ open: true, rows: obj });
                    }}
                  >
                    Delete
                  </MenuItem>
                </Menu>
              </Box>
            </Box>
            {columns ? (
              <CustomReactTable
                height={'calc(100vh - 250px)'}
                columns={columns}
                state={state}
                dispatch={dispatch}
                refreshGrid={fetchData}
                hideSelection={!allowedToEdit}
                hideAction={!allowedToEdit}
                renderedFrom={renderedFrom}
                isClientSideGrid={true}
                expander={true}
              />
            ) : (
              <Box p={2} height={500}>
                <CommonSkeleton lenArray={[...Array(10).keys()]} />
              </Box>
            )}
          </Fragment>
        </CustomDialogContent>
        <CustomDialogFooter>
          <Button
            type="button"
            variant="outlined"
            color="primary"
            size="small"
            onClick={() => {
              onClose();
            }}
          >
            Cancel
          </Button>
        </CustomDialogFooter>
      </Dialog>
      {isProductEdit.open && (
        <RentalJobQtyDialog
          onClose={() => {
            setIsProductEdit({ open: false, rowData: null });
          }}
          isBulkedit={false}
          handleSaveData={handleSaveData}
          rentalManagementData={rentalManagementData}
          rowData={dataRows?.find((d) => d._id === isProductEdit.rowData._id)}
          material={material}
          selectedProducts={[]}
          loading={isLoadingUpdate}
          isQtyOnly={true}
          isRateRequired={false}
        />
      )}
      {viewBillDialogConfirm.open && (
        <ConfirmationDialog
          open={viewBillDialogConfirm.open}
          message={`Are you sure you want to delete ?`}
          onClose={() => {
            setViewBillDialogConfirm({ open: false, rows: [] });
          }}
          okBtnLoading={null}
          onOk={() => {
            handleDeleteData(viewBillDialogConfirm.rows);
          }}
        />
      )}

      {showDeleteConfirmBox && (
        <ConfirmationDialog
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete invoice ${invoiceData?.invoiceNumber || ''} ?`}
          onClose={() => {
            setShowDeleteConfirmBox(false);
          }}
          okBtnLoading={isSubmitting}
          onOk={() => {
            handleDeleteInvoice();
          }}
        />
      )}
    </Fragment>
  );
};

export default ViewBillingDialog;
