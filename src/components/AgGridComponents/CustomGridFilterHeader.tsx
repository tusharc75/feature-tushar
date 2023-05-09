import React, { useState, useEffect, useRef, useContext, useImperativeHandle, useMemo } from 'react';
import { BiFilterAlt } from 'react-icons/bi';
import { Chip, Button, Tooltip } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import { CustomOfflineContext } from '../../StateProvider/OfflineContext/OfflineContext';
import _ from 'lodash';

import GridFilter from '../GridFilter';

// OTHER COMPONENTS
import { RefreshButton, ArrangeView, ShowOnlySelected } from './GridButtons';
import HtmlTooltip from '../CustomTooltipTitle';
import moment from 'moment';

const CustomGridFilterHeader = (props) => {
  const {
    showFilters,
    resource,
    currentGridApi,
    refreshGrid,
    setSelectedReportView,
    selectedReportView,
    reportSave,
    columns,
    setColumns,
    columnApi,
    renderedFrom,
    isClientSideGrid,
    buttonGap = '8px',
    dispatch,
    showOnlyShowFilteredRecordSwitch = false,
    selectedRecords = null
  } = props;
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [chipData, setChipData] = useState([]);
  const [currentFomValue, setCurrentFomValue] = useState({});
  const { isOffline } = useContext(CustomOfflineContext);
  const [isFilterPresent, setIsFilterPresent] = useState<boolean>(false);

  const handleFilterOpen = () => {
    setIsFilterOpen(true);
  };

  const handleFilterClose = () => {
    setIsFilterOpen(false);
  };

  const clearSingleFilter = (name) => {
    currentGridApi.destroyFilter(name);
    currentGridApi.onFilterChanged();
    let formValues = { ...currentFomValue };
    delete formValues[name];
    setCurrentFomValue(formValues);
    setChipData((prev) => prev.filter((item) => item.name !== name));
  };

  const clearFilterAll = () => {
    currentGridApi.setFilterModel({});
    setSelectedFilter(null);
    setChipData([]);
    setCurrentFomValue({});
  };

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '15px', margin: '8px', justifyContent: 'space-between' }}>
        <div
          className="table-filter-v1"
          style={{ flexBasis: isFilterPresent ? '766px' : 'unset', maxWidth: isFilterPresent ? '766px' : 'unset', paddingRight: '52px' }}
        >
          {showOnlyShowFilteredRecordSwitch && (
            <ShowOnlySelected dispatch={dispatch} renderedFrom={renderedFrom} selectedRecords={selectedRecords} style={{ padding: '0px 0 10px' }} />
          )}
          {showFilters && (
            <DisplyaFilters
              selectedFilter={selectedFilter}
              chipData={chipData}
              setChipData={setChipData}
              currentGridApi={currentGridApi}
              handleFilterOpen={handleFilterOpen}
              clearSingleFilter={clearSingleFilter}
              clearFilterAll={clearFilterAll}
              setIsFilterPresent={setIsFilterPresent}
            />
          )}
        </div>
        <div style={{ marginInlineStart: 'auto' }}>
          {showFilters && (
            <HtmlTooltip title="Apply Filters" placement="top">
              <Button
                style={{ marginRight: buttonGap, color: '#424242' }}
                startIcon={<BiFilterAlt />}
                size={'small'}
                className="btn-outline-v1 light "
                onClick={handleFilterOpen}
              >
                Filter
              </Button>
            </HtmlTooltip>
          )}
          <ArrangeView
            setSelectedReportView={setSelectedReportView}
            selectedReportView={selectedReportView}
            reportSave={reportSave}
            columns={columns}
            setColumns={setColumns}
            columnApi={columnApi}
            renderedFrom={renderedFrom}
            isClientSideGrid={isClientSideGrid}
            dispatch={dispatch}
            style={{ marginRight: buttonGap }}
          />
          <RefreshButton isOffline={isOffline} refreshGrid={refreshGrid} />
        </div>
      </div>

      {/* ALL MODALS */}
      {isFilterOpen && (
        <GridFilter
          resource={resource}
          currentGridApi={currentGridApi}
          handleClose={handleFilterClose}
          setSelectedFilter={setSelectedFilter}
          selectedFilter={selectedFilter}
          // setChipData={setChipData}
          currentFomValue={currentFomValue}
          setCurrentFomValue={setCurrentFomValue}
        />
      )}
    </>
  );
};

export default CustomGridFilterHeader;

