import React, { useState } from 'react'
import { Popover, Box, Button } from '@material-ui/core';
import Checkbox from "@material-ui/core/Checkbox";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import { BsFilter } from 'react-icons/bs';
import { Grid, FormControl, InputLabel, Select, MenuItem, AppBar, makeStyles } from '@material-ui/core';
import { KeyboardDatePicker } from '@material-ui/pickers';
import moment from 'moment';
import { dateFormatForInputControl } from '../../../constants/helpers';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';


const useStyles = makeStyles((theme) => ({
    button: {
        display: 'flex',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        marginRight:'10px',
        textOverflow: 'ellipsis',
        [theme.breakpoints.down('xs')]: {
            maxWidth: '80%',
        },
    },
}));

export function FilterHandler({ handleChange, particularCategory, tempDataVal, dateFilters, setDateFilters }) {

    const classes = useStyles();

    const [filterAnchorEl, setFilterAnchorEl] = useState(null);
    const [timeFrame, setTimeFrame] = React.useState<any>('current-year');


    React.useEffect(() => {
        switch (timeFrame) {
            case '1-month':
                setDateFilters({

                    from: new Date(moment().subtract('1', 'month').calendar()),
                    to: new Date()

                });
                break;

            case '3-months':
                setDateFilters({
                    from: new Date(moment().subtract('3', 'months').calendar()),
                    to: new Date()

                });
                break;

            case '6-months':
                setDateFilters({


                    from: new Date(moment().subtract('6', 'months').calendar()),
                    to: new Date()
                });
                break;

            case '1-year':
                setDateFilters({

                    from: new Date(moment().subtract('1', 'year').calendar()),
                    to: new Date()

                });
                break;
            case 'current-year':
                setDateFilters({

                    from: new Date(moment().startOf('year').calendar()),
                    to: new Date(moment().endOf('year').calendar()),

                });
                break;

            default:
                break;
        }
    }, [timeFrame]);


    const handleFilterOpen = (event) => {
        setFilterAnchorEl(event.currentTarget);
    };

    const handleFilterClose = () => {
        setFilterAnchorEl(null);
    };

    const isFilterOpen = Boolean(filterAnchorEl);

    return (

        <Grid item xs={12} sm={12} md={12} style={{ display: 'flex', flexDirection: 'row', marginTop: '10px', maxWidth:'80%' }}>
            <Button
                onClick={handleFilterOpen}
                startIcon={<BsFilter fontSize={10} />}
                disableElevation
                color="primary"
                variant="outlined"
                size="small"
                // style={{ whiteSpace: 'nowrap', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}
                className={classes.button}
            >
                Category Filters
            </Button>

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
            <MuiPickersUtilsProvider utils={DateFnsUtils}>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                        <FormControl fullWidth size="small" variant="outlined">
                            <InputLabel id="duration">Select Duration</InputLabel>
                            <Select
                                labelId="duration"
                                id="time-duration"
                                value={timeFrame}
                                onChange={(e) => setTimeFrame(e.target.value)}
                                label="Select Duration"
                                MenuProps={{ anchorOrigin: { vertical: 'bottom', horizontal: 'left' }, transformOrigin: { vertical: 'top', horizontal: 'left' }, getContentAnchorEl: null }}
                            >
                                <MenuItem value={'1-year'}>Last 1 Year</MenuItem>
                                <MenuItem value={'6-months'}>Last 6 Months</MenuItem>
                                <MenuItem value={'3-months'}>Last 3 Months</MenuItem>
                                <MenuItem value={'1-month'}>Last 1 Month</MenuItem>
                                <MenuItem value={'current-year'}>Current Year</MenuItem>
                                <MenuItem value={'custom'}>Custom</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={6} sm={4}>
                        <KeyboardDatePicker
                            //   disabled={timeFrame !== 'custom' || disabled}
                            inputVariant="outlined"
                            variant="inline"
                            fullWidth
                            size="small"
                            openTo="year"
                            format={dateFormatForInputControl}
                            maxDate={dateFilters.to}
                            label="From"
                            views={['year', 'month', 'date']}
                            value={dateFilters.from}
                            onChange={(date) => {
                                setDateFilters({ ...dateFilters, from: date });
                            }}
                        />
                    </Grid>
                    <Grid item xs={6} sm={4}>
                        <KeyboardDatePicker
                            //   disabled={timeFrame !== 'custom' || disabled}
                            inputVariant="outlined"
                            variant="inline"
                            fullWidth
                            size="small"
                            minDate={dateFilters.from}
                            openTo="year"
                            format={dateFormatForInputControl}
                            label="To"
                            views={['year', 'month', 'date']}
                            value={dateFilters.to}
                            onChange={(date) => {
                                setDateFilters({ ...dateFilters, to: date });
                            }}
                        />
                    </Grid>
                </Grid>
            </MuiPickersUtilsProvider>
        </Grid>

    )

}