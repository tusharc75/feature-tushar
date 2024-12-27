import { IconButton } from '@mui/material';
import Box from '@mui/material/Box/Box';
import Grid from '@mui/material/Grid2';
import { camelCase, startCase } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../../axios/axiosInstance';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CHILD_RESOURCE, INVOICE_STATUS, MATERIAL_TYPE, invoice, sidebarResource } from '../../../constants/helpers';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import { FiExternalLink } from 'react-icons/fi';
import { useData } from 'src/StateProvider/Provider';

const Invoice = ({ invoiceData, setNextStep, handleChangeStatus, statusOptions, stepFullScreen }) => {
  const renderedFrom = `${camelCase(sidebarResource.invoice)}`;
  const toastConfig = useContext(CustomToastContext);

  const [columns, setColumns] = useState(null);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { generateColumns } = useColumns();

  const {
    state: { resources }
  }: any = useData();

  useEffect(() => {
    if (
      statusOptions.findIndex((d) => d.optionLabel === INVOICE_STATUS.readyToInvoice) >
      statusOptions.findIndex((d) => d.optionLabel === invoiceData?.status)
    ) {
      handleChangeStatus(INVOICE_STATUS.readyToInvoice);
    }
  }, []);

  useEffect(() => {
    fetchFields();
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
      fetchData();
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });

    var data: any = [];
    const response = await axiosInstance().get(`${invoice.api}/material/${invoiceData._id}`);
    const additionalData = await axiosInstance().get(`${routes.invoice.path}/${invoiceData._id}/additional-cost`);
    let additionalCost = additionalData?.data?.data || [];
    additionalCost = additionalCost?.map((e: any) => {
      return { ...e, type: MATERIAL_TYPE.manualEntry };
    });
    data = response?.data?.data;

    let rows = data.material.filter((e) => !e.parentId);
    rows = [...rows, ...additionalCost];
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
    resource: sidebarResource.invoice,
    referenceId: invoiceData?._id,
    columns: columns,
    isSendEmail: true,
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

  return (
    <Fragment>
      <DetailsPageHeader isAddButtonVisible={false} isActionButtonVisible={false} previewDownloadProps={previewDownloadProps} hasXpadding />
      <Grid size={{xs:12, md:12, sm:12}}>
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
