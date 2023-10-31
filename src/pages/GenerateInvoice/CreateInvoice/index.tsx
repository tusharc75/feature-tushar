import { useState, useEffect, useContext, Fragment } from 'react';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../../axios/axiosInstance';
import { Box, Dialog, IconButton } from '@material-ui/core';
import { isMobile } from 'react-device-detect';
import routes from 'src/components/Helpers/Routes';
import {
  CHILD_RESOURCE,
  CustomDialogTransition,
  MATERIAL_TYPE,
  dateFormat,
  quotation,
  repairOrder,
  sidebarResource,
  sublease
} from 'src/constants/helpers';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import { MuiPickersUtilsProvider, KeyboardDatePicker } from '@material-ui/pickers';
import MomentUtils from '@date-io/moment';
import { autoCalculateSpecificFields, CURReplaceByCurrencySingle } from 'src/constants/formulaUtility';
import styles from '../../Leads/Header.module.scss';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { camelCase, startCase } from 'lodash';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { generateCustomTableColumns } from 'src/constants/columns';
import moment from 'moment';
import { useData } from 'src/StateProvider/Provider';

const CreateInvoiceDialog = ({ onClose, onSuccess, resourceData, resource, progressiveBilling }) => {

  const toastConfig = useContext(CustomToastContext);

  const [isUpdating, setUpdating] = useState(false);

  const [selectedProducts, setSelectedProducts] = useState([]);
  const [material, setMaterial] = useState([]);

  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState(null);

  const [endDate, setEndDate] = useState(null);
  const [allFields, setAllFields] = useState([]);
  const [appliedDate, setAppliedDate] = useState(false);
  const [rowsApplied, setRowsApplied] = useState([]);


  const {
    state: { permissions, selectedEntity }
  }: any = useData();

  const renderedFrom = `${camelCase(routes?.generateInvoice.title)}_create`;

  useEffect(() => {
    fetchFields();
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
          : CHILD_RESOURCE.quotationProduct;

    const response = await axiosInstance().get(`/field/child?resource=${childResourceName}`);
    data = response?.data?.data;
    data = CURReplaceByCurrencySingle(data, resourceData[0]?.currency ? resourceData[0]?.currency : 'USD');
    data?.forEach((e) => {
      e.isColumnEditable = false;
    });
    const newColumns = generateCustomTableColumns(data, resourceData[0]?.currency ? resourceData[0]?.currency : 'USD', renderedFrom);
    setAllFields(JSON.parse(JSON.stringify(data)));
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
        width: 100,
        disableFilters: true,
        Cell: ({ row }) =>
          row.original['type'] ? (
            <p>
              {`${startCase(row.original?.type)} `}
              {/* {row.original['type'] === MATERIAL_TYPE.product
                ? row.original?.productDetail?.serializedProduct
                  ? '(Serialized)'
                  : '(Non-Serialized)'
                : row.original?.type === MATERIAL_TYPE.package
                  ? row.original?.packageDetail?.packageType === 'Product'
                    ? '(Product)'
                    : '(Service)'
                  : row.original.type === MATERIAL_TYPE.service
                    ? row?.original?.serviceDetail?.serviceType && `(${row?.original?.serviceDetail?.serviceType})`
                    : ''} */}
            </p>
          ) : (
            <NoDataCell />
          )
      },
      ...(resource === sidebarResource.fieldTicket ? [{
        accessor: 'fieldTicketNumber',
        Header: 'Field Ticket',
        Cell: ({ row }) =>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <p className="text-truncate">{row.original.fieldTicketNumber}</p>
            {permissions?.fieldTicket?.isRead &&
              <Box ml={1}>
                <IconButton
                  size="small"
                  onClick={() => {
                    window.open(`${routes.fieldTicketDetail.path}/${row.original.fieldTicketId}`);
                  }}
                >
                  <OpenInNewIcon fontSize="small" color="primary" />
                </IconButton>
              </Box>
            }
          </div>
      }] : []),
      {
        accessor: 'detail',
        Header: 'Details',
        minWidth: 300,
        width: 300,
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <p>{row.original.detail}</p>
            <Box ml={1} className="d-flex align-items-center">
              <span title={`There are ${row.original?.subRows?.length} product(s) in this ${row.original?.type}`}>
                {row.original?.subRows?.length ? `(${row.original?.subRows?.length})` : ''}
              </span>
            </Box>
            {row.original.type !== 'manualEntry' && (
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
    setColumns(column);
  };

  const manageMaterial = (material, invoicedProducts) => {
    let newMaterial: any = [];
    if (resource === sidebarResource.sublease) {
      material?.filter((d) => d.actualStartDate)?.forEach((element) => {
        let values: any = {};
        values['actualEndDate'] = element?.actualEndDate || element?.estimateEndDate;
        values['manualEndDate'] = element?.actualEndDate;
        const calValues = autoCalculateSpecificFields(values, { ...element, ...values }, allFields);
        newMaterial.push({ ...element, ...calValues });
      });

      material = newMaterial;
      if (invoicedProducts?.length) {
        material = material?.map((e) => {
          let materialData: any = { ...e };

          let pMethod = materialData?.pricingMethod?.split(',') || [];
          pMethod = pMethod.map((m) => m?.trim()).find((m) => !['Per Day', 'Per Week', 'Per Month'].includes(m));

          const product = invoicedProducts?.find((p) => p._id === e._id);
          if (product) {
            const actualEndDate = new Date(product?.endDate)?.setDate(new Date(product?.endDate)?.getDate() + 1);
            materialData.actualStartDate = actualEndDate;
          } else {
            materialData.actualStartDate = materialData.manualStartDate ? materialData.manualStartDate : new Date().setDate(new Date().getDate() + 1);
          }
          return materialData;
        }).filter((d) => d.qty > 0);
      }
    }
    else if (resource === sidebarResource.fieldTicket) {
      material?.cost?.forEach((ele, i) => {
        ele.type = 'manualEntry';
      });
      material = [...material?.material, ...material?.cost];
    }
    setMaterial(material);
    initializeTable(material);
  };

  const fetchData = async () => {
    let invoicedProducts: any = [];

    let response: any = {};

    if (resource === sidebarResource.sublease) {
      response = await axiosInstance().get(`${sublease.api}/productpackage/${resourceData[0]?._id}`);

      const invoiceResponse = await axiosInstance().get(
        `/generate-invoice/${resourceData[0]?._id}/invoice/material-end-date-qty?resource=${resource}`
      );
      invoicedProducts = invoiceResponse?.data?.data?.material;

      manageMaterial(response?.data?.data?.material, invoicedProducts);
    } else if (resource === sidebarResource.repairOrder) {
      const quotationResponse = axiosInstance().get(
        `${repairOrder.api}/${resourceData[0]?._id}/check-create/quotation?approval=${resourceData[0]?.addQuotationStep ? 1 : 0}`
      );
      const quotationData: any = (await quotationResponse).data.data;

      let keys = Object.keys(quotationData.versions);
      let currentVersion = parseInt(keys[keys.length - 1]);

      const productPackageResponse = axiosInstance().get(
        `${quotation.api}/productpackage/${quotationData._id}/${quotationData.versions[currentVersion]?._id}`
      );

      const [quotationResult, productPackageResult] = await Promise.all([quotationResponse, productPackageResponse]);

      response = productPackageResult.data;
      manageMaterial(response?.data?.material, invoicedProducts);
    } else if (resource === sidebarResource.fieldTicket) {
      const referenceIds = resourceData?.map((d) => d._id);

      const {
        data: { data: data }
      } = await axiosInstance().get(`${routes?.generateInvoice.path}/material?referenceIds=${JSON.stringify(referenceIds)}`);
      manageMaterial(data, []);
    }
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
              : parent.type === 'manualEntry'
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
                : parent.type === 'manualEntry'
                  ? parent?.description || ''
                  : '';
      parent.qtyDisplay = parent.qty;
      parent.subRows = generateNestedData(material, parent);
    });
    setRowsData(rows);
    setSelectedProducts([]);
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
    let tempValues: any = { actualEndDate: endDate };

    const invoiceResponse = await axiosInstance().get(`/generate-invoice/${resourceData[0]?._id}/invoice/material-end-date-qty?resource=${resource}`);
    const invoicedProducts = invoiceResponse?.data?.data?.material;

    let rows: any = [];
    selectedProducts.forEach((element) => {
      element.invalidDate = false;

      const product = invoicedProducts?.material?.find((p) => p._id === element._id);

      const productStartDateTime = new Date(new Date(element.actualStartDate).toLocaleDateString()).getTime();
      const selectedEndDateTime = new Date(new Date(endDate).toLocaleDateString()).getTime();

      if (selectedEndDateTime < productStartDateTime) {
        element.invalidDate = true;
      } else if (product) {
        const productEndDateTime = new Date(new Date(product?.endDate).toLocaleDateString()).getTime();
        if (selectedEndDateTime < productEndDateTime) {
          element.invalidDate = true;
        } else {
          element.invalidDate = false;
        }
      }

      if (element?.manualEndDate) {
        const productManualEndDate = new Date(new Date(element?.manualEndDate).toLocaleDateString()).getTime();
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
  };

  const handleCreateInvoice = () => {
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
      axiosInstance().post(`/generate-invoice/create-progressive`, {
        resource: resource,
        referenceId: resourceData[0]?._id,
        material: rowsApplied
      }).then(() => {
        setUpdating(false);
        onSuccess();
      })
        .catch((error) => {
          setUpdating(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      axiosInstance().post(`/generate-invoice/create`, { resource: resource, referenceIds: resourceData?.map((e) => e._id) })
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

  return (
    <Fragment>
      <Dialog fullScreen={true} TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={true}>
        <CustomDialogHeader title={`Create Invoice`} onClose={onClose} showRequiredLabel={false}></CustomDialogHeader>
        <CustomDialogContent>
          <Fragment>
            {progressiveBilling && (
              <MuiPickersUtilsProvider utils={MomentUtils}>
                <Grid container className={styles.rental_header_layout}>
                  <Grid item xs={12} md={6} sm={12} className="d-flex align-items-center gap-1 layout-for-tablet"></Grid>
                  <Grid item xs={12} sm={12} md={6} className={styles.filter_side}>
                    <Box className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} component="div">
                      <Grid style={{ display: 'flex', flex: 1, gap: '5px', alignItems: 'center' }} className={isMobile ? styles.content_box : ''}>
                        <KeyboardDatePicker
                          autoOk
                          fullWidth
                          size="small"
                          variant="inline"
                          inputVariant="outlined"
                          value={endDate}
                          name="endDate"
                          label="End Date"
                          onChange={(date: any) => {
                            setEndDate(date ? date : null);
                          }}
                          format={dateFormat}
                          InputLabelProps={{
                            shrink: true
                          }}
                          margin="dense"
                        />
                        <Box>
                          <HtmlTooltip title={selectedProducts?.length ? '' : 'Please select items to apply'}>
                            <span>
                              <Button
                                variant="contained"
                                color="primary"
                                disabled={selectedProducts?.length && moment(endDate)?.isValid() ? false : true}
                                size="small"
                                onClick={() => {
                                  handleApplyDate();
                                }}
                              >
                                Apply
                              </Button>
                            </span>
                          </HtmlTooltip>
                        </Box>
                      </Grid>
                    </Box>
                  </Grid>
                </Grid>
              </MuiPickersUtilsProvider>
            )}
            {columns && rowsData ? (
              <Box zIndex={5} width={'100%'} p={1}>
                <CustomReactTable
                  height={progressiveBilling ? 'calc(100vh - 285px)' : 'calc(100vh - 180px)'}
                  columns={columns}
                  data={rowsData}
                  setWholeRowsCellColor={(rowData) => {
                    if (rowData?.invalidDate) return 'error';
                    if (rowData?.isAppliedBill) return 'isAppliedBill';
                    return '';
                  }}
                  onSelect={setSelectedProducts}
                  childrenProperty="subRows"
                  uniqueKey="_id"
                  renderedFrom={renderedFrom}
                  isClientSideGrid={true}
                  hideSelection={!progressiveBilling}
                  hideExpander={resource === sidebarResource.fieldTicket ? true : false}
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
              <Button
                type="button"
                variant="contained"
                color="primary"
                size="small"
                disabled={progressiveBilling ? isUpdating || !appliedDate || rowsApplied.some((d) => d.invalidDate === true) : false}
                onClick={() => {
                  handleCreateInvoice();
                }}
              >
                Create Invoice
              </Button>
            </span>
          </HtmlTooltip>
        </CustomDialogFooter>
      </Dialog>
    </Fragment>
  );
};

export default CreateInvoiceDialog;
