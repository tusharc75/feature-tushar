import { Fragment, useState } from 'react';
import {
  Grid,
  Checkbox,
  FormControlLabel,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Button,
  Popper,
  Fade,
  Paper,
  Typography
} from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { DatePicker } from '@material-ui/pickers';
import { FilterList } from '@material-ui/icons';

const Filters = (props) => {
  const { entities, marketSegments, subMarketSegments, productCategory, setSubMarketSegments, salesFilter, setSalesFilter } = props;
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [openFilter, setOpenFilter] = useState(false);

  const handleClickFilter = (event) => {
    setFilterAnchor(event.currentTarget);
    setOpenFilter((prev) => !prev);
  };

  return (
    <Fragment>
      <Popper open={openFilter} placement="right-start" anchorEl={filterAnchor} transition>
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={350}>
            <Paper>
              <Typography>The content of the Popper.</Typography>
            </Paper>
          </Fade>
        )}
      </Popper>
      <Grid container>
        <Grid item xs={12} sm={6}>
          <Button onClick={handleClickFilter} color="primary" endIcon={<FilterList />}>
            Filters
          </Button>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Grid container spacing={2}>
            <Grid item>
              <FormControl fullWidth size="small" variant="outlined">
                <InputLabel htmlFor="grouped-native-select">Select Time</InputLabel>
                <Select native value={1} id="grouped-native-select">
                  <option value={1}>Last 1 Year</option>
                  <option value={2}>Last 6 Months</option>
                  <option value={3}>Last 3 Months</option>
                  <option value={4}>Last 1 Month</option>
                </Select>
              </FormControl>
            </Grid>
            <Grid item>
              <DatePicker
                inputVariant="outlined"
                fullWidth
                size="small"
                disableFuture
                openTo="year"
                format="MM/dd/yyyy"
                maxDate={salesFilter.between.from}
                label="From"
                views={['year', 'month', 'date']}
                value={salesFilter.between.from}
                onChange={(date) => {
                  setSalesFilter({ ...salesFilter, between: { from: date, to: salesFilter.between.to } });
                }}
              />
            </Grid>
            <Grid item>
              <DatePicker
                inputVariant="outlined"
                fullWidth
                size="small"
                minDate={salesFilter.between.from}
                disableFuture
                openTo="year"
                format="MM/dd/yyyy"
                label="To"
                views={['year', 'month', 'date']}
                value={salesFilter.between.to}
                onChange={(date) => {
                  setSalesFilter({ ...salesFilter, between: { to: date, from: salesFilter.between.from } });
                }}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid item sm={6}>
          <FormControlLabel
            control={
              <Checkbox
                checked={salesFilter.allEntity}
                onChange={(e) => setSalesFilter({ ...salesFilter, allEntity: e.target.checked })}
                color="primary"
              />
            }
            label="All Entity"
          />
        </Grid>
        <Grid item sm={6}>
          <FormControlLabel
            control={
              <Checkbox
                checked={salesFilter.byMonth}
                onChange={(e) => setSalesFilter({ ...salesFilter, byMonth: e.target.checked })}
                color="primary"
              />
            }
            label="By Month"
          />
        </Grid>
        <Grid item sm={6}>
          <Autocomplete
            size="small"
            disabled={salesFilter.allEntity}
            fullWidth
            options={entities}
            autoHighlight
            value={salesFilter.entity}
            getOptionLabel={(option) => option.name || ''}
            getOptionSelected={(option, val) => (option ? option.name === val.name : false)}
            onChange={(_, val) => {
              setSalesFilter({ ...salesFilter, entity: val });
            }}
            renderInput={(params) => <TextField {...params} label="Entity" variant="outlined" />}
          />
        </Grid>
        <Grid item sm={6}>
          <Autocomplete
            size="small"
            fullWidth
            options={marketSegments}
            autoHighlight
            value={salesFilter.marketSegment}
            getOptionLabel={(option) => option.name || ''}
            getOptionSelected={(option, val) => (option ? option.name === val.name : false)}
            onChange={(_, val) => {
              setSalesFilter({ ...salesFilter, marketSegment: val });
              if (val) {
                setSubMarketSegments(marketSegments.filter((d) => d?.parentSegment === val?.id));
              } else {
                setSubMarketSegments([]);
              }
            }}
            renderInput={(params) => <TextField {...params} label="Market Segment" variant="outlined" />}
          />
        </Grid>
        {salesFilter.marketSegment && (
          <Grid item sm={6}>
            <Autocomplete
              size="small"
              fullWidth
              options={subMarketSegments}
              autoHighlight
              value={salesFilter.subMarketSegment}
              getOptionLabel={(option) => option.name || ''}
              getOptionSelected={(option, val) => (option ? option.name === val.name : false)}
              onChange={(_, val) => setSalesFilter({ ...salesFilter, subMarketSegment: val })}
              renderInput={(params) => <TextField {...params} label="Sub-Market Segment" variant="outlined" />}
            />
          </Grid>
        )}
        <Grid item sm={6}>
          <Autocomplete
            size="small"
            fullWidth
            options={productCategory}
            autoHighlight
            value={salesFilter.productCategory}
            getOptionLabel={(option) => option.name || ''}
            getOptionSelected={(option, val) => (option ? option.name === val.name : false)}
            onChange={(_, val) => setSalesFilter({ ...salesFilter, productCategory: val })}
            renderInput={(params) => <TextField {...params} label="Product Category" variant="outlined" />}
          />
        </Grid>
      </Grid>
    </Fragment>
  );
};

export default Filters;
