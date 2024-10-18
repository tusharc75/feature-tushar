import { Button, IconButton, useMediaQuery } from '@material-ui/core';
import RefreshIcon from '@material-ui/icons/Refresh';
import { useContext, useEffect, useState } from 'react';
import { BiFilterAlt } from 'react-icons/bi';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import ArrangeView from '../ArrangeView';
import DisplayFilters from '../DisplayFilters';
import GridFilter from '../GridFilter';
import ShowFilteredRecordsOnly from '../ShowFilteredRecordsOnly';
import { IndeterminateCheckbox } from '../TableComponents/TableHelperComponents';
import { TInitialState } from '../hooks/useTableReducer';
import { sidebarResource } from 'src/constants/helpers';

import { Table } from '@tanstack/react-table';
import { ExportIcon } from 'src/assets/svg/svgIcons';
import { createFilterModel, fetchFieldOptions } from '../utils';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import { FiltersContext } from 'src/StateProvider/FiltersContext/FiltersContext';
import { isEmpty } from 'lodash';

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
  hideExportTable = false
}: GridHeaderProps) => {
  const toastConfig = useContext(CustomToastContext);
  const { selectedRecords, loading, filters: customFilters, dataRows }: TInitialState = state;

  const isMobileView = useMediaQuery('(max-width:768px)');

  const [selectedFilter, setSelectedFilter] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentFomValue, setCurrentFomValue] = useState({});

  const { savedFilters } = useContext(FiltersContext);

  const handleFilterOpen = () => {
    setIsFilterOpen(true);
  };

  const handleFilterClose = () => {
    setIsFilterOpen(false);
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
          setSelectedFilter(defaultFilter);
          let deepFilter;
          if (defaultFilter?.filterValue) deepFilter = createFilterModel(defaultFilter?.filterValue, columns);
          if (defaultFilter && deepFilter) {
            dispatch({ type: 'filter', filters: deepFilter });
            if (defaultFilter.sortBy) {
              dispatch({
                type: 'sort',
                sorting: [{ colId: defaultFilter.sortBy, sort: defaultFilter.orderBy ?? 'asc' }],
                loading: isClientSideGrid ? false : true
              });
            }
          }
        } else if (!isEmpty(savedFilters[resource]) && !isClientSideGrid) {
          dispatch({ type: 'filter', filters: savedFilters[resource] });
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
          <DisplayFilters
            columns={newColumns}
            customFilters={customFilters}
            dispatchTable={dispatch}
            showFilters={showFilters}
            handleFilterOpen={handleFilterOpen}
            selectedFilter={selectedFilter}
            setSelectedFilter={setSelectedFilter}
            currentFomValue={currentFomValue}
            setCurrentFomValue={setCurrentFomValue}
            resource={resource}
          />
        </div>
        {isFilterOpen && (
          <GridFilter
            resource={resource}
            customFilters={customFilters}
            handleClose={handleFilterClose}
            setSelectedFilter={setSelectedFilter}
            selectedFilter={selectedFilter}
            currentFomValue={currentFomValue}
            setCurrentFomValue={setCurrentFomValue}
            dispatch={dispatch}
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
            <HtmlTooltip title="Apply Filters" placement="top" arrow>
              <Button
                startIcon={isMobileView ? null : <BiFilterAlt />}
                size={'small'}
                variant={isMobileView ? 'text' : 'outlined'}
                className={`btn-outline-v1 light with-border`}
                onClick={handleFilterOpen}
              >
                <span className={isMobileView ? 'sr-only' : ''}>Filter</span>
                {isMobileView ? <BiFilterAlt /> : ''}
              </Button>
            </HtmlTooltip>
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
