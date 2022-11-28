import React, { memo } from 'react'
import { TextField, InputAdornment } from '@material-ui/core'
import { Search } from '@material-ui/icons'
import PropTypes from 'prop-types'
import { isMobile, isTablet } from 'react-device-detect';


function SearchBox({ onSearch, value, size, width, placeholder, style, searchbox }) {
    return isMobile && !isTablet ? <TextField
        style={{ width: width || "242px", ...style }}
        variant="standard"
        placeholder={placeholder || "Search"}
        type="search"
        size={size || "small"}
        value={value}
        className={isMobile ? "serchBox" : searchbox}
        onChange={onSearch}
        InputProps={{
            disableUnderline: true,
            endAdornment: (
                <InputAdornment position="start" className="search-input-icon">
                    <Search color="secondary" style={{}} />
                </InputAdornment>
            )
        }
        }

    /> : <TextField
        style={{ width: width || "200px", ...style }}
        variant="outlined"
        placeholder={placeholder || "Search"}
        type="search"
        size={size || "small"}
        value={value}
        className={searchbox}
        onChange={onSearch}
        InputProps={{
            startAdornment: (
                <InputAdornment position="start" >
                    <Search color="primary" style={{}} />
                </InputAdornment>
            )
        }
        }

    />
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


SearchBox.propTypes = {
    onSearch: PropTypes.any,
    value: PropTypes.any,
    size: PropTypes.any,
    width: PropTypes.any,
    placeholder: PropTypes.any,
    style: PropTypes.any,
    searchbox: PropTypes.any
}

export default memo(SearchBox)