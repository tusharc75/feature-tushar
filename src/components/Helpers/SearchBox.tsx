import React, { memo } from 'react';
import { TextField, InputAdornment, TextFieldProps } from '@material-ui/core';
import { Search } from '@material-ui/icons';
import PropTypes from 'prop-types';
import { isMobile, isTablet } from 'react-device-detect';
import { FiSearch } from 'react-icons/fi';

type SerachBoxProps = Omit<TextFieldProps, 'variant' | 'type' | 'InputProps'> & {
  width?: string;
};

function SearchBox({ onChange, value, size, width, placeholder, style, className, ...otherProps }: SerachBoxProps) {
  return (
    <TextField
      {...otherProps}
      style={{ minWidth: width || '200px', flexGrow: 1, maxWidth: 300, ...style }}
      variant="outlined"
      placeholder={placeholder || 'Search'}
      type="search"
      size={size || 'small'}
      value={value}
      className={className}
      onChange={onChange}
      InputProps={{
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
