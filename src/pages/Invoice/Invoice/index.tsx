import Box from '@material-ui/core/Box/Box';
import { useState, useEffect, useContext, Fragment } from 'react';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import Grid from '@material-ui/core/Grid/Grid';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { CustomDialogTransition, invoice, sidebarResource } from '../../../constants/helpers';
import axiosInstance from '../../../axios/axiosInstance';
import { isMobile, isTablet } from 'react-device-detect';
import { fetch_invoice_product_fields } from '../../../components/Invoice/helper';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import { generateCustomTableColumns } from 'src/constants/columns';
import { startCase } from 'lodash';
import PreviewDownload from 'src/components/PreviewDownload';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { IconButton } from '@material-ui/core';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import routes from 'src/components/Helpers/Routes';

const Invoice = ({ invoiceData, setNextStep, currencySymbol, updateJobStatus, statusOptions, stepFullScreen, renderedFrom }) => {

  const toastConfig = useContext(CustomToastContext);

  const [allFields, setAllFields] = useState([]);
  const [rowsData, setRowsData] = useState(null);
  const [columns, setColumns] = useState(null);

  useEffect(() => {
    if (statusOptions.findIndex((d) => d.optionLabel === 'Ready to Invoice') > statusOptions.findIndex((d) => d.optionLabel === invoiceData?.status)) {
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
      const newColumns = generateCustomTableColumns(data, invoiceData?.currency, renderedFrom);
      let qtyIndex = newColumns.findIndex((d) => d.accessor === 'qty');
      if (qtyIndex > -1) {
        newColumns[qtyIndex].accessor = 'qtyDisplay';
      }
      let coloum: any = [
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
          Cell: ({ row }) => (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <p>{startCase(row.original?.type)}</p>
            </div>
          )
        },
        {
          accessor: 'detail',
          Header: 'Detail',
          minWidth: 300,
          width: 300,
          Cell: ({ row }) => 
          row?.original?.type ? (
            <div className="d-flex gap-2 align-items-center">
              <p className="text-truncate">{row.original.detail}</p>
              <IconButton
                size='small'
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
            </div>
          ) : (
            <NoDataCell />
          )
        }
      ];
      coloum = [...coloum, ...newColumns];
      setColumns(coloum);
      fetchData();
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchData = async () => {
    var data: any = [];
    const response = await axiosInstance().get(`${invoice.api}/material/${invoiceData._id}`);
    data = response?.data?.data;

    const rows = data.material.filter((e) => e.parentId === null);
    rows.forEach((parent, i) => {
      parent.index = i + 1;
      parent.detail =
        parent.type === 'product'
          ? parent.productDetail?.productName
          : parent.type === 'package'
            ? parent.packageDetail?.packageName
            : parent.type === 'serializedAsset'
              ? parent.serializedAssetDetail?.assetNumber
              : parent.serviceDetail?.serviceName;
      parent.description =
        parent.type === 'product'
          ? parent?.productDetail?.productDescription
          : parent.type === 'package'
            ? parent?.packageDetail?.packageDescription
            : parent.type === 'serializedAsset'
              ? parent?.description
              : parent?.serviceDetail?.serviceDescription;
      parent.qty = parent.qty;
      parent.qtyDisplay = parent.qty;
      parent.subRows = generateNestedData(data.material, parent);
    });
    if (rows.filter((_rows) => _rows.isValid === false).length > 0 || rows.length === 0) {
      setNextStep(true);
    } else {
      setNextStep(true);
    }
    setRowsData(rows);
  };

  const generateNestedData = (material, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, index) => {
      _subRow.index = parent.index + '.' + `${index + 1}`;
      _subRow.detail =
        _subRow.type === 'product'
          ? _subRow.productDetail?.productName
          : _subRow.type === 'package'
            ? _subRow.packageDetail?.packageName
            : _subRow.type === 'serializedAsset'
              ? _subRow.serializedAssetDetail.assetNumber
              : _subRow.serviceDetail?.serviceName;
      _subRow.description =
        _subRow.type === 'product'
          ? _subRow?.productDetail?.productDescription
          : _subRow.type === 'package'
            ? _subRow?.packageDetail?.packageDescription
            : _subRow.type === 'serializedAsset'
              ? parent.description
              : _subRow?.serviceDetail?.serviceDescription;
      _subRow.qty = _subRow.qty;
      _subRow.qtyDisplay = parent.qtyDisplay * _subRow.qty;
      _subRow.subRows = generateNestedData(material, _subRow);
    });
    return subRows;
  };

  return (
    <Fragment>
      <Box pb={2}>
        <PreviewDownload
          resource={sidebarResource.invoice}
          referenceId={invoiceData?._id}
          columns={columns}
          isSendEmail={true}
        />
      </Box>
      <Grid item xs={12} md={12} sm={12}>
        {columns && rowsData ? (
          <Box zIndex={5}>
            <CustomReactTable
              height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 395px)'}
              columns={columns}
              data={rowsData}
              setWholeRowsCellColor={(rowData) => (!rowData.isValid ? '' : '')}
              hideSelection={true}
              hideAction={true}
              onSelect={() => { }}
              childrenProperty="subRows"
              uniqueKey="_id"
              renderedFrom="invoice_product_package"
              isClientSideGrid={true}
            />
          </Box>
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Grid>
    </Fragment>
  );
};

export default Invoice;
