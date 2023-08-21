import { AppBar, Box, FormControl, Grid, InputLabel, MenuItem, Select, TextField, makeStyles } from '@material-ui/core';
import React, { Fragment, useCallback, useEffect, useState } from 'react'
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import routes from 'src/components/Helpers/Routes';
import Chart from './Chart'
import FormTypes from 'src/components/Helpers/FormTypes';
import { KeyboardDatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import { RESOURCE_LABEL, dateFormatForInputControl, serializedAsset, sidebarResource } from '../../constants/helpers';
import { Autocomplete, ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import moment from 'moment';
import DateFnsUtils from '@date-io/date-fns';
import { debounce, set } from 'lodash';
import axiosInstance from 'src/axios/axiosInstance';

function IotChart() {
    const [serializedAssets, setSerializedAssets] = useState([])
    const [typeAlignment, setTypeAlignment] = useState('byCategory')
    const [loading, setLoading] = useState(false)
    const [serializedAssetOptions, setSerializedAssetOptions] = useState([])

    const fetchOptions = useCallback(
        debounce(async (searchKey: string = '') => {
            try {
                const lookupResourceName = sidebarResource.serializedAsset;
                let query = `sa-field/options?resource=${lookupResourceName}&limit=10&search=${searchKey}`;
                const response = await axiosInstance().get(query);
                const options = [...response.data.data];
                setSerializedAssetOptions(options);
                setLoading(false);
            } catch (error) {
                console.error(error);
            }
        }, 1000),
        []
    );

    const types = [{
        optionValue: 'byCategory',
        optionLabel: 'By Category'
    }, {
        optionValue: 'dataPoint',
        optionLabel: 'Data Points'
    }]

    return (
        <div className="main-container-v1">
            <Grid container className="headerbox-v1">
                <Grid item md={4} sm={11} xs={10}>
                    <CustomBreadCrumbs routes={[routes.iotChart]} />
                </Grid>
            </Grid>
            <CustomContainer>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <Autocomplete
                            multiple
                            onOpen={() => {
                                setSerializedAssetOptions([]);
                                setLoading(true);
                                fetchOptions('');
                            }}
                            onInputChange={(event, value) => fetchOptions(value)}
                            options={serializedAssetOptions}
                            fullWidth
                            loading={loading}
                            getOptionLabel={(option: any) => option.optionLabel ?? ''}
                            getOptionSelected={(option: any, value: any) => option?.optionValue === value?.optionValue}
                            value={serializedAssets || []}
                            onChange={(e, val) => {
                                setSerializedAssets(val);
                            }}
                            size="small"
                            renderInput={(params) => <TextField {...params} label={'Serialized Assets'} variant="outlined" name={'serializedAssets'} />}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Autocomplete
                            options={types}
                            fullWidth
                            loading={loading}
                            getOptionLabel={(option: any) => option.optionLabel ?? ''}
                            getOptionSelected={(option: any, value: any) => option?.optionValue === value?.optionValue}
                            value={types?.find(t => t.optionValue === typeAlignment) || {}
                            }
                            onChange={(e, val) => {
                                setTypeAlignment(val?.optionValue)
                            }}
                            size="small"
                            renderInput={(params) => <TextField {...params} label={'Type'} variant="outlined" name={'type'} />}
                        />
                        {/* <ToggleButtonGroup
                            color="primary"
                            value={typeAlignment}
                            size='small'
                            exclusive
                            onChange={handleChange}
                            aria-label="Type"
                        >
                            <ToggleButton color='primary' value="byCategory">By Category</ToggleButton>
                            <ToggleButton value="dataPoint">Data Point</ToggleButton>
                        </ToggleButtonGroup> */}
                    </Grid>
                </Grid>
                <Chart serializedAssets={serializedAssets?.map(s => s?.optionValue)} type={typeAlignment} />
            </CustomContainer>
        </div>
    )
}

export default IotChart;