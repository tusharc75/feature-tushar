import { Box, Button, IconButton, Menu, MenuItem, Typography, useMediaQuery } from '@material-ui/core';
import { ExpandMore } from '@material-ui/icons';
import EditIcon from '@material-ui/icons/Edit';
import { capitalize, isArray } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { FcCancel, FcClock, FcOk } from 'react-icons/fc';
import { FiExternalLink } from 'react-icons/fi';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import PreviewDownload from 'src/components/PreviewDownload';
import { calculateRowsField } from 'src/components/RentalManagment/helper';
import ManualReponseDialog from 'src/pages/Quotation/ManualRespondDialog';
import QuotationQtyDialog from 'src/pages/Quotation/Productpackage/QuotationQtyDialog';
import QuotationSummeryDialog from 'src/pages/Quotation/QuotationSummeryDialog';
import SendEmail from 'src/pages/Quotation/SendEmail';
import Versions from 'src/pages/Quotation/Versions';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../../StateProvider/Provider';
import axiosInstance from '../../../axios/axiosInstance';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import routes from '../../../components/Helpers/Routes';
import {
  CHILD_RESOURCE,
  PRICING_SETUP_TYPE,
  QUOTATION_STATUS,
  REPAIR_ORDER_STATUS,
  pricingCondition,
  quotation,
  repairOrder,
  sidebarResource
} from '../../../constants/helpers';
import { useGetWalkmeInstance, useSetWalkmeData } from 'src/components/CustomIntro';
import { generateCompleteStepData, nextButtonStep } from 'src/pages/RepairOrder/walkmeSteps';
import { flattenArray } from 'src/constants/columns';

const dataAdded = {
  completeDataAdded: false,
  nextButtonAdded: false
};

