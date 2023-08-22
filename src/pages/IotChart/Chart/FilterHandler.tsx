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

export function FilterHandler({
  fullScreen,
  setOpenFullScreen,
  setDateFilters,
  dateFilters,
  dataPoints,
  selectedDataPoints,
  handleChange,
}) {

  const [filterAnchorEl, setFilterAnchorEl] = useState(null);

  const handleFilterOpen = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const intervals = [
    {
      optionValue: 'minute',
      optionLabel: 'Minute'
    },
    {
      optionValue: '30minutes',
      optionLabel: '30 Minute'
    },
    {
      optionValue: '5hours',
      optionLabel: '5 Hour'
    },
    {
      optionValue: 'day',
      optionLabel: 'Day'
    },
    {
      optionValue: 'week',
      optionLabel: 'Week'
    },
    {
      optionValue: 'month',
      optionLabel: 'Month'
    },
    {
      optionValue: '6months',
      optionLabel: '6 Month'
    },
    {
      optionValue: 'quarter',
      optionLabel: 'Quarter'
    },
    {
      optionValue: 'year',
      optionLabel: 'Year'
    }
  ];

  const isFilterOpen = Boolean(filterAnchorEl);

  return (
    <>
      <Box display={'flex'} justifyContent={'space-between'}>
        <MuiPickersUtilsProvider utils={DateFnsUtils}>
          <div className="grid grid-cols-1  sm:grid-cols-[1fr_1fr] md:grid-cols-[1Fr_1fr_1fr]
           lg:grid-cols-[auto_1fr_1fr_1fr] gap-2 flex-grow -mr-[40px] sm:mr-[0] max-w-[850px] ">
            <Button
              onClick={handleFilterOpen}
              startIcon={<BsFilter fontSize={10} />}
              disableElevation
              color="primary"
              size="small"
              style={{ fontSize: '16px' }}
            >
              {'Filter'}
            </Button>
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
          {dataPoints?.map((item) => (
            <FormControlLabel
              key={item._id}
              control={
                <Checkbox
                  checked={!selectedDataPoints[item?._id]}
                  onChange={() => handleChange(item?._id)} />
              }
              label={
                <span
                  style={{
                    fontSize: '0.8em',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {item?.fieldLabel}
                </span>
              }
            />
          ))}
        </Box>
      </Popover>
    </>
  );
}
