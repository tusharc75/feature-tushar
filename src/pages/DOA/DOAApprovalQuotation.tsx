import { useEffect, useState, useContext, useReducer, Fragment } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import ThumbUpIcon from '@material-ui/icons/ThumbUp';
import ThumbDownIcon from '@material-ui/icons/ThumbDown';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { Box, Button, Card, CardContent, Dialog, Grid, IconButton, Paper, Tooltip, Typography, useMediaQuery } from '@material-ui/core';
import { GiAbstract055, GiVintageRobot } from 'react-icons/gi';
import { AiOutlineEye } from 'react-icons/ai';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import Activity from '../../components/Activity';
import PerformanceTuningImg from '../../assets/PerformanceTuning.png';
import {
  CustomDialogTransition,
  formatAmountWithCurrency,
  gridLoadingTimeout,
  gridPageSizes,
  defaultActivityShow,
  quoteBuilder,
  ACTIVITY_RESOURCE,
  sidebarResource,
  quotation
} from '../../constants/helpers';
import { startCase } from 'lodash';
import { useData } from '../../StateProvider/Provider';
import { isMobile, isTablet } from 'react-device-detect';
import DOAReasonDialog from './DOAReasonDialog';
import Loader from '../../components/Loader';
import ActivityButton from 'src/components/Activity/ActivityButton';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { generateCustomTableColumns } from 'src/constants/columns';
import { fetch_quotation_product_fields } from 'src/components/Quotation/helper';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