const Quotation = ({
  repairOrderData,
  setNextStep,
  setPrevStep,
  renderedFrom,
  stepFullScreen,
  allowedToEdit,
  topAllowedToEdit = false,
  setQuotationVersionData,
  updateOrderStatus,
  invoiceStep,
  currentStepName = 'Quotation'
}) => {
  const walkmeInstance = useGetWalkmeInstance();
  const { setWalkmeData } = useSetWalkmeData();
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();

  const isMobileScreen = useMediaQuery('(max-width: 767px)');
  const [isUpdating, setUpdating] = useState(false);
  const [isProductEdit, setIsProductEdit] = useState({ open: false, isBulkedit: false, showSaveAndNext: false });
  const [recordToUpdate, setRecordToUpdate] = useState(null);
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);
  const [material, setMaterial] = useState([]);
  const [columns, setColumns] = useState(null);
  const [allFields, setAllFields] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [showQuotationSummaryDialog, setShowQuotationSummaryDialog] = useState(false);
  const [showAllVersionStatus, setShowAllVersionStatus] = useState(false);
  const [customerAcceptable, setCustomerAcceptable] = useState(false);
  const [quotationData, setQuotationData] = useState(null);
  const [currentVersion, setCurrentVersion] = useState(null);
  const [isInlineEdit, setIsInlineEdit] = useState(false);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState({ open: false, data: null });

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, selectedRecords } = state;
  const { generateColumns } = useColumns();

  useEffect(() => {
    setWalkmeData([]);
  }, []);

  const handleAddWalkmeData = (rows: any[]) => {
    if (walkmeInstance && walkmeInstance.type === 'flow' && rows.length) {
      if (currentStepName === 'Quotation' && !dataAdded.nextButtonAdded) {
        dataAdded.nextButtonAdded = true;
        walkmeInstance.instance.push([nextButtonStep(true)]);
        walkmeInstance.handleNext();
      }
      if (
        permissions?.repairOrder?.isUpdate &&
        topAllowedToEdit &&
        repairOrderData?.canComplete &&
        !dataAdded.completeDataAdded &&
        currentStepName === 'Slip'
      ) {
        dataAdded.completeDataAdded = true;
        walkmeInstance.instance.push(generateCompleteStepData().steps);
        walkmeInstance.handleNext();
      }
    }
  };

  useEffect(() => {
    fetchFields();
  }, [repairOrderData]);

  useEffect(() => {
    if (
      invoiceStep &&
      ![REPAIR_ORDER_STATUS.invoiced, REPAIR_ORDER_STATUS.readyToInvoice, REPAIR_ORDER_STATUS.completed]?.includes(repairOrderData?.status)
    ) {
      if (permissions?.repairOrder?.isUpdate) {
        updateOrderStatus(REPAIR_ORDER_STATUS.readyToInvoice);
      }
    }
    if (invoiceStep && repairOrderData?.status === REPAIR_ORDER_STATUS.invoiced) {
      setPrevStep(false);
    } else {
      setPrevStep(true);
    }
  }, [invoiceStep]);

  useEffect(() => {
    if (quotationData?.versions[currentVersion] && quotationData?.versions[currentVersion]?._id) {
      fetchData();
    }
  }, [currentVersion]);

  const fetchFields = async () => {
    setNextStep(false);
    setColumns(null);

    const quotationResponse = await axiosInstance().get(
      `${repairOrder.api}/${repairOrderData?._id}/check-create/quotation?approval=${repairOrderData?.addQuotationStep ? 1 : 0}`
    );
    const quotationInfo: any = quotationResponse?.data?.data;

    setQuotationData(quotationInfo);
    let keys = Object.keys(quotationInfo.versions);
    let tempCurrentVersion = parseInt(keys[keys.length - 1]);
    setCurrentVersion(tempCurrentVersion);
    setQuotationVersionData({ quotationId: quotationInfo?._id, ...quotationInfo?.versions[tempCurrentVersion] });

    if (repairOrderData?.addQuotationStep) {
      setNextStep(quotationInfo?.versions[tempCurrentVersion]?.status === QUOTATION_STATUS.acceptByCustomer ? true : false);
    } else {
      setNextStep(true);
    }

    var data = await await fetch_child_resource_fields(CHILD_RESOURCE.quotationProduct, quotationData?.currency, true);
    setAllFields(JSON.parse(JSON.stringify(data)));

    if (
      allowedToEdit === false ||
      invoiceStep === true ||
      ![QUOTATION_STATUS.buildingQuote].includes(quotationInfo?.versions[tempCurrentVersion]?.status)
    ) {
      data?.forEach((e) => {
        e.isColumnEditable = false;
      });
    }

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
        disabled: true,
        sticky: isMobile || isTablet ? 'none' : 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.type === 'serializedAsset' ? 'Asset' : capitalize(row.original.type)}</p>
      },
      {
        accessor: 'detail',
        Header: 'Details',
        width: 250,
        disabled: true,
        sticky: isMobile || isTablet ? 'none' : 'left',
        Cell: ({ row, table }) => (
          <div className="flex items-center gap-2">
            {[QUOTATION_STATUS.acceptByCustomer, QUOTATION_STATUS.rejectByCustomer, QUOTATION_STATUS.sentToCustomer].includes(
              quotationInfo?.versions[tempCurrentVersion]?.status
            ) || invoiceStep ? (
              <p> {row.original.detail}</p>
            ) : (
              <p
                onClick={() => {
                  handleOpen(row, table.getRowModel().rows);
                }}
                className="link text-truncate"
                title={row.original?.detail}
              >
                {row.original?.detail}
              </p>
            )}
            <IconButton
              size="small"
              onClick={() => {
                if (row.original.type === 'service') {
                  window.open(`${routes.serviceMasterDetail.path}/${row.original.materialId}`);
                } else if (row.original.type === 'product') {
                  window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                } else if (row.original.type === 'serializedAsset') {
                  window.open(`${routes.serializedAssetDetail.path}/${row.original.materialId}`);
                } else {
                  window.open(`${routes.packagesDetail.path}/${row.original.materialId}`);
                }
              }}
            >
              <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
            </IconButton>
          </div>
        )
      },
      {
        accessor: 'productName',
        Header: 'Product',
        width: 200,
        primaryField: true,
        Cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {row.original?.productName ? (
              <>
                <p className="text-truncate" title={row.original?.productName}>
                  {row.original?.productName}
                </p>
                <IconButton
                  size="small"
                  onClick={() => {
                    window.open(`${routes.productDetail.path}/${row.original.productId}`);
                  }}
                >
                  <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                </IconButton>
              </>
            ) : (
              <NoDataCell />
            )}
          </div>
        )
      },
      {
        accessor: 'description',
        Header: 'Description',
        width: 200,
        primaryField: true,
        Cell: ({ row }) => {
          return row.original['description'] ? <p className="text-truncate">{row.original.description}</p> : <NoDataCell />;
        }
      }
    ];

    const newColumns = generateColumns(renderedFrom, data, null, false, quotationInfo?.currency);
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
            {allowedToEdit && (
              <HtmlTooltip title="Edit">
                <IconButton
                  size="small"
                  disabled={
                    [QUOTATION_STATUS.acceptByCustomer, QUOTATION_STATUS.rejectByCustomer, QUOTATION_STATUS.sentToCustomer].includes(
                      quotationInfo?.versions[tempCurrentVersion]?.status
                    ) || invoiceStep
                  }
                  aria-label="Edit"
                  onClick={() => {
                    handleOpen(row, table.getRowModel().rows);
                  }}
                >
                  <EditIcon
                    color={
                      [QUOTATION_STATUS.acceptByCustomer, QUOTATION_STATUS.rejectByCustomer, QUOTATION_STATUS.sentToCustomer].includes(
                        quotationInfo?.versions[tempCurrentVersion]?.status
                      ) || invoiceStep
                        ? 'disabled'
                        : 'primary'
                    }
                  />
                </IconButton>
              </HtmlTooltip>
            )}
          </>
        );
      }
    });
    setColumns(column);
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });

    var data: any = [];
    const response = await axiosInstance().get(
      `${quotation.api}/productpackage/${quotationData._id}/${quotationData?.versions[currentVersion]?._id}`
    );
    data = response?.data?.data;

    setMaterial(JSON.parse(JSON.stringify(data.material)));

    data?.material?.forEach((e: any) => {
      if (e.type === 'service') {
        e.preWork = e?.serviceDetail?.preWork;
      }
    });

    const rows = data.material.filter((e) => e.parentId === null);

    rows?.forEach((parent, i) => {
      parent.index = i + 1;
      parent.detail =
        parent.type === 'serializedAsset'
          ? parent.serializedAssetDetail?.assetNumber
          : parent.type === 'product'
            ? parent.productDetail?.productName
            : parent.type === 'service'
              ? parent.serviceDetail?.serviceName
              : parent.packageDetail?.packageName;
      parent.description =
        parent.type === 'serializedAsset'
          ? parent.serializedAssetDetail?.product?.productDescription
          : parent.type === 'service'
            ? parent?.serviceDetail?.serviceDescription || ''
            : parent.type === 'product'
              ? parent?.productDetail?.productDescription || ''
              : parent.type === 'package'
                ? parent?.packageDetail?.packageDescription || ''
                : '';
      parent.productName = parent?.serializedAssetDetail?.product?.optionLabel || '';
      parent.productId = parent?.serializedAssetDetail?.product?.optionValue || '';
      parent.leadTimeData = Array.isArray(parent.leadTime) ? parent.leadTime : [];
      parent.leadTime = Array.isArray(parent.leadTime) ? `${parent?.leadTime?.reduce((acc, e) => acc + parseInt(e?.days || 0), 0) || 0}` : 0;
      parent.isValid = parent['finalPrice_' + quotationData?.currency?.toLowerCase()] ? true : false;
      parent.hideSelection = false;
      parent.subRows = generateNestedData(data.material, parent);
    });
    handleAddWalkmeData(rows);
    dispatch({ type: 'initialize', data: rows, count: rows?.length });
    dispatch({ type: 'loading', loading: false });
  };

  const generateNestedData = (material, parent) => {
    var subRows: any = material?.filter((e) => e.parentId === parent._id);

    subRows.forEach((_subRow, j) => {
      _subRow.index = parent.index + '.' + (j + 1);
      _subRow.detail = `${_subRow.type === 'serializedAsset'
        ? _subRow.serializedAssetDetail?.assetNumber
        : _subRow.type === 'product'
          ? _subRow.productDetail?.productName
          : _subRow.type === 'service'
            ? _subRow.serviceDetail?.serviceName
            : _subRow.packageDetail?.packageName
        }`;
      _subRow.description =
        _subRow.type === 'service'
          ? _subRow?.serviceDetail?.serviceDescription || ''
          : _subRow.type === 'product'
            ? _subRow?.productDetail?.productDescription || ''
            : _subRow.type === 'package'
              ? _subRow?.packageDetail?.packageDescription || ''
              : '';
      _subRow.productName = _subRow?.serializedAssetDetail?.product?.optionLabel || '';
      _subRow.productId = _subRow?.serializedAssetDetail?.product?.optionValue || '';
      _subRow.leadTimeData = Array.isArray(_subRow.leadTime) ? _subRow.leadTime : [];
      _subRow.leadTime = Array.isArray(_subRow.leadTime) ? `${_subRow?.leadTime?.reduce((acc, e) => acc + parseInt(e?.days || 0), 0) || 0}` : 0;
      _subRow.isValid = _subRow['finalPrice_' + quotationData?.currency?.toLowerCase()] ? true : false;
      _subRow.hideSelection = false;
      _subRow.subRows = generateNestedData(material, _subRow);
    });

    if (subRows.length === 0 && parent.type === 'package') {
      parent.isValid = false;
    }
    if (parent.type === 'package') {
      parent.hideSelection = subRows.filter((e) => e.hideSelection).length ? true : false;
    }
    return subRows;
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const handleSaveData = async (rows: any, saveAndNext = false) => {
    setUpdating(true);
    axiosInstance().put(`${quotation.api}/productpackage/${quotationData?._id}/${quotationData?.versions[currentVersion]?._id}`, { material: rows })
      .then(() => {
        if (saveAndNext) {
          const row = flattenArray(dataRows).find((ele) => ele._id === rows[0]?._id);
          if (!row?.parentId) {
            const rowIndex = dataRows.findIndex((d) => d._id === rows[0]?._id);
            setRecordToUpdate(dataRows[rowIndex + 1]);
            setIsProductEdit({
              open: true,
              isBulkedit: false,
              showSaveAndNext: rowIndex + 1 < dataRows?.length - 1 ? true : false
            });
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
        setUpdating(false);
      })
      .catch((error) => {
        setUpdating(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleDelete = (rows) => {
    setDeleting(true);
    axiosInstance()
      .put(`${quotation.api}/productpackage/${quotationData?._id}/${quotationData?.versions[currentVersion]?._id}/delete`, { ids: rows })
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

  const handleOpen = (rowData, rows) => {
    let saveAndNext = true;
    if (rowData.depth === 0) {
      saveAndNext = rowData?.index < rows?.filter((e) => e?.depth === 0)?.length - 1 && rowData?.depth === 0 ? true : false;
    } else if (rowData.depth === 1) {
      saveAndNext =
        rowData?.index < rows?.filter((e) => e?.depth === 1 && e.original.parentId === rowData.original.parentId)?.length - 1 && rowData?.depth === 1
          ? true
          : false;
    }
    setIsProductEdit({
      open: true,
      isBulkedit: false,
      showSaveAndNext: saveAndNext
    });
    setRecordToUpdate(rowData?.original);
  };

  const calculatePrice = (arr: any[]) => {
    if (quotationData) {
      const data: any = {};
      data.conditionType = [PRICING_SETUP_TYPE.price];
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

  const handleChangeVersion = (versionNumber) => {
    setCurrentVersion(versionNumber);
    setShowAllVersionStatus(false);
  };

  const cloneVersion = () => {
    const versionId = quotationData?.versions[currentVersion]?._id;
    axiosInstance()
      .post(`/quotation/clone-version/${quotationData._id}/${versionId}`)
      .then(() => {
        fetchFields();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleSendToCustomer = () => {
    axiosInstance()
      .put(`${quotation.api}/${quotationData?._id}/send-to-customer/${quotationData?.versions[currentVersion]?._id}`)
      .then(() => {
        fetchFields();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: 'Processed Successfully'
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const onSaveInlineEdit = (inputField, updatedData) => {
    setIsInlineEdit(true);
    const currency = quotationData?.currency.toLowerCase();
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
      handleOpen(
        {
          ...updatedData,
          detail: updatedData.type === 'product' ? updatedData?.productDetail?.productName : updatedData?.packageDetail?.packageName
        },
        []
      );
    } else {
      onConfirmSave(inputField, updatedData);
    }
  };

  const onConfirmSave = async (inputField, updatedData) => {
    const rowData = material.find((d) => d._id === updatedData._id);
    if (rowData.parentId && !showConfirmationDialog.open) {
      setShowConfirmationDialog({
        open: true,
        data: {
          inputField,
          updatedData
        }
      });
    } else {
      let rows: any = [{ ...rowData, ...updatedData }];
      rows = await calculateRowsField(material, inputField, allFields, updatedData, quotationData?.currency);
      handleSaveData(rows);
      setShowConfirmationDialog({ open: false, data: {} });
    }
  };

  return (
    <Fragment>
      {invoiceStep ? (
        <Box p={2}>
          <PreviewDownload
            fileName={`${routes.repairOrder.title}-${repairOrderData?.repairOrderNumber}`}
            resource={sidebarResource.repairOrder}
            referenceId={repairOrderData?._id}
            columns={columns}
            isSendEmail={true}
          />
        </Box>
      ) : (
        <Box
          display="flex"
          m={1}
          my={1}
          className={`flex-wrap`}
          style={{ gap: isMobileScreen ? '5px' : 0, justifyContent: isMobileScreen ? 'center' : 'space-between' }}
        >
          {repairOrderData?.addQuotationStep ? (
            <Box display="flex">
              <SendEmail
                quotationData={quotationData}
                versionId={quotationData?.versions[currentVersion]?._id}
                currentVersion={currentVersion}
                columns={columns}
                setShowAllVersionStatus={setShowAllVersionStatus}
                setShowQuotationSummaryDialog={setShowQuotationSummaryDialog}
                hideSummary={true}
                hideVersions={false}
              />
            </Box>
          ) : (
            <div />
          )}
          {!isMobileScreen && repairOrderData?.addQuotationStep && (
            <Box display="flex">
              {quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.sentToCustomer ? (
                <div className={`d-flex align-items-center justify-content-center spacing-1 text-align-center flex-wrap`}>
                  <FcClock size={25} />
                  <Typography style={{ color: '#00acc1', fontWeight: 'bold' }}>Quotation has been sent to customer</Typography>
                </div>
              ) : quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.acceptByCustomer ? (
                <div className={`d-flex align-items-center justify-content-center spacing-1 text-align-center flex-wrap`}>
                  <FcOk size={25} />
                  <Typography style={{ color: '#28a745', fontWeight: 'bold' }}>Quotation has been accepted by customer</Typography>
                </div>
              ) : quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.rejectByCustomer ? (
                <div className={`d-flex align-items-center justify-content-center spacing-1 text-align-center flex-wrap`}>
                  <FcCancel size={25} />
                  <Typography style={{ color: '#dc3545', fontWeight: 'bold' }}>Quotation has been rejected by customer</Typography>
                </div>
              ) : null}
            </Box>
          )}
          {allowedToEdit && (
            <Box display={'flex'} gridGap={8}>
              {repairOrderData?.addQuotationStep &&
                (quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.buildingQuote ||
                  quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.waitingForSupplierPrice ? (
                  <Button
                    disabled={material
                      .filter((e) => e.parentId === null)
                      .some(
                        (d) =>
                          d[`finalPrice_${quotationData?.currency?.toLowerCase()}`] === 0 ||
                          d[`finalPrice_${quotationData?.currency?.toLowerCase()}`] === null ||
                          d[`finalPrice_${quotationData?.currency?.toLowerCase()}`] === undefined
                      )}
                    onClick={handleSendToCustomer}
                    variant="contained"
                    size="small"
                    color="primary"
                  >
                    Process Quotation
                  </Button>
                ) : quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.sentToCustomer ? (
                  <Button
                    onClick={() => {
                      setCustomerAcceptable(true);
                    }}
                    variant="contained"
                    size="small"
                    className="mx-1"
                    color="primary"
                  >
                    Accept / Reject
                  </Button>
                ) : [QUOTATION_STATUS.rejectByCustomer, QUOTATION_STATUS.acceptByCustomer].includes(
                  quotationData?.versions[currentVersion]?.status
                ) ? (
                  <Button
                    onClick={() => {
                      cloneVersion();
                    }}
                    variant="contained"
                    size="small"
                    className="mx-1"
                    color="primary"
                  >
                    Create New Version
                  </Button>
                ) : null)}
              {![QUOTATION_STATUS.acceptByCustomer, QUOTATION_STATUS.rejectByCustomer, QUOTATION_STATUS.sentToCustomer].includes(
                quotationData?.versions[currentVersion]?.status
              ) && (
                  <Button
                    variant="outlined"
                    color="default"
                    size="small"
                    onClick={openActions}
                    aria-controls="action-menu"
                    disabled={selectedRecords?.length === 0}
                    endIcon={<ExpandMore />}
                    className="new-dropdown-v1"
                  >
                    Actions
                  </Button>
                )}
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
                  onClick={() => {
                    closeActions();
                    setIsProductEdit({ open: true, isBulkedit: true, showSaveAndNext: false });
                  }}
                >
                  Bulk Edit
                </MenuItem>
              </Menu>
            </Box>
          )}
          {isMobileScreen && (
            <Box display="flex" style={{ margin: '0 auto' }}>
              {quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.sentToCustomer ? (
                <div className={`d-flex align-items-center justify-content-center spacing-1 text-align-center flex-wrap`}>
                  <FcClock size={25} />
                  <Typography style={{ color: '#00acc1', fontWeight: 'bold' }}>Quotation has been sent to customer</Typography>
                </div>
              ) : quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.acceptByCustomer ? (
                <div className={`d-flex align-items-center justify-content-center spacing-1 text-align-center flex-wrap`}>
                  <FcOk size={25} />
                  <Typography style={{ color: '#28a745', fontWeight: 'bold' }}>Quotation has been accepted by customer</Typography>
                </div>
              ) : quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.rejectByCustomer ? (
                <div className={`d-flex align-items-center justify-content-center spacing-1 text-align-center flex-wrap`}>
                  <FcCancel size={25} />
                  <Typography style={{ color: '#dc3545', fontWeight: 'bold' }}>Quotation has been rejected by customer</Typography>
                </div>
              ) : null}
            </Box>
          )}
        </Box>
      )}

      {columns ? (
        <Box zIndex={5} width={'100%'}>
          <CustomReactTable
            height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 395px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            setWholeRowsCellColor={(rowData) => {
              if (rowData.type === 'service') {
                return 'isService';
              }
              return '';
            }}
            refreshGrid={fetchData}
            hideSelection={
              !allowedToEdit ||
              [QUOTATION_STATUS.acceptByCustomer, QUOTATION_STATUS.rejectByCustomer, QUOTATION_STATUS.sentToCustomer].includes(
                quotationData?.versions[currentVersion]?.status
              )
            }
            hideAction={invoiceStep}
            onSaveEdit={onSaveInlineEdit}
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
        <QuotationQtyDialog
          calculatePrice={calculatePrice}
          onClose={() => {
            setIsProductEdit({ open: false, isBulkedit: false, showSaveAndNext: false });
            setRecordToUpdate(null);
            if (isInlineEdit) {
              setIsInlineEdit(false);
            }
          }}
          isBulkedit={isProductEdit.isBulkedit}
          handleSaveData={handleSaveData}
          quotationData={quotationData}
          rowData={!isProductEdit.isBulkedit ? recordToUpdate : selectedRecords}
          material={material}
          loadingEdit={isUpdating}
          selectedProducts={selectedRecords}
          isInlineEdit={isInlineEdit}
          showSaveAndNext={isProductEdit.showSaveAndNext}
        />
      )}
      {quotationData && showAllVersionStatus && (
        <Versions
          onClose={() => setShowAllVersionStatus(false)}
          quotationId={quotationData?._id}
          handleChangeVersion={handleChangeVersion}
          referenceType="repairOrder"
        />
      )}
      {customerAcceptable && (
        <ManualReponseDialog
          versionId={quotationData?.versions[currentVersion]?._id}
          quotationId={quotationData?._id}
          setCurrentStep={() => {
            fetchFields();
          }}
          updateStatus={() => {
            fetchFields();
          }}
          setCustomerAcceptable={setCustomerAcceptable}
        />
      )}
      {showQuotationSummaryDialog && (
        <QuotationSummeryDialog
          quotationData={quotationData}
          versionId={quotationData?.versions[currentVersion]?._id}
          onClose={() => {
            setShowQuotationSummaryDialog(false);
          }}
        />
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
    </Fragment>
  );
};

export default Quotation;
