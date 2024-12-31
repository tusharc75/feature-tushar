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
import { createFilterData, createFilterSetData, fetchFieldOptions } from '../utils';
import { useUserTempFilters } from 'src/components/CustomReactTable/GridFilter/utils';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import DisplayFilterChip from 'src/pages/Reports/tables/DisplayFilterChip';

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

  const isMobileView = useMediaQuery('(max-width:768px)');

  const [selectedFilter, setSelectedFilter] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [coloums, setColoums] = useState(null);
  const [deepFilters, setDeepFilters] = useState([]);
  const [filterByIds, setFilterByIds] = useState([]);
  const [filterTerm, setFilterTerm] = useState({});

  const handleFilterOpen = () => {
    setIsFilterOpen(true);
  };

  const handleFilterClose = () => {
    setIsFilterOpen(false);
  };

  const handleApplyFilter = (filterByIdsP = filterByIds, deepFiltersP = deepFilters) => {
    const { filterById, deepFilter } = createFilterData(coloums, filterByIdsP, deepFiltersP, filterTerm);
    dispatch({ type: 'filter', filters: { filterByIds: filterById, deepFilters: deepFilter } });
    handleFilterClose();
  };

  useEffect(() => {
    if (!resource || !showFilters) return;
    const applyDefaultFilter = async () => {
      try {
        const responce: any = await axiosInstance().get(`/user-resource-filter?resource=${resource}`);
        const defaultFilter = responce?.data?.data.find((d) => d.default);
        if (defaultFilter) {
          const columns = await fetchFieldOptions({ resource, sidebarResource, toastConfig });
          if (columns.length === 0) return;
          const { filterById, deepFilter } = createFilterSetData(defaultFilter, columns);
          const { filterById: filterByIdP, deepFilter: deepFilterP } = createFilterData(coloums, filterById, deepFilter, defaultFilter?.filterTerm);
          setSelectedFilter(defaultFilter);
          setFilterByIds(filterById);
          setDeepFilters(deepFilter);
          setFilterTerm(defaultFilter?.filterTerm || {});
          dispatch({ type: 'filter', filters: { filterByIds: filterByIdP, deepFilters: deepFilterP } });
          if (defaultFilter.sortBy && deepFilterP?.length > 0) {
            dispatch({
              type: 'sort',
              sorting: [{ colId: defaultFilter.sortBy, sort: defaultFilter.orderBy ?? 'asc' }],
              loading: isClientSideGrid ? false : true
            });
          }
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
          <DisplayFilterChip
            filterTerm={filterTerm}
            resourceColumns={coloums ? coloums : []}
            deepFilters={deepFilters}
            filterByIds={filterByIds}
            fetchResourceData={(deepFilter, filterById) => {
              handleApplyFilter(filterById, deepFilter);
            }}
            setDeepFilters={setDeepFilters}
            setFilterByIds={setFilterByIds}
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
