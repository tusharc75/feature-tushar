import React, { memo, useState } from 'react';
import { TextField, InputAdornment, TextFieldProps } from '@material-ui/core';
// import { Search } from '@material-ui/icons';
// import PropTypes from 'prop-types';
// import { isMobile, isTablet } from 'react-device-detect';
import { FiSearch } from 'react-icons/fi';
import { debounce } from 'lodash';

type SerachBoxProps = Omit<TextFieldProps, 'variant' | 'type'> & {
  width?: string;
};

function SearchBox({ onChange, value, size, width, placeholder, style, className, InputProps, ...otherProps }: SerachBoxProps) {
  const [inputvalue, setInputValue] = useState(value);

  const debouncedInputDispatch = debounce((e) => {
    onChange(e);
  }, 1000);

  const onChangeWrapper = (e) => {
    setInputValue(e.target.value);
    debouncedInputDispatch(e);
  };

  return (
    <TextField
      {...otherProps}
      style={{ ...style, display: 'flex' }}
      variant="outlined"
      placeholder={placeholder || 'Search'}
      type="search"
      size={size || 'small'}
      value={inputvalue}
      className={`${className} sm:max-w-[300px] sm:min-w-[200px] flex-grow small-searchbar`}
      onChange={onChangeWrapper}
      InputProps={{
        ...InputProps,
        startAdornment: (
          <InputAdornment position="start">
            <FiSearch style={{ color: '#737373' }} />
          </InputAdornment>
        )
      }}
    />
  );
}

export default memo(SearchBox);
