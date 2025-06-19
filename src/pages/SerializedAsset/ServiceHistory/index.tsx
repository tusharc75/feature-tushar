import { useState, useEffect, useContext } from 'react';
import { Box, IconButton } from '@mui/material';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import {
  dateFormatToSend,
  displayDateTime,
  sidebarResource
} from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';
import DurationFilter from 'src/components/DurationFilter';
import CustomReactTable, { gridFilterParser, useTableReducer } from 'src/components/CustomReactTable';
import { camelCase } from 'lodash';
import ImportExportLinks from 'src/components/Helpers/ImportExportLinks';
import ContainedTabs, { ContainedTab } from 'src/components/CustomTabs/ContainedTab';
import { FiExternalLink } from 'react-icons/fi';

const ServiceHistory = ({ id, refresh }) => {
  const toastConfig = useContext(CustomToastContext);

  const renderedFrom = `${camelCase(sidebarResource?.serializedAsset)}_serviceHistory`;

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const [duration, setDuration] = useState({
    from: null,
    to: null
  });
  const [column, setColumn] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  const {
    state: { permissions, resources }
  }: any = useData();

  const SERVICE_HISTORY_RESOURCE = [
    {
      key: 'all',
      resource: 'All',
      title: 'All'
    },
    {
      key: sidebarResource.fieldTicket,
      resource: sidebarResource.fieldTicket,
      title: resources?.fieldTicket?.titlePlural
    },
    {
      key: sidebarResource.repairOrder,
      resource: sidebarResource.repairOrder,
      title: resources?.repairOrder?.titlePlural
    }
  ];

  const { page, limit, filters, sorting } = state;

  useEffect(() => {
    const columns = [
      {
        accessor: 'reference',
        Header: 'Reference',
        disableFilters: true,
        disableSortBy: false,
        disabled: true,
        Cell: ({ row }) => (
          row.original.reference ? <div className="flex items-center gap-1">
            {row.original.reference}
            <IconButton
              size="small"
              onClick={() => {
                if (row.original.referenceType === sidebarResource.fieldTicket) {
                  window.open(`${routes.fieldTicketDetail.path}/${row.original.referenceId}`);
                }
                if (row.original.referenceType === sidebarResource.repairOrder) {
                  window.open(`${routes.repairOrderDetail.path}/${row.original.referenceId}`);
                }
              }}
            >
              <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
            </IconButton>
          </div> : <NoDataCell />
        )
      },
      {
        accessor: 'referenceType',
        Header: 'Resource',
        Cell: ({ row }) => (row.original?.referenceType ? <div>{row.original?.referenceType}</div> : <NoDataCell />)
      },
      {
        accessor: 'service',
        Header: 'Service',
        Cell: ({ row }) => (
          row?.original?.service ? <div className="flex items-center gap-1">
            {row.original?.service?.optionLabel}
            <IconButton
              size="small"
              onClick={() => {
                window.open(`${routes.serviceMasterDetail.path}/${row.original?.service?.optionValue}`);
              }}
            >
              <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
            </IconButton>
          </div> : <NoDataCell />
        )
      },
      {
        accessor: 'date',
        Header: 'Date & Time',
        disabled: true,
        disableFilters: true,
        disableSortBy: false,
        Cell: ({ row }) =>
          row.original?.date ? (
            <div title={`${displayDateTime(row.original?.date)}`}>
              {displayDateTime(row.original?.date)}
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
        accessor: 'warehouse',
        Header: resources?.warehouse?.titleSingular,
        Cell: ({ row }) => (
          row.original.warehouse ? <div className="flex items-center gap-1">
            {row.original.warehouse?.optionLabel}
            <IconButton
              size="small"
              onClick={() => {
                window.open(`${routes.warehouseDetail.path}/${row?.original?.warehouse?.optionValue}`);
              }}
            >
              <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
            </IconButton>
          </div> : <NoDataCell />
        )
      }
    ];
    setColumn([...columns]);
  }, []);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id, refresh, page, limit, filters, sorting, duration, tabValue]);

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}`;
    const { deepFilters } = gridFilterParser(filters);

    if (tabValue !== 0) {
      const filterKey = SERVICE_HISTORY_RESOURCE?.filter((f) => permissions[camelCase(f.resource)]?.isRead || f.key == 'all')?.find((ele, idx) => idx == tabValue);
      deepFilters.push({ field: 'referenceType', term: filterKey.key });
    }
    if (duration && duration?.from && duration?.to) {
      deepFilters.push({
        field: 'date',
        term: {
          from: dateFormatToSend(duration?.from),
          to: dateFormatToSend(duration?.to)
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
    axiosInstance().get(`/history/asset-service/${id}${queryString}`)
      .then(({ data: { data, count } }) => {
        data = data?.map((u) => ({
          ...u,
          reference: u?.reference?.optionLabel
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
      <ContainedTabs value={tabValue} className="mb-4" onChange={(e, value) => handleMainTabChange(e, value)}>
        {SERVICE_HISTORY_RESOURCE?.filter((f) => permissions[camelCase(f.resource)]?.isRead || f.key === 'all')?.map((res, idx) => (
          <ContainedTab value={idx} id={res.key} label={`${res.title}`} />
        ))}
      </ContainedTabs>
      <Box className="flex flex-wrap items-center justify-between gap-3">
        <Box className="max-w-[800px]">
          <DurationFilter label={''} defaultTimeFrame="all" duration={duration} setDuration={setDuration} showAll={true} />
        </Box>
        <ImportExportLinks
          permissions={permissions?.serializedAsset}
          module={'Service History'}
          api={`/history/asset-service/${id}`}
          afterImportCompleted={() => { }}
          onExportToExcelSuccess={() => { }}
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

export default ServiceHistory;
