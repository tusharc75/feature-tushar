import { Box, Button, IconButton, Typography, useMediaQuery } from '@material-ui/core';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { camelCase, orderBy, startCase } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import { FcCancel, FcClock, FcOk } from 'react-icons/fc';
import { useData } from 'src/StateProvider/Provider';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import ManualReponseDialog from 'src/pages/Quotation/ManualRespondDialog';
import QuotationSummeryDialog from 'src/pages/Quotation/QuotationSummeryDialog';
import Versions from 'src/pages/Quotation/Versions';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../../axios/axiosInstance';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import routes from '../../../components/Helpers/Routes';
import { CHILD_RESOURCE, MATERIAL_TYPE, QUOTATION_STATUS, quotation, sidebarResource } from '../../../constants/helpers';
import { GiReceiveMoney } from 'react-icons/gi';
import { VscVersions } from 'react-icons/vsc';
import PreviewDownload from 'src/components/PreviewDownload';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';

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
  const isMobile = useMediaQuery('(max-width:600px)');
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();

  const [columns, setColumns] = useState(null);
  const [customerAcceptable, setCustomerAcceptable] = useState(false);
  const [showQuotationSummaryDialog, setShowQuotationSummaryDialog] = useState(false);
  const [showAllVersionStatus, setShowAllVersionStatus] = useState(false);
  const [material, setMaterial] = useState([]);

  const { state, dispatch } = useTableReducer();
  const { generateColumns } = useColumns();

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
    if (
      quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.buildingQuote ||
      quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.waitingForSupplierPrice
    ) {
      setNextStep(false);
    }
    if (quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.acceptByCustomer) {
      setNextStep(true);
    }
  }, [quotationData?.versions[currentVersion]?._id]);

  const fetchFields = async () => {
    var data = await await fetch_child_resource_fields(CHILD_RESOURCE.quotationProduct, quotationData?.currency, false);
    let newColumns = generateColumns(renderedFrom, data, null, false, rentalManagementData?.currency);

    let coloum: any = [
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
        disableFilters: true,
        disabled: true,
        sticky: isMobile ? 'none' : 'left',
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
        disabled: true,
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
    dispatch({ type: 'loading', loading: true });

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
      return {
        ...e,
        type: MATERIAL_TYPE.manualEntry,
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

    dispatch({ type: 'initialize', data: rows, count: rows?.length });
    dispatch({ type: 'loading', loading: false });
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
          message: 'Processed Successfully'
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const rightSideContents = () => {
    return (
      <>
        {allowedToEdit && (
          <>
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
                Process Quotation
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
            <Button
              onClick={() => {
                setShowQuotationSummaryDialog(true);
              }}
              variant="outlined"
              size="small"
              startIcon={<GiReceiveMoney />}
              color="primary"
            >
              Summary
            </Button>
            <Button
              variant={isMobile ? 'text' : 'outlined'}
              color="primary"
              size="small"
              className={'btn-outline-v1'}
              onClick={() => {
                setShowAllVersionStatus(true);
              }}
              style={isMobile ? { color: '#43aeaa' } : {}}
              startIcon={isMobile ? null : <VscVersions />}
            >
              {isMobile ? <VscVersions size={20} /> : `Version : ${currentVersion}`}
            </Button>
          </>
        )}
      </>
    );
  };

  const previewDownloadProps = {
    fileName: `${routes.quotation.title}-${quotationData?.quotationNumber}`,
    resource: sidebarResource.quotation,
    referenceId: quotationData?._id,
    columns: columns,
    isSendEmail: true,
    isExcelDownload: true,
    subject: `${user?.user?.brandName} Offer - ${quotationData?.quotationNumber}`,
    extraQueryParams: { uniqueId: quotationData?.versions[currentVersion]?._id },
    defaultColumns: [
      'index',
      'type',
      'detail',
      'description',
      'qty',
      `price_${quotationData?.currency?.toLowerCase()}`,
      `totalPrice_${quotationData?.currency?.toLowerCase()}`,
      `tax_${quotationData?.currency?.toLowerCase()}`,
      `finalPrice_${quotationData?.currency?.toLowerCase()}`
    ]
  };

  return (
    <Fragment>
      <RenderQuotationMessage {...{ quotationData, currentVersion, isMobile }} />
      <DetailsPageHeader
        isAddButtonVisible={false}
        isActionButtonVisible={false}
        previewDownloadProps={previewDownloadProps}
        rightSideContents={rightSideContents()}
        hasXpadding
      />
      {columns ? (
        <Box zIndex={5}>
          <CustomReactTable
            height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            refreshGrid={fetchProductInventory}
            hideSelection={true}
            hideAction={true}
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
            expander={true}
            hideExportTable={true}
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

const RenderQuotationMessage = ({ quotationData, currentVersion, isMobile }) => {
  return (
    <>
      <Box display="flex" sx={{ flexBasis: isMobile ? '100%' : '', justifyContent: 'center' }}>
        {quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.sentToCustomer ? (
          <div className="d-flex align-items-center justify-content-center m-1 text-center">
            <FcClock size={25} className="text-[var(--primary)]" />
            <Typography style={{ color: '#00acc1', fontWeight: 'bold', fontSize: isMobile ? '.89rem' : '1rem' }}>
              Quotation has been sent to customer
            </Typography>
          </div>
        ) : quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.acceptByCustomer ? (
          <div className="d-flex align-items-center justify-content-center m-1 text-center">
            <FcOk size={25} className="text-[var(--primary)]" />
            <Typography style={{ color: '#28a745', fontWeight: 'bold', fontSize: isMobile ? '.89rem' : '1rem' }}>
              Quotation has been accepted by customer
            </Typography>
          </div>
        ) : quotationData?.versions[currentVersion]?.status === QUOTATION_STATUS.rejectByCustomer ? (
          <div className="d-flex align-items-center justify-content-center m-1 text-center">
            <FcCancel size={25} className="text-[var(--primary)]" />
            <Typography style={{ color: '#dc3545', fontWeight: 'bold', fontSize: isMobile ? '.89rem' : '1rem' }}>
              Quotation has been rejected by customer
            </Typography>
          </div>
        ) : null}
      </Box>
    </>
  );
};
