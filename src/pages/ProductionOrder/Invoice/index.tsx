import { useState, useEffect, Fragment } from 'react';
import { Box, Grid, IconButton } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import { useData } from '../../../StateProvider/Provider';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import CustomReactTable from '../../../components/CustomReactTable/CustomReactTable';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import {
  CHILD_RESOURCE,
  MATERIAL_TYPE,
  WORKORDER_SERVICE_STATUS,
  WORK_ORDER_STATUS,
  productionOrder,
  sidebarResource
} from '../../../constants/helpers';
import { startCase } from 'lodash';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { generateCustomTableColumns } from 'src/constants/columns';
import { CURReplaceByCurrencySingle } from 'src/constants/formulaUtility';
import { isMobile } from 'react-device-detect';
import PreviewDownload from 'src/components/PreviewDownload';
const alphabet = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

const Invoice = ({ productionOrderData, renderedFrom, stepFullScreen }) => {
  const {
    state: { user, permissions }
  }: any = useData();

  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState(null);

  useEffect(() => {
    fetchFields();
  }, [productionOrderData]);

  const fetchFields = async () => {
    const response = await axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE.productionOrderDetail}`);
    var data = response?.data?.data;
    data = CURReplaceByCurrencySingle(data, productionOrderData?.currency || 'USD');
    data?.forEach((e) => {
      e.isColumnEditable = false;
    });
    const newColumns = generateCustomTableColumns(data, productionOrderData?.currency || 'USD', renderedFrom)?.filter((e) => !['detail', 'description']?.includes(e['accessor']));
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
        disableFilters: true,
        sticky: isMobile ? 'none' : 'left',
        width: 200,
        Cell: ({ row }) => (row.original['type'] ? <p>{`${startCase(row.original?.type)} `}</p> : <NoDataCell />)
      },
      {
        accessor: 'detail',
        Header: ' Details',
        minWidth: 300,
        width: 300,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row, rows }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <p className="text-truncate">{row.original?.detail}</p>
            <Box ml={1}>
              <IconButton
                size="small"
                onClick={() => {
                  if (row.original.type === 'product') {
                    window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                  } else {
                    window.open(`${routes.packagesDetail.path}/${row.original.materialId}`);
                  }
                }}
              >
                <OpenInNewIcon fontSize="small" color="primary" />
              </IconButton>
            </Box>
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
      },
      {
        accessor: 'workOrder',
        Header: 'Work Order',
        Cell: ({ row }) =>
          row.original.workOrder ? (
            <div className="d-flex gap-2 align-items-center">
              <p className="text-truncate">{row.original.workOrderNumber}</p>
              <IconButton
                size="small"
                onClick={() => {
                  window.open(`${routes.workOrderDetail.path}/${row.original?.workOrder?._id}`);
                }}
              >
                <OpenInNewIcon fontSize="small" color={'primary'} />
              </IconButton>
            </div>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'workOrderStatus',
        Header: 'Result',
        Cell: ({ row }) => (row?.original['workOrderStatus'] ? <p> {row?.original?.workOrderStatus}</p> : <NoDataCell />)
      },
      {
        accessor: 'assignedUsers',
        Header: 'Assigned Technician',
        disableFilters: true,
        Cell: ({ row }) =>
          row?.original['assignedUsers'] && row?.original['assignedUsers']?.length ? (
            row?.original['assignedUsers']?.map((e, i) => {
              return i === row?.original['assignedUsers'].length - 1 ? (
                <a className="link text-truncate" target="_blank" href={`${routes.userDetail.path}/${e.optionValue}`} rel="noreferrer">
                  {e?.optionLabel}
                </a>
              ) : (
                <a className="link text-truncate" target="_blank" href={`${routes.userDetail.path}/${e.optionValue}`} rel="noreferrer">
                  {e?.optionLabel},{' '}
                </a>
              );
            })
          ) : (
            <NoDataCell />
          )
      }
    ];
    if (permissions?.workStations?.isRead) {
      coloum.push({
        accessor: 'assignedWorkStations',
        Header: 'Assigned Work Station',
        disableFilters: true,
        Cell: ({ row }) =>
          row?.original['assignedWorkStations'] && row?.original['assignedWorkStations']?.length ? (
            row?.original['assignedWorkStations']?.map((e, i) => {
              return i === row?.original['assignedWorkStations'].length - 1 ? (
                <a className="link text-truncate" target="_blank" href={`${routes.workStationsDetail.path}/${e.optionValue}`} rel="noreferrer">
                  {e?.optionLabel}
                </a>
              ) : (
                <a className="link text-truncate" target="_blank" href={`${routes.workStationsDetail.path}/${e.optionValue}`} rel="noreferrer">
                  {e?.optionLabel},{' '}
                </a>
              );
            })
          ) : (
            <NoDataCell />
          )
      });
    }
    coloum = [...coloum, ...newColumns];
    setColumns(coloum);
    fetchData();
  };

  const fetchData = async () => {
    var data: any = [];
    const response = await axiosInstance().get(`${productionOrder.api}/${productionOrderData._id}/work-order/service`);
    data = response?.data?.data;
    let rows = data.material.filter((e) => e.type === MATERIAL_TYPE.product && e?.parentId === null);
    rows.forEach((parent, i) => {
      parent.index = i + 1;
      parent.detail =
        parent.type === MATERIAL_TYPE.service
          ? parent?.serviceDetail?.serviceName
          : parent.type === MATERIAL_TYPE.product
            ? parent.productDetail?.productName
            : parent.packageDetail?.packageName;
      parent.description =
        parent.type === MATERIAL_TYPE.product ? parent?.productDetail?.productDescription : parent?.packageDetail?.packageDescription;
      parent.qty = parent.qty;
      parent.workOrderNumber = parent?.workOrder?.workOrderNumber;
      if (parent?.workOrder?.status === WORK_ORDER_STATUS.completed) {
        parent.workOrderStatus = parent?.workOrder?.status;
      }
      parent.subRows = generateNestedData(data.material, parent);
    });
    setRowsData(rows);
  };

  const generateNestedData = (material, parent) => {
    const subRows: any = material.filter((e) => e?.parentId === parent?._id);
    let productIndex = 0;
    let serviceIndex = 0;
    subRows.forEach((_subRow, index) => {
      _subRow.index = parent.index + '.' + `${_subRow.type === MATERIAL_TYPE.service ? alphabet[serviceIndex] : productIndex + 1}`;
      _subRow.detail =
        _subRow.type === MATERIAL_TYPE.service
          ? _subRow?.serviceDetail?.serviceName
          : _subRow.type === MATERIAL_TYPE.product
            ? _subRow.productDetail?.productName
            : _subRow.packageDetail?.packageName;
      _subRow.description =
        _subRow.type === MATERIAL_TYPE.service
          ? _subRow?.serviceDetail?.serviceDescription
          : _subRow.type === MATERIAL_TYPE.product
            ? _subRow?.productDetail?.productDescription
            : _subRow?.packageDetail?.packageDescription;
      _subRow.qty = _subRow.qty;
      _subRow.workOrder = parent?.workOrder;
      _subRow.workOrderNumber = parent?.workOrder?.workOrderNumber;
      _subRow.subRows = generateNestedData(material, _subRow);
      _subRow.type === MATERIAL_TYPE.service ? serviceIndex++ : productIndex++;
    });
    return subRows;
  };

  return (
    <Fragment>
      <Box display="flex" justifyContent="space-between" m={1}>
        <Box display="flex" alignItems="center" gridGap={'8px'}>
          <PreviewDownload
            fileName={`${routes.productionOrder.title}-${productionOrderData?.productionOrderNumber}`}
            resource={sidebarResource.productionOrder}
            referenceId={productionOrderData._id}
            columns={columns}
            isSendEmail={true}
          />
        </Box>
      </Box>
      <Grid container spacing={2}>
        <Grid item xs={12} md={12} sm={12}>
          {columns && rowsData ? (
            <>
              <Box zIndex={5} width={'100%'}>
                <CustomReactTable
                  height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 395px)'}
                  columns={columns}
                  data={rowsData}
                  onSelect={() => { }}
                  setWholeRowsCellColor={(rowData) => (rowData.type === 'service' ? 'isService' : '')}
                  childrenProperty="subRows"
                  uniqueKey="_id"
                  renderedFrom={renderedFrom}
                  isClientSideGrid={true}
                  hideSelection={true}
                  hideAction={true}
                />
              </Box>
            </>
          ) : (
            <Box p={2} height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </Grid>
      </Grid>
    </Fragment>
  );
};

export default Invoice;
