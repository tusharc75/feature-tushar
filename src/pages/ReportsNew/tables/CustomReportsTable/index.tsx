import MomentUtils from '@date-io/moment';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import axios from 'axios';
import { camelCase, kebabCase, startCase } from 'lodash';
import React from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import AsynImportExportMenu from 'src/components/AsynImportExportMenu';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { cn, downloadExcel, gridLoadingTimeout, prepareDataForGrid, primaryFields, REPORT_LIST } from 'src/constants/helpers';
import { TableCommonProps } from 'src/pages/ReportsNew/types';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

let cancelTokenSource = null;

const CustomReportsTable = ({ state: reportState, isMobile, isSidebarOpen }: TableCommonProps) => {
  const toastConfig = React.useContext(CustomToastContext);
  const { generateColumns } = useColumns();
  const {
    selectedReport,
    columns,
    resourceColumns,
    setColumns,
    setResourceColumns,
    setIsColumnsLoading,
    permissions,
    isColumnsLoading,
    selectedEntity
  } = reportState;
  const id = selectedReport.resource;
  const renderedFrom = `custom-report_${id}`;

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, sorting, search, limit, filters, pageSizes, visibleColumns } = state;
  const [showGrid, setShowGrid] = React.useState(true);
  // const [deepFilters, setDeepFilters] = useState([]);
  // const [filterByIds, setFilterByIds] = useState([]);
  // const [filterTerm, setFilterTerm] = useState({});
  // const [defaultColumns, setDefaultColumns] = React.useState([]);

  const [isExporting, setExporting] = React.useState(false);
  const [customReportData, setCustomReportData] = React.useState(null);
  const [resource, setResource] = React.useState('');
  const [selectedData, setSelectedData] = React.useState(null);
  const [selectedResources, setSelectedResources] = React.useState([]);

  const fetchGridColumns = async (res) => {
    let result = [];
    setIsColumnsLoading(true);
    if (REPORT_LIST?.find((r) => r?.title === startCase(res))?.key === 'standardReport') {
      let {
        data: {
          data: { columnFields }
        }
      } = await axiosInstance().get(`/report/${kebabCase(REPORT_LIST?.find((r) => r?.title === startCase(res))?.type)}/column`);

      result = columnFields;
    } else {
      const {
        data: { data }
      }: any = await axiosInstance().get(`/field?resource=${startCase(res)}`);
      if (startCase(res) === 'Serialized Asset') {
        const {
          data: { data: lookupResource }
        } = await axiosInstance().get(`/sa-formbuilder/lookup?lookupResource=Customer Account,Supplier Account`);
        if (lookupResource) {
          data?.forEach((e) => {
            if (e?.fieldData?.fieldName === 'currentOwner') {
              e.fieldData.lookup = true;
              e.fieldData.option = [...lookupResource?.[`Customer Account`], ...lookupResource?.[`Supplier Account`]];
            }
          });
        }
      }
      result = data;
    }

    setResourceColumns(result);
    setIsColumnsLoading(false);
    let columns = [];

    result.forEach((o) => {
      if (o?.fieldData?.fieldName === primaryFields[camelCase(res) === 'quotes' ? 'quoteBuilder' : camelCase(res)]) {
        o.fieldData.primaryField = true;
      }
    });
    let newColumns = generateColumns(
      renderedFrom,
      result,
      camelCase(res) === 'quotes' ? routes['quoteBuilder']?.path : routes[`${camelCase(res)}Detail`] ? routes[`${camelCase(res)}Detail`]?.path : null,
      true
    );
    columns = [...newColumns, ...getStaticFields()];

    if (startCase(res) === 'Purchase Order') {
      columns.splice(1, 0, {
        accessor: 'poAmount',
        Header: 'Purchase Order Amount',
        width: 200,
        Cell: ({ row }) => {
          return row.original?.poAmount ? <p className="text-truncate">{row.original.poAmount}</p> : <NoDataCell />;
        }
      });
    }
    setColumns([...columns]);
    setIsColumnsLoading(false);
  };

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}`;
    if (isExport) {
      deepFilter = `?`;
    }

    const { deepFilters } = gridFilterParser(filters);

    let customDeepFilter = [...deepFilters];
    customReportData?.filters?.forEach((filter: any) => {
      if (filter?.type === 'checkBox') {
        customDeepFilter.push({
          field: filter.term,
          term: filter.value ? 'Yes' : 'No'
        });
      } else {
        customDeepFilter.push({
          field: filter.term,
          term: filter.value
        });
      }
    });

    if (customDeepFilter?.length) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(customDeepFilter))}`;
    }
    if (customDeepFilter?.length) {
      deepFilter = `${deepFilter}&filterType=and`;
    }
    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }
    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURIComponent(search)}`;
    }
    return deepFilter;
  };

  const fetchResourceData = () => {
    setShowGrid(true);
    let queryString = getQueryString();
    if (cancelTokenSource) {
      cancelTokenSource.cancel();
    }
    cancelTokenSource = axios.CancelToken.source();
    dispatch({ type: 'loading', loading: true });
    const api = `/report${
      camelCase(resource) === 'quotes'
        ? '/quote-builder'
        : routes[camelCase(resource)]
          ? routes[camelCase(resource)]?.path
          : `/${kebabCase(REPORT_LIST?.find((r) => r?.title === resource)?.type)}`
    }${queryString}`;

    axiosInstance()
      .get(api, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data, count, columns } }) => {
        if (camelCase(resource) === 'numberOfAssetsByStatus') {
          setIsColumnsLoading(true);
          setResourceColumns(columns);
          let col = [];
          let newColumns = generateColumns(renderedFrom, columns, null, true);
          col = [...newColumns, ...getStaticFields()];
          setColumns([...col]);
          setIsColumnsLoading(false);
        }
        data = data.map((u: any) => {
          let finalObject = prepareDataForGrid(u);
          return finalObject;
        });
        dispatch({ type: 'initialize', data: data, count: count });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((err) => {
        if (!axios.isCancel(err)) {
          setTimeout(() => {
            dispatch({ type: 'loading', loading: false });
          }, gridLoadingTimeout);
          toastConfig.setToastConfig(err);
        }
      });
  };

  const exportData = () => {
    if (isExporting) return;
    toastConfig.setToastConfig({
      open: true,
      message: 'Please wait exporting data',
      type: 'info'
    });
    let exportColumns = [];
    exportColumns =
      customReportData?.column && customReportData?.column.length > 0
        ? columns.filter((col) => customReportData?.column.includes(col.accessor)).map((col) => col.accessor)
        : columns.map((col) => col.accessor);
    setExporting(true);
    let queryString = getQueryString(true);
    axiosInstance()
      .get(
        `/report/${
          camelCase(resource) === 'quotes'
            ? 'quote-builder'
            : routes[camelCase(resource)]
              ? routes[camelCase(resource)]?.path
              : `${kebabCase(REPORT_LIST?.find((r) => r?.title === resource)?.type)}`
        }/export?exportColumn=${JSON.stringify(exportColumns)}&export=1&${queryString}`,
        {
          responseType: 'arraybuffer'
        }
      )
      .then((res) => {
        const fileName = res.headers['content-disposition'].split('filename=')[1];
        downloadExcel(res.data, fileName);
        setExporting(false);
        toastConfig.setToastConfig({
          open: true,
          message: 'Successfully Exported',
          type: 'success'
        });
      })
      .catch((err) => {
        setExporting(false);
        toastConfig.setToastConfig(err);
      });
  };

  const getApi = () => {
    let exportColumns = [];
    exportColumns =
      customReportData?.column && customReportData?.column.length > 0
        ? columns?.filter((col) => customReportData?.column.includes(col.accessor))?.map((col) => col.accessor)
        : columns?.map((col) => col.accessor);
    let queryString = getQueryString(true);
    let resourceCamelCase = camelCase(resource);
    let resourcePath = resourceCamelCase === 'quotes' ? 'quote-builder' : routes[resourceCamelCase] ? routes[resourceCamelCase]?.path : ``;
    return `/report${resourcePath}/export?exportColumn=${JSON.stringify(exportColumns)}&${queryString}`;
  };

  React.useEffect(() => {
    if (id) {
      (async () => {
        let {
          data: { data }
        } = await axiosInstance().get(`custom-report/${id}`);
        setCustomReportData(data);
        setResource(data.resource);
        fetchGridColumns(data.resource);
      })();
    }
  }, [id]);

  React.useEffect(() => {
    if (showGrid && resource) {
      fetchResourceData();
    }
  }, [resource, page, sorting, search, limit, filters, selectedEntity, customReportData, pageSizes]);

  React.useEffect(() => {
    if (!selectedData) return;
    setSelectedData((prevState: any) => {
      const dataKeys = Object.keys(prevState);
      const selectedKeys = Object.keys(selectedResources);
      if (selectedResources.length > 0 && dataKeys.length > 0) {
        dataKeys.forEach((key) => {
          if (selectedKeys.includes(key) && prevState?.hasOwnProperty(key)) {
            delete prevState[key];
          }
        });
      }
      return prevState;
    });
  }, [selectedData, selectedResources]);

  return (
    <MuiPickersUtilsProvider utils={MomentUtils}>
      {showGrid && (
        <div className={cn('inline-flex items-center justify-between gap-2', !isSidebarOpen ? 'w-[calc(100%-40px)]' : 'w-full')}>
          <h6 className="text-[14px] font-semibold leading-[24px]">{selectedReport.title}</h6>
          {['dynamic', 'inUsedSerializedAsset']?.includes(REPORT_LIST?.find((r) => r?.title === resource)?.type) ? (
            <AsynImportExportMenu
              resource={resource}
              subResource={'report'}
              permissions={
                resource === 'In Used Serialized Asset'
                  ? permissions?.report
                  : permissions[camelCase(resource) === 'quotes' ? 'quoteBuilder' : camelCase(resource)]
              }
              module={''}
              api={resource === 'In Used Serialized Asset' ? `/report/${kebabCase(resource)}` : getApi()}
              afterImportCompleted={() => {}}
              onlyExport={true}
            />
          ) : (
            <ThemeButton
              iconForMobile={false}
              variant="outlined"
              size="small"
              disabled={isExporting}
              onClick={exportData}
              className={`btn-outline-v-1`}
            >
              Export All
            </ThemeButton>
          )}
        </div>
      )}
      {columns ? (
        <CustomReactTable
          height={'calc(100vh - 270px)'}
          columns={
            customReportData?.column && customReportData?.column.length > 0
              ? columns.filter((col) => customReportData?.column.includes(col.accessor))
              : columns
          }
          state={state}
          dispatch={dispatch}
          renderedFrom={renderedFrom}
          refreshGrid={fetchResourceData}
          hideAction={true}
          hideSelection={true}
        />
      ) : (
        <div className="h-[500px] p-4">
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </div>
      )}
    </MuiPickersUtilsProvider>
  );
};

export default CustomReportsTable;
