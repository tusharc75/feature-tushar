import { Box, TextField } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';

const DashboardResources = ({ dashboardList, dashboardName, setDashboardName }) => {
  return (
    <Box pt={2} mt={2} pb={0}>
      <Box p={1}>
        <Autocomplete
          multiple
          id="tags-outlined"
          disableCloseOnSelect={true}
          options={dashboardList}
          getOptionLabel={(option: any) => option.name}
          value={dashboardName}
          onChange={(_event, newValue) => setDashboardName(newValue)}
          renderInput={(params) => <TextField {...params} variant="outlined" label="Select Dashboard" placeholder="Dashboard" margin="dense" />}
        />
      </Box>
    </Box>
  );
};

export default DashboardResources;
