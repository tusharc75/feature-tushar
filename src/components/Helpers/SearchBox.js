import React, { memo } from 'react'
import { TextField, InputAdornment } from '@material-ui/core'
import { Search } from '@material-ui/icons'
function SearchBox({ onSearch, value, size, width, placeholder }) {
    return <TextField
        style={{ width: width || "200px" }}
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
export default memo(SearchBox) 