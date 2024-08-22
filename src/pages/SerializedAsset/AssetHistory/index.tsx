import { useState, useEffect, useContext } from 'react';
import { Box } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { Link } from 'react-router-dom';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import { dateTimeFormat, isObjectEmpty, serializedAsset, sidebarResource } from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';
import DurationFilter from 'src/components/DurationFilter';
import moment from 'moment';
import CustomReactTable, { gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { camelCase, cloneDeep, uniq } from 'lodash';
import ImportExportLinks from 'src/components/Helpers/ImportExportLinks';

const AssetHistory = ({ id, status, resourceData, fields }) => {
  const renderedFrom = `${camelCase(routes?.serializedAsset.title)}_assetHistory`;

  const toastConfig = useContext(CustomToastContext);
  const { generateColumns } = useColumns();
  const { state, dispatch } = useTableReducer();
  const [duration, setDuration] = useState({
    from: new Date(moment().startOf('year').calendar()),
    to: new Date(moment().endOf('year').calendar())
  });
  const [column, setColumn] = useState([]);

  const {
    state: { permissions }
  }: any = useData();

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
                to={`${routes.workOrderDetail.path}/${row.original.referenceId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {row.original.reference}
              </Link>
            ) : row.original.type === 'Repair Order' ? (
              <Link
                className="link"
                title={row.original.reference}
                to={`${routes.repairOrderDetail.path}/${row.original.referenceId}`}
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
      Cell: ({ row }) => (row.original?.comments ? <div>{row.original?.comments}</div> : <NoDataCell />)
    },
    {
      accessor: 'warehouse',
      Header: routes.warehouse.title,
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
  }, [id, status, page, limit, filters, sorting, duration]);

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}`;
    const { deepFilters } = gridFilterParser(filters);

    if (duration) {
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

  return (
    <Box>
      <Box className="flex flex-wrap items-center justify-between gap-3">
        <Box className="max-w-[800px]">
          <DurationFilter label={''} defaultTimeFrame="current-year" duration={duration} setDuration={setDuration} />
        </Box>
        <ImportExportLinks
          permissions={permissions?.history}
          module={'Asset History'}
          api={`/history/inventory/${id}`}
          afterImportCompleted={() => { }}
          onExportToExcelSuccess={() => { }}
          additionalParams={getQueryString()}
          onlyExport={true}
        />
      </Box>

      {column ? (
        <CustomReactTable
          height={'calc(100vh - 250px)'}
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
