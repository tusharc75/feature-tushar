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
    Menu
} from "@material-ui/core";
import { ExpandMore } from "@material-ui/icons";
import styles from "./Header.module.scss"

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

    const { selectedType, onTypeChange, options, onSearch, searchVal, onCreate,
        leadPermissions, showConfirmBox, canDelete } = props
    return <Grid className={styles.filter_side_container} container>
        <Grid item xs={6}>
            <FormControl style={{ minWidth: "170px" }}>
                {
                    Object.keys(options).length ? <Select
                        style={{ width: '160px' }}
                        displayEmpty
                        disableUnderline
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
