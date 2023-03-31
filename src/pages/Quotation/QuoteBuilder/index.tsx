import { useState, useEffect, useContext, Fragment } from 'react';
import { Box, Button, IconButton } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import { useData } from '../../../StateProvider/Provider';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import { isMobile } from 'react-device-detect';
import { fetch_quotation_product_fields } from 'src/components/Quotation/helper';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { prepareDataForGrid, quotation } from 'src/constants/helpers';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import SendEmail from '../SendEmail';
import { startCase } from 'lodash';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { genrateCustomTableColumns } from 'src/constants/columns';

const QuoteBuilder = ({ quotationData, setNextStep, sentToCustomer = false, stepFullScreen, fetchQuotationData, version, currentStep, versionData, allowedToEdit, renderedFrom }) => {

  const toastConfig = useContext(CustomToastContext);
  const { state: { user, permissions } }: any = useData();

  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState(null);
  const [allColumn, setAllColumn] = useState([]);

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
    data?.forEach((e) => {
      e.isColumnEditable = false;
    });
    const newColumns = genrateCustomTableColumns(data, quotationData?.currency, renderedFrom);
    let qtyIndex = newColumns.findIndex((d) => d.accessor === 'qty');
    if (qtyIndex > -1) {
      newColumns[qtyIndex].accessor = 'qtyDisplay';
    }
    let column: any = [
      {
        accessor: 'srno',
        Header: 'Index',
        width: 70,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => (<p className="text-truncate">{row.original.srno}</p>),
        Footer: () => {
          return <>Total</>;
        }
      },
      {
        accessor: 'type',
        Header: 'Type',
        sticky: isMobile ? 'none' : 'left',
        width: 100,
        Cell: ({ row }) =>
          row.original['type'] ? (
            <p>
              {`${startCase(row.original?.type)} `}
            </p>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'detail',
        Header: 'Details',
        minWidth: 300,
        width: 300,
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <p className="text-truncate" title={row.original?.detail}>
              {row.original?.detail}
            </p>
            {row.original?.subRows?.length ? (
              <Box ml={1} >
                <span>({row.original?.subRows?.length})</span>
              </Box>
            ) : null}
            <Box ml={1} >
              <IconButton
                size="small"
                onClick={() => {
                  window.open(
                    `${row.original.type === 'serializedAsset'
                      ? routes.serializedAssetDetail.path
                      : row.original.type === 'product'
                        ? routes.productDetail.path
                        : row.original.type === 'package'
                          ? routes.packagesDetail.path
                          : routes.serviceMasterDetail.path
                    }/${row.original.materialId}`
                  );
                }}
              >
                <OpenInNewIcon fontSize="small" color="primary" />
              </IconButton>
            </Box>
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
    column = [...column, ...newColumns];
    setColumns(column);
    setAllColumn(column.map((d) => d.Header));
  };

  const fetchProductInventory = async () => {
    setNextStep(false);
    var data: any = [];
    const response = await axiosInstance().get(`${quotation.api}/productpackage/${quotationData._id}/${versionData._id}`);
    const serviceResponse = await axiosInstance().get(`${quotation.api}/service/${quotationData._id}/${versionData._id}`);

    data = response?.data?.data;
    const rows = data.material.filter((e) => e.parentId === null);
    rows.forEach((parent, i) => {
      parent.srno = i + 1;
      parent.detail = `${parent.type === 'serializedAsset'
        ? parent.serializedAssetDetail?.assetNumber
        : parent.type === 'product'
          ? parent.productDetail?.productName
          : parent.type === 'service'
            ? parent.serviceDetail?.serviceName
            : parent.packageDetail?.packageName
        }`;
      parent.leadTime = Array.isArray(parent?.leadTime) ? `${parent?.leadTime?.reduce((acc, e) => acc + parseInt(e?.days || 0), 0) || 0}` : 0;
      parent.qtyDisplay = parent.qty;
      parent.isValid = true;
      parent.subRows = generateNestedData(data.material, parent);
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
        finalObject['leadTime'] = Array.isArray(item?.leadTime) && item?.leadTime?.length ? `${item?.leadTime?.reduce((acc, e) => acc + parseInt(e.days), 0) || 0}` : 0;
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
  };

  const generateNestedData = (material, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, index) => {
      _subRow.srno = parent.srno + '.' + `${index + 1}`;
      _subRow.detail = `${_subRow.type === 'serializedAsset'
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
      _subRow.isValid = true;
      _subRow.subRows = generateNestedData(material, _subRow);
    });
    return subRows;
  };

  const handleSendToCustomer = (sendMail) => {
    var api = `${quotation.api}/${quotationData?._id}/send-to-customer/${versionData._id}`;
    if (sendMail) {
      api = api + `?sendMail=true`
    }
    axiosInstance().put(api)
      .then(() => {
        fetchQuotationData(version, false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: sendMail ? 'Sent to Customer Sucessfully' : 'Processed Quote Successfully'
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }

  return (
    <Fragment>
      <Box pb={2} display="flex" justifyContent="space-between">
        <Box display="flex">
          <SendEmail
            versionData={versionData}
            quotationData={quotationData}
            columns={columns}
            versionId={versionData._id}
            allColumn={allColumn}
            isSendEmail={true}
            allowedToEdit={allowedToEdit}
            currentVersion={version}
            hideSummary={true}
            hideVersions={true}
          />
        </Box>
        {versionData?.processStatus === 'Quote Approval' &&
          <Box display="flex">
            <Button
              variant="contained"
              size="small"
              color="primary"
              disabled={sentToCustomer}
              onClick={() => {
                handleSendToCustomer(false)
              }}
            >
              Process Quote
            </Button>
            <Box p={1} />
            <Button
              variant="contained"
              size="small"
              color="primary"
              disabled={sentToCustomer}
              onClick={() => {
                handleSendToCustomer(true)
              }}
            >
              Send to Customer
            </Button>
          </Box>
        }
      </Box>
      {columns && rowsData ? (
        <Box p="6px" zIndex={5} width={'100%'}>
          <CustomReactTable
            height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 395px)'}
            columns={columns}
            data={rowsData}
            setWholeRowsCellColor={(rowData) => (!rowData.isValid ? 'error' : '')}
            onSelect={() => { }}
            hideSelection={true}
            hideAction={true}
            childrenProperty="subRows"
            uniqueKey="_id"
            renderedFrom="quotation_product_package"
            isClientSideGrid={true}
          />
        </Box>
      ) : (
        <Box p={2} height={500} bgcolor="white">
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </Fragment>
  );
};

export default QuoteBuilder;