const DoaQuotationApproval = () => {
  const {
    state: {
      user: { user: currentUser }
    }
  } = useData();
  const { setToastConfig } = useContext(CustomToastContext);

  const history = useHistory();
  const { id } = useParams();
  const [DOAData, setDOAData] = useState(null);
  const [PDFName, setPDFName] = useState('');
  const [QStatus, setQStatus] = useState(true);
  const [showQuoteStatusChangeDialog, setShowQuoteStatusChangeDialog] = useState(false);
  const [quoteStatusChangeData, setQuoteStatusChangeData] = useState('');
  const [quoteData, setQuoteData] = useState(null);
  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState(null);

  const [quotationSummary, setQuotationSummary] = useState({
    totalProfit: null,
    totalcost: null,
    totalsale: null
  });

  useEffect(() => {
    if (id) {
      fetchQuote();
    }
  }, [id]);

  const fetchQuote = async () => {
    const responseDoaRequest = await axiosInstance().get('/doa-request/get-detail/' + id);
    const doaRequest = responseDoaRequest?.data?.data;

    const response = await axiosInstance().get(`${quotation.api}/productpackage/${doaRequest.quotation}/${doaRequest.versionId}`);
    const material = response?.data?.data?.material;

    setDOAData(doaRequest);
    setQuoteData(doaRequest.quotationDetail);
    fetchFields(doaRequest.quotationDetail);
    fetchRows(material, doaRequest.quotationDetail);
    if (doaRequest?.versionDetail?.status !== 'Sent for DOA') {
      setQStatus(false);
    }
  };

  const fetchRows = async (material, quotationData) => {
    const rows = material.filter((e) => e.parentId === null);

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

    rows.forEach((parent, i) => {
      parent.srno = i + 1;
      parent.detail = `${
        parent.type === 'serializedAsset'
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
      parent.isValid = true;
      parent.subRows = generateNestedData(material, parent);
    });
    setRowsData(rows);
  };

  const generateNestedData = (material, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, index) => {
      _subRow.srno = parent.srno + '.' + `${index + 1}`;
      _subRow.detail = `${
        _subRow.type === 'serializedAsset'
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

  const fetchFields = async (quotationData) => {
    var data = await fetch_quotation_product_fields(quotationData?.currency);
    data?.forEach((e) => {
      e.isColumnEditable = false;
    });
    const newColumns = generateCustomTableColumns(data, quotationData?.currency, 'quotation_product_package');
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
        Cell: ({ row }) => <p className="text-truncate">{row.original.srno}</p>,
        Footer: () => {
          return <>Total</>;
        }
      },
      {
        accessor: 'type',
        Header: 'Type',
        sticky: isMobile ? 'none' : 'left',
        width: 100,
        Cell: ({ row }) => (row.original['type'] ? <p>{`${startCase(row.original?.type)} `}</p> : <NoDataCell />)
      },
      {
        accessor: 'detail',
        Header: 'Details',
        minWidth: 300,
        width: 300,
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <p>{row.original?.detail}</p>
            {row.original?.subRows?.length ? (
              <Box ml={1}>
                <span>({row.original?.subRows?.length})</span>
              </Box>
            ) : null}
          </div>
        )
      },
      {
        accessor: 'leadTime',
        Header: 'Lead Time (Days)',
        Cell: ({ row }) => (row.original['leadTime'] ? <p>{row.original['leadTime']}</p> : 0),
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
  };

  const ViewQuote = () => {
    axiosInstance()
      .get('/user/download?fileName=' + PDFName, {
        responseType: 'blob'
      })
      .then(({ data }) => {
        const file = new Blob([data], { type: 'application/pdf' });
        const fileURL = URL.createObjectURL(file);
        const pdfWindow = window.open();
        pdfWindow.location.href = fileURL;
      })
      .catch((err) => {
        setToastConfig(err);
      });
  };

  const QuoteStatusChange = (accepted, signature, comment) => {
    if (accepted !== 'Rejected') {
      axiosInstance()
        .post('/doa-request/doaResponse/' + id, { response: 'Accepted' })
        .then(({ data }) => {
          history.push('/doa-request');
        })
        .catch((err) => {
          setToastConfig(err);
          setShowQuoteStatusChangeDialog(false);
        });
    } else {
      axiosInstance()
        .post('/doa-request/doaResponse/' + id, { response: 'Rejected', comment: comment })
        .then(({ data }) => {
          history.push('/doa-request');
        })
        .catch((err) => {
          setToastConfig(err);
          setShowQuoteStatusChangeDialog(false);
        });
    }
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[{ title: 'DOA Requests', path: '/doa-request' }, { title: DOAData?.DOAName || id }]} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            <Button onClick={() => ViewQuote()} variant="outlined" size="small" startIcon={<AiOutlineEye />} color="primary">
              View
            </Button>
            {DOAData?.DOARequestThrough?.some((u) => u.user.includes(currentUser._id)) &&
            DOAData?.status !== 'Accepted' &&
            DOAData?.status !== 'Rejected' ? (
              <>
                <Button
                  onClick={() => {
                    QuoteStatusChange('Accepted', '', '');
                  }}
                  variant="outlined"
                  size="small"
                  startIcon={<ThumbUpIcon />}
                  color="primary"
                >
                  Accept
                </Button>
                <Button
                  onClick={() => {
                    setQuoteStatusChangeData('Rejected');
                    setShowQuoteStatusChangeDialog(true);
                  }}
                  startIcon={<ThumbDownIcon />}
                  variant="outlined"
                  size="small"
                  color="primary"
                >
                  Reject
                </Button>
              </>
            ) : null}
            <ActivityButton referenceId={quoteData?.quotation} resource={sidebarResource.quotation} />
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        {quoteData && (
          <Box mb={3}>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Card>
                  <CardContent>
                    <Typography>Total Profit</Typography>
                    <Typography>{quotationSummary.totalProfit?.fullFormatAmount || 0}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={4}>
                <Card>
                  <CardContent>
                    <Typography>Total Cost Price</Typography>
                    <Typography>{quotationSummary.totalcost?.fullFormatAmount || 0}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={4}>
                <Card>
                  <CardContent>
                    <Typography>Total Selling Price</Typography>
                    <Typography>{quotationSummary.totalsale?.fullFormatAmount || 0}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
        {columns && rowsData ? (
          <Box mt={3} zIndex={5} width={'100%'}>
            <CustomReactTable
              height={'calc(100vh - 395px)'}
              columns={columns}
              data={rowsData}
              onSelect={() => {}}
              childrenProperty="subRows"
              uniqueKey="_id"
              renderedFrom="quotation_product_package"
              isClientSideGrid={true}
              hideSelection={true}
            />
          </Box>
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Box>
      {showQuoteStatusChangeDialog && (
        <DOAReasonDialog
          reasonDialogOpen={showQuoteStatusChangeDialog}
          handleCloseDialog={() => setShowQuoteStatusChangeDialog(false)}
          QuoteStatusChange={QuoteStatusChange}
          accepted={quoteStatusChangeData}
        />
      )}
    </Box>
  );
};

export default DoaQuotationApproval;
