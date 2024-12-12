import { useState, useEffect, useContext } from 'react';
import { Box } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { Link } from 'react-router-dom';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import { dateTimeFormat, INVENTORY_HISTORY_TYPE, sidebarResource } from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';
import DurationFilter from 'src/components/DurationFilter';
import moment from 'moment';
import CustomReactTable, { gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { camelCase, cloneDeep, uniq } from 'lodash';
import ImportExportLinks from 'src/components/Helpers/ImportExportLinks';
import CustomTabs, { CustomTab } from 'src/components/CustomTabs';

const AssetHistory = ({ id, refresh, resourceData, fields }) => {
  const toastConfig = useContext(CustomToastContext);
  const renderedFrom = `${camelCase(sidebarResource?.serializedAsset)}_assetHistory`;

  const { generateColumns } = useColumns();
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const [duration, setDuration] = useState({
    from: null,
    to: null
  });
  const [column, setColumn] = useState([]);
  const [tabValue, setTabValue] = useState(0);

  const {
    state: { permissions, resources }
  }: any = useData();

  const ASSET_HISTORY_RESOURCE = [
    {
      key: 'all',
      resource: 'All',
      title: 'All'
    },
    {
      key: INVENTORY_HISTORY_TYPE.serializedAssets,
      resource: sidebarResource.serializedAsset,
      title: resources?.serializedAsset?.titlePlural
    },
    {
      key: INVENTORY_HISTORY_TYPE.rental,
      resource: sidebarResource.rentalManagement,
      title: resources?.rentalManagement?.titlePlural
    },
    {
      key: INVENTORY_HISTORY_TYPE.repair,
      resource: sidebarResource?.repairOrder,
      title: resources?.repairOrder?.titlePlural
    },
    {
      key: INVENTORY_HISTORY_TYPE.workOrder,
      resource: sidebarResource?.workOrder,
      title: resources?.workOrder?.titlePlural
    },
    {
      key: INVENTORY_HISTORY_TYPE.deliveryTicket,
      resource: sidebarResource.deliveryTicket,
      title: resources?.deliveryTicket?.titlePlural
    },
    {
      key: INVENTORY_HISTORY_TYPE.transferAssets,
      resource: sidebarResource.transferAsset,
      title: routes.transferAsset.title
    }
    // {
    //   key: INVENTORY_HISTORY_TYPE.purchaseOrder,
    //   resource: sidebarResource.purchaseOrder,
    //   title: routes.purchaseOrder.title,
    // },
    // {
    //   key: INVENTORY_HISTORY_TYPE.salesOrder,
    //   resource: sidebarResource.salesOrder,
    //   title: routes.salesOrder.title,
    // },
    // {
    //   key: INVENTORY_HISTORY_TYPE.sublease,
    //   resource: sidebarResource.sublease,
    //   title: routes.sublease.title,
    // },
    // {
    //   key: INVENTORY_HISTORY_TYPE.bulkAssetCreation,
    //   resource: sidebarResource.bulkAssetCreation,
    //   title: routes.bulkAssetCreation.title,
    // },
    // {
    //   key: INVENTORY_HISTORY_TYPE.inventoryToAsset,
    //   resource: sidebarResource.inventoryToAsset,
    //   title: routes.inventoryToAsset.title,
    // },
    // {
    //   key: INVENTORY_HISTORY_TYPE.quotation,
    //   resource: sidebarResource.quotation,
    //   title: routes.quotation.title,
    // },
    // {
    //   key: INVENTORY_HISTORY_TYPE.invoice,
    //   resource: sidebarResource.invoice,
    //   title: routes.invoice.title,
    // },
    // {
    //   key: INVENTORY_HISTORY_TYPE.productionOrder,
    //   resource: sidebarResource.productionOrder,
    //   title: routes.productionOrder.title,
    // },
    // {
    //   key: INVENTORY_HISTORY_TYPE.fieldServiceOrder,
    //   resource: sidebarResource.fieldServiceOrder,
    //   title: routes.fieldServiceOrder.title,
    // },
    // {
    //   key: INVENTORY_HISTORY_TYPE.fieldTicket,
    //   resource: sidebarResource.fieldTicket,
    //   title: routes.fieldTicket.title,
    // },
    // {
    //   key: INVENTORY_HISTORY_TYPE.job,
    //   resource: sidebarResource.job,
    //   title: routes.job.title,
    // },
    // {
    //   key: INVENTORY_HISTORY_TYPE.planning,
    //   resource: sidebarResource.planning,
    //   title: routes.planning.title,
    // },
    // {
    //   key: INVENTORY_HISTORY_TYPE.deals,
    //   resource: sidebarResource.deals,
    //   title: routes.deals.title,
    // },
    // {
    //   key: INVENTORY_HISTORY_TYPE.assemblyOrder,
    //   resource: sidebarResource.assemblyOrder,
    //   title: routes.assemblyOrder.title,
    // },
  ];

  const { page, limit, filters, sorting } = state;

  const columns = [
    {
      accessor: 'reference',
      Header: 'Reference',
      disableFilters: true,
      disableSortBy: false,
      disabled: true,
      Cell: ({ row }) => (
        <div>
          {row.original.reference ? (
            row.original.type === 'Loading Ticket' ||
            row.original.type === 'Receiving Ticket' ||
            row.original.type === 'Return Ticket' ||
            row.original.type === 'Delivery Ticket' ? (
              <Link
                className="link"
                title={row.original.reference}
                to={`${routes.deliveryTicketDetail.path}/${row.original.referenceId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {row.original.reference}
              </Link>
            ) : row.original.type?.toLowerCase() === 'repair' ? (
              <Link
                className="link"
                title={row.original.reference}
                to={`${routes.repairJobDetail.path}/${row.original.referenceId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {row.original.reference}
              </Link>
            ) : row.original.type === 'Work Order' ? (
              <Link
                className="link"
                title={row.original.reference}
                to={`${routes?.workOrderDetail?.path}/${row.original.referenceId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {row.original.reference}
              </Link>
            ) : row.original.type === 'Repair Order' ? (
              <Link
                className="link"
                title={row.original.reference}
                to={`${routes?.repairOrderDetail.path}/${row.original.referenceId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {row.original.reference}
              </Link>
            ) : row.original.type?.toLowerCase() === 'rental' ? (
              <Link
                className="link"
                title={row.original.reference}
                to={`${routes.rentalManagementDetail.path}/${row.original.referenceId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {row.original.reference}
              </Link>
            ) : row.original.type === 'Transfer Assets' ? (
              <Link
                className="link"
                title={row.original.reference}
                to={`${routes.transferAssetDetail.path}/${row.original.referenceId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {row.original.reference}
              </Link>
            ) : row.original.type?.toLowerCase().includes('purchase') ? (
              <Link
                className="link"
                title={row.original.reference}
                to={`${routes.purchaseOrderDetail.path}/${row.original.referenceId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {row.original.reference}
              </Link>
            ) : row.original.type?.toLowerCase().includes('sublease') ? (
              <Link
                className="link"
                title={row.original.reference}
                to={`${routes.subleaseDetail.path}/${row.original.referenceId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {row.original.reference}
              </Link>
            ) : row.original?.type === 'Bulk Asset Creation' ? (
              <Link
                className="link"
                title={row.original.reference}
                to={`${routes.bulkAssetCreationDetail.path}/${row.original.referenceId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {row.original.reference}
              </Link>
            ) : row.original?.type === 'Transfer Inventory' ? (
              <Link
                className="link"
                title={row.original.reference}
                to={`${routes.transferInventoryDetail.path}/${row.original.referenceId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {row.original.reference}
              </Link>
            ) : row.original?.type === 'Job' ? (
              <Link
                className="link"
                title={row.original.reference}
                to={`${routes.jobDetail.path}/${row.original.referenceId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {row.original.reference}
              </Link>
            ) : row.original?.type === 'Quotation' ? (
              <Link
                className="link"
                title={row.original.reference}
                to={`${routes.quotationDetail.path}/${row.original.referenceId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {row.original.reference}
              </Link>
            ) : row.original?.type === sidebarResource.planning ? (
              <Link
                className="link"
                title={row.original.reference}
                to={`${routes.planningDetail.path}/${row.original.referenceId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {row.original.reference}
              </Link>
            ) : row.original?.type === sidebarResource.deals ? (
              <Link
                className="link"
                title={row.original.reference}
                to={`${routes.dealDetail.path}/${row.original.referenceId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {row.original.reference}
              </Link>
            ) : row?.original?.type === sidebarResource.assemblyOrder ? (
              <Link
                className="link"
                title={row.original.reference}
                to={`${routes.assemblyOrderDetail.path}/${row.original.referenceId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {row.original.reference}
              </Link>
            ) : (
              row.original.reference
            )
          ) : (
            <NoDataCell />
          )}
        </div>
      )
    },
    {
      accessor: 'type',
      Header: 'Type',
      disabled: true,
      Cell: ({ row }) => (row.original?.type ? <div>{row.original?.type}</div> : <NoDataCell />)
    },
    {
      accessor: 'date',
      Header: 'Date & Time',
      disabled: true,
      disableFilters: true,
      disableSortBy: false,
      Cell: ({ row }) =>
        row.original?.date ? (
          <div className="createBy" title={`${moment(row.original?.date)?.format(dateTimeFormat)}`}>
            {moment(row.original?.date)?.format(dateTimeFormat)}
          </div>
        ) : (
          <NoDataCell />
        )
    },
    {
      accessor: 'days',
      Header: 'Days',
      disableFilters: true,
      disableSortBy: false,
      Cell: ({ row }) => <div>{row.original?.days ? <span>{row.original?.days}</span> : <span>Less than a day</span>}</div>
    },
    {
      accessor: 'status',
      Header: 'Status',
      Cell: ({ row }) => (row.original?.status ? <div>{row.original?.status}</div> : <NoDataCell />)
    },
    {
      accessor: 'comments',
      Header: 'Comment',
      Cell: ({ row }) =>
        row.original?.comments ? (
          <div>
            <p title={row.original?.comments}>{row.original?.comments}</p>
          </div>
        ) : (
          <NoDataCell />
        )
    },
    {
      accessor: 'warehouse',
      Header: resources?.warehouse?.titleSingular,
      Cell: ({ row }) => (
        <div>
          {row.original?.warehouse ? (
            permissions?.warehouse?.isRead ? (
              <Link
                className="link"
                title={row.original?.warehouse}
                to={`${routes.warehouseDetail.path}/${row.original?.warehouseId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {row.original?.warehouse}
              </Link>
            ) : (
              <span>{row.original?.warehouse}</span>
            )
          ) : (
            <NoDataCell />
          )}
        </div>
      )
    },
    {
      accessor: 'location',
      Header: 'Location',
      Cell: ({ row }) => (row.original?.location ? <div>{row.original?.location}</div> : <NoDataCell />)
    },
    {
      accessor: 'ownerType',
      Header: 'Owner Type',
      Cell: ({ row }) => (row.original?.ownerType ? <div>{row.original?.ownerType}</div> : <NoDataCell />)
    },
    {
      accessor: 'owner',
      Header: 'Owner',
      Cell: ({ row }) => (row.original?.owner ? <div>{row.original?.owner}</div> : <NoDataCell />)
    },
    {
      accessor: 'transactionDate',
      Header: 'Actual Transaction Date',
      disableFilters: true,
      disableSortBy: true,
      Cell: ({ row }) => (
        <>
          {row?.original?.transactionDate ? (
            <h5 className="text-truncate" title={moment(row?.original?.transactionDate)?.format(dateTimeFormat)}>
              {moment(row?.original?.transactionDate)?.format(dateTimeFormat)}
            </h5>
          ) : (
            <NoDataCell />
          )}
        </>
      )
    }
  ];

  useEffect(() => {
    let statusChangeFieldColumns = [];
    statusChangeFieldColumns = uniq(resourceData?.policy?.statusChangeFields?.flatMap((ele) => ele.fields));
    let statusChangeFields = fields
      ?.filter((ele) => [...statusChangeFieldColumns]?.includes(ele.fieldData.fieldName))
      .map((field) => {
        const f = cloneDeep(field);
        const fieldData = f.fieldData;
        fieldData.fieldName = `assetData.${fieldData.fieldName}`;
        f.fieldData = fieldData;
        return f;
      });
    let extraColumns = generateColumns(
      renderedFrom,
      statusChangeFields?.filter((_field) => !columns?.map((c) => c?.accessor).includes(_field?.fieldData?.fieldName)),
      routes.serializedAssetDetail.path,
      true
    );
    setColumn([...columns, ...extraColumns]);
  }, [fields]);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id, refresh, page, limit, filters, sorting, duration, tabValue]);

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}`;
    const { deepFilters } = gridFilterParser(filters);

    if (tabValue !== 0) {
      const filterKey = ASSET_HISTORY_RESOURCE?.filter((f) => permissions[camelCase(f.resource)]?.isRead || f.key == 'all')?.find(
        (ele, idx) => idx == tabValue
      );
      const tabFilters = {
        [INVENTORY_HISTORY_TYPE.deliveryTicket]: [
          INVENTORY_HISTORY_TYPE.deliveryTicket,
          INVENTORY_HISTORY_TYPE.loadingTicket,
          INVENTORY_HISTORY_TYPE.receivingTicket,
          INVENTORY_HISTORY_TYPE.returnTicket
        ],
        [INVENTORY_HISTORY_TYPE.serializedAssets]: [INVENTORY_HISTORY_TYPE.inventory, INVENTORY_HISTORY_TYPE.serializedAssets]
      };
      const filterTerms = tabFilters[filterKey.key] || filterKey.key;
      deepFilters.push({ field: 'type', term: filterTerms });
    }
    if (duration && duration?.from && duration?.to) {
      deepFilters.push({
        field: 'date',
        term: {
          from: moment(duration?.from).format('MM/DD/YYYY'),
          to: moment(duration?.to).format('MM/DD/YYYY')
        }
      });
    }
    if (deepFilters?.length > 0) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(deepFilters))}&filterType=and`;
    }
    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }
    return deepFilter;
  };

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    axiosInstance()
      .get(`/history/inventory/${id}${queryString}`)
      .then(({ data: { data, count } }) => {
        data = data?.map((u, index) => ({
          ...(({ assetData, ...rest }) => rest)(u),
          ...Object.keys(u?.assetData).reduce((acc, k) => ({ ...acc, [`assetData.${k}`]: u.assetData[k] }), {}),
          _id: index + 1,
          id: index + 1,
          reference: u?.reference?.optionLabel,
          referenceId: u?.reference?.optionValue,
          warehouse: u?.warehouse?.optionLabel,
          warehouseId: u?.warehouse?.optionValue
        }));
        dispatch({ type: 'initialize', data: data, count: count });
        dispatch({ type: 'loading', loading: false });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };

  const handleMainTabChange = (event: any, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      <CustomTabs value={tabValue} onChange={handleMainTabChange}>
        {ASSET_HISTORY_RESOURCE?.filter((f) => permissions[camelCase(f.resource)]?.isRead || f.key === 'all')?.map((res, idx) => (
          <CustomTab primaryColor={true} value={idx} id={res.key} label={`${res.title}`} />
        ))}
      </CustomTabs>
      <Box className="flex flex-wrap items-center justify-between gap-3">
        <Box className="max-w-[800px]">
          <DurationFilter label={''} defaultTimeFrame="all" duration={duration} setDuration={setDuration} showAll={true} />
        </Box>
        <ImportExportLinks
          permissions={permissions?.history}
          module={'Asset History'}
          api={`/history/inventory/${id}`}
          afterImportCompleted={() => {}}
          onExportToExcelSuccess={() => {}}
          additionalParams={getQueryString()}
          onlyExport={true}
        />
      </Box>
      {column ? (
        <CustomReactTable
          height={'calc(100vh - 300px)'}
          columns={column}
          state={state}
          dispatch={dispatch}
          renderedFrom={renderedFrom}
          refreshGrid={fetchData}
          showFilters={false}
          hideSelection={true}
        />
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </Box>
  );
};

export default AssetHistory;
