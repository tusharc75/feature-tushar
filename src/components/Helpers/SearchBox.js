import React, { memo } from 'react'
import { TextField, InputAdornment } from '@material-ui/core'
import { Search } from '@material-ui/icons'
function SearchBox({ onSearch, value }) {
    return <TextField
        style={{ width: "200px" }}
        variant="outlined"
        placeholder="Search"
        type="search"
        size="small"
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