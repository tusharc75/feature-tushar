import React, { useState } from 'react'
import SearchBox from '../../components/Helpers/SearchBox'
import { makeStyles } from "@material-ui/core/styles";
import { FilterList, SortByAlpha, Search, AddOutlined } from "@material-ui/icons";
import {
    Box,
    Grid,
    Select,
    MenuItem,
    FormControl,
    IconButton,
    Button,
    Menu
} from "@material-ui/core";
import { Add, ExpandMore } from "@material-ui/icons";

const useStyles = makeStyles((theme) => ({
    filterSide: {
        display: "flex",
        justifyContent: "flex-end",
    },
}));

function LeadsHeader(props) {
    const classes = useStyles();
    const [anchorEl, setAnchorEl] = useState(null);

    const openActions = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const closeActions = () => {
        setAnchorEl(null);
    };

    const { selectedType, onTypeChange, options, onSearch, searchVal, onCreate,
        leadPermissions, showConfirmBox, canDelete } = props
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
                <Box component="span" marginX={1} />

                {
                    leadPermissions.isCreate &&
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={onCreate}
                        startIcon={<AddOutlined />}
                    >
                        Add
                </Button>
                }
                <Box component="span" marginX={1} />
                <SearchBox
                    onSearch={onSearch}
                    value={searchVal}
                    size="small"
                    placeholder="Search Leads"
                    width='242px'
                />

                <Box component="span" marginX={1} />
                {
                    leadPermissions.isDelete && <>
                        <Button
                            variant="outlined"
                            color="default"
                            onClick={openActions}
                            aria-controls="action-menu"
                        >
                            Actions <ExpandMore />
                        </Button>
                        <Menu
                            anchorEl={anchorEl}
                            keepMounted
                            getContentAnchorEl={null}
                            anchorOrigin={{
                                vertical: "bottom",
                                horizontal: "left"
                            }}
                            id="action-menu"
                            open={Boolean(anchorEl)}
                            onClose={closeActions}>

                            <MenuItem onClick={() => { showConfirmBox(null) }}
                            >Delete</MenuItem>
                        </Menu>
                    </>
                }
            </Box>
        </Grid>
    </Grid>
}
export default LeadsHeader