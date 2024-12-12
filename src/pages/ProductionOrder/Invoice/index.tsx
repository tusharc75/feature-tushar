import { useState, useEffect, Fragment } from 'react';
import { Box, Grid, IconButton } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import { useData } from '../../../StateProvider/Provider';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import CustomReactTable, { gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import { CHILD_RESOURCE, MATERIAL_TYPE, WORK_ORDER_STATUS, productionOrder, sidebarResource } from '../../../constants/helpers';
import { orderBy, startCase } from 'lodash';
import { isMobile, isTablet } from 'react-device-detect';
import PreviewDownload from 'src/components/PreviewDownload';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import { FiExternalLink } from 'react-icons/fi';
const alphabet = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

const Invoice = ({ productionOrderData, renderedFrom, stepFullScreen }) => {
  const {
    state: { user, permissions, resources }
  }: any = useData();

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, limit, filters, sorting } = state;

  const [columns, setColumns] = useState(null);
  const { generateColumns } = useColumns();

  useEffect(() => {
    fetchFields();
  }, [productionOrderData]);

  const fetchFields = async () => {
    const response = await fetch_child_resource_fields(CHILD_RESOURCE.productionOrderDetail, productionOrderData?.currency, false);
    var data = response?.filter((e) => !['detail', 'description']?.includes(e?.fieldName));
    const newColumns = generateColumns(renderedFrom, data, null, false, productionOrderData?.currency || 'USD');
    let coloum: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: 'left',
        Cell: ({ row }) => <h5 className="text-truncate">{row.original.index}</h5>,
        Footer: () => {
          return <>Total</>;
        }
      },
      {
        accessor: 'type',
        Header: 'Type',
        disableFilters: true,
        sticky: isMobile || isTablet ? 'none' : 'left',
        width: 100,
        Cell: ({ row }) => (row.original['type'] ? <h5>{`${startCase(row.original?.type)} `}</h5> : <NoDataCell />)
      },
      {
        accessor: 'detail',
        Header: ' Details',
        minWidth: 200,
        width: 200,
        sticky: isMobile || isTablet ? 'none' : 'left',
        Cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <h5 className="text-truncate">{row.original?.detail}</h5>
            <IconButton
              size="small"
              onClick={() => {
                if (row.original.type === MATERIAL_TYPE.product) {
                  window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                } else if (row.original.type === MATERIAL_TYPE.service) {
                  window.open(`${routes.serviceMasterDetail.path}/${row.original.materialId}`);
                } else {
                  window.open(`${routes.packagesDetail.path}/${row.original.materialId}`);
                }
              }}
            >
              <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
            </IconButton>
          </div>
        )
      },
      {
        accessor: 'description',
        Header: 'Description',
        width: 200,
        show: false,
        Cell: ({ row }) => {
          return row.original['description'] ? <h5 className="text-truncate">{row.original.description}</h5> : <NoDataCell />;
        }
      }
    ];
    const workOrderCol = {
      accessor: 'workOrder',
      Header: 'Work Order',
      width: 200,
      Cell: ({ row }) =>
        row.original.workOrder ? (
          <div className="flex items-center gap-2">
            <h5 className="text-truncate">{row.original.workOrderNumber}</h5>
            <IconButton
              size="small"
              onClick={() => {
                window.open(`${routes.workOrderDetail.path}/${row.original?.workOrder?._id}`);
              }}
            >
              <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
            </IconButton>
          </div>
        ) : (
          <NoDataCell />
        )
    };
    if (!newColumns?.find((e) => e.accessor === 'workOrderNumber')) {
      coloum.push(workOrderCol);
    }
    newColumns?.forEach((e) => {
      if (e.accessor === 'workOrderNumber') {
        coloum.push(workOrderCol);
      } else {
        coloum.push(e);
      }
    });
    coloum.push({
      accessor: 'status',
      Header: 'Status',
      width: 200,
      Cell: ({ row }) => <div>{row.original['status'] ? <p> {row.original.status}</p> : <NoDataCell />}</div>
    });
    coloum.push({
      accessor: 'serviceStatus',
      Header: 'Result',
      width: 200,
      Cell: ({ row }) => <div>{row?.original['serviceStatus'] ? <h5> {row?.original?.serviceStatus}</h5> : <NoDataCell />}</div>
    });
    coloum.push({
      accessor: 'assignedUsers',
      Header: 'Assigned Technician',
      width: 200,
      Cell: ({ row }) => (
        <div>
          {row?.original['assignedUsers'] && row?.original['assignedUsers']?.length ? (
            row?.original['assignedUsers']?.map((e, i) => {
              return i === row?.original['assignedUsers'].length - 1 ? (
                <a
                  className="link text-truncate [flex-grow:0_!important]"
                  target="_blank"
                  href={`${routes.userDetail.path}/${e.optionValue}`}
                  rel="noreferrer"
                >
                  {e?.optionLabel}
                </a>
              ) : (
                <>
                  <a
                    className="link text-truncate [flex-grow:0_!important]"
                    target="_blank"
                    href={`${routes.userDetail.path}/${e.optionValue}`}
                    rel="noreferrer"
                  >
                    {e?.optionLabel},
                  </a>
                  &nbsp;
                </>
              );
            })
          ) : (
            <NoDataCell />
          )}
        </div>
      )
    });
    if (permissions?.workStations) {
      coloum.push({
        accessor: 'assignedWorkStations',
        Header: 'Assigned Work Station',
        width: 200,
        Cell: ({ row }) => (
          <div>
            {row?.original['assignedWorkStations'] && row?.original['assignedWorkStations']?.length ? (
              row?.original['assignedWorkStations']?.map((e, i) => {
                return i === row?.original['assignedWorkStations'].length - 1 ? (
                  <a
                    className="link text-truncate [flex-grow:0_!important]"
                    target="_blank"
                    href={`${routes.workStationsDetail.path}/${e.optionValue}`}
                    rel="noreferrer"
                  >
                    {e?.optionLabel}
                  </a>
                ) : (
                  <>
                    <a
                      className="link text-truncate [flex-grow:0_!important]"
                      target="_blank"
                      href={`${routes.workStationsDetail.path}/${e.optionValue}`}
                      rel="noreferrer"
                    >
                      {e?.optionLabel},
                    </a>
                    &nbsp;
                  </>
                );
              })
            ) : (
              <NoDataCell />
            )}
          </div>
        )
      });
    }
    setColumns(coloum);
  };

  useEffect(() => {
    fetchData();
  }, [page, limit, filters, sorting]);

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}`;
    if (isExport) {
      deepFilter = `?`;
    }
    const { filterByIds, deepFilters } = gridFilterParser(filters);

    if (filterByIds?.length) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterByIds)}`;
    }
    if (deepFilters?.length) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(deepFilters))}`;
    }
    if (filterByIds?.length || deepFilters?.length) {
      deepFilter = `${deepFilter}&filterType=and`;
    }
    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }
    return deepFilter;
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });

    const queryString = getQueryString();
    const {
      data: { data, count }
    } = await axiosInstance().get(`${productionOrder.api}/${productionOrderData._id}/work-order/service${queryString}`);

    let rows = data?.material.filter((e) => e.type === MATERIAL_TYPE.product && e?.parentId === null);
    const totalPrev = page * limit;
    rows.forEach((parent, i) => {
      parent.index = i + 1 + totalPrev;
      parent.detail = parent.detail
        ? parent.detail
        : parent.type === MATERIAL_TYPE.service
          ? parent?.serviceDetail?.serviceName
          : parent.type === MATERIAL_TYPE.product
            ? parent.productDetail?.productName
            : parent.packageDetail?.packageName;
      parent.description = parent.description
        ? parent.description
        : parent.type === MATERIAL_TYPE.product
          ? parent?.productDetail?.productDescription
          : parent?.packageDetail?.packageDescription;
      parent.qty = parent.qty;
      parent.workOrderNumber = parent?.workOrder?.workOrderNumber;
      if (parent?.workOrder?.status === WORK_ORDER_STATUS.completed) {
        parent.workOrderStatus = parent?.workOrder?.status;
        parent.status = parent?.workOrder?.status;
      }
      parent.subRows = generateNestedData(data.material, parent);
    });
    dispatch({ type: 'initialize', data: rows, count: count });
    dispatch({ type: 'loading', loading: false });
  };

  const generateNestedData = (material, parent) => {
    var subRows: any = material.filter((e) => e?.parentId === parent?._id);
    subRows = orderBy(subRows, ['type'], ['desc']);
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
            fileName={`${resources?.productionOrder?.titleSingular}-${productionOrderData?.productionOrderNumber}`}
            resource={sidebarResource.productionOrder}
            referenceId={productionOrderData._id}
            referenceLabel={productionOrderData?.productionOrderNumber}
            columns={columns}
            isSendEmail={true}
            isAsyncDownload={true}
            defaultColumns={['index', `detail`, `description`, `workOrder`, `qty`, `unit`, 'weightlb', 'engRef']}
          />
        </Box>
      </Box>
      <Grid container spacing={2}>
        <Grid item xs={12} md={12} sm={12}>
          {columns ? (
            <Box zIndex={5} width={'100%'}>
              <CustomReactTable
                height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}
                columns={columns}
                state={state}
                setWholeRowsCellColor={(rowData) => (rowData.type === MATERIAL_TYPE.service ? 'isService' : '')}
                dispatch={dispatch}
                renderedFrom={renderedFrom}
                refreshGrid={fetchData}
                hideSelection={true}
                hideAction={true}
                expander={true}
              />
            </Box>
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
