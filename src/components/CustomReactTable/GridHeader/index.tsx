import { useState } from 'react';
import RefreshIcon from '@material-ui/icons/Refresh';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { Button, IconButton, useMediaQuery } from '@material-ui/core';
import GridFilter from '../GridFilter';
import { IndeterminateCheckbox } from '../TableComponents/TableHelperComponents';
import { BiFilterAlt } from 'react-icons/bi';
import ArrangeView from '../ArrangeView';
import ShowFilteredRecordsOnly from '../ShowFilteredRecordsOnly';
import DisplayFilters from '../DisplayFilters';
import { TInitialState } from '../hooks/useTableReducer';

const GridHeader = ({
  resource,
  dispatch,
  renderedFrom,
  showOnlyShowFilteredRecordSwitch,
  hideSelection,
  showFilters,
  table,
  showArrangeView,
  newColumns,
  refreshGrid,
  reportSave,
  setSelectedReportView,
  selectedReportView,
  expander,
  state
}) => {
  const { selectedRecords, loading, filters: customFilters }: TInitialState = state;
  const isMobileView = useMediaQuery('(max-width:768px)');

  const [selectedFilter, setSelectedFilter] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentFomValue, setCurrentFomValue] = useState({});

  const handleFilterOpen = () => {
    setIsFilterOpen(true);
  };

  const handleFilterClose = () => {
    setIsFilterOpen(false);
  };

  return (
    <div className={`flex items-center justify-between my-[8px] gap-[8px] flex-wrap`}>
      <div className="flex-grow">
        <div className="table-filter-v1">
          <ShowFilteredRecordsOnly
            dispatchTable={dispatch}
            showOnlyShowFilteredRecordSwitch={showOnlyShowFilteredRecordSwitch && !hideSelection}
            selectedRecords={selectedRecords?.length}
          />
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
      <div className="buttons flex flex-wrap gap-[8px] justify-between w-full min-[768px]:w-[unset] ml-auto">
        <div className="buttons flex flex-wrap gap-[8px]">
          {isMobileView && !hideSelection && (
            <>
              <label className="flex items-center gap-2 cursor-pointer ml-[13px]">
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
                style={{ marginRight: '8px', color: '#424242' }}
                startIcon={<BiFilterAlt />}
                size={'small'}
                variant="outlined"
                className="btn-outline-v1 light "
                onClick={handleFilterOpen}
              >
                Filter
              </Button>
            </HtmlTooltip>
          )}
          {showArrangeView && (
            <ArrangeView
              columns={newColumns}
              hideSelection={hideSelection}
              renderedFrom={renderedFrom}
              setSelectedReportView={setSelectedReportView}
              selectedReportView={selectedReportView}
              reportSave={reportSave}
              dispatchTable={dispatch}
              state={state}
              expander={expander}
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
