import { useState, useEffect, useContext, useCallback } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { Accordion, AccordionDetails, AccordionSummary, Box, Grid, IconButton, Typography } from '@material-ui/core';
import moment from 'moment';
import Chart from '../Chart';
import FilterModel from '../Chart/FilterModel';
import { dateTimeFormat } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import Loader from 'src/components/Loader';

const Analysis = ({ assetId, dataPoints }) => {

    const toastConfig = useContext(CustomToastContext);

    const [chartData, setChartData] = useState(null);
    const [chartLabels, setChartLabels] = useState(null)
    const [dateFilters, setDateFilters] = useState({
        from: new Date(moment().subtract(15, 'days').format('MM-DD-YYYY')),
        to: new Date(),
        intervals: '1minute'
    });
    const [expandedAccordition, setExpandedAccordition] = useState<string | false>('');

    useEffect(() => {
        if (dataPoints?.length && expandedAccordition) {
            fetchData()
        }
    }, [dataPoints, dateFilters, expandedAccordition])

    const fetchData = async () => {
        setChartData(null)
        setChartLabels(null)
        const selectedDataPoint = dataPoints?.filter(dataPoint => dataPoint?._id === expandedAccordition)[0];

        axiosInstance().get(`/report/iot/data-points`, {
            params: {
                asset: assetId,
                from_date: new Date(dateFilters.from).toISOString(),
                to_date: new Date(dateFilters.to).toISOString(),
                interval: dateFilters.intervals,
                dataPoints: selectedDataPoint?._id.toString()
            }
        })
            .then(({ data: { data } }) => {
                const chartLabel: any = []
                const chartData: any = []

                // for (let i = 0; i < data?.data?.length; i += 100) {
                // const arr = data?.data.slice(i, i + 100);
                data?.data?.forEach(e => {
                    chartLabel.push(moment(e?.time).format(dateTimeFormat))
                    chartData.push(e[selectedDataPoint?.fieldName])
                });
                setChartLabels(chartLabel)
                setChartData(chartData)
                // }
            })
            .catch((error) => {
                toastConfig.setToastConfig(error);
            });
    };

    const handleChange = useCallback((name: string) => {
        setExpandedAccordition((prev) => (!prev ? name : prev === name ? false : name));
    }, []);

    return (
        <>
            <FilterModel dateFilters={dateFilters} setDateFilters={setDateFilters} />
            <Box mt={2}>
                {
                    dataPoints?.map((dataPoint) => {
                        return (
                            <Box mt={2}>
                                <Accordion expanded={expandedAccordition === dataPoint?._id} className={`omsAccordian`} onChange={() => { handleChange(dataPoint?._id) }}>
                                    <AccordionSummary aria-controls="user-panel-content" id="user-panel-header">
                                        <Box display="flex">
                                            <Box>
                                                <IconButton size="small"> {expandedAccordition === dataPoint?._id ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
                                            </Box>
                                            <Box padding="5px">
                                                <Typography variant="subtitle2" style={{ fontSize: '14.2056px', fontWeight: 600 }}>
                                                    {dataPoint?.fieldLabel}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        {
                                            (chartData && chartLabels) ? (
                                                <Chart
                                                    id={`${dataPoint?._id}`}
                                                    data={
                                                        {
                                                            labels: chartLabels,
                                                            datasets: [{
                                                                label: dataPoint?.fieldLabel,
                                                                data: chartData,
                                                                borderColor: 'rgb(255, 99, 132)',
                                                                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                                                            }]
                                                        }
                                                    }
                                                />
                                            ) :
                                                (
                                                    <Loader text="Loading ..." />
                                                )
                                        }
                                    </AccordionDetails>
                                </Accordion>
                            </Box>
                        )
                    })
                }
            </Box>
        </>
    );
};

export default Analysis;