// THIS COMPONENT WILL DISPLAY CHIPS ===============================>
const DisplyaFilters = (props) => {
  const { chipData, setChipData, selectedFilter, handleFilterOpen, clearSingleFilter, clearFilterAll, currentGridApi, setIsFilterPresent } = props;
  const [hiddenItems, setHiddenItems] = useState(0);
  const isAppliedFilterPresent = React.useMemo(() => Object.keys(selectedFilter || {}).length > 0, [selectedFilter]);
  const oldModalRef = React.useRef(null);

  const containerRef = useRef(null);
  const countRef = useRef(null);
  const COUNT_PADDING = 10;

  useEffect(() => {
    setHiddenItems(0);
    if (containerRef?.current) {
      hideElementAndShowNumber(containerRef.current);
    }
  }, [chipData]);

  // currentGridApi.addEventListener
  const chipDataSetter = (currentGridApi, filterModel) => {
    if (filterModel) {
      const keys = Object.keys(filterModel);
      const filterData = [];
      for (let i = 0; i < keys.length; i++) {
        const element = filterModel[keys[i]];
        const currentColumn = currentGridApi.getColumnDef(keys[i]);
        if (currentColumn.cellRenderer === 'dateRenderer') {
          const dateValue =
            element.filter.from && element.filter.to
              ? `${element.filter.from ? element.filter.from : null} - ${element.filter.to ? element.filter.to : null}`
              : element.filter.from || element.filter.to
              ? `${element.filter.from ? `${element.filter.from} (From Date)` : ''} ${element.filter.to ? `${element.filter.to} (To Date)` : ''}`
              : null;
          const data = { title: currentColumn?.headerName || _.startCase(keys[i]), value: dateValue, name: keys[i] };
          filterData.push(data);
          continue;
        }
        const data = { title: currentColumn?.headerName || _.startCase(keys[i]), value: element.filter, name: keys[i] };
        filterData.push(data);
      }
      setChipData(filterData);
    }
  };

  const filterModel = React.useMemo(() => {
    return currentGridApi?.getFilterModel();
  }, [currentGridApi, currentGridApi?.getFilterModel()]);

  useEffect(() => {
    if (currentGridApi && filterModel) {
      if (!oldModalRef.current || !_.isEqual(filterModel, oldModalRef.current || {})) oldModalRef.current = filterModel;
      chipDataSetter(currentGridApi, filterModel);
    }
  }, [currentGridApi, _.isEqual(filterModel, oldModalRef.current || {})]);

  const hideElementAndShowNumber = (container) => {
    const childItems = [...container?.children];

    childItems.forEach((item) => (item.style.display = 'inline-flex'));
    let lastVisibleItem = null;
    const hiddenItems = [];
    for (let i = 0; i < childItems.length; i++) {
      const item = childItems[i] as HTMLDivElement;
      const isOverlapping = item.getBoundingClientRect().right >= container.getBoundingClientRect().right - COUNT_PADDING;
      if (isOverlapping) {
        hiddenItems.push(item);
        if (!lastVisibleItem) {
          lastVisibleItem = childItems[i - 1];
        }
      }
    }
    hiddenItems.forEach((item) => (item.style.display = 'none'));

    const count = hiddenItems.length;
    setHiddenItems(count);

    const deltaX = lastVisibleItem?.offsetLeft + lastVisibleItem?.clientWidth;

    if (countRef.current) {
      countRef.current.style.cssText = `
      left: ${deltaX + COUNT_PADDING}px;
      display: ${count === 0 ? 'none' : 'block'};
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      cursor: pointer;
      `;
    }
  };

  useEffect(() => {
    if (isAppliedFilterPresent || chipData?.length > 0) {
      setIsFilterPresent(true);
    } else {
      setIsFilterPresent(false);
    }
  }, [isAppliedFilterPresent, chipData]);

  return (
    <div className="">
      {isAppliedFilterPresent ? (
        <div className="chip-container">
          <Chip
            onClick={handleFilterOpen}
            className={'filter-chip'}
            deleteIcon={<CloseIcon />}
            label={selectedFilter?.title}
            onDelete={clearFilterAll}
          />
        </div>
      ) : (
        chipData?.length > 0 && (
          <div className="chip-container" style={{ paddingRight: `${55 + COUNT_PADDING}px` }}>
            <div className={'chip-group'} ref={containerRef}>
              {chipData?.map((filter) => (
                <Chip
                  onClick={handleFilterOpen}
                  className={'filter-chip'}
                  deleteIcon={<CloseIcon />}
                  label={`${filter?.title}=${filter?.value}`}
                  onDelete={() => clearSingleFilter(filter.name)}
                />
              ))}
            </div>

            <div
              ref={countRef}
              style={{ cursor: 'pointer', position: 'absolute', top: '50%', transform: 'translateY(-50%)' }}
              onClick={handleFilterOpen}
            >
              +{hiddenItems} more
            </div>
          </div>
        )
      )}
    </div>
  );
};
