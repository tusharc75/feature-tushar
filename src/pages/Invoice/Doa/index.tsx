import { IconButton } from "@mui/material";
import { camelCase, startCase } from "lodash";
import { useContext, useEffect, useState } from "react";
import { isMobile, isTablet } from "react-device-detect";
import { FiExternalLink } from "react-icons/fi";
import axiosInstance from "src/axios/axiosInstance";
import { fetch_child_resource_fields } from "src/components/ChildResourceField";
import CustomReactTable, { useColumns, useTableReducer } from "src/components/CustomReactTable";
import NoDataCell from "src/components/Helpers/NoDataCell";
import routes from "src/components/Helpers/Routes";
import { CHILD_RESOURCE, DOA_STATUS, getEmailsFromContacts, invoice, MATERIAL_TYPE, sidebarResource } from "src/constants/helpers";
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import { useData } from "src/StateProvider/Provider";
import Box from '@mui/material/Box/Box';
import Grid from '@mui/material/Grid2';
import CommonSkeleton from "src/components/Helpers/CommonSkeleton";
import FinalPriceBox from "src/components/FinalPriceBox";
import { DetailsPageHeader } from "src/components/PageHeaders";
import { ThemeButton } from "src/components/Helpers/Buttons";
import SendIcon from '@mui/icons-material/Send';
import RequestButton from "src/pages/DoaSetupNew/RequestButton";

