import React, { useState } from 'react';
import { Popover, Box, Button, IconButton } from '@material-ui/core';
import { FiMaximize2 } from 'react-icons/fi';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import { BsFilter } from 'react-icons/bs';
import { Grid } from '@material-ui/core';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';
import { KeyboardDateTimePicker } from '@material-ui/pickers';
import HtmlTooltip from 'src/components/CustomTooltipTitle';

export function FilterHandler({ fullScreen, setOpenFullScreen, handleChange, particularCategory, tempDataVal, dateFilters, setDateFilters }) {
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);

  const handleFilterOpen = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const isFilterOpen = Boolean(filterAnchorEl);

  return (
    <>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-[auto_1fr_auto] items-center justify-between">
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
      </div>

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
