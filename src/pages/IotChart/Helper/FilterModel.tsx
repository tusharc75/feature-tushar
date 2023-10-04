import DateFnsUtils from '@date-io/date-fns';
import { Box, TextField } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { KeyboardDateTimePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import { INTERVALS } from '../../../constants/helpers'

export default function FilterModel({ dateFilters, setDateFilters }) {

  return (
    <Box display="flex" justifyContent="end">
      <MuiPickersUtilsProvider utils={DateFnsUtils}>
        <div className="grid grid-cols-1 justify-end sm:grid-cols-[1fr_1fr] md:grid-cols-[1fr_1fr_1fr] lg:grid-cols-[1fr_1fr_1fr] gap-2 flex-grow max-w-[850px] ">
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
            options={INTERVALS}
            autoHighlight
            getOptionLabel={(option: any) => option?.optionLabel}
            renderOption={(option) => option?.optionLabel}
            onChange={(event, value) => {
              setDateFilters({
                ...dateFilters,
                intervals: value?.optionValue || null
              });
            }}
            value={INTERVALS.find((v) => v.optionValue === dateFilters.intervals) || {}}
            renderInput={(params) => <TextField {...params} name={`interval`} label="Interval" size="small" margin="none" variant="outlined" />}
          />
        </div>
      </MuiPickersUtilsProvider>
    </Box>
  );
}
