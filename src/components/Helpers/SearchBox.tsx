import React, { memo } from 'react';
import { TextField, InputAdornment, TextFieldProps } from '@material-ui/core';
import { Search } from '@material-ui/icons';
import PropTypes from 'prop-types';
import { isMobile, isTablet } from 'react-device-detect';
import { FiSearch } from 'react-icons/fi';

type SerachBoxProps = Partial<TextFieldProps> & {
  width?: string;
  placeholder?: string;
};

function SearchBox({ onChange, value, size, width, placeholder, style, className }: SerachBoxProps) {
  return isMobile && !isTablet ? (
    <TextField
      style={{ minWidth: width || '200px', ...style }}
      variant="standard"
      placeholder={placeholder || 'Search'}
      type="search"
      size={size || 'small'}
      value={value}
      className={isMobile ? 'serchBox' : className}
      onChange={onChange}
      InputProps={{
        disableUnderline: true,
        endAdornment: (
          <InputAdornment position="start" className="search-input-icon">
            <FiSearch style={{ color: '#737373' }} />
          </InputAdornment>
        )
      }}
    />
  ) : (
    <TextField
      style={{ minWidth: width || '258px', ...style }}
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
// <TextField
//     style={{ width: width || "200px", ...style , borderRadius:"20px" , backgroundColor:"#C8E9CE" , padding: "2px 14px"  }}
//     variant="standard"
//     placeholder={placeholder || "Search"}
//     type="search"
//     size={size || "small"}
//     value={value}
//     className={`${searchbox} ${"serchBox"}`}
//     onChange={onSearch}
//     InputProps={{
//
//     }}
//
// />

export default memo(SearchBox);
