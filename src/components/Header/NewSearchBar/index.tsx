import { useAutocomplete } from '@mui/material';
import React from 'react';
import { SearchBarProps } from 'src/components/Header/NewSearchBar/types';
import useSearch from 'src/components/Header/NewSearchBar/useSearch';

const SearchBar = () => {
  const { items } = useSearch();
  const {
    getRootProps,
    getInputLabelProps,
    getInputProps,
    getTagProps,
    getListboxProps,
    getOptionProps,
    groupedOptions,
    value,
    focused,
    setAnchorEl
  } = useAutocomplete({
    id: 'search-bar',
    multiple: false,
    options: items,
    groupBy: (option) => option.sectionName,
    getOptionLabel: (option) => option.name
  });

  return (
    <div>
      <div {...getRootProps()}>
        <label {...getInputLabelProps()}>useAutocomplete</label>
        <input {...getInputProps()} />
      </div>
      {groupedOptions.length > 0 ? (
        <ul {...getListboxProps()}>
          {groupedOptions.map((option, index) => {
            const { key, ...optionProps } = getOptionProps({ option, index });
            return (
              <li key={key} {...optionProps}>
                {option.options}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
};

export default SearchBar;
