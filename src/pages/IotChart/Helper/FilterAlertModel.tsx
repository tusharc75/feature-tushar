import { useEffect, useState } from "react";
import { Box, Checkbox, FormControlLabel, Grid, TextField } from "@material-ui/core";
import { Autocomplete } from "@material-ui/lab";
import axiosInstance from "src/axios/axiosInstance";
import routes from "src/components/Helpers/Routes";

export default function FilterAlertModel({ assetId, selectedAlert, setSelectedAlert, showHighLow, setShowHighLow }) {

    const [alertOptions, setAlertOptions] = useState([])

    const fetchErrorData = async () => {
        const { data: { data } } = await axiosInstance().get(`${routes?.deviceTemplateAlert?.path}`)
        setAlertOptions([{ optionLabel: 'All', optionValue: 'All' }, ...data?.map(d => ({ optionLabel: d?.message, optionValue: d?._id }))])
    };

    useEffect(() => {
        fetchErrorData()
    }, [assetId])

    return (
        <Box mt={2} mb={1}>
            <Grid container>
                <Grid item md={6} lg={6}>
                    <Autocomplete
                        options={alertOptions}
                        fullWidth
                        getOptionLabel={(option: any) => option?.optionLabel ?? ''}
                        value={
                            alertOptions.find((data) => data?.optionValue === selectedAlert?.optionValue)
                                ? alertOptions.find((data) => data?.optionValue === selectedAlert?.optionValue)
                                : ''
                        }
                        getOptionSelected={(option: any, val: any) => option.optionValue === val.optionValue}
                        onChange={(e, newVal) => {
                            setSelectedAlert(newVal);
                        }}
                        size="small"
                        renderInput={(params) => <TextField {...params} label="Select Alert" variant="outlined" />}
                    />
                </Grid>
                <Grid item md={6} lg={6}>
                    <Box ml={2}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={showHighLow}
                                    onChange={(e) => { setShowHighLow(e?.target?.checked) }}
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
    )
}