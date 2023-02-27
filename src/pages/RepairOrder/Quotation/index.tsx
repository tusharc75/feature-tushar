import React, { useState, useEffect, useContext, Fragment, useReducer, useMemo } from 'react';
import { Box, Button, Typography, Chip, useMediaQuery, Menu, MenuItem, IconButton } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import { useData } from '../../../StateProvider/Provider';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import CustomReactTable from '../../../components/CustomReactTable/CustomReactTable';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import {
  quotation,
  pricingCondition,
  repairOrder,
  QUOTATION_STATUS,
  REPAIR_ORDER_STATUS
} from '../../../constants/helpers';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import { isMobile, isTablet } from 'react-device-detect';
import { fetch_quotation_product_fields } from 'src/components/Quotation/helper';
import { ExpandMore } from '@material-ui/icons';
import { capitalize, orderBy } from 'lodash';
import QuotationQtyDialog from 'src/pages/Quotation/Productpackage/QuotationQtyDialog';
import LeadTimeDialog from 'src/pages/Quotation/Productpackage/LeadTimeDialog';
import Versions from 'src/pages/Quotation/Versions';
import { FcCancel, FcClock, FcOk } from 'react-icons/all';
import ManualReponseDialog from 'src/pages/Quotation/ManualRespondDialog';
import QuotationSummeryDialog from 'src/pages/Quotation/QuotationSummeryDialog';
import { calculateRowsField } from 'src/components/RentalManagment/helper';
import { genrateCustomTableColumns } from 'src/constants/columns';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import SendEmail from 'src/pages/RentalManagement/Quotation/SendEmail';

