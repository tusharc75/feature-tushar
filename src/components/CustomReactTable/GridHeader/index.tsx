import { Button, IconButton, useMediaQuery } from '@material-ui/core';
import RefreshIcon from '@material-ui/icons/Refresh';
import { useState } from 'react';
import { BiFilterAlt } from 'react-icons/bi';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import xlsx from 'xlsx-js-style';
import ArrangeView from '../ArrangeView';
import DisplayFilters from '../DisplayFilters';
import GridFilter from '../GridFilter';
import ShowFilteredRecordsOnly from '../ShowFilteredRecordsOnly';
import { IndeterminateCheckbox } from '../TableComponents/TableHelperComponents';
import { TInitialState } from '../hooks/useTableReducer';
import { camelCaseToWords, createJsonDataForTableExport, getExcelColumnNameFromRange } from '../utils';

import moment from 'moment';
import { ExportIcon } from 'src/assets/svg/svgIcons';
import { dateTimeFormat } from 'src/constants/helpers';

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
  reportSave,
  setSelectedReportView,
  selectedReportView,
  expander,
  state,
  exportTable = false
}) => {
  const { selectedRecords, loading, filters: customFilters, dataRows, page }: TInitialState = state;
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

  const handleTableExport = () => {
    const data = createJsonDataForTableExport(newColumns, dataRows);
    if (!data) return;
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(data);

    // for table head style
    for (const col of getExcelColumnNameFromRange(ws['!ref'])) {
      ws[`${col}1`].s = {
        font: {
          name: 'Calibri',
          bold: true
        }
      };
    }
    const name = `${camelCaseToWords(renderedFrom) || 'My Sheet'}-${moment().format(dateTimeFormat)}`;

    xlsx.utils.book_append_sheet(wb, ws, `Page-${(page ?? 0) + 1}`);
    xlsx.writeFile(wb, `${name}.xlsx`);
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
          {exportTable || isClientSideGrid ? (
            <HtmlTooltip title={dataRows.length === 0 ? 'Add some data first' : 'Export table to excel'} placement="top" arrow>
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
                  <ExportIcon />
                </IconButton>
              </span>
            </HtmlTooltip>
          ) : null}
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
