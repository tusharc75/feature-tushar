import { useState, useEffect } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { Box, Checkbox, FormControlLabel, FormGroup, Grid, TextField } from '@material-ui/core';
import moment from 'moment';
import Chart from '../Chart';
import { KeyboardDateTimePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';
import { Autocomplete } from '@material-ui/lab';
import { isEmpty } from 'lodash';
import FilterModel from '../Chart/FilterModel';

const PerformanceAnalysis = ({ assetId, dataPoints }) => {

    const [dateFilters, setDateFilters] = useState({
        from: new Date(moment().subtract(15, 'days').format('MM-DD-YYYY')),
        to: new Date(),
        intervals: null
    });
    const [chartData, setChartData] = useState(null);
    const [selectedDataPoint, setSelectedDataPoint] = useState({});

    useEffect(() => {
        if (!isEmpty(selectedDataPoint)) {
            fetchData()
        }
    }, [selectedDataPoint, dateFilters])

    const fetchData = async () => {
        const deepFilter: any = []
        deepFilter.push({
            field: 'from_date',
            term: moment(new Date(dateFilters.from)).format('MM/DD/YYYY')
        });
        deepFilter.push({
            field: 'to_date',
            term: moment(new Date(dateFilters.to)).format('MM/DD/YYYY')
        });

        let query = `?filterType=and`;

        const newfilterById = [{ field: 'asset', term: { $in: [assetId] } }];
        newfilterById.push({
            field: 'dataPoints',
            term: { $in: Object.keys(selectedDataPoint).filter(_k => selectedDataPoint[_k])?.map(k => dataPoints.find(d => d.fieldName === k)?._id) }
        });

        if (newfilterById?.length > 0) {
            query = `${query}&filterById=${JSON.stringify(newfilterById)}`;
        }
        if (deepFilter?.length > 0) {
            query = `${query}&deepFilter=${JSON.stringify(deepFilter)}`;
        }

        axiosInstance().get(`/report/iot/data-points${query}`)
            .then(({ data: { data } }) => {
                setChartData(data?.data)
            })
            .catch((err) => {
            });
    };

    return (
        <>
            <FilterModel dateFilters={dateFilters} setDateFilters={setDateFilters} />
            <Box mt={2}>
                <Grid container spacing={2}>
                    <Grid item lg={3}>
                        <FormGroup>
                            {
                                dataPoints?.map((dataPoint) => {
                                    return (
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    onChange={(e) => {
                                                        setSelectedDataPoint({ ...selectedDataPoint, [dataPoint?.fieldName]: e.target.checked })
                                                    }}
                                                    checked={selectedDataPoint[dataPoint?.fieldName]}
                                                    inputProps={{
                                                        'aria-labelledby': `checkbox-list-label-select-all`
                                                    }}
                                                />

                                            }
                                            label={dataPoint?.fieldLabel} />
                                    )
                                })
                            }
                        </FormGroup>
                    </Grid>
                    <Grid item lg={9}>
                        <Chart
                            id={`${Date.now()}`}
                            data={
                                {
                                    labels: chartData?.map((e) => e.date),
                                    datasets: Object.keys(selectedDataPoint).filter(_k => selectedDataPoint[_k]).map((_d, i) => ({
                                        label: dataPoints?.find(d => d.fieldName === _d)?.fieldLabel,
                                        data: chartData?.map((e) => e[_d]),
                                        borderColor: [
                                            'rgb(255, 99, 132)',
                                            'rgba(54, 162, 235)',
                                            'rgba(255, 206, 86)',
                                            'rgba(75, 192, 192)',
                                        ],
                                        backgroundColor: [
                                            'rgba(255, 99, 132, 0.5)',
                                            'rgba(54, 162, 235, 0.5)',
                                            'rgba(255, 206, 86, 0.5)',
                                            'rgba(75, 192, 192, 0.5)',
                                        ]
                                    }))
                                }
                            }
                        />
                    </Grid>
                </Grid>
            </Box>
        </>
    );
};

export default PerformanceAnalysis;
