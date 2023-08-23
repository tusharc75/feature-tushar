import DateFnsUtils from "@date-io/date-fns";
import { Box, TextField } from "@material-ui/core";
import { Autocomplete } from "@material-ui/lab";
import { KeyboardDateTimePicker, MuiPickersUtilsProvider } from "@material-ui/pickers";

export default function FilterModel({ dateFilters, setDateFilters }) {

    const intervals = [
        {
            optionValue: '1second',
            optionLabel: '1 Second'
        },
        {
            optionValue: '5seconds',
            optionLabel: '5 Seconds'
        },
        {
            optionValue: '10seconds',
            optionLabel: '10 Seconds'
        },
        {
            optionValue: '30seconds',
            optionLabel: '30 Seconds'
        },
        {
            optionValue: '1minute',
            optionLabel: '1 Minute'
        },
        {
            optionValue: '5minutes',
            optionLabel: '5 Minutes'
        },
        {
            optionValue: '15minutes',
            optionLabel: '15 Minutes'
        },
        {
            optionValue: '1hour',
            optionLabel: '1 Hour'
        },
        {
            optionValue: '6hours',
            optionLabel: '6 Hours'
        },
        {
            optionValue: '1day',
            optionLabel: '1 Day'
        },
        {
            optionValue: '7days',
            optionLabel: '7 Days'
        },
        {
            optionValue: '30days',
            optionLabel: '30 Days'
        }
    ];

    return (
        <Box display="flex" justifyContent="end">
            <MuiPickersUtilsProvider utils={DateFnsUtils}>
                <div className="grid grid-cols-1  sm:grid-cols-[1fr_1fr] md:grid-cols-[1Fr_1fr_1fr] lg:grid-cols-[auto_1fr_1fr_1fr] gap-2 flex-grow -mr-[40px] sm:mr-[0] max-w-[850px] " style={{ display: 'flex', justifyContent: 'end' }} >
                    <KeyboardDateTimePicker
                        inputVariant="outlined"
                        variant="inline"
                        fullWidth
                        size="small"
                        margin="none"
                        format="dd/MM/yyyy HH:mm"
                        autoOk
                        maxDate={dateFilters.to}
                        label="From"
                        views={['year', 'month', 'date', 'hours', 'minutes']}
                        value={dateFilters.from}
                        onChange={(date) => {
                            setDateFilters({ ...dateFilters, from: date });
                        }}
                    />
                    <KeyboardDateTimePicker
                        inputVariant="outlined"
                        variant="inline"
                        fullWidth
                        size="small"
                        margin="none"
                        autoOk
                        minDate={dateFilters.from}
                        format="dd/MM/yyyy HH:mm"
                        label="To"
                        views={['year', 'month', 'date', 'hours', 'minutes']}
                        value={dateFilters.to}
                        onChange={(date) => {
                            setDateFilters({ ...dateFilters, to: date });
                        }}
                    />
                    <Autocomplete
                        id={`interval`}
                        style={{ minWidth: '260px' }}
                        options={intervals}
                        autoHighlight
                        getOptionLabel={(option: any) => option?.optionLabel}
                        renderOption={(option) => option?.optionLabel}
                        onChange={(event, value) => {
                            setDateFilters({
                                ...dateFilters,
                                intervals: value?.optionValue || null
                            });
                        }}
                        value={intervals.find((v) => v.optionValue === dateFilters.intervals) || {}}
                        renderInput={(params) => <TextField {...params} name={`interval`} label="Interval" size="small" margin="none" variant="outlined" />}
                    />
                </div>
            </MuiPickersUtilsProvider>
        </Box>
    )
}