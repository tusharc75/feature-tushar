import React, { useEffect, useState, useRef } from 'react';
import CloseIcon from '@material-ui/icons/Close';
import { Chip } from '@material-ui/core';
import _ from 'lodash';

const DisplayChips = (props) => {
  const { chipData, setChipData, selectedFilter, handleFilterOpen, clearSingleFilter, clearFilterAll, setIsFilterPresent, customFilters, columns } =
    props;
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

  const chipDataSetter = (filterModel) => {
    if (filterModel) {
      const keys = Object.keys(filterModel);
      const filterData = [];
      for (let i = 0; i < keys.length; i++) {
        const element = filterModel[keys[i]];
        const currentColumn = columns.find((col) => col.accessor === keys[i]);
        if (currentColumn.cellRenderer === 'dateRenderer') {
          const dateValue =
            element.filter.from && element.filter.to
              ? `${element.filter.from ? element.filter.from : null} - ${element.filter.to ? element.filter.to : null}`
              : element.filter.from || element.filter.to
              ? `${element.filter.from ? `${element.filter.from} (From Date)` : ''} ${element.filter.to ? `${element.filter.to} (To Date)` : ''}`
              : null;
          const data = { title: currentColumn?.Header || _.startCase(keys[i]), value: dateValue, name: keys[i] };
          filterData.push(data);
        } else if (element.operator && element.condition1) {
          const data = {
            title: currentColumn?.Header || _.startCase(keys[i]),
            value: element?.condition1?.filter?.map((e) => e?.optionLabel)?.toString(),
            name: keys[i]
          };
          filterData.push(data);
        } else {
          const data = { title: currentColumn?.Header || _.startCase(keys[i]), value: element.filter, name: keys[i] };
          filterData.push(data);
        }
      }
      setChipData(filterData);
    }
  };

  const filterModel = React.useMemo(() => {
    return customFilters;
  }, [customFilters]);

  useEffect(() => {
    if (filterModel) {
      if (!oldModalRef.current || !_.isEqual(filterModel, oldModalRef.current || {})) oldModalRef.current = filterModel;
      chipDataSetter(filterModel);
    }
  }, [filterModel]);

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

  const getFilterValue = (data) => {
    if (!data) return '';
    switch (true) {
      case typeof data === 'string':
        return data;
      case Array.isArray(data):
        return data.toString();
      case typeof data === 'object':
        return `${data.from ? data.from : ''}${data.to ? ' - ' + data.to : ''}`;
      default:
        return '';
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
                  label={`${filter?.title}=${getFilterValue(filter?.value)}`}
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

export default DisplayChips;