const Doa = ({ invoiceData, invoiceFields, setNextStep, setPrevStep, DOAData, fetchInvoiceData, stepFullScreen }) => {

  const renderedFrom = `${camelCase(sidebarResource.invoice)}_DOA`;
  const toastConfig = useContext(CustomToastContext);

  const [columns, setColumns] = useState(null);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { generateColumns } = useColumns();

  const {
    state: { resources }
  }: any = useData();


  useEffect(() => {
    fetchFields();
    fetchData();
  }, []);

  const fetchFields = async () => {
    try {
      let data = await fetch_child_resource_fields(CHILD_RESOURCE.invoiceProduct, invoiceData?.currency, false);
      const newColumns = generateColumns(renderedFrom, data, null, false, invoiceData?.currency);
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
          sticky: isMobile || isTablet ? 'none' : 'left',
          Cell: ({ row }) => (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <p>{startCase(row.original?.type)}</p>
            </div>
          )
        },
        {
          accessor: 'detail',
          Header: 'Detail',
          disabled: true,
          minWidth: 300,
          sticky: isMobile || isTablet ? 'none' : 'left',
          width: 300,
          Cell: ({ row }) =>
            row?.original?.type ? (
              <div className="flex items-center gap-2">
                {row?.original?.detail ? <p className="text-truncate">{row.original.detail}</p> : <NoDataCell />}
                {![MATERIAL_TYPE.manualEntry, MATERIAL_TYPE.other]?.includes(row.original['type']) && (
                  <IconButton
                    size="small"
                    onClick={() => {
                      if (row.original.type === MATERIAL_TYPE.service) {
                        window.open(`${routes.serviceMasterDetail.path}/${row.original.materialId}`);
                      } else if (row.original.type === MATERIAL_TYPE.product) {
                        window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                      } else if (row.original.type === MATERIAL_TYPE.serializedAsset) {
                        window.open(`${routes.serializedAssetDetail.path}/${row.original.materialId}`);
                      } else {
                        window.open(`${routes.packagesDetail.path}/${row.original.materialId}`);
                      }
                    }}
                  >
                    <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                  </IconButton>
                )}
              </div>
            ) : (
              <NoDataCell />
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
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  useEffect(() => {
    handleCheckNextPrev()
  }, [DOAData])

  const handleCheckNextPrev = () => {
    if (!DOAData) {
      setNextStep(false);
      setPrevStep(true);
    } else if (DOAData?.status === DOA_STATUS.approved) {
      setPrevStep(false);
      setNextStep(true);
    } else {
      setPrevStep(false);
      setNextStep(false);
    }
  };

  const fetchData = async () => {
    setNextStep(false)
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });

    var data: any = [];
    const response = await axiosInstance().get(`${invoice.api}/material/${invoiceData._id}`);
    data = response?.data?.data;

    let rows = data.material.filter((e) => !e.parentId);
    rows.forEach((parent, i) => {
      parent.index = i + 1;
      parent.detail =
        parent.type === MATERIAL_TYPE.product
          ? parent.productDetail?.productName
          : parent.type === MATERIAL_TYPE.package
            ? parent.packageDetail?.packageName
            : parent.type === MATERIAL_TYPE.serializedAsset
              ? parent.serializedAssetDetail?.assetNumber
              : parent.type === MATERIAL_TYPE.service
                ? parent.serviceDetail?.serviceName
                : parent.detail || '';
      parent.description =
        parent.type === MATERIAL_TYPE.product
          ? parent?.productDetail?.productDescription
          : parent.type === MATERIAL_TYPE.package
            ? parent?.packageDetail?.packageDescription
            : parent.type === MATERIAL_TYPE.serializedAsset
              ? parent?.serializedAssetDetail?.product?.productDescription
              : parent.type === MATERIAL_TYPE.service
                ? parent?.serviceDetail?.serviceDescription
                : parent.description || '';
      parent.qty = parent.qty;
      parent.subRows = generateNestedData(data.material, parent);
    });
    dispatch({ type: 'initialize', data: rows, count: rows?.length });
    dispatch({ type: 'loading', loading: false });
    handleCheckNextPrev()
  };

  const generateNestedData = (material, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, index) => {
      _subRow.index = parent.index + '.' + `${index + 1}`;
      _subRow.detail =
        _subRow.type === MATERIAL_TYPE.product
          ? _subRow.productDetail?.productName
          : _subRow.type === MATERIAL_TYPE.package
            ? _subRow.packageDetail?.packageName
            : _subRow.type === MATERIAL_TYPE.serializedAsset
              ? _subRow.serializedAssetDetail.assetNumber
              : _subRow.type === MATERIAL_TYPE.service
                ? _subRow.serviceDetail?.serviceName
                : _subRow?.detail;
      _subRow.description =
        _subRow.type === MATERIAL_TYPE.product
          ? _subRow?.productDetail?.productDescription
          : _subRow.type === MATERIAL_TYPE.package
            ? _subRow?.packageDetail?.packageDescription
            : _subRow.type === MATERIAL_TYPE.serializedAsset
              ? parent.description
              : _subRow.type === MATERIAL_TYPE.service
                ? _subRow?.serviceDetail?.serviceDescription
                : '';
      _subRow.qty = _subRow.qty;
      _subRow.subRows = generateNestedData(material, _subRow);
    });
    return subRows;
  };

  const previewDownloadProps = {
    fileName: `${resources?.invoice?.titleSingular}-${invoiceData?.invoiceNumber}`,
    subject: `${resources?.invoice?.titleSingular}-${invoiceData?.invoiceNumber}`,
    resource: sidebarResource.invoice,
    referenceId: invoiceData?._id,
    columns: columns,
    isSendEmail: true,
    toEmails: getEmailsFromContacts(invoiceData),
    defaultColumns: [
      'type',
      'detail',
      'fieldTicket',
      'qty',
      'unit',
      'pricingMethod',
      'actualStartDate',
      'actualEndDate',
      `price_${invoiceData?.currency?.toLowerCase()}`,
      `totalPrice_${invoiceData?.currency?.toLowerCase()}`,
      `taxPercentage`,
      `tax_${invoiceData?.currency?.toLowerCase()}`,
      `finalPrice_${invoiceData?.currency?.toLowerCase()}`
    ]
  };

  const handleSendForDOA = () => {
    axiosInstance()
      .post(`${routes.resourceDoaRequest.path}`, {
        resource: sidebarResource?.invoice,
        referenceId: invoiceData?._id,
        entity: invoiceData?.entity,
      })
      .then(({ data }) => {
        fetchInvoiceData()
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
        {!DOAData && (
          <RequestButton
            resource={sidebarResource.invoice}
            id={invoiceData._id}
            entity={invoiceData.entity}
            fetchData={fetchInvoiceData}
          />
        )}
      </>
    )
  }

  return (
    <>
      <DetailsPageHeader isAddButtonVisible={false} isActionButtonVisible={false} previewDownloadProps={previewDownloadProps} rightSideContents={rightSideContents()} hasXpadding />
      <Grid size={{ xs: 12, md: 12, sm: 12 }}>
        {columns ? (
          <Box zIndex={5}>
            <CustomReactTable
              height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 395px)'}
              columns={columns}
              state={state}
              dispatch={dispatch}
              hideSelection={true}
              hideAction={true}
              expander={true}
              refreshGrid={fetchData}
              renderedFrom={renderedFrom}
              isClientSideGrid={true}
            />
            <FinalPriceBox allFields={invoiceFields} data={invoiceData} />
          </Box>
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Grid>
    </>
  )
}

export default Doa;
