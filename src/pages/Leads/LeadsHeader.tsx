import { useState } from 'react'
import SearchBox from '../../components/Helpers/SearchBox'
import { makeStyles } from "@material-ui/core/styles";
import { AddOutlined } from "@material-ui/icons";
import {
    Box,
    Grid,
    Select,
    MenuItem,
    FormControl,
    Button,
    Menu,
    Chip
} from "@material-ui/core";
import { ExpandMore } from "@material-ui/icons";
import styles from "./Header.module.scss"

import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';

const useStyles = makeStyles((theme) => ({
    filter_side: {
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

    const [filter, setFilter] = useState("All Leads");

    const handleFilter = (event, newFilter) => {
        setFilter(newFilter);
        onTypeChange(options.find((d) => d.key === newFilter).value);
    };

    const { selectedType,
        onTypeChange,
        options,
        onSearch,
        searchVal,
        onCreate,
        leadPermissions,
        showConfirmBox,
        canDelete,
        icon,
        heading
    } = props
    return <Grid className={styles.filter_side_container} container>
        <Grid item xs={6} className="d-flex align-items-center gap-1">
            {icon} <span className="listingHeader">{heading}
            </span>
            {
                options && <ToggleButtonGroup size="small" className="ml-8"
                    value={filter}
                    exclusive
                    onChange={handleFilter}>
                    {options.map((k, index) => {
                        return (
                            <ToggleButton value={k.key} key={index}>{k.key}
                            </ToggleButton>
                        );
                    })}
                </ToggleButtonGroup>
            }
        </Grid>
        <Grid item xs={6} className={styles.filter_side}>
            <Box className={styles.filter_side_header} component="div">
                <SearchBox
                    onSearch={onSearch}
                    searchbox={styles.search_box_input}
                    value={searchVal}
                    size="small"
                    placeholder="Search Leads"
                    width='242px'
                />
                {
                    leadPermissions.isCreate &&
                    <Button
                        variant="contained"
                        color="primary"
                        className={styles.add_submit_btn}
                        onClick={onCreate}
                        startIcon={<AddOutlined />}
                    >
                        Add
                </Button>
                }

                {
                    leadPermissions.isDelete && <>
                        <Button
                            variant="outlined"
                            color="default"
                            className={styles.action_submit_btn}
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

                            <MenuItem onClick={() => {
                                closeActions();
                                showConfirmBox(null)
                            }}
                            >Delete</MenuItem>
                        </Menu>
                    </>
                }
            </Box>

        </Grid>
    </Grid>
}
export default LeadsHeader
