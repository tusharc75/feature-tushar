import { useState, useEffect, useContext } from 'react';
import TextField from '@material-ui/core/TextField';
import Box from '@material-ui/core/Box';
import Autocomplete from '@material-ui/lab/Autocomplete';
import axiosInstance from '../../../axios/axiosInstance';
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import { Checkbox, CircularProgress, FormControlLabel, Grid } from '@material-ui/core';
import React from 'react';

export const Entity = ({ values, setFieldValue, touched, errors }) => {
    const toastConfig = useContext(CustomToastContext)
    const [entityOptions, setEntityOptions] = useState([]);
    const [loadingEntity, setLoadingEntity] = useState(false);

    useEffect(() => {
        setLoadingEntity(true)
        axiosInstance()
            .get(`/entity`)
            .then(({ data: { data } }) => {
                const options = data.map((data) => ({
                    optionValue: data._id,
                    optionLabel: data?.entityName || ""
                }))
                setEntityOptions(options || []);
                setLoadingEntity(false);
            }).catch((e) => {
                toastConfig.toast("error", "Error fetching entity options");
                setLoadingEntity(false);
            })
    }, []);

    return (<Box>
        <Grid container>
            <Grid item xs={12} md={6}>
                <FormControlLabel
                    control={
                        <Checkbox
                            name="isFieldEntityWise"
                            checked={values['isFieldEntityWise']}
                            onChange={(e) => {
                                setFieldValue('isFieldEntityWise', e.target.checked);
                                setFieldValue('fieldEntity', []);
                            }}
                            color="primary"
                        />
                    }
                    label="Show Entity Wise "
                />
            </Grid>
            <Grid item xs={12} md={6}>
                {values['isFieldEntityWise'] &&
                    <Autocomplete
                        id="entity-dependent-on-field"
                        multiple={true}
                        options={entityOptions}
                        disabled={!values['isFieldEntityWise']}
                        getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
                        getOptionSelected={(option: any, val) => option?.fieldName === val}
                        value={
                            values['fieldEntity']?.length > 0
                                ? entityOptions.filter((option) => values['fieldEntity'].includes(option.optionValue))?.map((option) => option)
                                : []
                        }
                        onChange={(e, val) => {
                            setFieldValue('fieldEntity', val.map((option) => option.optionValue));
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                margin="dense"
                                variant="outlined"
                                label="Entites"
                                InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                        <React.Fragment>
                                            {loadingEntity ? <CircularProgress color="inherit" size={20} /> : null}
                                            {params.InputProps.endAdornment}
                                        </React.Fragment>
                                    )
                                }}
                                error={touched['fieldEntity'] && Boolean(errors['fieldEntity'])}
                            />
                        )}
                    />
                }
            </Grid>
        </Grid>
    </Box>);
}