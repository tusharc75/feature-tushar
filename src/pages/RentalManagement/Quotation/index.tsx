import { useState, useEffect, useContext, Fragment } from 'react';
import {
  Box,
  Button,
  Typography,
  IconButton,
} from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import CustomReactTable from '../../../components/CustomReactTable/CustomReactTable';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import {
  QUOTATION_STATUS,
  pricingCondition,
} from '../../../constants/helpers';
import { isMobile } from 'react-device-detect';
import { FcCancel, FcClock, FcOk } from 'react-icons/fc';
import { useData } from 'src/StateProvider/Provider';
import { quotation } from '../../../constants/helpers';
import Versions from 'src/pages/Quotation/Versions';
import LeadTimeDialog from 'src/pages/Quotation/Productpackage/LeadTimeDialog';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import QuotationQtyDialog from 'src/pages/Quotation/Productpackage/QuotationQtyDialog';
import ManualReponseDialog from 'src/pages/Quotation/ManualRespondDialog';
import QuotationSummeryDialog from 'src/pages/Quotation/QuotationSummeryDialog';
import { camelCase, orderBy, startCase } from 'lodash';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { fetch_quotation_product_fields } from 'src/components/Quotation/helper';
import SendEmail from 'src/pages/Quotation/SendEmail';
import { generateCustomTableColumns } from 'src/constants/columns';

