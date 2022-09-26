import React, { useState, useEffect, useContext, Fragment, useReducer, useMemo } from 'react';
import {
  Grid,
  Box,
  Button,
  Paper,
  Typography,
  IconButton,
  CircularProgress,
  Tab,
  Tabs,
  ButtonGroup,
  Container,
  InputAdornment,
  useMediaQuery,
  Menu,
  MenuItem,
  Tooltip,
  Chip,
  capitalize
} from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import { useData } from '../../../StateProvider/Provider';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import { ExpandMore } from '@material-ui/icons';
import { isMobile, isTablet } from 'react-device-detect';
import { FiDownloadCloud } from 'react-icons/fi';
import { AiFillEdit, AiOutlineEye, AiOutlineFileExcel, AiOutlineFilePdf } from 'react-icons/ai';
import { GiVintageRobot } from 'react-icons/gi';
import { utils } from 'xlsx';
import { fetch_quotation_product_fields, handleViewPdf } from 'src/components/Quotation/helper';
import moment from 'moment';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { dateFormat, formatAmountWithCurrency, prepareDataForGrid, quotation, QUOTATION_STATUS } from 'src/constants/helpers';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import SendEmail from '../SendEmail';

const QuoteBuilder = ({
  quotationData,
  setNextStep,
  currencySymbol,
  showActivity,
  sentToCustomer = false,
  stepFullScreen,
  fetchQuotationData,
  setQuotationSummary,
  version,
  currentStep,
  versionData
}) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();

  const [isRateRequired, setIsRateRequired] = useState(false);
  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState(null);
  const isSmallScreen = useMediaQuery('(max-width:1300px)');
  const isTabletScreen = useMediaQuery('(max-width:960px)');

  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    if (versionData) {
      fetchProductInventory();
    }
  }, [versionData]);

  useEffect(() => {
    if (currentStep === 3 && rowsData && !sentToCustomer) {
      setNextStep(false);
    } else {
      setNextStep(true);
    }
  }, [currentStep, sentToCustomer, rowsData]);

  const fetchFields = async () => {
    var data = await fetch_quotation_product_fields(quotationData?.currency);
    const coloum: any = [
      {
        accessor: 'detail',
        Header: 'Detail',
        minWidth: 300,
        width: 300,
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {
              <p className="text-truncate" title={row.original?.detail}>
                {row.original?.detail}
              </p>
            }
            {row.original?.parentId === null && row.original?.type !== 'Service' && (
              <Box ml={1} className="d-flex align-items-center">
                <span>({row.original?.subRows?.length})</span>
              </Box>
            )}
            <Chip
              className="ml-1"
              label={`${row.original.type === 'serializedAsset' ? 'Asset' : capitalize(row.original.type)}`}
              size="small"
              color="primary"
            />
          </div>
        )
      },
      {
        accessor: 'leadTime',
        Header: 'Lead Time (Days)',
        Cell: ({ row }) => (row.original?.leadTime && row.original?.leadTime?.length ? <p>{row.original['leadTime']}</p> : <p>0</p>),
        Footer: (info) => {
          const total = info.rows
            .filter((f) => f.values.hasOwnProperty('leadTime') && !isNaN(f.values['leadTime']))
            .reduce((sum, row) => parseInt(row.values['leadTime']) + sum, 0);
          return <>{total}</>;
        }
      }
    ];
    data.forEach((element) => {
      if (element.fieldName === 'price' && element.required) {
        setIsRateRequired(true);
      }
      if (element.type === 'date') {
        coloum.push({
          accessor: element.fieldName,
          Header: element.fieldLabel,
          disableFilters: true,
          Cell: ({ row }) =>
            row.original[element.fieldName] ? <p>{moment(row.original[element.fieldName].slice(0, 10)).format(dateFormat)}</p> : <NoDataCell />
        });
      } else if (element.fieldName === 'supplierAccount') {
        coloum.push({
          accessor: element.fieldName,
          Header: element.fieldLabel,
          Cell: ({ row }) =>
            row.original[element.fieldName] ? (
              <p className="text-truncate">{row.original[element.fieldName].map((d) => d?.optionLabel).toString()}</p>
            ) : (
              <NoDataCell />
            )
        });
      } else if (element.type === 'converter' || element.type === 'currencyAmount' || element.isConverter === true) {
        if (element.type !== 'currencyAmount' && (element.type === 'converter' || element.isConverter === true)) {
          element.displayUnits.forEach((_unit) => {
            let fieldName = element.fieldName + '_' + _unit.toLowerCase();
            let fieldLabel = element.fieldLabel + ' ' + _unit;
            coloum.push({
              accessor: fieldName,
              Header: fieldLabel,
              Cell: ({ row }) => (row.original[fieldName] ? <p>{row.original[fieldName]}</p> : <NoDataCell />)
            });
          });
        } else if (element.type === 'currencyAmount' && (element.type === 'converter' || element.isConverter === true)) {
          element.displayUnits.forEach((_unit) => {
            element.displayCurrency.forEach((_currency) => {
              let fieldName = element.fieldName + '_' + _currency.toLowerCase() + '_' + _unit.toLowerCase();
              let fieldLabel = element.fieldLabel + ' ' + _unit + '/' + _currency;
              coloum.push({
                accessor: fieldName,
                Header: fieldLabel,
                Cell: ({ row }) =>
                  row.original[fieldName] ? (
                    <p>{formatAmountWithCurrency(quotationData?.currency, row.original[fieldName])?.amountWithouCurrencyCode}</p>
                  ) : (
                    <NoDataCell />
                  )
              });
            });
          });
        } else if (element.type === 'currencyAmount') {
          element.displayCurrency.forEach((_currency) => {
            let fieldName = element.fieldName + '_' + _currency.toLowerCase();
            let fieldLabel = element.fieldLabel + ' ' + _currency;
            coloum.push({
              accessor: fieldName,
              Header: fieldLabel,
              Cell: ({ row }) =>
                row.original[fieldName] ? (
                  <p>{formatAmountWithCurrency(quotationData?.currency, row.original[fieldName])?.amountWithouCurrencyCode}</p>
                ) : (
                  <NoDataCell />
                )
            });
          });
        }
      } else {
        if (element.fieldName === 'qty') {
          element.fieldName = 'qtyDisplay';
        }
        coloum.push({
          accessor: element.fieldName,
          Header: element.fieldLabel,
          Cell: ({ row }) => (row.original[element.fieldName] ? <p>{row.original[element.fieldName]}</p> : <NoDataCell />)
        });
      }
    });
    coloum.forEach((element) => {
      if (element.accessor.includes('detail')) {
        element['Footer'] = () => {
          return <>Total</>;
        };
      } else if (element.accessor === 'qtyDisplay') {
        element['Footer'] = (info) => {
          const qtyTotal = info.rows
            .filter((f) => f?.original?.parentId === null && f?.values?.hasOwnProperty(element?.accessor) && !isNaN(f?.values[element?.accessor]))
            .reduce((sum, row) => row?.values[element?.accessor] + sum, 0);
          return <>{qtyTotal}</>;
        };
      } else if (element.accessor.includes('finalPrice')) {
        element['Footer'] = (info) => {
          const total = info?.rows
            .filter((f) => f?.original?.parentId === null && f?.values?.hasOwnProperty(element?.accessor) && !isNaN(f?.values[element?.accessor]))
            .reduce((sum, row) => row?.values[element?.accessor] + sum, 0);
          return (
            <>
              {currencySymbol} {formatAmountWithCurrency(quotationData?.currency, total)?.amountWithouCurrencyCode ?? total}
            </>
          );
        };
      }
    });
    setColumns(coloum);
  };

  const fetchProductInventory = async () => {
    setNextStep(false);
    var data: any = [];
    var inventory: any = [];
    const response = await axiosInstance().get(`${quotation.api}/productpackage/${quotationData._id}/${versionData._id}`);
    const serviceResponse = await axiosInstance().get(`${quotation.api}/service/${quotationData._id}/${versionData._id}`);

    data = response?.data?.data;
    inventory = data?.inventory ? data?.inventory : [];
    const rows = data.material.filter((e) => e.parentId === null);
    rows.forEach((parent, i) => {
      parent.detail = `${
        parent.type === 'serializedAsset'
          ? parent.serializedAssetDetail?.assetNumber
          : parent.type === 'product'
          ? parent.productDetail?.productName
          : parent.type === 'service'
          ? parent.serviceDetail?.serviceName
          : parent.packageDetail?.packageName
      }`;
      parent.leadTime = Array.isArray(parent?.leadTime) ? `${parent?.leadTime?.reduce((acc, e) => acc + parseInt(e?.days || 0), 0) || 0}` : 0;
      parent.qtyDisplay = parent.qty;
      parent.isValid = parent['finalPrice_' + quotationData?.currency?.toLowerCase()] ? true : !isRateRequired;
      parent.hideSelection = inventory.filter((e) => e._id === parent._id).length ? true : false;
      parent.assetQty = inventory.filter((e) => e._id === parent._id).length;

      const subRows: any = data.material.filter((e) => e.parentId === parent._id);
      subRows.forEach((_subRow, j) => {
        _subRow.detail = `${
          _subRow.type === 'serializedAsset'
            ? _subRow.serializedAssetDetail?.assetNumber
            : _subRow.type === 'product'
            ? _subRow.productDetail?.productName
            : _subRow.type === 'service'
            ? _subRow.serviceDetail?.serviceName
            : _subRow.packageDetail?.packageName
        }`;
        _subRow.leadTime = Array.isArray(_subRow?.leadTime) ? `${_subRow?.leadTime?.reduce((acc, e) => acc + parseInt(e.days), 0) || 0}` : 0;
        _subRow.qtyDisplay = `${parent.qty * _subRow.qty}`;
        _subRow.isValid = _subRow['finalPrice_' + quotationData?.currency?.toLowerCase()] ? true : !isRateRequired;
        _subRow.hideSelection = inventory.filter((e) => e._id === _subRow._id).length ? true : false;
        _subRow.assetQty = inventory.filter((e) => e._id === _subRow._id).length;
      });
      parent.hideSelection = subRows.filter((e) => e.hideSelection).length ? true : false;
      parent.subRows = subRows;
    });
    if (rows.filter((_rows) => _rows.isValid === false).length > 0 || rows.length === 0) {
      setNextStep(false);
    } else {
      setNextStep(true);
    }

    let serviceRows = [];
    if (serviceResponse?.data?.data?.length) {
      serviceRows = serviceResponse?.data?.data?.map((item) => {
        let finalObject = prepareDataForGrid(item);
        finalObject['detail'] = item?.serviceName;
        finalObject['qtyDisplay'] = item?.qty;
        finalObject['leadTime'] =
          Array.isArray(item?.leadTime) && item?.leadTime?.length ? `${item?.leadTime?.reduce((acc, e) => acc + parseInt(e.days), 0) || 0}` : 0;
        finalObject['parentId'] = null;
        finalObject['isValid'] = true;
        finalObject['hideSelection'] = false;
        finalObject['assetQty'] = 0;
        finalObject['type'] = 'Service';
        let res: any = {
          ...finalObject
        };
        return res;
      });
    }
    setRowsData([...rows, ...serviceRows]);

    const totalFinalPrice = rows
      .filter(
        (f) =>
          f?.parentId === null &&
          f?.hasOwnProperty('finalPrice_' + quotationData?.currency?.toLowerCase()) &&
          !isNaN(f['finalPrice_' + quotationData?.currency?.toLowerCase()])
      )
      .reduce((sum, row) => row['finalPrice_' + quotationData?.currency?.toLowerCase()] + sum, 0);
    const totalSupplierPrice = rows
      .filter(
        (f) =>
          f?.parentId === null &&
          f?.hasOwnProperty('supplierPrice_' + quotationData?.currency?.toLowerCase()) &&
          !isNaN(f['supplierPrice_' + quotationData?.currency?.toLowerCase()])
      )
      .reduce((sum, row) => row['supplierPrice_' + quotationData?.currency?.toLowerCase()] + sum, 0);

    setQuotationSummary({
      totalProfit: formatAmountWithCurrency(quotationData?.currency, totalFinalPrice - totalSupplierPrice),
      totalcost: formatAmountWithCurrency(quotationData?.currency, totalSupplierPrice),
      totalsale: formatAmountWithCurrency(quotationData?.currency, totalFinalPrice)
    });
  };

  return (
    <Fragment>
      <Box pb={2} display="flex" justifyContent="space-between">
        <Box display="flex">
          <SendEmail versionData={versionData} quotationData={quotationData} />
        </Box>
        <Box display="flex">
          <Typography variant="h6" color={quotationData?.subStatus === 'Reject by Customer Waiting for New Price' ? 'error' : 'secondary'}>
            {quotationData?.subStatus === 'Waiting for Your Acceptance'
              ? 'Waiting for Customer Response'
              : quotationData?.subStatus === 'Reject by Customer Waiting for New Price'
              ? 'Rejected by Customer'
              : quotationData?.subStatus === 'Price Approved by Customer'
              ? 'Approved by Customer'
              : ''}
          </Typography>
        </Box>
        <Box display="flex">
          {versionData?.processStatus === 'Send To Customer' && (
            <HtmlTooltip title={'Send to customer'}>
              <Button
                variant="contained"
                color="primary"
                size="small"
                disabled={sentToCustomer}
                onClick={() => {
                  axiosInstance()
                    .put(`${quotation.api}/${quotationData?._id}/send-to-customer/${versionData._id}`)
                    .then(() => {
                      fetchQuotationData(version, false);
                      toastConfig.setToastConfig({
                        open: true,
                        type: 'success',
                        message: 'Sent to customer Sucessfully'
                      });
                    })
                    .catch((error) => {
                      toastConfig.setToastConfig(error);
                    });
                }}
              >
                Send to Customer
              </Button>
            </HtmlTooltip>
          )}
          <Box p={1} />
        </Box>
      </Box>
      {columns && rowsData ? (
        <>
          <Box
            p="6px"
            zIndex={5}
            width={
              stepFullScreen ? '100%' : isTabletScreen ? 'calc(100vw)' : isSmallScreen ? 'calc(100vw)' : showActivity ? '100%' : 'calc(100vw - 100px)'
            }
            height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 345px)'}
          >
            <CustomReactTable
              height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 345px)'}
              columns={columns}
              data={rowsData}
              setWholeRowsCellColor={(rowData) => (!rowData.isValid ? 'error' : '')}
              onSelect={() => {}}
              hideSelection={true}
              childrenProperty="subRows"
              uniqueKey="_id"
              renderedFrom="quotation_product_package"
              isClientSideGrid={true}
            />
          </Box>
        </>
      ) : (
        <Box p={2} height={500} bgcolor="white">
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </Fragment>
  );
};

export default QuoteBuilder;
