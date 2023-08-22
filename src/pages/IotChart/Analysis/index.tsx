import { useState, useEffect } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { Box, Grid, TextField } from '@material-ui/core';
import moment from 'moment';
import Chart from '../Chart';
import { KeyboardDateTimePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';
import { Autocomplete } from '@material-ui/lab';

const Analysis = ({ assetId }) => {

    const [dataPoints, setDataPoints] = useState([]);
    const [dateFilters, setDateFilters] = useState({
        from: new Date(moment().subtract(15, 'days').format('MM-DD-YYYY')),
        to: new Date(),
        intervals: null
    });
    const [chartData, setChartData] = useState(null);

    const intervals = [
        {
            optionValue: 'minute',
            optionLabel: 'Minute'
        },
        {
            optionValue: '30minutes',
            optionLabel: '30 Minute'
        },
        {
            optionValue: '5hours',
            optionLabel: '5 Hour'
        },
        {
            optionValue: 'day',
            optionLabel: 'Day'
        },
        {
            optionValue: 'week',
            optionLabel: 'Week'
        },
        {
            optionValue: 'month',
            optionLabel: 'Month'
        },
        {
            optionValue: '6months',
            optionLabel: '6 Month'
        },
        {
            optionValue: 'quarter',
            optionLabel: 'Quarter'
        },
        {
            optionValue: 'year',
            optionLabel: 'Year'
        }
    ];

    useEffect(() => {
        axiosInstance().get(`${routes?.iotDataPoints?.path}`).then(({ data: { data } }) => {
            setDataPoints(data?.data)
        });
    }, [assetId]);

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
            <Box display="flex" justifyContent="end">
                <MuiPickersUtilsProvider utils={DateFnsUtils}>
                    <div className="grid grid-cols-1  sm:grid-cols-[1fr_1fr] md:grid-cols-[1Fr_1fr_1fr] lg:grid-cols-[auto_1fr_1fr_1fr] gap-2 flex-grow -mr-[40px] sm:mr-[0] max-w-[850px] " style={{ display: 'flex', justifyContent: 'end' }} >
                        <KeyboardDateTimePicker
                            inputVariant="outlined"
                            variant="inline"
                            fullWidth
                            size="small"
                            margin="none"
                            format="dd/MM/yyyy HH:mm"
                            autoOk
                            maxDate={dateFilters.to}
                            label="From"
                            views={['year', 'month', 'date', 'hours', 'minutes']}
                            value={dateFilters.from}
                            onChange={(date) => {
                                setDateFilters({ ...dateFilters, from: date });
                            }}
                        />
                        <KeyboardDateTimePicker
                            inputVariant="outlined"
                            variant="inline"
                            fullWidth
                            size="small"
                            margin="none"
                            autoOk
                            minDate={dateFilters.from}
                            format="dd/MM/yyyy HH:mm"
                            label="To"
                            views={['year', 'month', 'date', 'hours', 'minutes']}
                            value={dateFilters.to}
                            onChange={(date) => {
                                setDateFilters({ ...dateFilters, to: date });
                            }}
                        />
                        <Autocomplete
                            id={`interval`}
                            style={{ minWidth: '260px' }}
                            options={intervals}
                            autoHighlight
                            getOptionLabel={(option: any) => option?.optionLabel}
                            renderOption={(option) => option?.optionLabel}
                            onChange={(event, value) => {
                                setDateFilters({
                                    ...dateFilters,
                                    intervals: value?.optionValue || null
                                });
                            }}
                            value={intervals.find((v) => v.optionValue === dateFilters.intervals) || {}}
                            renderInput={(params) => <TextField {...params} name={`interval`} label="Interval" size="small" margin="none" variant="outlined" />}
                        />
                    </div>
                </MuiPickersUtilsProvider>
            </Box>
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
