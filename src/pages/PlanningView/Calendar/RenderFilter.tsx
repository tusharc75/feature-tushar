import { CircularProgress, TextField } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.scss';

const RenderFilter = ({ filtered, lookupResource, selectedLookUpResourceData, setSelectedLookUpResourceData, lookupLoading }) => {
  return (
    <Autocomplete
      options={lookupResource ? lookupResource[filtered?.value] : []}
      multiple
      disableCloseOnSelect
      style={{ width: '300px' }}
      getOptionLabel={(option: any) => option?.optionLabel}
      value={selectedLookUpResourceData && selectedLookUpResourceData[filtered.key] ? selectedLookUpResourceData[filtered.key] : []}
      onChange={(event, newValue) => {
        if (newValue?.length > 0) {
          setSelectedLookUpResourceData((preVal) => ({
            ...preVal,
            [filtered.key]: newValue
          }));
        } else {
          const { [filtered.key]: _, ...remainObj } = selectedLookUpResourceData;
          setSelectedLookUpResourceData(remainObj);
        }
      }}
      size="small"
      renderInput={(params) => (
        <TextField
          {...params}
          label={`Select ${filtered?.label}`}
          variant="outlined"
          slotProps={{
            input: {
              ...params.InputProps,
              endAdornment: (
                <>
                  {lookupLoading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              )
            }
          }}
        />
      )}
    />
  );
};

export default RenderFilter;
