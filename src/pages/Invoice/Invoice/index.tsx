import Box from '@material-ui/core/Box/Box';
import React, { useState, useEffect, useReducer, useContext } from 'react';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import Grid from '@material-ui/core/Grid/Grid';
import { Dialog, useMediaQuery } from '@material-ui/core';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { CustomDialogTransition, dateFormat, formatAmountWithCurrency, invoice } from '../../../constants/helpers';
import { useData } from '../../../StateProvider/Provider';
import axiosInstance from '../../../axios/axiosInstance';
import { CreateEmail } from '../../../components/Activity/Email/CreateEmail';
import { isMobile, isTablet } from 'react-device-detect';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import moment from 'moment';
import { fetch_invoice_product_fields } from '../../../components/Invoice/helper';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import InvoiceFacility from './InvoiceFacility';

const Invoice = ({ invoiceData, setNextStep, currencySymbol, updateJobStatus, statusOptions, stepFullScreen, showActivity, renderedFrom }) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();
  const isSmallScreen = useMediaQuery('(max-width:1300px)');
  const isTabletScreen = useMediaQuery('(max-width:960px)');
  const [sendEmail, setSendEmail] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [userEmails, setUserEmails] = useState({ to: [], cc: [] });
  const [generatingPdfFile, setGeneratingFile] = useState(false);
  const [allFields, setAllFields] = useState([]);
  const [rowsData, setRowsData] = useState(null);
  const [columns, setColumns] = useState([
    { field: 'type', headerName: 'Type', show: true, disabled: true, cellRenderer: 'commonRenderer' },
    { field: 'description', headerName: 'Description', show: true, disabled: true, cellRenderer: 'commonRenderer' }
  ]);

  const [downlodingFile, setDownlodingFile] = useState(null);
  const [emailAttachments, setEmailAttachments] = useState([]);

  useEffect(() => {
    if (
      statusOptions.findIndex((d) => d.optionLabel === 'Ready to Invoice') > statusOptions.findIndex((d) => d.optionLabel === invoiceData?.status)
    ) {
      updateJobStatus('Ready to Invoice');
    }
  }, []);

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      let data = await fetch_invoice_product_fields(invoiceData?.currency);
      setAllFields(JSON.parse(JSON.stringify(data)));
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
            </div>
          )
        }
      ];
      data.forEach((element) => {
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
                      <p>{formatAmountWithCurrency(invoiceData?.currency, row.original[fieldName])?.amountWithouCurrencyCode}</p>
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
                    <p>{formatAmountWithCurrency(invoiceData?.currency, row.original[fieldName])?.amountWithouCurrencyCode}</p>
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
              .filter((f) => f.original.parentId === null && f.values.hasOwnProperty(element.accessor) && !isNaN(f.values[element.accessor]))
              .reduce((sum, row) => row.values[element.accessor] + sum, 0);
            return <>{qtyTotal}</>;
          };
        } else if (element.accessor.includes('finalPrice')) {
          element['Footer'] = (info) => {
            const total = info.rows
              .filter((f) => f.original.parentId === null && f.values.hasOwnProperty(element.accessor) && !isNaN(f.values[element.accessor]))
              .reduce((sum, row) => row.values[element.accessor] + sum, 0);
            return (
              <>
                {currencySymbol} {formatAmountWithCurrency(invoiceData?.currency, total)?.amountWithouCurrencyCode ?? total}
              </>
            );
          };
        }
      });
      setColumns(coloum);
      fetchData();
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchData = async () => {
    var data: any = [];
    var inventory: any = [];
    const response = await axiosInstance().get(`${invoice.api}/productpackage/${invoiceData._id}`);
    data = response?.data?.data;

    inventory = data?.inventory ? data?.inventory : [];
    const rows = data.material.filter((e) => e.parentId === null);
    rows.forEach((parent, i) => {
      parent.detail = `${
        parent.type === 'asset'
          ? parent.serializedAssetDetail?.assetNumber
          : parent.type === 'product'
          ? parent.productDetail?.productName
          : parent.type === 'service'
          ? parent.serviceDetail?.serviceName
          : parent.packageDetail?.packageName
      }`;
      parent.leadTimeData = Array.isArray(parent.leadTime) ? parent.leadTime : [];
      parent.leadTime = Array.isArray(parent.leadTime) ? `${parent?.leadTime?.reduce((acc, e) => acc + parseInt(e?.days || 0), 0) || 0}` : 0;
      parent.qtyDisplay = parent.qty;
      parent.isValid = parent['finalPrice_' + invoiceData?.currency?.toLowerCase()] ? true : false;
      parent.hideSelection = inventory.filter((e) => e._id === parent._id).length ? true : false;
      parent.assetQty = inventory.filter((e) => e._id === parent._id).length;
      parent.subRows = generateNestedData(data.material, inventory, parent);
    });
    if (rows.filter((_rows) => _rows.isValid === false).length > 0 || rows.length === 0) {
      setNextStep(true);
    } else {
      setNextStep(true);
    }
    setRowsData(rows);
  };

  const generateNestedData = (material, inventory, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, j) => {
      _subRow.detail = `${
        _subRow.type === 'asset'
          ? _subRow.serializedAssetDetail?.assetNumber
          : _subRow.type === 'product'
          ? _subRow.productDetail?.productName
          : _subRow.type === 'service'
          ? _subRow.serviceDetail?.serviceName
          : _subRow.packageDetail?.packageName
      }`;
      _subRow.leadTimeData = Array.isArray(_subRow.leadTime) ? _subRow.leadTime : [];
      _subRow.leadTime = Array.isArray(_subRow.leadTime) ? `${_subRow?.leadTime?.reduce((acc, e) => acc + parseInt(e?.days || 0), 0) || 0}` : 0;
      _subRow.qtyDisplay = _subRow.qty;
      _subRow.isValid = _subRow['finalPrice_' + invoiceData?.currency?.toLowerCase()] ? true : false;
      _subRow.hideSelection = inventory.filter((e) => e._id === _subRow._id).length ? true : false;
      _subRow.assetQty = inventory.filter((e) => e._id === _subRow._id).length;
      _subRow.subRows = generateNestedData(material, inventory, _subRow);
    });
    if (subRows.length === 0 && parent.type === 'package') {
      parent.isValid = false;
    }
    if (parent.type === 'package') {
      parent.hideSelection = subRows.filter((e) => e.hideSelection).length ? true : false;
    }
    return subRows;
  };

  const getNestedSubRows = (obj, original) => {
    if (original?.subRows?.length) {
      original?.subRows.forEach((element) => {
        obj.push({ id: element._id, type: element.type, materialId: element.materialId });
        getNestedSubRows(obj, element);
      });
    }
  };

  return (
    <>
      <InvoiceFacility invoiceData={invoiceData} />
      <Grid item xs={12} md={12} sm={12} className="mt-3">
        {columns && rowsData ? (
          <>
            <Box
              p="6px"
              zIndex={5}
              width={
                stepFullScreen
                  ? '100%'
                  : isTabletScreen
                  ? 'calc(100vw)'
                  : isSmallScreen
                  ? 'calc(100vw)'
                  : showActivity
                  ? '100%'
                  : 'calc(100vw - 100px)'
              }
              height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 345px)'}
            >
              <CustomReactTable
                height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 345px)'}
                columns={columns}
                data={rowsData}
                setWholeRowsCellColor={(rowData) => (!rowData.isValid ? '' : '')}
                hideSelection={true}
                onSelect={() => {}}
                childrenProperty="subRows"
                uniqueKey="_id"
                renderedFrom="invoice_product_package"
                isClientSideGrid={true}
              />
            </Box>
          </>
        ) : (
          <Box p={2} height={500} bgcolor="white">
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Grid>
      {sendEmail && (
        <Dialog
          open={sendEmail}
          fullScreen={fullScreen || isMobile || isTablet}
          TransitionComponent={CustomDialogTransition}
          aria-labelledby="customized-dialog-title"
          maxWidth="md"
          onClose={() => {
            setSendEmail(false);
            setDownlodingFile(null);
            setFullScreen(false);
          }}
          fullWidth
        >
          <CreateEmail
            generatingFile={generatingPdfFile}
            handleClose={() => {
              setSendEmail(false);
              setDownlodingFile(null);
              setFullScreen(false);
            }}
            fetchData={() => {
              setSendEmail(false);
              setDownlodingFile(null);
              setFullScreen(false);
            }}
            id={invoiceData._id}
            showESign={true}
            isQuoteBuilder={true}
            options={userEmails?.to}
            cc={userEmails?.cc ?? []}
            emailId={null}
            qouteBuilderAttachments={emailAttachments}
            subject={`${user?.user?.brandName ?? 'Brand'} Invoice - ${invoiceData?.invoiceNumber ?? ''}`}
            fromQuote={true}
            isMinimized={!fullScreen}
            onMinimizeMaximize={() => {
              setFullScreen((prevState) => !prevState);
            }}
            showManimizeMaximize={true}
            refrenceType="invoice"
          />
        </Dialog>
      )}
    </>
  );
};

export default Invoice;
