import { Box, TextField } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';

const DefaultResources = ({ resourceList, resourceName, setResourceName, isEdit }) => {
  return (
    <Box>
      <Box p={1}>
        <Autocomplete
          id="tags-outlined"
          disableCloseOnSelect={true}
          options={resourceList}
          getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
          isOptionEqualToValue={(option: any, val) => option.optionValue === val}
          value={
            resourceList && resourceList?.filter((data) => data.optionValue === resourceName)?.length
              ? resourceList && resourceList?.filter((data) => data.optionValue === resourceName)[0]
              : ''
          }
          onChange={(_event, newValue) => setResourceName(newValue && newValue?.optionValue ? newValue.optionValue : '')}
          renderInput={(params) => <TextField {...params} variant="outlined" label="Default Resource" placeholder="Resources" margin="dense" />}
          disabled={!isEdit}
        />
      </Box>
    </Box>
  );
};

export default DefaultResources;