const Quotation = ({
  repairOrderData,
  setNextStep,
  renderedFrom,
  stepFullScreen,
  allowedToEdit,
  allowedToDelete,
  setQuotationVersionData,
  updateOrderStatus,
  invoiceStep
}) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();

  const isMobileScreen = useMediaQuery('(max-width: 767px)');
  const [isUpdating, setUpdating] = useState(false);

  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isProductEdit, setIsProductEdit] = useState({ open: false, isBulkedit: false });

  const [recordToUpdate, setRecordToUpdate] = useState(null);

  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);

  const [material, setMaterial] = useState([]);
  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState(null);
  const [allFields, setAllFields] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [leadTimeDialog, setLeadTimeDialog] = useState({ open: false, data: null });
  const [showQuotationSummaryDialog, setShowQuotationSummaryDialog] = useState(false);
  const [showAllVersionStatus, setShowAllVersionStatus] = useState(false);
  const [customerAcceptable, setCustomerAcceptable] = useState(false);
  const [quotationData, setQuotationData] = useState(null);
  const [currentVersion, setCurrentVersion] = useState(null);
  const [allColumn, setAllColumn] = useState([]);
  const [isInlineEdit, setIsInlineEdit] = useState(false);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState({ open: false, data: null });

  useEffect(() => {
    fetchFields();
  }, [repairOrderData]);

  useEffect(() => {
    if (
      invoiceStep &&
      ![REPAIR_ORDER_STATUS.invoiced, REPAIR_ORDER_STATUS.readyToInvoice, REPAIR_ORDER_STATUS.completed]?.includes(repairOrderData?.status)
    ) {
      updateOrderStatus(REPAIR_ORDER_STATUS.readyToInvoice);
    }
  }, [invoiceStep]);

  useEffect(() => {
    if (quotationData?.versions[currentVersion] && quotationData?.versions[currentVersion]?._id) {
      fetchProductInventory();
    }
  }, [currentVersion]);

  const fetchFields = async () => {
    setNextStep(false);
    setColumns(null);

    const quotationResponse = await axiosInstance().get(`${repairOrder.api}/${repairOrderData?._id}/check-create/quotation`);
    const quotationInfo: any = quotationResponse?.data?.data;

    setQuotationData(quotationInfo);
    let keys = Object.keys(quotationInfo.versions);
    let tempCurrentVersion = parseInt(keys[keys.length - 1]);
    setCurrentVersion(tempCurrentVersion);
    setQuotationVersionData({ quotationId: quotationInfo?._id, ...quotationInfo?.versions[tempCurrentVersion] });

    setNextStep(quotationInfo?.versions[tempCurrentVersion]?.status === QUOTATION_STATUS.acceptByCustomer ? true : false);

    var data = await fetch_quotation_product_fields(quotationInfo?.currency);
    setAllFields(JSON.parse(JSON.stringify(data)));

    if (allowedToEdit === false || invoiceStep === true || ![QUOTATION_STATUS.buildingQuote].includes(quotationInfo?.versions[tempCurrentVersion]?.status)) {
      data?.forEach((e) => {
        e.isColumnEditable = false;
      });
    }

    let column: any = [
      {
        accessor: 'srno',
        Header: 'Index',
        width: 70,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.srno}</p>,
        Footer: () => {
          return <>Total</>;
        }
      },
      {
        accessor: 'type',
        Header: 'Type',
        width: 70,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.type === "serializedAsset" ? "Asset" : capitalize(row.original.type)}</p>
      },
      {
        accessor: 'detail',
        Header: 'Detail',
        width: 250,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {[QUOTATION_STATUS.acceptByCustomer, QUOTATION_STATUS.rejectByCustomer, QUOTATION_STATUS.sentToCustomer].includes(
              quotationInfo?.versions[tempCurrentVersion]?.status
            ) ? (
              <p> {row.original.detail}</p>
            ) : (
              <p
                onClick={() => {
                  handleOpen(row.original);
                }}
                className="link text-truncate"
                title={row.original?.detail}
              >
                {row.original?.detail}
              </p>
            )}
            <Box pl={1}>
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
                <OpenInNewIcon fontSize="small" color="primary" />
              </IconButton>
            </Box>
          </div>
        )
      },
      {
        accessor: 'productName',
        Header: 'Product',
        width: 200,
        primaryField: true,
        Cell: ({ row }) => (
          <div className="d-flex gap-2 align-items-center">
            <p className="text-truncate" title={row.original?.productName}>
              {row.original?.productName ? (
                row.original?.productId ? (
                  <a className="link text-truncate" href={`${routes.productDetail.path}/${row.original?.productId}`} target="_blank">
                    {row.original?.productName}
                  </a>
                ) : (
                  row.original?.productName
                )
              ) : (
                <NoDataCell />
              )}
            </p>
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

    const newColumns = genrateCustomTableColumns(data, quotationInfo?.currency, renderedFrom);
    let qtyIndex = newColumns.findIndex(d => d.accessor === 'qty')
    if (qtyIndex > -1) {
      newColumns[qtyIndex].accessor = 'qtyDisplay'
    }
    column = [...column, ...newColumns];
    column.push({
      accessor: 'action',
      Header: '',
      minWidth: 50,
      width: 50,
      sticky: 'right',
      disableFilters: true,
      canDrag: false,
      Cell: ({ row }) => {
        return <></>;
      }
    });
    setColumns(column);
    setAllColumn(column.map((d) => d.Header));
  };

  const fetchProductInventory = async () => {
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
      parent.srno = i + 1;
      parent.detail = `${parent.type === 'serializedAsset'
        ? parent.serializedAssetDetail?.assetNumber
        : parent.type === 'product'
          ? parent.productDetail?.productName
          : parent.type === 'service'
            ? parent.serviceDetail?.serviceName
            : parent.packageDetail?.packageName
        }`;
      parent.description =
        parent.type === 'service'
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
      parent.qtyDisplay = parent.qty;
      parent.isValid = parent['finalPrice_' + quotationData?.currency?.toLowerCase()] ? true : false;
      parent.hideSelection = false;
      parent.subRows = generateNestedData(data.material, parent);
    });
    setRowsData(rows);
    setSelectedProducts([]);
  };

  const generateNestedData = (material, parent) => {
    var subRows: any = orderBy(
      material?.filter((e) => e.parentId === parent._id),
      ['preWork'],
      ['desc']
    );

    subRows.forEach((_subRow, j) => {
      _subRow.srno = parent.srno + '.' + (j + 1);
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
      _subRow.qtyDisplay = _subRow.qty;
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

  const handleSaveData = async (rows: any) => {
    rows.forEach((element) => {
      delete element.srno;
      delete element.detail;
      delete element.qtyDisplay;
      delete element.isValid;
      delete element.hideSelection;
      delete element.assetQty;
      delete element.productDetail;
      delete element.packageDetail;
      delete element.serviceDetail;
      delete element.subRows;
      delete element.leadTime;
      delete element.leadTimeData;
      delete element.productName;
      delete element.productId;
    });
    setUpdating(true);
    axiosInstance()
      .put(`${quotation.api}/productpackage/${quotationData?._id}/${quotationData?.versions[currentVersion]?._id}`, { material: rows })
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
    axiosInstance()
      .put(`${quotation.api}/productpackage/${quotationData?._id}/${quotationData?.versions[currentVersion]?._id}/delete`, { ids: rows })
      .then(() => {
        setDeleting(false);
        fetchProductInventory();
        setDeleteData(null);
      })
      .catch((error) => {
        setDeleting(false);
        toastConfig.setToastConfig(error);
        setDeleteData(null);
      });
  };

  const handleOpen = (rowData) => {
    setIsProductEdit({ open: true, isBulkedit: false });
    setRecordToUpdate(rowData);
  };

  const calculatePrice = (arr: any[]) => {
    if (quotationData) {
      const data: any = {};
      data.conditionType = ['Rent'];
      data.material = arr.map((ele) => ({
        materialId: ele?.materialId,
        materialType: ele?.type,
        qty: ele?.qty,
        pricingMethod: ele?.pricingMethod,
        unit: ele?.unit,
        currency: quotationData?.currency
      }));
      data.supplier = [];
      data.customer = [quotationData?.customerAccount?.optionValue];
      data.warehouse = [quotationData?.warehouse?.optionValue];
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
          message: 'Sent to customer Sucessfully'
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
      handleOpen({
        ...updatedData,
        detail: updatedData.type === 'product' ? updatedData?.productDetail?.productName : updatedData?.packageDetail?.packageName
      });
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
      if (inputField.hasOwnProperty('qtyDisplay')) {
        inputField['qty'] = inputField['qtyDisplay'];
      }
      let rows: any = [{ ...rowData, ...updatedData }];
      rows = await calculateRowsField(material, inputField, allFields, updatedData);
      handleSaveData(rows);
      setShowConfirmationDialog({ open: false, data: {} });
    }
  };

  return (
    <Fragment>
      <Box
        display="flex"
        justifyContent="space-between"
        mt={1}
        mb={2}
        className={`flex-wrap`}
        style={{ gap: isMobileScreen ? '5px' : 0, justifyContent: isMobileScreen ? 'center' : 'space-between' }}
      >
        <Box display="flex">
          <SendEmail
            versionData={quotationData?.versions[currentVersion]}
            quotationData={quotationData}
            allowedToEdit={invoiceStep ? !allowedToEdit : allowedToEdit}
            versionId={quotationData?.versions[currentVersion]?._id}
            columns={columns}
            allColumn={allColumn}
            setShowAllVersionStatus={setShowAllVersionStatus}
            setShowQuotationSummaryDialog={setShowQuotationSummaryDialog}
            currentVersion={currentVersion}
            isSendEmail={true}
            hideSummary={true}
            hideVersions={invoiceStep}
          />
        </Box>
        {!isMobileScreen && !invoiceStep && (
          <Box display="flex">
            {quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.sentToCustomer ? (
              <div className={`d-flex align-items-center justify-content-center flex-wrap spacing-1 text-align-center`}>
                <FcClock size={25} />
                <Typography style={{ color: '#00acc1', fontWeight: 'bold' }}>Quote has been sent to customer</Typography>
              </div>
            ) : quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.acceptByCustomer ? (
              <div className={`d-flex align-items-center justify-content-center flex-wrap spacing-1 text-align-center`}>
                <FcOk size={25} />
                <Typography style={{ color: '#28a745', fontWeight: 'bold' }}>Quote has been accepted by customer</Typography>
              </div>
            ) : quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.rejectByCustomer ? (
              <div className={`d-flex align-items-center justify-content-center flex-wrap spacing-1 text-align-center`}>
                <FcCancel size={25} />
                <Typography style={{ color: '#dc3545', fontWeight: 'bold' }}>Quote has been rejected by customer</Typography>
              </div>
            ) : null}
          </Box>
        )}
        <Box display="flex">
          {allowedToEdit && (
            <div>
              {quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.buildingQuote ||
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
                  className="mx-1"
                  color="primary"
                >
                 Process Quote
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
              ) : [QUOTATION_STATUS.rejectByCustomer, QUOTATION_STATUS.acceptByCustomer].includes(quotationData?.versions[currentVersion]?.status) ? (
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
              ) : null}
              {![QUOTATION_STATUS.acceptByCustomer, QUOTATION_STATUS.rejectByCustomer, QUOTATION_STATUS.sentToCustomer].includes(
                quotationData?.versions[currentVersion]?.status
              ) && (
                  <Button
                    variant="outlined"
                    color="default"
                    size="small"
                    onClick={openActions}
                    aria-controls="action-menu"
                    disabled={selectedProducts.length === 0}
                  >
                    Actions
                    <ExpandMore />
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
                    setIsProductEdit({ open: true, isBulkedit: true });
                  }}
                >
                  Bulk Edit
                </MenuItem>
              </Menu>
            </div>
          )}
        </Box>
        {isMobileScreen && (
          <Box display="flex" style={{ margin: '0 auto' }}>
            {quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.sentToCustomer ? (
              <div className={`d-flex align-items-center justify-content-center flex-wrap spacing-1 text-align-center`}>
                <FcClock size={25} />
                <Typography style={{ color: '#00acc1', fontWeight: 'bold' }}>Quote has been sent to customer</Typography>
              </div>
            ) : quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.acceptByCustomer ? (
              <div className={`d-flex align-items-center justify-content-center flex-wrap spacing-1 text-align-center`}>
                <FcOk size={25} />
                <Typography style={{ color: '#28a745', fontWeight: 'bold' }}>Quote has been accepted by customer</Typography>
              </div>
            ) : quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.rejectByCustomer ? (
              <div className={`d-flex align-items-center justify-content-center flex-wrap spacing-1 text-align-center`}>
                <FcCancel size={25} />
                <Typography style={{ color: '#dc3545', fontWeight: 'bold' }}>Quote has been rejected by customer</Typography>
              </div>
            ) : null}
          </Box>
        )}
      </Box>
      {columns && rowsData ? (
        <Box zIndex={5} width={'100%'}>
          <CustomReactTable
            height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 395px)'}
            columns={columns}
            data={rowsData}
            setWholeRowsCellColor={(rowData) => (!rowData.isValid ? '' : '')}
            onSelect={setSelectedProducts}
            childrenProperty="subRows"
            uniqueKey="_id"
            hideSelection={
              !allowedToEdit ||
              [QUOTATION_STATUS.acceptByCustomer, QUOTATION_STATUS.rejectByCustomer, QUOTATION_STATUS.sentToCustomer].includes(
                quotationData?.versions[currentVersion]?.status
              )
            }
            hideAction={
              !allowedToEdit ||
              [QUOTATION_STATUS.acceptByCustomer, QUOTATION_STATUS.rejectByCustomer, QUOTATION_STATUS.sentToCustomer].includes(
                quotationData?.versions[currentVersion]?.status
              )
            }
            onSaveEdit={onSaveInlineEdit}
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
          />
        </Box>
      ) : (
        <Box p={2} height={500} bgcolor="white">
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
            setIsProductEdit({ open: false, isBulkedit: false });
            setRecordToUpdate(null);
            if (isInlineEdit) {
              setIsInlineEdit(false);
            }
          }}
          isBulkedit={isProductEdit.isBulkedit}
          handleSaveData={handleSaveData}
          quotationData={quotationData}
          rowData={recordToUpdate}
          material={material}
          selectedProducts={selectedProducts}
          isInlineEdit={isInlineEdit}
        />
      )}
      {leadTimeDialog.open && (
        <LeadTimeDialog
          quotationId={quotationData._id}
          data={leadTimeDialog?.data}
          versionId={quotationData?.versions[currentVersion]?._id}
          onClose={() => {
            setLeadTimeDialog({ open: false, data: null });
          }}
          handleSucess={() => {
            setLeadTimeDialog({ open: false, data: null });
            fetchProductInventory();
          }}
        />
      )}
      {quotationData && showAllVersionStatus && (
        <Versions
          onClose={() => setShowAllVersionStatus(false)}
          quotationId={quotationData?._id}
          handleChangeVersion={handleChangeVersion}
          refrenceType="repairOrder"
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
