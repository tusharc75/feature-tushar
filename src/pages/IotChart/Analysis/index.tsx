import { useState, useEffect, useContext } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { Box, Grid } from '@material-ui/core';
import moment from 'moment';
import Chart from '../Chart';
import FilterModel from '../Chart/FilterModel';
import { dateTimeFormat } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const Analysis = ({ assetId, dataPoints }) => {

    const toastConfig = useContext(CustomToastContext);

    const [chartData, setChartData] = useState(null);
    const [dateFilters, setDateFilters] = useState({
        from: new Date(moment().subtract(15, 'days').format('MM-DD-YYYY')),
        to: new Date(),
        intervals: '1minute'
    });

    useEffect(() => {
        if (dataPoints?.length) {
            fetchData()
        }
    }, [dataPoints, dateFilters])

    const fetchData = async () => {

        let query = `?asset=${assetId}&interval=${dateFilters.intervals}&fromDate=${new Date(dateFilters.from).toISOString()}
        &toDate=${new Date(dateFilters.to).toISOString()}&dataPoints=${dataPoints?.map(d => d?._id)?.toString()}`;

        axiosInstance().get(`/report/iot/data-points${query}`)
            .then(({ data: { data } }) => {
                setChartData(data?.data)
            })
            .catch((error) => {
                toastConfig.setToastConfig(error);
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
                                                labels: chartData?.map((e) => moment(e?.time).format(dateTimeFormat)),
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
