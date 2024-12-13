import { Box, Button, IconButton, MenuItem, useMediaQuery } from '@material-ui/core';
import { startCase } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import { AiFillEdit } from 'react-icons/ai';
import { useHistory } from 'react-router-dom';
import { useData } from 'src/StateProvider/Provider';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import {
  ASSET_STATUS,
  CHILD_RESOURCE,
  MATERIAL_TYPE,
  QUOTATION_STATUS,
  QUOTATION_TYPE,
  fieldServiceOrder,
  fieldTicket,
  prepareDataForGrid,
  quotation,
  sidebarResource
} from 'src/constants/helpers';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import ManageFieldTicket from 'src/pages/FieldTicket/ManageFieldTicket';
import { getObjKeysWithValues } from '../../../constants/helpers';
import { fetch_child_resource_fields, fetch_child_resource_fields_perm } from 'src/components/ChildResourceField';
import { FiExternalLink } from 'react-icons/fi';

const QuoteBuilder = ({
  quotationData,
  setNextStep,
  setPrevStep,
  sentToCustomer = false,
  stepFullScreen,
  fetchQuotationData,
  version,
  currentStep,
  versionData,
  allowedToEdit,
  renderedFrom,
  DOAData = [],
  setReserveAssetWarning
}) => {
  const isMobile = useMediaQuery('(max-width:600px)');
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();

  const {
    state: { user, permissions, resources }
  }: any = useData();

  const { generateColumns } = useColumns();
  const { state, dispatch } = useTableReducer({ renderedFrom });

  const [columns, setColumns] = useState(null);
  const { selectedRecords } = state;
  const [fieldTicketDialog, setFieldTicketDialog] = useState({ open: false, data: null });

  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    if (versionData) {
      fetchData();
    }
  }, [versionData]);

  useEffect(() => {
    handleCheckNextPrev();
  }, [sentToCustomer, DOAData]);

  const fetchFields = async () => {
    var data = await fetch_child_resource_fields_perm(CHILD_RESOURCE.quotationProduct, quotationData?.currency, false);
    data = data?.filter((f) => f?.isRead);
    const newColumns = generateColumns(
      renderedFrom,
      data?.map((e) => {
        return { ...e, fieldName: e.fieldName === 'qty' ? 'qtyDisplay' : e.fieldName };
      }),
      null,
      false,
      quotationData?.currency
    );
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
        sticky: isMobile ? 'none' : 'left',
        width: 100,
        Cell: ({ row }) =>
          row.original['type'] ? (
            <div>
              <p className="text-truncate">
                {row.original.type === 'serializedAsset' ? 'Asset' : `${startCase(row.original.type)} `}
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
            </div>
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
        Cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <p className="text-truncate" title={row.original?.detail}>
              {row.original?.detail}
            </p>
            {row.original?.subRows?.length ? (
              <>
                <span>({row.original?.subRows?.length})</span>
              </>
            ) : null}
            {['product', 'service', 'package', 'serializedAsset']?.includes(row.original.type) && (
              <IconButton
                size="small"
                onClick={() => {
                  window.open(
                    `${
                      row.original.type === MATERIAL_TYPE.serializedAsset
                        ? routes.serializedAssetDetail.path
                        : row.original.type === MATERIAL_TYPE.product
                          ? routes.productDetail.path
                          : row.original.type === MATERIAL_TYPE.package
                            ? routes.packagesDetail.path
                            : routes.serviceMasterDetail.path
                    }/${row.original.materialId}`
                  );
                }}
              >
                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
              </IconButton>
            )}
          </div>
        )
      },
      {
        accessor: 'leadTime',
        Header: 'Lead Time (Days)',
        Cell: ({ row }) => (row.original?.leadTime && row.original?.leadTime?.length ? <p>{row.original['leadTime']}</p> : <p>0</p>),
        Footer: (info) => {
          let rows = info.table.getExpandedRowModel().rows;
          const total = rows
            ?.filter((f) => f.original.hasOwnProperty('leadTime') && !isNaN(f.original['leadTime']))
            .reduce((sum, row) => parseInt(row.original['leadTime']) + sum, 0);
          return <>{total}</>;
        }
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

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    setNextStep(false);
    setPrevStep(false);

    var data: any = [];
    const response = await axiosInstance().get(`${quotation.api}/productpackage/${quotationData._id}/${versionData._id}`);
    const additionalCostResponce = await axiosInstance().get(`${quotation.api}/additionalcost/${quotationData._id}/${versionData._id}`);

    data = response?.data?.data;
    const rows = data.material.filter((e) => e.parentId === null);
    rows.forEach((parent, i) => {
      parent.index = i + 1;
      parent.detail = `${
        parent.type === 'serializedAsset'
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
      parent.leadTime = Array.isArray(parent?.leadTime) ? `${parent?.leadTime?.reduce((acc, e) => acc + parseInt(e?.days || 0), 0) || 0}` : 0;
      parent.qtyDisplay = parent.qty;
      parent.isValid = true;
      parent.hideSelection = parent?.fieldTicketCreated ? true : false;
      parent.subRows = generateNestedData(data.material, parent);
    });

    let cost = [];
    if (additionalCostResponce?.data?.data?.length) {
      cost = additionalCostResponce?.data?.data?.map((item, index) => {
        let finalObject = prepareDataForGrid(item);
        finalObject['index'] = rows?.length + (index + 1);
        finalObject['detail'] = item?.detail;
        finalObject['description'] = item?.description;
        finalObject['qtyDisplay'] = item?.qty;
        finalObject['leadTime'] =
          Array.isArray(item?.leadTime) && item?.leadTime?.length ? `${item?.leadTime?.reduce((acc, e) => acc + parseInt(e.days), 0) || 0}` : 0;
        finalObject['parentId'] = null;
        finalObject['isValid'] = true;
        finalObject['hideSelection'] = item?.fieldTicketCreated ? true : false;
        finalObject['type'] = MATERIAL_TYPE.manualEntry;
        let res: any = {
          ...finalObject
        };
        return res;
      });
    }
    dispatch({ type: 'initialize', data: [...rows, ...cost], count: [...rows, ...cost]?.length });
    dispatch({ type: 'loading', loading: false });
    handleCheckNextPrev();
  };

  const handleCheckNextPrev = () => {
    if (currentStep === 'Quote Builder') {
      setNextStep(true);
      setPrevStep(true);
    } else if (currentStep === 'DOA') {
      if (DOAData?.length === 0) {
        setNextStep(false);
        setPrevStep(true);
      } else if (DOAData?.filter((e) => e.status === 'approve')?.length === DOAData?.length) {
        setPrevStep(false);
        setNextStep(true);
      } else {
        setPrevStep(false);
        setNextStep(false);
      }
    } else if (currentStep === 'Quote Approval') {
      if (sentToCustomer) {
        setNextStep(true);
        setPrevStep(false);
      } else {
        setNextStep(false);
        setPrevStep(true);
      }
    }
  };

  const generateNestedData = (material, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, index) => {
      _subRow.index = parent.index + '.' + `${index + 1}`;
      _subRow.detail = `${
        _subRow.type === 'serializedAsset'
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
      _subRow.leadTimeData = Array.isArray(_subRow.leadTime) ? _subRow.leadTime : [];
      _subRow.leadTime = Array.isArray(_subRow.leadTime) ? `${_subRow?.leadTime?.reduce((acc, e) => acc + parseInt(e?.days || 0), 0) || 0}` : 0;
      _subRow.qtyDisplay = _subRow.qty;
      _subRow.isValid = true;
      _subRow.hideSelection = _subRow?.fieldTicketCreated ? true : false;
      _subRow.subRows = generateNestedData(material, _subRow);
    });
    for (const _subRow of subRows) {
      let assetStatus = _subRow?.serializedAssetDetail?.status;
      if (
        quotationData?.type === QUOTATION_TYPE.rentalJob &&
        _subRow.type === MATERIAL_TYPE.serializedAsset &&
        assetStatus !== ASSET_STATUS.new &&
        assetStatus !== ASSET_STATUS.available &&
        assetStatus !== ASSET_STATUS.underReview
      ) {
        setReserveAssetWarning(true);
        break;
      }
    }
    return subRows;
  };

  const handleSendToCustomer = (sendMail) => {
    var api = `${quotation.api}/${quotationData?._id}/send-to-customer/${versionData._id}`;
    if (sendMail) {
      api = api + `?sendMail=true`;
    }
    axiosInstance()
      .put(api)
      .then(() => {
        fetchQuotationData(version, false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: sendMail ? 'Sent to Customer Successfully' : 'Processed Successfully'
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleSendForDOA = () => {
    axiosInstance()
      .post(`/doa-request/create/${quotationData._id}?version=${version}`)
      .then(({ data }) => {
        fetchQuotationData(version, false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: 'DOA Sended Successfully'
        });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const rightSideContents = () => {
    return (
      <>
        {allowedToEdit && (
          <ThemeButton
            onClick={() => {
              quotationData?.pdfTemplate?.optionValue &&
                history.push(
                  `/quote-pdf-template/detail/${quotationData?.pdfTemplate?.optionValue}?quotation=${quotationData?._id}&version=${versionData?.version}`,
                  '_blank'
                );
            }}
            hasMobileBorder
            iconForMobile={<AiFillEdit />}
            tooltip="Edit PDF Template"
          >
            <AiFillEdit size={20} className="mr-2" /> PDF Template
          </ThemeButton>
        )}
        {allowedToEdit && currentStep === 'Quote Approval' && (
          <>
            <ThemeButton
              iconForMobile={false}
              hasMobileBorder
              disabled={sentToCustomer}
              onClick={() => {
                handleSendToCustomer(false);
              }}
              tooltip={`Process ${routes.quotation.title}`}
            >
              {`Process ${routes.quotation.title}`}
            </ThemeButton>

            <ThemeButton
              iconForMobile={false}
              hasMobileBorder
              disabled={sentToCustomer}
              onClick={() => {
                handleSendToCustomer(true);
              }}
              tooltip="Send to Customer"
            >
              Send to Customer
            </ThemeButton>
          </>
        )}
        {allowedToEdit && currentStep === 'DOA' && DOAData?.length === 0 && (
          <Button variant="contained" size="small" color="primary" onClick={handleSendForDOA}>
            Send for DOA
          </Button>
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
    extraQueryParams: { uniqueId: versionData?._id },
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

  const fetchFieldServiceOrderData = () => {
    const fieldServiceOrderId = quotationData?.fieldJob?.optionValue || quotationData?.fieldJob;
    axiosInstance()
      .get(`${fieldServiceOrder.api}/${fieldServiceOrderId}`)
      .then(({ data: { data } }) => {
        setFieldTicketDialog({ open: true, data: data });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const addFieldTicketMaterial = async (data) => {
    try {
      let materialIds = [],
        costIds = [];
      if (selectedRecords?.filter((e) => [MATERIAL_TYPE.product, MATERIAL_TYPE.service])?.length) {
        var fieldTicketMaterialField = await fetch_child_resource_fields(CHILD_RESOURCE.fieldTicketMateial, data?.currency, true);
        const material = [];
        selectedRecords
          ?.filter((e) => [MATERIAL_TYPE.product, MATERIAL_TYPE.service].includes(e.type))
          ?.forEach((e: any) => {
            const extraData: any = {};
            if (MATERIAL_TYPE.product && e?.parentId) {
              if (selectedRecords?.find((ele) => ele._id === e?.parentId)?.type === MATERIAL_TYPE.service) {
                extraData.service = selectedRecords?.find((ele) => ele._id === e?.parentId)?.materialId;
              }
            }
            material.push({ materialId: e.materialId, type: e.type, ...getObjKeysWithValues(e, fieldTicketMaterialField), ...extraData });
            materialIds.push(e._id);
          });
        await axiosInstance().post(`${fieldTicket.api}/${data?._id}/material`, { material: material, notAddserviceProduct: true });
      }
      if (selectedRecords?.filter((e) => [MATERIAL_TYPE.manualEntry])?.length) {
        var fieldTicketCostField = await fetch_child_resource_fields(CHILD_RESOURCE.fieldTicketCost, data?.currency, true);
        const manualEntry = [];
        selectedRecords
          ?.filter((e) => [MATERIAL_TYPE.manualEntry].includes(e.type))
          ?.forEach((e: any) => {
            manualEntry.push({ ...getObjKeysWithValues(e, fieldTicketCostField) });
            costIds.push(e._id);
          });
        await axiosInstance().post(`${fieldTicket.api}/${data?._id}/cost`, manualEntry);
      }
      if (materialIds.length || costIds.length)
        await axiosInstance().post(`${quotation.api}/set-field-ticket-created/${versionData?._id}`, { material: materialIds, cost: costIds });
      setFieldTicketDialog({ open: false, data: null });
      fetchData();
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const actionButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          disabled={selectedRecords?.length ? false : true}
          onClick={() => {
            fetchFieldServiceOrderData();
          }}
        >
          {`Create ${resources?.fieldTicket?.titleSingular}`}
        </MenuItem>
      </>
    );
  };

  return (
    <Fragment>
      <DetailsPageHeader
        isAddButtonVisible={false}
        isActionButtonVisible={
          quotationData?.type === QUOTATION_TYPE.fieldJob && quotationData.status === QUOTATION_STATUS.converted && quotationData?.fieldJob
            ? true
            : false
        }
        previewDownloadProps={previewDownloadProps}
        rightSideContents={rightSideContents()}
        hasXpadding
        actionButtonMenuItems={actionButtonMenuItems()}
        actionButtonProps={{ disabled: selectedRecords?.length ? false : true }}
      />
      {columns ? (
        <Box zIndex={5}>
          <CustomReactTable
            height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 395px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            refreshGrid={fetchData}
            setWholeRowsCellColor={(rowData) => (!rowData.isValid ? 'error' : '')}
            renderedFrom={renderedFrom}
            hideSelection={
              quotationData?.type === QUOTATION_TYPE.fieldJob && quotationData.status === QUOTATION_STATUS.converted && quotationData?.fieldJob
                ? false
                : true
            }
            hideAction={true}
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
      {fieldTicketDialog.open && (
        <ManageFieldTicket
          onClose={() => setFieldTicketDialog({ open: false, data: null })}
          referenceData={{
            quotation: quotationData?._id,
            fieldServiceOrder: fieldTicketDialog?.data?._id,
            warehouse: fieldTicketDialog?.data?.warehouse?.optionValue || '',
            wellName: fieldTicketDialog?.data?.wellName?.optionValue || '',
            wellNumber: fieldTicketDialog?.data?.wellNumber?.map((m) => m.optionValue) || [],
            numberOfWells: fieldTicketDialog?.data?.numberOfWells,
            estimateStartDate: fieldTicketDialog?.data?.estimateStartDate || '',
            estimateEndDate: fieldTicketDialog?.data?.estimateEndDate || '',
            customerAccount: fieldTicketDialog?.data?.customerAccount?.optionValue || '',
            billingAddress: fieldTicketDialog?.data?.billingAddress?.optionValue || '',
            shippingAddress: fieldTicketDialog?.data?.shippingAddress?.optionValue || '',
            taxCode: fieldTicketDialog?.data?.taxCode?.optionValue || '',
            pricingCondition: fieldTicketDialog?.data?.pricingCondition?.optionValue || '',
            collaborator: fieldTicketDialog?.data?.collaborator?.map((m) => m.optionValue) || []
          }}
          onSuccess={(data) => {
            addFieldTicketMaterial(data);
          }}
        />
      )}
    </Fragment>
  );
};

export default QuoteBuilder;
