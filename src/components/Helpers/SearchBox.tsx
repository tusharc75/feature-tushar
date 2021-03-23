import React, { memo } from 'react'
import { TextField, InputAdornment } from '@material-ui/core'
import { Search } from '@material-ui/icons'
import PropTypes from 'prop-types'

function SearchBox({ onSearch, value, size, width, placeholder, style }) {
    return <TextField
        style={{ width: width || "200px", ...style }}
        variant="outlined"
        placeholder={placeholder || "Search"}
        type="search"
        size={size || "small"}
        value={value}
        onChange={onSearch}
        InputProps={{
            startAdornment: (
                <InputAdornment position="start">
                    <Search color="disabled" />
                </InputAdornment>
            ),
        }}
    />
}

SearchBox.propTypes = {
    onSearch: PropTypes.any, 
    value: PropTypes.any, 
    size: PropTypes.any, 
    width: PropTypes.any, 
    placeholder: PropTypes.any, 
    style: PropTypes.any
}

export default memo(SearchBox) 