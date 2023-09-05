import { useState, useEffect, useContext } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { isEmpty } from 'lodash';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { Box } from '@material-ui/core';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

const Chart = ({ dateFilters, assetId, dataPoints, errorDescriptions = null }) => {

    const toastConfig = useContext(CustomToastContext);
    const [chartData, setChartData] = useState(null);
    const [annotations, setAnnotations] = useState({
        xaxis: [],
        points: []
    });

    useEffect(() => {
        if (!isEmpty(dataPoints)) {
            fetchData();
        }
    }, [assetId, dataPoints, dateFilters]);

    const fetchData = () => {
        axiosInstance()
            .get(`/report/iot/data-points`, {
                params: {
                    asset: assetId,
                    from_date: new Date(dateFilters.from).toISOString(),
                    to_date: new Date(dateFilters.to).toISOString(),
                    interval: dateFilters.intervals,
                    dataPoints: dataPoints?.map((e) => e._id)?.toString(),
                    timezone: Intl?.DateTimeFormat()?.resolvedOptions()?.timeZone
                }
            })
            .then(({ data: { data } }) => {
                const newData = dataPoints?.map(obj => ({
                    name: obj?.fieldLabel,
                    data: data?.data?.map(e => [new Date(e.time).getTime(), e[obj?.fieldName]])
                }));

                setChartData(newData);
            })
            .catch((error) => {
                toastConfig.setToastConfig(error);
            });
    };

    const fetchAlert = () => {
        axiosInstance()
            .get(`/report/iot/asset-error-message?asset=${assetId}&from_date=${new Date(dateFilters.from).toISOString()}&to_date=${new Date(dateFilters.to).toISOString()}&errorDescriptions=${errorDescriptions?.map((e) => e)?.toString()}`)
            .then(({ data: { data } }) => {
                const xaxis: any = [];
                const points: any = [];
                data?.forEach(d => {
                    if (d?.errorMessage) {
                        const x = new Date(d.time).getTime();
                        xaxis.push({
                            x,
                            strokeDashArray: 0,
                            borderColor: '#775DD0',
                            label: {
                                borderColor: '#775DD0',
                                style: {
                                    color: '#fff',
                                    background: '#775DD0',
                                },
                                text: d?.errorMessage,
                            }
                        })
                        points.push({
                            x,
                            y: 145,
                            marker: {
                                size: 5,
                                fillColor: '#fff',
                                strokeColor: 'red',
                                radius: 2,
                            },
                            label: {
                                borderColor: '#FF4560',
                                offsetY: 0,
                                style: {
                                    color: '#fff',
                                    background: '#FF4560',
                                },
                                text: d?.errorMessage,
                            }
                        })
                    }
                });
                setAnnotations({
                    xaxis,
                    points
                })
            })
            .catch((error) => {
                toastConfig.setToastConfig(error);
            });
    };

    useEffect(() => {
        if (errorDescriptions) {
            fetchAlert()
        } else {
            setAnnotations({
                xaxis: [],
                points: []
            })
        }
    }, [errorDescriptions, assetId, dateFilters])

    const options: ApexOptions = {
        chart: {
            stacked: false,
            zoom: {
                type: 'x',
                enabled: true,
                autoScaleYaxis: true
            },
            toolbar: {
                autoSelected: 'zoom'
            }
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            curve: 'straight',
            width: 1
        },
        fill: {
            type: 'solid',
        },
        markers: {
            size: 0
        },
        xaxis: {
            type: 'datetime'
        },
        tooltip: {
            shared: true,
            y: {
                formatter: function (val) {
                    return typeof val === 'number' ? val.toFixed(2) : parseFloat(val).toFixed(2);
                }
            }
        },
        annotations
        // xaxis: [{
        //     x: 1691994600000,
        //     strokeDashArray: 0,
        //     borderColor: '#775DD0',
        //     label: {
        //         borderColor: '#775DD0',
        //         style: {
        //             color: '#fff',
        //             background: '#775DD0',
        //         },
        //         text: 'Alert',
        //     }
        // }],
        // points: [{
        //     x: 1692994600000,
        //     y: 145,
        //     marker: {
        //         size: 5,
        //         fillColor: '#fff',
        //         strokeColor: 'red',
        //         radius: 2,
        //     },
        //     label: {
        //         borderColor: '#FF4560',
        //         offsetY: 0,
        //         style: {
        //             color: '#fff',
        //             background: '#FF4560',
        //         },
        //         text: 'Alert',
        //     }
        // }]
        // }
    };

    return (
        <> {chartData ?
            <ReactApexChart
                options={options}
                series={chartData}
                type="line"
                height={500}
            />
            : <Box p={2} height={500}>
                <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>}
        </>
    );
};

export default Chart;
