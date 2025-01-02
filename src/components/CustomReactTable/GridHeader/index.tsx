import { IconButton, useMediaQuery } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import React, { useContext, useEffect, useState } from 'react';
import { BiFilterAlt } from 'react-icons/bi';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { sidebarResource } from 'src/constants/helpers';
import ArrangeView from '../ArrangeView';
import GridFilter from '../GridFilter';
import ShowFilteredRecordsOnly from '../ShowFilteredRecordsOnly';
import { IndeterminateCheckbox } from '../TableComponents/TableHelperComponents';
import { TInitialState } from '../hooks/useTableReducer';
import { Table } from '@tanstack/react-table';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { ExportIcon } from 'src/assets/svg/svgIcons';
import axiosInstance from 'src/axios/axiosInstance';
import { createFilterData, createFilterSetData, fetchFieldOptions, filtermodelToFormValue } from '../utils';
import { useUserTempFilters } from 'src/components/CustomReactTable/GridFilter/utils';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import DisplayFilters from 'src/components/CustomReactTable/DisplayFilters';

type GridHeaderProps = {
  resource: any;
  isClientSideGrid: any;
  dispatch: any;
  renderedFrom: any;
  showOnlyShowFilteredRecordSwitch: any;
  hideSelection: any;
  showFilters: any;
  table: Table<any>;
  showArrangeView: any;
  newColumns: any;
  refreshGrid: any;
  setSelectedReportView: any;
  selectedReportView: any;
  expander: any;
  state: any;
  handleTableExport: () => void;
  hideExportTable: boolean;
  topLeftSlot: React.ReactNode;
};

