import { useState, useEffect, useContext } from 'react';
import TextField from '@material-ui/core/TextField';
import Box from '@material-ui/core/Box';
import Autocomplete from '@material-ui/lab/Autocomplete';
import Chip from '@material-ui/core/Chip';
import axiosInstance from '../../../axios/axiosInstance';
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import { Checkbox, FormControlLabel, Grid } from '@material-ui/core';

export const MinMax = ({ values, setFieldValue, handleValuesChange }) => {

    const toastConfig = useContext(CustomToastContext)
    const [services, setServices] = useState([]);


    useEffect(() => {
        axiosInstance()
            .get(`/sa-formbuilder/lookup?lookupResource=Service Master`)
            .then(({ data: { data } }) => {
                setServices(data['Service Master']);
            });
    }, []);

    return (<Box>
        <FormControlLabel
            control={
                <Checkbox
                    name="isMinMaxValue"
                    checked={values['isMinMaxValue']}
                    onChange={(e) => {
                        setFieldValue('isMinMaxValue', e.target.checked);
                        handleValuesChange({
                            isMinMaxValue: e.target.checked
                        });
                    }}
                    color="primary"
                />
            }
            label="Min Max Value"
        />
        {values['isMinMaxValue'] &&
            <Grid spacing={2} container>
                <Grid item xs={12} sm={6} md={6}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        label={"Min Value"}
                        name={"minValue"}
                        margin="dense"
                        type="number"
                        value={values["minValue"]}
                        onChange={(e) => {
                            setFieldValue('minValue', parseFloat(e.target.value.replace(/[^0-9\.]/g, '')));
                            handleValuesChange({
                                minValue: parseFloat(e.target.value.replace(/[^0-9\.]/g, ''))
                            });
                        }
                        }
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={6}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        label={"Max Value"}
                        name={"maxValue"}
                        margin="dense"
                        type="number"
                        value={values["maxValue"]}
                        onChange={(e) => {
                            setFieldValue('maxValue', parseFloat(e.target.value.replace(/[^0-9\.]/g, '')));
                            handleValuesChange({
                                maxValue: parseFloat(e.target.value.replace(/[^0-9\.]/g, ''))
                            });
                        }
                        }
                    />

                </Grid>
                {services.length !== 0 && <>
                    <Grid item xs={12} sm={6} md={6}>
                        <Autocomplete
                            options={services}
                            fullWidth
                            value={values?.minValueServiceAdd ? services?.find((data: any) => values?.minValueServiceAdd === data.optionValue) : []}
                            getOptionLabel={(option) => option.optionLabel}
                            getOptionSelected={(option: any, val: any) => option.optionValue === val.optionValue}
                            onChange={(_, newVal: any) => {
                                setFieldValue('minValueServiceAdd', newVal?.optionValue);
                                handleValuesChange({
                                    minValueServiceAdd: newVal?.optionValue
                                });
                            }}
                            renderInput={(params) => <TextField {...params} margin="dense" label="Value Exceed Min  Service Add" name="passAddon" variant="outlined" />}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={6}>
                        <Autocomplete
                            options={services}
                            fullWidth
                            value={values?.maxValueServiceAdd ? services?.find((data: any) => values?.maxValueServiceAdd === data.optionValue) : []}
                            getOptionLabel={(option) => option.optionLabel}
                            getOptionSelected={(option: any, val: any) => option.optionValue === val.optionValue}
                            onChange={(_, newVal: any) => {
                                setFieldValue('maxValueServiceAdd', newVal?.optionValue);
                                handleValuesChange({
                                    maxValueServiceAdd: newVal?.optionValue
                                });
                            }}
                            renderInput={(params) => <TextField {...params} margin="dense" label="Value Exceed Max Service Add" name="passAddon" variant="outlined" />}
                        />
                    </Grid>
                </>}
            </Grid>
        }
    </Box>
    );
}