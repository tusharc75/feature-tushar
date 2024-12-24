import { Box, Checkbox, FormControlLabel, Grid, TextField } from '@mui/material';
import { Autocomplete } from '@material-ui/lab';

export default function FilterAlertModel({
  alertOptions,
  selectedAlert,
  setSelectedAlert,
  alarmOptions,
  selectedAlarm,
  setSelectedAlarm,
  showHighLow,
  setShowHighLow
}) {
  return (
    <Box mt={2} mb={1}>
      <Grid container spacing={1}>
        <Grid item md={4} lg={4} sm={6}>
          <Autocomplete
            options={[{ optionLabel: 'All', optionValue: 'All' }, ...alarmOptions]}
            getOptionLabel={(option) => (option && option?.optionLabel) || ''}
            value={selectedAlarm}
            onChange={(event, newValue: any) => {
              setSelectedAlarm(newValue);
            }}
            size="small"
            renderInput={(params) => <TextField {...params} label="Select Alarm" size="small" variant="outlined" />}
          />
        </Grid>
        <Grid item md={4} lg={4} sm={6}>
          <Autocomplete
            options={alertOptions}
            getOptionLabel={(option: any) => option || ''}
            value={selectedAlert}
            onChange={(event, newValue: any) => {
              setSelectedAlert(newValue);
            }}
            size="small"
            renderInput={(params) => <TextField {...params} label="Select Alert" size="small" variant="outlined" />}
          />
        </Grid>
        <Grid item md={4} lg={4} sm={6}>
          <Box ml={2}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={showHighLow}
                  onChange={(e) => {
                    setShowHighLow(e?.target?.checked);
                  }}
                  name="showHighLow"
                  color="primary"
                />
              }
              label="Show High Low"
            />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
