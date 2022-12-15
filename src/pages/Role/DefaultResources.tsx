import { Box, TextField } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';

const DefaultResources = ({ resourceList, resourceName, setResourceName }) => {
  return (
    <Box pb={2}>
      <Box p={1}>
        <Autocomplete
          id="tags-outlined"
          disableCloseOnSelect={true}
          options={resourceList}
          getOptionLabel={(option: any) => option}
          value={resourceName || ''}
          onChange={(_event, newValue) => setResourceName(newValue)}
          renderInput={(params) => <TextField {...params} variant="outlined" label="Default Resource" placeholder="Resources" margin="dense" />}
        />
      </Box>
    </Box>
  );
};

export default DefaultResources;
