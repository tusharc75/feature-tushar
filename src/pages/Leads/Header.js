import React from 'react'
import SearchBox from '../../components/Helpers/SearchBox'
import { makeStyles } from "@material-ui/core/styles";
import { FilterList, SortByAlpha, Search } from "@material-ui/icons";
import {
    Box,
    Grid,
    Select,
    MenuItem,
    FormControl,
    IconButton,
    TextField,
    InputAdornment,
} from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
    filterSide: {
        display: "flex",
        justifyContent: "flex-end",
    },
}));

function LeadsHeader(props) {
    const classes = useStyles();
    const { selectedType, onTypeChange, options, onSearch, searchVal } = props
    return <Grid container>
        <Grid item xs={6}>
            <FormControl style={{ minWidth: "170px" }}>
                {
                    Object.keys(options).length ? <Select
                        style={{ width: '160px' }}
                        displayEmpty
                        labelId="demo-simple-select-outlined-label"
                        inputProps={{ "aria-label": "Without label" }}
                        id="demo-simple-select-outlined"
                        MenuProps={{
                            anchorOrigin: {
                                vertical: "bottom",
                                horizontal: "left"
                            },
                            getContentAnchorEl: null
                        }}
                        value={selectedType}
                        onChange={onTypeChange}
                        label="Select Type"
                    >
                        {
                            Object.keys(options).map((k, index) => {
                                return <MenuItem key={index} value={options[k]}>{k}</MenuItem>
                            })
                        }
                    </Select>
                        : null
                }
            </FormControl>
        </Grid>
        <Grid item xs={6} className={classes.filterSide}>
            <Box component="div">
                <IconButton>
                    <FilterList />
                </IconButton>
                <IconButton>
                    <SortByAlpha />
                </IconButton>
                <SearchBox
                    onSearch={onSearch}
                    value={searchVal}
                    size="sm"
                    placeholder="Search Leads"
                    width='242px'
                />
            </Box>
        </Grid>
    </Grid>
}
export default LeadsHeader