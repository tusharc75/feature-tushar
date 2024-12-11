import { IconButton } from '@material-ui/core';
import Box from '@material-ui/core/Box/Box';
import Grid from '@material-ui/core/Grid/Grid';
import { camelCase, startCase } from 'lodash';
import { Fragment, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { useData } from 'src/StateProvider/Provider';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import axiosInstance from '../../../axios/axiosInstance';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import routes from '../../../components/Helpers/Routes';
import { CHILD_RESOURCE, MATERIAL_TYPE, RESOURCE_LABEL, SALES_ORDER_STATUS, salesOrder, sidebarResource } from '../../../constants/helpers';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import { FiExternalLink } from 'react-icons/fi';

const Invoice = ({ salesOrderData, setNextStep, updateJobStatus, stepFullScreen }) => {
  const renderedFrom = `${camelCase(RESOURCE_LABEL.salesOrder)}_Invoice`;

  const {
    state: { resources }
  }: any = useData();

  const [columns, setColumns] = useState(null);

  const { state, dispatch } = useTableReducer({ renderedFrom });

  const { generateColumns } = useColumns();

  useEffect(() => {
    if ([SALES_ORDER_STATUS.new, SALES_ORDER_STATUS.inProgress]?.includes(salesOrderData?.status)) {
      updateJobStatus(SALES_ORDER_STATUS.readyToInvoice);
    }
  }, []);

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    var data = await fetch_child_resource_fields(CHILD_RESOURCE.salesOrderProduct, salesOrderData?.currency, true);
    const newColumns = generateColumns(renderedFrom, data, null, false, salesOrderData?.currency);
    let coloum: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 100,
        sticky: 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>,
        Footer: () => {
          return <>Total</>;
        }
      },
      {
        accessor: 'type',
        Header: 'Type',
        width: 100,
        sticky: isMobile || isTablet ? 'none' : 'left',
        Cell: ({ row }) => {
          return row.original?.type ? (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <p>{`${startCase(row.original?.type)} `}</p>
            </div>
          ) : (
            <NoDataCell />
          );
        }
      },
      {
        accessor: 'detail',
        Header: 'Detail',
        width: 300,
        sticky: isMobile || isTablet ? 'none' : 'left',
        Cell: ({ row }) => {
          return row.original?.detail ? (
            <div className="flex items-center gap-2">
              <p title={row.original?.detail}>{row.original?.detail}</p>
              {row.original.type !== MATERIAL_TYPE.manualEntry && (
                <IconButton
                  size="small"
                  onClick={() => {
                    if (row.original.type === MATERIAL_TYPE.service) {
                      window.open(`${routes.serviceMasterDetail.path}/${row.original.materialId}`);
                    } else if (row.original.type === MATERIAL_TYPE.product) {
                      window.open(`${routes.productDetail.path}/${row.original.materialId}`);
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
          );
        }
      },
      {
        accessor: 'description',
        Header: 'Description',
        width: 200,
        Cell: ({ row }) => {
          return row.original['description'] ? <p className="text-truncate">{row.original.description}</p> : <NoDataCell />;
        }
      },
      {
        accessor: 'leadTime',
        Header: 'Lead Time (Days)',
        Cell: ({ row }) => <div>{row.original['leadTime'] ? <p>{row.original['leadTime']}</p> : 0}</div>,
        Footer: (info) => {
          let rows = info.table.getExpandedRowModel().rows;
          const total = rows
            ?.filter((f) => f.original.hasOwnProperty('leadTime') && !isNaN(f.original['leadTime']))
            .reduce((sum, row) => parseInt(row.original['leadTime']) + sum, 0);
          return <>{total}</>;
        }
      }
    ];
    coloum = [...coloum, ...newColumns];
    setColumns(coloum);
    fetchData();
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });

    setNextStep(false);
    var data: any = [];
    const response = await axiosInstance().get(`${salesOrder.api}/material/${salesOrderData._id}`);
    data = response?.data?.data;
    let rows = data.material.filter((e) => e.parentId === null);

    const additionalCost = await axiosInstance().get(`${salesOrder.api}/additionalcost/${salesOrderData._id}`);
    const additionalCostRows = additionalCost?.data?.data;
    additionalCostRows.forEach((r) => (r.type = MATERIAL_TYPE.manualEntry));

    rows = [...rows, ...additionalCostRows];

    rows.forEach((parent, i) => {
      parent.index = i + 1;
      parent.detail =
        parent.type === MATERIAL_TYPE.product
          ? parent.productDetail?.productName
          : parent.type === MATERIAL_TYPE.service
            ? parent.serviceDetail?.serviceName
            : parent.type === MATERIAL_TYPE.package
              ? parent.packageDetail?.packageName
              : parent.type === MATERIAL_TYPE.manualEntry
                ? parent?.description
                : '';
      parent.description =
        parent.type === MATERIAL_TYPE.product
          ? parent?.productDetail?.productDescription
          : parent.type === MATERIAL_TYPE.package
            ? parent?.packageDetail?.packageDescription
            : parent?.type === MATERIAL_TYPE.manualEntry
              ? parent?.description
              : parent?.type === MATERIAL_TYPE.service
                ? parent?.serviceDetail?.serviceDescription
                : '';
      parent.leadTimeData = Array.isArray(parent.leadTime) ? parent.leadTime : [];
      parent.leadTime = Array.isArray(parent.leadTime) ? `${parent?.leadTime?.reduce((acc, e) => acc + parseInt(e?.days || 0), 0) || 0}` : 0;
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
          : _subRow.type === MATERIAL_TYPE.service
            ? _subRow.serviceDetail?.serviceName
            : _subRow.packageDetail?.packageName;
      _subRow.description =
        _subRow.type === MATERIAL_TYPE.product
          ? _subRow?.productDetail?.productDescription
          : _subRow.type === MATERIAL_TYPE.package
            ? _subRow?.packageDetail?.packageDescription
            : _subRow?.serviceDetail?.serviceDescription;
      _subRow.leadTimeData = Array.isArray(_subRow.leadTime) ? _subRow.leadTime : [];
      _subRow.leadTime = Array.isArray(_subRow.leadTime) ? `${_subRow?.leadTime?.reduce((acc, e) => acc + parseInt(e?.days || 0), 0) || 0}` : 0;
      _subRow.qty = `${parent.qty * _subRow.qty} `;
      _subRow.subRows = generateNestedData(material, _subRow);
    });
    return subRows;
  };

  const previewDownloadProps = {
    fileName: `${resources?.salesOrder?.titleSingular}-${salesOrderData?.salesOrderNo}`,
    resource: sidebarResource.salesOrder,
    referenceId: salesOrderData._id,
    columns: columns,
    isSendEmail: true
  };

  return (
    <Fragment>
      <DetailsPageHeader isAddButtonVisible={false} isActionButtonVisible={false} previewDownloadProps={previewDownloadProps} hasXpadding />

      <Grid item xs={12} md={12} sm={12}>
        {columns ? (
          <Box zIndex={5} width={'100%'}>
            <CustomReactTable
              height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 395px)'}
              columns={columns}
              state={state}
              dispatch={dispatch}
              renderedFrom={renderedFrom}
              isClientSideGrid={true}
              hideSelection={true}
              refreshGrid={fetchData}
              expander={true}
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