const Quotation = ({
  rentalManagementData,
  setNextStep,
  stepFullScreen,
  allowedToEdit,
  allowedToDelete,
  fetchQuotationData,
  quotationData,
  currentVersion,
  setCurrentVersion
}) => {

  const renderedFrom = `${camelCase(routes?.rentalManagement.title)}_quotation`;

  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();
  
  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState(null);
  const [customerAcceptable, setCustomerAcceptable] = useState(false);
  const [showQuotationSummaryDialog, setShowQuotationSummaryDialog] = useState(false);
  const [showAllVersionStatus, setShowAllVersionStatus] = useState(false);
  const [material, setMaterial] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);

  useEffect(() => {
    if (quotationData && quotationData?.versions[currentVersion]?._id) {
      fetchFields();
      fetchProductInventory();
    } else {
      fetchQuotationData(null, true);
    }
  }, []);

  useEffect(() => {
    if (quotationData && quotationData?.versions[currentVersion]?._id) {
      fetchFields();
      fetchProductInventory();
    }
    if (quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.buildingQuote
      || quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.waitingForSupplierPrice) {
      setNextStep(false);
    }
    if (quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.acceptByCustomer) {
      setNextStep(true);
    }
  }, [quotationData?.versions[currentVersion]?._id]);


  const fetchFields = async () => {
    var data = await fetch_quotation_product_fields(rentalManagementData?.currency);
    data?.forEach((e) => {
      e.isColumnEditable = false;
    });
    let newColumns = generateCustomTableColumns(data, rentalManagementData?.currency, renderedFrom);

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
        disableFilters: true,
        width: 200,
        Cell: ({ row }) =>
          row.original['type'] ? (
            <p>
              {`${startCase(row.original?.type)} `}
              {row.original['type'] === 'product'
                ? row.original?.productDetail?.serializedProduct
                  ? '(Serialized)'
                  : '(Non-Serialized)'
                : row.original?.type === 'package'
                  ? row.original?.packageDetail.packageType === 'Product'
                    ? '(Product)'
                    : '(Service)'
                  : row.original.type === 'service'
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
        width: 300,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <p title={row.original.detail}>{row.original.detail}</p>
            <Box ml={1} mr={1} className="d-flex align-items-center">
              <span title={`There are ${row.original?.subRows?.length} product(s) in this ${row.original?.type}`}>
                {row.original?.subRows?.length ? `(${row.original?.subRows?.length})` : null}
              </span>
            </Box>
            {['service', 'product', 'package', 'serializedAsset']?.includes(row.original.type) && (
              <IconButton
                size="small"
                onClick={() => {
                  if (row.original.type === 'service') {
                    window.open(`${routes.serviceMasterDetail.path}/${row.original.materialId}`);
                  } else if (row.original.type === 'product') {
                    window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                  } else if (row.original.type === 'serializedAsset') {
                    window.open(`${routes.serializedAssetDetail.path}/${row.original.inventory}`);
                  } else if (row.original.type === 'package') {
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

    coloum = [...coloum, ...newColumns];
    setColumns(coloum);
  };

  const generateNestedData = (material, inventory, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, j) => {
      _subRow.index = parent.index + '.' + (j + 1);
      _subRow.detail = `${_subRow.type === 'serializedAsset'
        ? _subRow?.serializedAssetDetail?.assetNumber
        : _subRow.type === 'product'
          ? _subRow?.productDetail?.productName
          : _subRow.type === 'service'
            ? _subRow?.serviceDetail?.serviceName
            : _subRow?.packageDetail?.packageName
        }`;
      _subRow.description =
        _subRow.type === 'service'
          ? _subRow?.serviceDetail?.serviceDescription || ''
          : _subRow.type === 'product'
            ? _subRow?.productDetail?.productDescription || ''
            : _subRow.type === 'package'
              ? _subRow?.packageDetail?.packageDescription || ''
              : '';
      _subRow.serializedProduct = _subRow?.productDetail?.serializedProduct;
      _subRow.qtyDisplay = parent?.qty * _subRow.qty;
      _subRow.isValid = _subRow['finalPrice_' + quotationData?.currency?.toLowerCase()] ? true : false;
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
    // setNextStep(true)
    return orderBy(subRows, ['order'], ['asc']);
  };

  const fetchProductInventory = async () => {
    setNextStep(false);
    var data: any = [];
    var inventory: any = [];
    const response = await axiosInstance().get(
      `${quotation.api}/productpackage/${quotationData._id}/${quotationData?.versions[currentVersion]?._id}`
    );
    const additionalCost = await axiosInstance().get(
      `${quotation.api}/additionalcost/${quotationData._id}/${quotationData?.versions[currentVersion]?._id}`
    );
    const additionalCostData = additionalCost?.data?.data?.map((e) => {
      const detail = e?.description;
      return {
        ...e,
        type: e?.costType,
        detail: detail,
        parentId: null
      };
    });
    data = response?.data?.data;
    setMaterial(JSON.parse(JSON.stringify(data.material)));
    inventory = data?.inventory ? data?.inventory : [];
    const rowsMaterial = data.material.filter((e) => e.parentId === null);
    const rows = [...rowsMaterial, ...additionalCostData];
    rows.forEach((parent, i) => {
      parent.index = i + 1;
      parent.detail = `${parent.type === 'serializedAsset'
        ? parent.serializedAssetDetail?.assetNumber
        : parent.type === 'product'
          ? parent.productDetail?.productName
          : parent.type === 'service'
            ? parent.serviceDetail?.serviceName
            : parent.type === 'package'
              ? parent.packageDetail?.packageName
              : parent.detail
        }`;
      parent.description =
        parent.type === 'service'
          ? parent?.serviceDetail?.serviceDescription || ''
          : parent.type === 'product'
            ? parent?.productDetail?.productDescription || ''
            : parent.type === 'package'
              ? parent?.packageDetail?.packageDescription || ''
              : parent?.description;
      parent.serializedProduct = parent.type === 'product' ? parent.productDetail?.serializedProduct : false;
      parent.qtyDisplay = parent.qty;
      parent.isValid = parent['finalPrice_' + quotationData?.currency?.toLowerCase()] ? true : false;
      parent.hideSelection = inventory.filter((e) => e._id === parent._id).length ? true : false;
      parent.assetQty = inventory.filter((e) => e._id === parent._id).length;
      parent.subRows = generateNestedData(data.material, inventory, parent);
    });
    setRowsData(rows);
    setSelectedProducts([]);
  };

  const cloneVersion = () => {
    const versionId = quotationData?.versions[currentVersion]?._id;
    axiosInstance()
      .post(`/quotation/clone-version/${quotationData._id}/${versionId}`)
      .then(() => {
        fetchQuotationData();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleChangeVersion = (versionNumber) => {
    setCurrentVersion(versionNumber);
    setShowAllVersionStatus(false);
  };

  const handleSendToCustomer = () => {
    axiosInstance()
      .put(`${quotation.api}/${quotationData?._id}/send-to-customer/${quotationData?.versions[currentVersion]?._id}`)
      .then(({ data }) => {
        fetchQuotationData(currentVersion);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: 'Processed Quote Successfully'
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Fragment>
      <Box
        display="flex"
        mx={1}
        my={1}
        // mb={2}
        sx={{ flexWrap: isMobile ? 'wrap' : 'no-wrap', justifyContent: isMobile ? 'center' : 'space-between' }}
        style={{ gap: '8px' }}
      >
        <Box display="flex">
          <SendEmail
            quotationData={quotationData}
            versionId={quotationData?.versions[currentVersion]?._id}
            currentVersion={currentVersion}
            columns={columns}
            setShowAllVersionStatus={setShowAllVersionStatus}
            setShowQuotationSummaryDialog={setShowQuotationSummaryDialog}
          />
        </Box>
        {isMobile ? (
          <>
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
                      color="primary"
                    >
                      Accept / Reject
                    </Button>
                  ) : quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.rejectByCustomer ? (
                    <Button
                      onClick={() => {
                        cloneVersion();
                      }}
                      variant="contained"
                      size="small"
                      color="primary"
                    >
                      {`Clone Version-${currentVersion}`}
                    </Button>
                  ) : null}
                </div>
              )}
            </Box>
            <Box display="flex" sx={{ flexBasis: isMobile ? '100%' : '', justifyContent: isMobile ? 'center' : '' }}>
              {quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.sentToCustomer ? (
                <div className="d-flex align-items-center justify-content-center flex-column m-1 text-center">
                  <FcClock size={25} />
                  <Typography style={{ color: '#00acc1', fontWeight: 'bold', fontSize: isMobile ? '.89rem' : '1rem' }}>
                    Quote has been sent to customer
                  </Typography>
                </div>
              ) : quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.acceptByCustomer ? (
                <div className="d-flex align-items-center justify-content-center flex-column m-1 text-center">
                  <FcOk size={25} />
                  <Typography style={{ color: '#28a745', fontWeight: 'bold', fontSize: isMobile ? '.89rem' : '1rem' }}>
                    Quote has been accepted by customer
                  </Typography>
                </div>
              ) : quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.rejectByCustomer ? (
                <div className="d-flex align-items-center justify-content-center flex-column m-1 text-center">
                  <FcCancel size={25} />
                  <Typography style={{ color: '#dc3545', fontWeight: 'bold', fontSize: isMobile ? '.89rem' : '1rem' }}>
                    Quote has been rejected by customer
                  </Typography>
                </div>
              ) : null}
            </Box>
          </>
        ) : (
          <>
            <Box display="flex" sx={{ flexBasis: isMobile ? '100%' : '', justifyContent: isMobile ? 'center' : '' }}>
              {quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.sentToCustomer ? (
                <div className="d-flex align-items-center justify-content-center flex-column m-1 text-center">
                  <FcClock size={25} />
                  <Typography style={{ color: '#00acc1', fontWeight: 'bold', fontSize: isMobile ? '.89rem' : '1rem' }}>
                    Quote has been sent to customer
                  </Typography>
                </div>
              ) : quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.acceptByCustomer ? (
                <div className="d-flex align-items-center justify-content-center flex-column m-1 text-center">
                  <FcOk size={25} />
                  <Typography style={{ color: '#28a745', fontWeight: 'bold', fontSize: isMobile ? '.89rem' : '1rem' }}>
                    Quote has been accepted by customer
                  </Typography>
                </div>
              ) : quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.rejectByCustomer ? (
                <div className="d-flex align-items-center justify-content-center flex-column m-1 text-center">
                  <FcCancel size={25} />
                  <Typography style={{ color: '#dc3545', fontWeight: 'bold', fontSize: isMobile ? '.89rem' : '1rem' }}>
                    Quote has been rejected by customer
                  </Typography>
                </div>
              ) : null}
            </Box>
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
                      color="primary"
                    >
                      Accept / Reject
                    </Button>
                  ) : quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.rejectByCustomer ? (
                    <Button
                      onClick={() => {
                        cloneVersion();
                      }}
                      variant="contained"
                      size="small"
                      color="primary"
                    >
                      {`Clone Version-${currentVersion}`}
                    </Button>
                  ) : null}
                </div>
              )}
            </Box>
          </>
        )}
      </Box>
      {columns && rowsData ? (
        <Box zIndex={5} width={'100%'} height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}>
          <CustomReactTable
            height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}
            columns={columns}
            data={rowsData}
            setWholeRowsCellColor={(rowData) => (!rowData.isValid ? '' : '')}
            onSelect={setSelectedProducts}
            childrenProperty="subRows"
            uniqueKey="_id"
            hideSelection={true}
            hideAction={true}
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
          />
        </Box>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {quotationData && showAllVersionStatus && (
        <Versions
          onClose={() => setShowAllVersionStatus(false)}
          quotationId={quotationData?._id}
          handleChangeVersion={handleChangeVersion}
          referenceType="rentalJob"
        />
      )}
      {customerAcceptable && (
        <ManualReponseDialog
          versionId={quotationData?.versions[currentVersion]?._id}
          quotationId={quotationData?._id}
          setCurrentStep={() => {
            fetchQuotationData(currentVersion);
          }}
          setNextStep={(type: string) => {
            if (type && type.includes('Rejected')) {
              setNextStep(false);
            } else {
              setNextStep(true);
            }
          }}
          updateStatus={() => {
            fetchQuotationData(currentVersion);
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
    </Fragment>
  );
};

export default Quotation;
