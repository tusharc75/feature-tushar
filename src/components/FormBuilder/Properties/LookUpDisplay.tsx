import { Box, CircularProgress, Grid, TextField } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import React from 'react';
import { getResourceField } from '../helper';

function LookUpDisplay({ lookupFields, values, fieldSet, touched, errors }) {

    const [lookupFieldDisplay, setLookupFieldDisplay] = React.useState([]);
    const [lookupFieldDisplayLoading, setLookupFieldDisplayLoading] = React.useState(false);

    React.useEffect(() => {
        if (values['lookUpField']) {
            getFields()
        }
    }, [values['lookUpField'], lookupFields]);

    const getFields = async () => {
        setLookupFieldDisplayLoading(true);
        const lookUpFieldDisplay = lookupFields.filter((data) => data?.value === values['lookUpField'])[0];
        try {
            const data: any = await getResourceField(lookUpFieldDisplay?.value);
            setLookupFieldDisplay(data);
            setLookupFieldDisplayLoading(false);
        } catch (e) {
            setLookupFieldDisplayLoading(false);
        }
    };

    return (
        <Box pt={1} pb={1}>
            <Grid container spacing={1}>
                <Grid item xs={6} sm={6} md={6}>
                    <Autocomplete
                        id="lookup-field"
                        options={lookupFields}
                        getOptionLabel={(option: any) => (option ? option.name : '')}
                        getOptionSelected={(option: any, val) => option?.value === val}
                        value={
                            lookupFields &&
                                lookupFields.filter(lookupField => lookupField?.value === values['lookUpField']).length
                                ?
                                lookupFields.filter(lookupField => lookupField?.value === values['lookUpField'])[0]
                                :
                                ''
                        }
                        onChange={(e, val) => {
                            fieldSet('lookUpField', val && val.value ? val.value : '');
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                margin="dense"
                                variant="outlined"
                                label="Look Up Field"
                                placeholder="Look Up Field"
                                error={touched['lookUpField'] && Boolean(errors['lookUpField'])}
                                helperText={touched['lookUpField'] && errors['lookUpField']}
                            />
                        )}
                    />
                </Grid>
                {values['lookUpField'] && (
                    <Grid item xs={6} sm={6} md={6}>
                        <Autocomplete
                            id="lookup-field-display"
                            options={lookupFieldDisplay}
                            disabled={lookupFieldDisplayLoading}
                            getOptionLabel={(option: any) => (option ? option?.fieldLabel : '')}
                            getOptionSelected={(option: any, val) => option?.fieldName === val}
                            value={
                                lookupFieldDisplay && lookupFieldDisplay.filter((data) => data?.fieldName === values['lookUpFieldDisplay']).length
                                    ? lookupFieldDisplay.filter((data) => data?.fieldName === values['lookUpFieldDisplay'])[0]
                                    : ''
                            }
                            onChange={(e, val) => {
                                fieldSet('lookUpFieldDisplay', val && val?.fieldName ? val?.fieldName : '');
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    margin="dense"
                                    variant="outlined"
                                    label="Look Up Field Display"
                                    placeholder="Look Up Field Display"
                                    InputProps={{
                                        ...params.InputProps,
                                        endAdornment: (
                                            <React.Fragment>
                                                {lookupFieldDisplayLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                                {params.InputProps.endAdornment}
                                            </React.Fragment>
                                        )
                                    }}
                                    error={touched['lookUpFieldDisplay'] && Boolean(errors['lookUpFieldDisplay'])}
                                    helperText={touched['lookUpFieldDisplay'] && errors['lookUpFieldDisplay']}
                                />
                            )}
                        />
                    </Grid>
                )}
            </Grid>
        </Box>
    );
}

export default LookUpDisplay;
