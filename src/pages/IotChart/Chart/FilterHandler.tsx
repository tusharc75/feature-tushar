import React, { useState } from 'react';
import { Popover, Box, Button, IconButton, TextField } from '@material-ui/core';
import { FiMaximize2 } from 'react-icons/fi';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import { BsFilter } from 'react-icons/bs';
import { Grid } from '@material-ui/core';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';
import { KeyboardDateTimePicker } from '@material-ui/pickers';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { Autocomplete } from '@material-ui/lab';

export function FilterHandler({ fullScreen, setOpenFullScreen, handleChange, particularCategory, tempDataVal, dateFilters, setDateFilters }) {
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);

  const handleFilterOpen = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const intervals = [{
    optionValue: 'minute',
    optionLabel: 'Minute'
  },
  {
    optionValue: '30minutes',
    optionLabel: '30 Minute'
  }, {
    optionValue: '5hours',
    optionLabel: '5 Hour'
  }, {
    optionValue: 'day',
    optionLabel: 'Day'
  }, {
    optionValue: 'week',
    optionLabel: 'Week'
  }, {
    optionValue: 'month',
    optionLabel: 'Month'
  }, {
    optionValue: '6months',
    optionLabel: '6 Month'
  }, {
    optionValue: 'quarter',
    optionLabel: 'Quarter'
  }, {
    optionValue: 'year',
    optionLabel: 'Year'
  }]

  const isFilterOpen = Boolean(filterAnchorEl);

  return (
    <>
      <Box display={'flex'} justifyContent={'space-between'}>
        <div>
          <MuiPickersUtilsProvider utils={DateFnsUtils}>
            <Grid container spacing={1} alignItems='center'>
              <Grid item xs={3} sm={3} md={3} lg={3}>
                <Button
                  onClick={handleFilterOpen}
                  startIcon={<BsFilter fontSize={10} />}
                  disableElevation
                  color="primary"
                  size="small"
                  style={{ fontSize: '16px' }}
                >
                  {particularCategory}
                </Button>
              </Grid>
              <Grid item xs={3} sm={3} md={3} lg={3}>
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
              <Grid item xs={3} sm={3} md={3} lg={3}>
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
              <Grid item xs={3} sm={3} md={3} lg={3}>
                <Autocomplete
                  id={`interval`}
                  options={intervals}
                  autoHighlight
                  getOptionLabel={(option: any) => option?.optionLabel}
                  renderOption={(option) => option?.optionLabel}
                  onChange={(event, value) => {
                    setDateFilters({ ...dateFilters, intervals: value?.optionValue || null })
                  }}
                  value={intervals.find((v) => v.optionValue === dateFilters.intervals) || {}}
                  renderInput={(params) => (
                    <TextField {...params} name={`interval`} label="Interval" margin="dense" variant="outlined" />
                  )}
                />
              </Grid>
            </Grid>
          </MuiPickersUtilsProvider>
        </div>
        {!fullScreen && (
          <div className="">
            <HtmlTooltip title="Open Chart In Full Screen">
              <IconButton color="primary" style={{ marginLeft: 'auto', display: 'flex' }} onClick={() => setOpenFullScreen(true)}>
                <FiMaximize2 fontSize="16px" />
              </IconButton>
            </HtmlTooltip>
          </div>
        )}
      </Box>



      {/* <div className="grid gap-4 grid-cols-1 md:grid-cols-[auto_1fr_auto] items-center justify-between">
        <div className="">
          <Button
            onClick={handleFilterOpen}
            startIcon={<BsFilter fontSize={10} />}
            disableElevation
            color="primary"
            size="small"
            style={{ fontSize: '16px' }}
          >
            {particularCategory}
          </Button>
        </div>
        <div className="">
          <MuiPickersUtilsProvider utils={DateFnsUtils}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-[500px]">
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
              <Autocomplete
                id={`interval`}
                options={intervals}
                autoHighlight
                getOptionLabel={(option: any) => option?.optionLabel}
                renderOption={(option) => option?.optionLabel}
                onChange={(event, value) => {
                  setDateFilters({ ...dateFilters, intervals: value?.optionValue || null })
                }}
                value={intervals.find((v) => v.optionValue === dateFilters.intervals) || {}}
                renderInput={(params) => (
                  <TextField {...params} name={`interval`} label="Interval" margin="dense" variant="outlined" />
                )}
              />
            </div>
          </MuiPickersUtilsProvider>
        </div>
        {!fullScreen && (
          <div className="">
            <HtmlTooltip title="Open Chart In Full Screen">
              <IconButton color="primary" style={{ marginLeft: 'auto', display: 'flex' }} onClick={() => setOpenFullScreen(true)}>
                <FiMaximize2 fontSize="16px" />
              </IconButton>
            </HtmlTooltip>
          </div>
        )}
      </div> */}

      <Popover
        open={isFilterOpen}
        anchorEl={filterAnchorEl}
        onClose={handleFilterClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}
        PaperProps={{
          style: {
            maxHeight: '300px', // Set your desired max height
            width: '200px', // Set your desired width
            overflowY: 'auto' // Enable vertical scrolling if needed
          }
        }}
      >
        <Box width={200} padding={'8px 16px'}>
          {tempDataVal[particularCategory] &&
            Object.keys(tempDataVal[particularCategory])?.map((item) => (
              <FormControlLabel
                key={item}
                control={
                  <Checkbox checked={!tempDataVal[particularCategory][item]['hide']} onChange={() => handleChange(particularCategory, item)} />
                }
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
    </>
  );
}
