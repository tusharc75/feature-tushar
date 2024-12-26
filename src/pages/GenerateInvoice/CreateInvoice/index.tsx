import { useState, useEffect, useContext, Fragment } from 'react';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../../axios/axiosInstance';
import { Box, Dialog, IconButton } from '@mui/material';
import { isMobile, isTablet } from 'react-device-detect';
import routes from 'src/components/Helpers/Routes';
import { CHILD_RESOURCE, CustomDialogTransition, MATERIAL_TYPE, dateFormat, sidebarResource } from 'src/constants/helpers';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import { autoCalculateSpecificFields } from 'src/constants/formulaUtility';
import styles from '../../Leads/Header.module.scss';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { camelCase, startCase } from 'lodash';
import moment from 'moment';
import { useData } from 'src/StateProvider/Provider';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import { FiExternalLink } from 'react-icons/fi';
import CustomButton from 'src/components/Helpers/CustomButton';
import InvoiceDataDialog from 'src/pages/RentalManagement/ProgressiveBilling/InvoiceDataDialog';
import CustomDatePicker from 'src/components/CustomDatePicker';

const renderedFrom = `${camelCase(sidebarResource.generateInvoice)}_create`;

const CreateInvoiceDialog = ({ onClose, onSuccess, resourceData, resource, progressiveBilling }) => {
  const toastConfig = useContext(CustomToastContext);

  const [isUpdating, setUpdating] = useState(false);
  const [isDateApplying, setIsDateApplying] = useState(false);

  const [material, setMaterial] = useState([]);

  const [columns, setColumns] = useState(null);

  const [endDate, setEndDate] = useState(null);
  const [allFields, setAllFields] = useState([]);
  const [appliedDate, setAppliedDate] = useState(false);
  const [rowsApplied, setRowsApplied] = useState([]);
  const [openInvoiceDataDialog, setOpenInvoiceDataDialog] = useState(false);
  const [invoiceResourceData, setInvoiceResourceData] = useState(null);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { selectedRecords } = state;
  const { generateColumns } = useColumns();

  const {
    state: { permissions }
  }: any = useData();

  useEffect(() => {
    fetchFields();
    fetchPolicy();
  }, []);

  useEffect(() => {
    if (columns) {
      fetchData();
    }
  }, [columns]);

  const fetchFields = async () => {
    setColumns(null);
    let data;

    const childResourceName =
      resource === sidebarResource.sublease
        ? CHILD_RESOURCE.subleaseProduct
        : resource === sidebarResource.fieldTicket
          ? CHILD_RESOURCE.fieldTicketMateial
          : sidebarResource.salesOrder
            ? CHILD_RESOURCE.salesOrderProduct
            : CHILD_RESOURCE.quotationProduct;

    data = await fetch_child_resource_fields(childResourceName, resourceData[0]?.currency, false);

    var newColumns = generateColumns(renderedFrom, data, null, false, resourceData[0]?.currency ? resourceData[0]?.currency : 'USD');
    setAllFields(JSON.parse(JSON.stringify(data)));
    let column: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 120,
        sticky: 'left',
        disableFilters: false,
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
        disabled: true,
        disableFilters: true,
        Cell: ({ row }) =>
          row.original['type'] ? (
            <div>
              <p className="text-truncate" title={startCase(row.original?.type)}>
                {' '}
                {startCase(row.original?.type)}
              </p>
            </div>
          ) : (
            <NoDataCell />
          )
      },
      ...(resource === sidebarResource.fieldTicket
        ? [
          {
            accessor: 'fieldTicketNumber',
            Header: 'Field Ticket',
            disabled: true,
            Cell: ({ row }) => (
              <div className="flex items-center gap-2">
                <p className="text-truncate">{row.original.fieldTicketNumber}</p>
                {permissions?.fieldTicket?.isRead && (
                  <IconButton
                    size="small"
                    onClick={() => {
                      window.open(`${routes.fieldTicketDetail.path}/${row.original.fieldTicketId}`);
                    }}
                  >
                    <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                  </IconButton>
                )}
              </div>
            )
          }
        ]
        : []),
      {
        accessor: 'detail',
        Header: 'Details',
        minWidth: 300,
        width: 300,
        disabled: true,
        Cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <p>{row.original.detail}</p>
            <span title={`There are ${row.original?.subRows?.length} product(s) in this ${row.original?.type}`}>
              {row.original?.subRows?.length ? `(${row.original?.subRows?.length})` : ''}
            </span>
            {row.original.type !== MATERIAL_TYPE.manualEntry && (
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

    if (resource === sidebarResource.sublease) {
      newColumns = newColumns?.filter((d) => !d?.accessor?.includes('estimate'));
    }
    column = [...column, ...newColumns];
    setColumns(column);
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    setRowsApplied([]);

    const referenceIds = resourceData?.map((d) => d._id);
    const {
      data: { data: data }
    } = await axiosInstance().get(`${routes?.generateInvoice.path}/material?resource=${resource}&referenceIds=${JSON.stringify(referenceIds)}`);

    let newMaterial: any = [];

    data?.manualEntry?.forEach((ele, i) => {
      ele.type = 'manualEntry';
    });

    if (resource === sidebarResource.sublease) {
      const invoiceResponse = await axiosInstance().get(
        `/generate-invoice/${resourceData[0]?._id}/invoice/material-end-date-qty?resource=${resource}`
      );
      const invoicedProducts = invoiceResponse?.data?.data?.material || [];

      data?.material
        ?.filter((d) => d.actualStartDate)
        ?.forEach((element) => {
          let values: any = {};
          values['actualEndDate'] = element?.actualEndDate || element?.estimateEndDate;
          values['manualEndDate'] = element?.actualEndDate;
          const calValues = autoCalculateSpecificFields(values, { ...element, ...values }, allFields);
          newMaterial.push({ ...element, ...calValues });
        });

      if (invoicedProducts?.length) {
        newMaterial = newMaterial
          ?.map((_material) => {
            const product = invoicedProducts?.find((p) => p._id === _material._id);
            if (product) {
              const actualEndDate = new Date(product?.endDate)?.setDate(new Date(product?.endDate)?.getDate() + 1);
              _material.actualStartDate = actualEndDate;
            }
            return _material;
          })
          .filter((d) => d.qty > 0);
      }

      data?.assets?.forEach((_asset) => {
        const product = newMaterial?.find((p) => p._id === _asset._id);
        const obj: any = {};
        obj._id = _asset.inventory;
        obj.parentId = _asset._id;
        obj.type = MATERIAL_TYPE.serializedAsset;
        obj.materialId = _asset.inventory;
        obj.serializedAssetDetail = _asset?.serializedAssetDetail;
        obj.actualStartDate = product?.actualStartDate;
        obj.pricingMethod = product?.pricingMethod;
        obj.qty = 1;
        newMaterial.push(obj);
      });
    } else {
      newMaterial = data?.material;
    }
    setMaterial([...newMaterial, ...data?.manualEntry]);
    initializeTable([...newMaterial, ...data?.manualEntry]);
  };

  const initializeTable = (material) => {
    const rows = material?.filter((e) => e.parentId === null || !e.hasOwnProperty('parentId'));
    rows.forEach((parent, i) => {
      parent.index = i + 1;
      parent.detail =
        parent.type === MATERIAL_TYPE.product
          ? parent.productDetail?.productName
          : parent.type === MATERIAL_TYPE.service
            ? parent?.serviceDetail?.serviceName
            : parent.type === MATERIAL_TYPE.serializedAsset
              ? parent?.serializedAssetDetail?.assetNumber
              : parent.type === MATERIAL_TYPE.manualEntry
                ? parent?.description
                : parent.packageDetail?.packageName;
      parent.description =
        parent.type === MATERIAL_TYPE.product
          ? parent?.productDetail?.productDescription || ''
          : parent.type === MATERIAL_TYPE.service
            ? parent?.serviceDetail?.serviceDescription || ''
            : parent.type === MATERIAL_TYPE.package
              ? parent?.packageDetail?.packageDescription || ''
              : parent.type === MATERIAL_TYPE.serializedAsset
                ? parent?.description || ''
                : parent.type === MATERIAL_TYPE.manualEntry
                  ? parent?.description || ''
                  : '';
      parent.qtyDisplay = parent.qty;
      parent.subRows = generateNestedData(material, parent);
    });
    dispatch({ type: 'initialize', data: rows, count: rows?.length });
    dispatch({ type: 'loading', loading: false });
  };

  const generateNestedData = (material, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, j) => {
      _subRow.index = parent.index + '.' + (j + 1);
      _subRow.detail =
        _subRow.type === MATERIAL_TYPE.product
          ? _subRow?.productDetail?.productName
          : _subRow.type === MATERIAL_TYPE.service
            ? _subRow?.serviceDetail?.serviceName
            : _subRow.type === MATERIAL_TYPE.serializedAsset
              ? _subRow?.serializedAssetDetail?.assetNumber
              : _subRow?.packageDetail?.packageName;
      _subRow.description =
        _subRow.type === MATERIAL_TYPE.product
          ? _subRow?.productDetail?.productDescription || ''
          : _subRow.type === MATERIAL_TYPE.service
            ? _subRow?.serviceDetail?.serviceDescription || ''
            : _subRow.type === MATERIAL_TYPE.package
              ? _subRow?.packageDetail?.packageDescription || ''
              : _subRow.type === MATERIAL_TYPE.serializedAsset
                ? _subRow?.description || ''
                : '';
      _subRow.qtyDisplay = `${parent.qtyDisplay * _subRow.qty}`;
      _subRow.subRows = generateNestedData(material, _subRow);
    });
    return subRows;
  };

  const handleApplyDate = async () => {
    setIsDateApplying(true);
    let tempValues: any = { actualEndDate: endDate };
    let newEndDate = moment(endDate).toISOString();
    const invoiceResponse = await axiosInstance().get(`/generate-invoice/${resourceData[0]?._id}/invoice/material-end-date-qty?resource=${resource}`);
    const invoicedProducts = invoiceResponse?.data?.data?.material;

    let rows: any = [];
    selectedRecords.forEach((element) => {
      element.invalidDate = false;
      const product = invoicedProducts?.find((p) => p._id === element._id);
      const productStartDateTime = new Date(element.actualStartDate).getTime();
      const selectedEndDateTime = new Date(newEndDate).getTime();

      if (selectedEndDateTime < productStartDateTime) {
        element.invalidDate = true;
      } else if (product) {
        const productEndDateTime = new Date(product?.endDate).getTime();
        if (selectedEndDateTime < productEndDateTime) {
          element.invalidDate = true;
        } else {
          element.invalidDate = false;
        }
      }

      if (element?.manualEndDate) {
        const productManualEndDate = new Date(element?.manualEndDate).getTime();
        if (selectedEndDateTime > productManualEndDate) {
          tempValues.actualEndDate = element?.manualEndDate;
        }
        if (productManualEndDate < productStartDateTime) {
          element.invalidDate = true;
        }
      }
      let calValues: any;
      tempValues.pricingMethod = element?.pricingMethod;
      let values = JSON.parse(JSON.stringify(tempValues));
      calValues = autoCalculateSpecificFields(values, { ...element, ...values }, allFields);
      element.isAppliedBill = true;
      rows.push({ ...element, ...calValues });
    });

    let tempRows = material?.map((obj) => rows.find((o) => o._id === obj._id) || obj);

    setMaterial(tempRows);
    initializeTable(tempRows);
    setRowsApplied((prevState) => {
      let prevRowsApplied = prevState.filter((obj) => !rows.map((d) => d._id).includes(obj._id));
      return [...prevRowsApplied, ...rows];
    });
    setAppliedDate(true);
    setIsDateApplying(false);
  };

  const handleCreateInvoice = (invoiceData = null) => {
    if (progressiveBilling) {
      setUpdating(true);
      rowsApplied?.forEach((element) => {
        delete element?.index;
        delete element?.detail;
        delete element?.qtyDisplay;
        delete element?.hideSelection;
        delete element?.productDetail;
        delete element?.packageDetail;
        delete element?.serviceDetail;
        delete element?.serializedAssetDetail;
        delete element?.description;
        delete element?.subRows;
        delete element?.manualEndDate;
      });
      axiosInstance()
        .post(`/generate-invoice/create-progressive`, {
          resource: resource,
          referenceId: resourceData[0]?._id,
          material: rowsApplied
        })
        .then(() => {
          setUpdating(false);
          onSuccess();
        })
        .catch((error) => {
          setUpdating(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      axiosInstance()
        .post(`/generate-invoice/create`, { resource: resource, referenceIds: resourceData?.map((e) => e._id), extraInvoiceData: invoiceData })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          onSuccess();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const fetchPolicy = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.invoice}`);
      if (data) {
        setInvoiceResourceData(data);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  return (
    <Fragment>
      <Dialog fullScreen={true} TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={true}>
        <CustomDialogHeader title={`Create Invoice`} onClose={onClose} showRequiredLabel={false}></CustomDialogHeader>
        <CustomDialogContent>
          <Fragment>
            {progressiveBilling && (
              <Grid container className={styles.rental_header_layout}>
                <Grid item xs={12} md={6} sm={12} className="d-flex align-items-center layout-for-tablet gap-1"></Grid>
                <Grid item xs={12} sm={12} md={6} className={styles.filter_side}>
                  <Box className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} component="div">
                    <Grid style={{ display: 'flex', flex: 1, gap: '5px', alignItems: 'center' }} className={isMobile ? styles.content_box : ''}>
                      <CustomDatePicker
                        fullWidth
                        size="small"
                        value={endDate}
                        name="endDate"
                        label="End Date"
                        onChange={(date: any) => {
                          setEndDate(date ? date : null);
                        }}
                        margin="dense"
                      />
                      <Box>
                        <HtmlTooltip title={selectedRecords?.length ? '' : 'Please select items to apply'}>
                          <span>
                            <CustomButton
                              id="dialog-apply-button"
                              loading={isDateApplying}
                              disabled={selectedRecords?.length && moment(endDate)?.isValid() ? isDateApplying : true}
                              variant="contained"
                              color="primary"
                              type="button"
                              onClick={() => {
                                handleApplyDate();
                              }}
                            >
                              Apply
                            </CustomButton>
                          </span>
                        </HtmlTooltip>
                      </Box>
                    </Grid>
                  </Box>
                </Grid>
              </Grid>
            )}
            {columns ? (
              <Box zIndex={5} width={'100%'} p={1}>
                <CustomReactTable
                  height={progressiveBilling ? 'calc(100vh - 285px)' : 'calc(100vh - 180px)'}
                  state={state}
                  columns={columns}
                  setWholeRowsCellColor={(rowData) => {
                    if (rowData?.invalidDate) return 'error';
                    if (rowData?.isAppliedBill) return 'isAppliedBill';
                    return '';
                  }}
                  renderedFrom={renderedFrom}
                  isClientSideGrid={true}
                  hideSelection={!progressiveBilling}
                  expander={true}
                  refreshGrid={fetchData}
                  dispatch={dispatch}
                  hideAction={true}
                />
              </Box>
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
          <HtmlTooltip
            title={
              !appliedDate && progressiveBilling
                ? 'Please select items and apply end date'
                : rowsApplied?.some((d) => d.invalidDate === true) && progressiveBilling
                  ? 'Please select an appropriate date !'
                  : 'Create Invoice'
            }
          >
            <span>
              <CustomButton
                id="dialog-save-button"
                loading={isUpdating}
                disabled={
                  progressiveBilling ? isUpdating || !appliedDate || !rowsApplied?.length || rowsApplied.some((d) => d.invalidDate === true) : false
                }
                variant="contained"
                color="primary"
                type="button"
                onClick={() => {
                  if (resource === sidebarResource.fieldTicket && invoiceResourceData?.policy?.fieldTicketInvoiceFields?.length > 0) {
                    setOpenInvoiceDataDialog(true);
                  } else {
                    handleCreateInvoice();
                  }
                }}
              >
                Create Invoice
              </CustomButton>
            </span>
          </HtmlTooltip>
        </CustomDialogFooter>
      </Dialog>
      {openInvoiceDataDialog && (
        <InvoiceDataDialog
          onClose={() => {
            setOpenInvoiceDataDialog(false);
          }}
          invoiceFields={invoiceResourceData?.policy?.fieldTicketInvoiceFields}
          onSuccess={(data) => {
            handleCreateInvoice(data);
          }}
        />
      )}
    </Fragment>
  );
};

export default CreateInvoiceDialog;
