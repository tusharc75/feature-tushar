import React, { useState, useEffect, useRef } from 'react';
import { BiFilterAlt } from 'react-icons/bi';
import { Box, Chip, Button, Popover, FormControl, FormGroup, Divider, FormControlLabel, Tooltip, Switch, IconButton } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';

import GridFilter from '../GridFilter';

const CustomGridFilterHeader = (props) => {
  const { resource, currentGridApi } = props;
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState({});
  const [chipData, setChipData] = useState([]);
  const [currentFomValue, setCurrentFomValue] = useState({});

  const handleFilterOpen = () => {
    setIsFilterOpen(true);
  };

  const handleFilterClose = () => {
    setIsFilterOpen(false);
  };

  const clearSingleFilter = (name) => {
    currentGridApi.destroyFilter(name);
    let formValues = { ...currentFomValue };
    delete formValues[name];
    setCurrentFomValue(formValues);
    setChipData((prev) => prev.filter((item) => item.name !== name));
  };

  const clearFilterAll = () => {
    currentGridApi.setFilterModel({});
    setSelectedFilter({});
    setChipData([]);
    setCurrentFomValue({});
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
      <div className="table-filter-v1" style={{ flexBasis: 'calc(100% - 110px)' }}>
        <DisplyaFilters
          selectedFilter={selectedFilter}
          chipData={chipData}
          handleFilterOpen={handleFilterOpen}
          clearSingleFilter={clearSingleFilter}
          clearFilterAll={clearFilterAll}
        />
      </div>
      <div style={{ flexBasis: '91px', marginLeft: 'auto' }}>
        <Button startIcon={<BiFilterAlt />} size={'small'} className="btn-outline-v1 light " onClick={handleFilterOpen}>
          Filter
        </Button>
      </div>
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
    </div>
  );
};

export default CustomGridFilterHeader;

// THIS COMPONENT WILL DISPLAY CHIPS ===============================>
const DisplyaFilters = (props) => {
  const { selectedFilter, chipData, handleFilterOpen, clearSingleFilter, clearFilterAll } = props;
  const [hiddenItems, setHiddenItems] = useState(0);
  const isAppliedFilterPresent = Object.keys(selectedFilter).length > 0;
  const containerRef = useRef(null);

  useEffect(() => {
    setHiddenItems(0);
    if (containerRef?.current) {
      hideElementAndShowNumber(containerRef.current);
    }
  }, [chipData]);

  const hideElementAndShowNumber = (container) => {
    const containerWidth = container?.clientWidth - 103;
    const childItems = [...container?.children];

    let tempChildWIdth = 0;
    let count = 0;
    childItems.forEach((item) => {
      const itemWidth = item.clientWidth;
      tempChildWIdth += itemWidth;
      if (tempChildWIdth > containerWidth) {
        item.style.display = 'none';
      }
    });
    childItems.forEach((item) => {
      if (item.style.display === 'none') setHiddenItems((prev) => prev + 1);
    });
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
          <div className="chip-container">
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
            {hiddenItems !== 0 && (
              <div style={{ cursor: 'pointer' }} onClick={handleFilterOpen}>
                +{hiddenItems} more
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
};
