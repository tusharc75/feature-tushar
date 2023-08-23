import { useState, useEffect } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { Box, Grid, TextField } from '@material-ui/core';
import moment from 'moment';
import Chart from '../Chart';
import { KeyboardDateTimePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';
import { Autocomplete } from '@material-ui/lab';
import FilterModel from '../Chart/FilterModel';

const Analysis = ({ assetId, dataPoints }) => {

    const [dateFilters, setDateFilters] = useState({
        from: new Date(moment().subtract(15, 'days').format('MM-DD-YYYY')),
        to: new Date(),
        intervals: null
    });
    const [chartData, setChartData] = useState(null);

    useEffect(() => {
        if (dataPoints?.length) {
            fetchData()
        }
    }, [dataPoints, dateFilters])

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
            term: { $in: dataPoints?.map(d => d?._id) }
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
                    {
                        dataPoints?.map((dataPoint) => {
                            return (
                                <Grid item md={6} lg={6} xs={12} sm={12}>
                                    <Chart
                                        id={`${dataPoint?._id}`}
                                        data={
                                            {
                                                labels: chartData?.map((e) => e.date),
                                                datasets: [{
                                                    label: dataPoint?.fieldLabel,
                                                    data: chartData?.map((e) => e[dataPoint?.fieldName]),
                                                    borderColor: 'rgb(255, 99, 132)',
                                                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                                                }]
                                            }
                                        }
                                        label={dataPoint?.fieldLabel}
                                    />
                                </Grid>
                            )
                        })
                    }
                </Grid>
            </Box>
        </>
    );
};

export default Analysis;
