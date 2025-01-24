import React, { useEffect, useState, useRef } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import { Chip } from '@mui/material';
import _ from 'lodash';
import { displayDate } from 'src/constants/helpers';

const DisplayChips = (props) => {
  const { chipData, setChipData, selectedFilter, handleFilterOpen, clearSingleFilter, clearFilterAll, setIsFilterPresent, customFilters, columns } =
    props;
  const isAppliedFilterPresent = React.useMemo(() => Object.keys(selectedFilter || {}).length > 0, [selectedFilter]);
  const oldModalRef = React.useRef(null);

  const chipDataSetter = (filterModel) => {
    if (filterModel) {
      const keys = Object.keys(filterModel);
      const filterData = [];
      for (let i = 0; i < keys.length; i++) {
        const element = filterModel[keys[i]];
        const currentColumn = columns.find((col) => col.accessor === keys[i]);
        if (currentColumn?.type === 'date') {
          const dateValue =
            element.filter.from && element.filter.to
              ? `${element.filter.from ? displayDate(element.filter.from) : null} - ${element.filter.to ? displayDate(element.filter.to) : null}`
              : element.filter.from || element.filter.to
                ? `${element.filter.from ? `${displayDate(element.filter.from)} (From Date)` : ''} ${element.filter.to ? `${displayDate(element.filter.to)} (To Date)` : ''}`
                : null;
          const data = { title: currentColumn?.Header || _.startCase(keys[i]), value: dateValue, name: keys[i] };
          filterData.push(data);
        } else if (element.operator && element.condition1) {
          const data = {
            title: currentColumn?.Header || _.startCase(keys[i]),
            value: element?.condition1?.filter?.map((e) => e?.optionLabel)?.toString(),
            name: keys[i],
            ['$nin']: element?.condition1?.['$nin'] === true ? true : false
          };
          filterData.push(data);
        } else {
          const data = {
            title: currentColumn?.Header || _.startCase(keys[i]),
            value: element.filter,
            name: keys[i],
            ['$nin']: element?.['$nin'] === true ? true : false
          };
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
            title={selectedFilter?.title}
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
            <div className={'chip-group'}>
              {chipData?.map((filter) => {
                const filterValue = getFilterValue(filter?.value);
                if (!filterValue) return null;
                return (
                  <Chip
                    onClick={handleFilterOpen}
                    className={'filter-chip'}
                    deleteIcon={<CloseIcon />}
                    label={`${filter?.title}${filter?.['$nin'] ? '≠' : '='}${filterValue}`}
                    title={`${filter?.title}${filter?.['$nin'] ? '≠' : '='}${filterValue}`}
                    onDelete={() => clearSingleFilter(filter.name)}
                  />
                );
              })}
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default DisplayChips;