const GridHeader = ({
  resource,
  isClientSideGrid,
  dispatch,
  renderedFrom,
  showOnlyShowFilteredRecordSwitch,
  hideSelection,
  showFilters,
  table,
  showArrangeView,
  newColumns,
  refreshGrid,
  setSelectedReportView,
  selectedReportView,
  expander,
  state,
  handleTableExport,
  hideExportTable = false,
  topLeftSlot = null
}: GridHeaderProps) => {
  const toastConfig = useContext(CustomToastContext);
  const { selectedRecords, loading, filters: customFilters, dataRows }: TInitialState = state;
  const { getTempFilter, setTempFilter } = useUserTempFilters();

  const isMobileView = useMediaQuery('(max-width:768px)');

  const [selectedFilter, setSelectedFilter] = useState(null);
  const [currentFomValue, setCurrentFomValue] = useState({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [coloums, setColoums] = useState(null);
  const [deepFilters, setDeepFilters] = useState([]);
  const [filterByIds, setFilterByIds] = useState([]);
  const [filterTerm, setFilterTerm] = useState({});

  useEffect(() => {
    const filters = getTempFilter(resource);
    if (filters) {
      if (filters.formValues) setCurrentFomValue(filters.formValues);
      if (filters.filters) dispatch({ type: 'filter', filters: filters.filters });
    }
  }, [dispatch, resource]);

  const handleFilterOpen = () => {
    setIsFilterOpen(true);
  };

  const handleFilterClose = () => {
    setIsFilterOpen(false);
  };

  const handleApplyFilter = () => {
    const filters = createFilterData(coloums, filterByIds, deepFilters, filterTerm);
    const fromValue = filtermodelToFormValue(filters);
    dispatch({ type: 'filter', filters });
    setTempFilter(resource, { formValues: fromValue || {}, filters });
    setCurrentFomValue(fromValue);
    handleFilterClose();
  };

  useEffect(() => {
    if (!resource || !showFilters) return;
    const filters = getTempFilter(resource);
    const applyDefaultFilter = async () => {
      try {
        const responce: any = await axiosInstance().get(`/user-resource-filter?resource=${resource}`);
        const defaultFilter = responce?.data?.data.find((d) => d.default);
        if (defaultFilter) {
          const columns = await fetchFieldOptions({ resource, sidebarResource, toastConfig });
          if (columns.length === 0) return;
          const { filterById, deepFilter } = createFilterSetData(defaultFilter, columns);
          setSelectedFilter(defaultFilter);
          setFilterByIds(filterById);
          setDeepFilters(deepFilter);
          setFilterTerm(defaultFilter?.filterTerm || {});
          let deepFilterP;
          if (defaultFilter?.filterValue) deepFilterP = createFilterData(coloums, filterById, deepFilter, defaultFilter?.filterTerm);
          if (defaultFilter && deepFilterP) {
            dispatch({ type: 'filter', filters: deepFilterP });
            if (defaultFilter.sortBy) {
              dispatch({
                type: 'sort',
                sorting: [{ colId: defaultFilter.sortBy, sort: defaultFilter.orderBy ?? 'asc' }],
                loading: isClientSideGrid ? false : true
              });
            }
          }
        } else if (filters) {
          if (filters.formValues) setCurrentFomValue(filters.formValues);
          if (filters.filters) dispatch({ type: 'filter', filters: filters.filters });
        }
      } catch (error) {
        toastConfig.setToastConfig(error);
      }
    };
    applyDefaultFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource]);

  return (
    <div className={`my-[8px] flex flex-wrap items-center justify-between gap-[8px]`}>
      <div className="flex-grow">
        <div className="table-filter-v1">
          {(isClientSideGrid || selectedRecords?.length <= 200) && (
            <ShowFilteredRecordsOnly
              dispatchTable={dispatch}
              showOnlyShowFilteredRecordSwitch={showOnlyShowFilteredRecordSwitch && !hideSelection}
              selectedRecords={selectedRecords?.length}
            />
          )}
          {topLeftSlot}
          <DisplayFilters
            columns={newColumns}
            customColumns={coloums}
            customFilters={customFilters}
            dispatchTable={dispatch}
            showFilters={showFilters}
            handleFilterOpen={handleFilterOpen}
            selectedFilter={selectedFilter}
            setSelectedFilter={setSelectedFilter}
            currentFomValue={currentFomValue}
            setCurrentFomValue={setCurrentFomValue}
            resource={resource}
            filterByIds={filterByIds}
            setFilterByIds={setFilterByIds}
            deepFilters={deepFilters}
            setDeepFilters={setDeepFilters}
            filterTerm={filterTerm}
            setFilterTerm={setFilterTerm}
          />
        </div>
        {isFilterOpen && (
          <GridFilter
            resource={resource}
            handleClose={handleFilterClose}
            coloums={coloums}
            setColoums={setColoums}
            deepFilters={deepFilters}
            setDeepFilters={setDeepFilters}
            filterByIds={filterByIds}
            setFilterByIds={setFilterByIds}
            filterTerm={filterTerm}
            setFilterTerm={setFilterTerm}
            handleApplyFilter={handleApplyFilter}
            selectedFilter={selectedFilter}
          />
        )}
      </div>
      <div className="buttons ml-auto flex w-full flex-wrap justify-between gap-[8px] min-[768px]:w-[unset]">
        <div className="buttons flex flex-wrap gap-[8px]">
          {isMobileView && !hideSelection && (
            <>
              <label className="ml-[13px] flex cursor-pointer items-center gap-2">
                <IndeterminateCheckbox
                  {...{
                    checked: table.getIsAllRowsSelected(),
                    indeterminate: table.getIsSomeRowsSelected(),
                    onChange: table.getToggleAllRowsSelectedHandler()
                  }}
                  className="mx-auto text-center [&_svg]:[font-size:20px] "
                />
                <span>Select All</span>
              </label>
            </>
          )}
        </div>
        <div className="buttons flex flex-wrap gap-[8px] ">
          {showFilters && (
            <ThemeButton
              onClick={handleFilterOpen}
              startIcon={<BiFilterAlt />}
              tooltip="Apply Filters"
              mobileTooltip="Apply Filters"
              iconForMobile={<BiFilterAlt />}
            >
              {'Filters'}
            </ThemeButton>
          )}
          {!hideExportTable && isClientSideGrid ? (
            <HtmlTooltip title={dataRows.length === 0 ? 'No Data to Export' : 'Export to Excel'} placement="top" arrow>
              <span>
                <IconButton
                  className={`refresh-arrange-button`}
                  color="primary"
                  disabled={loading || dataRows.length === 0}
                  size="small"
                  onClick={() => {
                    handleTableExport();
                  }}
                >
                  <ExportIcon fontSize="small" />
                </IconButton>
              </span>
            </HtmlTooltip>
          ) : null}
          {showArrangeView && (
            <ArrangeView
              table={table}
              columns={newColumns}
              hideSelection={hideSelection}
              renderedFrom={renderedFrom}
              dispatchTable={dispatch}
              state={state}
              expander={expander}
              appliedView={null}
            />
          )}
          {refreshGrid && (
            <HtmlTooltip title="Refresh" placement="top" arrow>
              <IconButton
                className={`refresh-arrange-button`}
                color="primary"
                disabled={loading}
                size="small"
                onClick={() => {
                  refreshGrid();
                }}
              >
                <RefreshIcon style={{ fontSize: '20px' }} />
              </IconButton>
            </HtmlTooltip>
          )}
        </div>
      </div>
    </div>
  );
};

export default GridHeader;
