import React, { useState } from 'react'
import { Popover, Box, Button, IconButton } from '@material-ui/core';
import { FiMaximize2 } from 'react-icons/fi';
import Checkbox from "@material-ui/core/Checkbox";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import { BsFilter } from 'react-icons/bs';
import { Grid, makeStyles } from '@material-ui/core';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';
import { KeyboardDateTimePicker} from '@material-ui/pickers';
import HtmlTooltip from 'src/components/CustomTooltipTitle';

const useStyles = makeStyles((theme) => ({
    button: {
        display: 'flex',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        marginRight: '10px',
        textOverflow: 'ellipsis',
        [theme.breakpoints.down('xs')]: {
            maxWidth: '80%',
        },
    }
}));

export function FilterHandler({ fullScreen, setOpenFullScreen, handleChange, particularCategory, tempDataVal, dateFilters, setDateFilters }) {

    const classes = useStyles();

    const [filterAnchorEl, setFilterAnchorEl] = useState(null);

    const handleFilterOpen = (event) => {
        setFilterAnchorEl(event.currentTarget);
    };

    const handleFilterClose = () => {
        setFilterAnchorEl(null);
    };

    const isFilterOpen = Boolean(filterAnchorEl);

    return (

        <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center">
            <Box display="flex">
                <Button
                    onClick={handleFilterOpen}
                    startIcon={<BsFilter fontSize={10} />}
                    disableElevation
                    color="primary"
                    size="small"
                    className={classes.button}
                    style={{ fontSize: '16px' }}
                >
                    {particularCategory}
                </Button>
            </Box>

            <Box display="flex">
                <MuiPickersUtilsProvider utils={DateFnsUtils}>
                
                    <Grid container spacing={2}>
                        <Grid item xs={6} sm={4}>
                        
                            <KeyboardDateTimePicker
                                //   disabled={timeFrame !== 'custom' || disabled}
                                inputVariant="outlined"
                                variant="inline"
                                fullWidth
                                size="small"
                                // openTo="year"
                                format="dd/MM/yyyy HH:mm"
                                maxDate={dateFilters.to}
                                label="From"
                                views={['year', 'month', 'date', 'hours', 'minutes']}
                                value={dateFilters.from}
                                onChange={(date) => {
                                    setDateFilters({ ...dateFilters, from: date });
                                }}
                            />
                            
                        </Grid>
                        <Grid item xs={6} sm={4}>
                            <KeyboardDateTimePicker
                                //   disabled={timeFrame !== 'custom' || disabled}
                                inputVariant="outlined"
                                variant="inline"
                                fullWidth
                                size="small"
                                minDate={dateFilters.from}
                                // openTo="year"
                                format="dd/MM/yyyy HH:mm"
                                label="To"
                                views={['year', 'month', 'date', 'hours', 'minutes']}
                                value={dateFilters.to}
                                onChange={(date) => {
                                    setDateFilters({ ...dateFilters, to: date });
                                }}
                            />
                        </Grid>
                    </Grid>
                </MuiPickersUtilsProvider>
                {
                    !fullScreen && (
                        <HtmlTooltip title="Open Chart In Full Screen">
                        <IconButton size="small" color="primary" onClick={() => setOpenFullScreen(true)}>
                            <FiMaximize2 fontSize="16px" />
                        </IconButton>
                        </HtmlTooltip>
                    )
                }

            </Box>
             <Popover
                open={isFilterOpen}
                anchorEl={filterAnchorEl}
                onClose={handleFilterClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center'
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center'
                }}
                PaperProps={{
                    style: {
                        maxHeight: '300px', // Set your desired max height
                        width: '200px', // Set your desired width
                        overflowY: 'auto', // Enable vertical scrolling if needed
                    },
                }}
            >
                <Box width={200} padding={'0px 16px 16px 16px'}>
                    {tempDataVal[particularCategory] && Object.keys(tempDataVal[particularCategory])?.map((item) => (
                        <FormControlLabel
                            key={item}
                            control={<Checkbox checked={!tempDataVal[particularCategory][item]['hide']} onChange={() => handleChange(particularCategory, item)} />}
                            label={
                                <span
                                    style={{
                                        fontSize: tempDataVal[particularCategory][item]['fieldLabel'].length * 8 > 200 ? '0.8em' : '0.9em',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}
                                >
                                    {tempDataVal[particularCategory][item]['fieldLabel']}
                                </span>
                            }
                        />
                    ))}
                </Box>
            </Popover>
        </Box>

    )

}