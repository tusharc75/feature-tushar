import React from 'react';
import { Grid, FormControl, InputLabel, Select, MenuItem } from '@material-ui/core';
import { KeyboardDatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import { dateFormatForInputControl } from '../../constants/helpers';
import moment from 'moment';
import DateFnsUtils from '@date-io/date-fns';

const DurationFilter = ({ duration, setDuration, disabled }) => {

    const [timeFrame, setTimeFrame] = React.useState<any>('current-year');

    React.useEffect(() => {
        switch (timeFrame) {
            case '1-month':
                setDuration({
                    from: new Date(moment().subtract('1', 'month').calendar()),
                    to: new Date()
                });
                break;

            case '3-months':
                setDuration({
                    from: new Date(moment().subtract('3', 'months').calendar()),
                    to: new Date()
                });
                break;

            case '6-months':
                setDuration({
                    from: new Date(moment().subtract('6', 'months').calendar()),
                    to: new Date()
                });
                break;

            case '1-year':
                setDuration({
                    from: new Date(moment().subtract('1', 'year').calendar()),
                    to: new Date()
                });
                break;
            case 'current-year':
                setDuration({
                    from: new Date(moment().startOf('year').calendar()),
                    to: new Date(moment().endOf('year').calendar()),
                });
                break;

            default:
                break;
        }
    }, [timeFrame]);
   
    return (
        <MuiPickersUtilsProvider utils={DateFnsUtils}>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                    <FormControl disabled={disabled} fullWidth size="small" variant="outlined">
                        <InputLabel id="duration">Select Duration</InputLabel>
                        <Select
                            labelId="duration"
                            id="time-duration"
                            value={timeFrame}
                            onChange={(e) => setTimeFrame(e.target.value)}
                            label="Select Duration"
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
                        disabled={timeFrame !== 'custom' || disabled}
                        inputVariant="outlined"
                        variant="inline"
                        fullWidth
                        size="small"
                        openTo="year"
                        format={dateFormatForInputControl}
                        maxDate={duration.to}
                        label="From"
                        views={['year', 'month', 'date']}
                        value={duration.from}
                        onChange={(date) => {
                            setDuration({ ...duration, from: date });
                        }}
                    />
                </Grid>
                <Grid item xs={6} sm={4}>
                    <KeyboardDatePicker
                        disabled={timeFrame !== 'custom' || disabled}
                        inputVariant="outlined"
                        variant="inline"
                        fullWidth
                        size="small"
                        minDate={duration.from}
                        openTo="year"
                        format={dateFormatForInputControl}
                        label="To"
                        views={['year', 'month', 'date']}
                        value={duration.to}
                        onChange={(date) => {
                            setDuration({ ...duration, to: date });
                        }}
                    />
                </Grid>
            </Grid>
        </MuiPickersUtilsProvider>
    );
};

export default DurationFilter;
