import { Autocomplete, Box, CircularProgress, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { getResourceField } from "src/components/FormBuilder/helper";

const CopyFromHeaderFieldDropdown = ({ values, setFieldValue, resource }) => {

  const [resourceFields, setResourceFields] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getResourceFields()
  }, [])

  const getResourceFields = async () => {
    setLoading(true)
    try {
      const data: any = await getResourceField(resource);
      if (data?.length > 0) {
        setResourceFields(data);
      }
      setLoading(false)
    } catch (e) {
      setLoading(false)
    }
  };

  return (
    <Box mt={2}>
      <Autocomplete
        value={resourceFields?.some(f => f?.fieldName === values['copyFromHeaderField']) ? resourceFields?.find(f => f?.fieldName === values['copyFromHeaderField']) : ''}
        fullWidth
        style={{ minWidth: '300px', maxWidth: '500px' }}
        size="small"
        options={resourceFields}
        getOptionLabel={(option) => option?.fieldLabel || ''}
        onChange={(event: any, newValue) => {
          setFieldValue('copyFromHeaderField', newValue?.fieldName);
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            margin="dense"
            label="Copy From Header Field"
            variant="outlined"
            name="copyFromHeaderField"
            slotProps={{
              input: {
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                )
              }
            }} />
        )}
      />
    </Box>
  )
}

export default CopyFromHeaderFieldDropdown;
