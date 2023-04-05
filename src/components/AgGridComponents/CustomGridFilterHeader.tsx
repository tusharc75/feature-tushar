import React, { useState, useEffect, useRef, useContext } from 'react';
import { BiFilterAlt } from 'react-icons/bi';
import { Chip, Button, Tooltip } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import { CustomOfflineContext } from '../../StateProvider/OfflineContext/OfflineContext';

import GridFilter from '../GridFilter';

// OTHER COMPONENTS
import { RefreshButton, ArrangeView, ShowOnlySelected } from './GridButtons';

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
    buttonGap = '10px',
    dispatch,
    showOnlyShowFilteredRecordSwitch = false,
    selectedRecords = null
  } = props;
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [chipData, setChipData] = useState([]);
  const [currentFomValue, setCurrentFomValue] = useState({});
  const { isOffline } = useContext(CustomOfflineContext);

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
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '15px', marginBottom: '15px', justifyContent: 'space-between' }}>
        <div className="table-filter-v1" style={{ flexBasis: '766px', maxWidth: '766px', paddingRight: '52px' }}>
          {showOnlyShowFilteredRecordSwitch && (
            <ShowOnlySelected dispatch={dispatch} renderedFrom={renderedFrom} selectedRecords={selectedRecords} style={{ padding: '0px 0 10px' }} />
          )}
          {showFilters && (
            <DisplyaFilters
              selectedFilter={selectedFilter}
              chipData={chipData}
              handleFilterOpen={handleFilterOpen}
              clearSingleFilter={clearSingleFilter}
              clearFilterAll={clearFilterAll}
            />
          )}
        </div>
        <div style={{ marginInlineStart: 'auto' }}>
          {showFilters && (
            <Tooltip title="Apply filter" placement="top">
              <Button
                style={{ marginRight: buttonGap, color: '#424242' }}
                startIcon={<BiFilterAlt />}
                size={'small'}
                className="btn-outline-v1 light "
                onClick={handleFilterOpen}
              >
                Filter
              </Button>
            </Tooltip>
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
          setChipData={setChipData}
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
  const { selectedFilter, chipData, handleFilterOpen, clearSingleFilter, clearFilterAll } = props;
  const [hiddenItems, setHiddenItems] = useState(0);
  const isAppliedFilterPresent = Object.keys(selectedFilter || {}).length > 0;
  const containerRef = useRef(null);
  const countRef = useRef(null);
  const COUNT_PADDING = 10;

  useEffect(() => {
    setHiddenItems(0);
    if (containerRef?.current) {
      hideElementAndShowNumber(containerRef.current);
    }
  }, [chipData]);

  const hideElementAndShowNumber = (container) => {
    const containerWidth = container?.clientWidth - 52;
    const childItems = [...container?.children];

    let lastVisibleItem = null;

    let tempChildWIdth = 0;
    let count = 0;

    for (let i = 0; i < childItems.length; i++) {
      const item = childItems[i];
      const itemWidth = item.clientWidth;
      tempChildWIdth += itemWidth;
      if (tempChildWIdth > containerWidth) {
        item.style.display = 'none';
      }
    }

    for (let i = 0; i < childItems.length; i++) {
      const item = childItems[i];
      if (item.style.display === 'none') {
        if (!lastVisibleItem) {
          if (i != 0) {
            lastVisibleItem = childItems[i - 1];
          } else {
            lastVisibleItem = childItems[i];
          }
        }
        count += 1;
        setHiddenItems((prev) => prev + 1);
      }
    }

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
