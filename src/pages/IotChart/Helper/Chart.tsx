import { useState, useEffect, useContext } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { isEmpty } from 'lodash';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { Box } from '@material-ui/core';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

const Chart = ({ dateFilters, assetId, dataPoints, alert }) => {

    const toastConfig = useContext(CustomToastContext);
    const [chartData, setChartData] = useState(null);

    const [options, setOptions] = useState<ApexOptions>({
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
            width: 1,
        },
        fill: {
            type: 'solid',
        },
        markers: {
            size: 0
        },
        xaxis: {
            type: 'datetime',
        },
        // yaxis: {
        //     min: 0
        // },
        tooltip: {
            shared: true,
            y: {
                formatter: function (val) {
                    return typeof val === 'number' ? val.toFixed(2) : parseFloat(val).toFixed(2);
                }
            }
        },
        annotations: {
            xaxis: [],
            points: [],
        }
    })

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
                const newData: any = []
                const yaxis: any = []
                dataPoints?.forEach(dataPoint => {
                    newData.push({
                        name: dataPoint?.fieldLabel,
                        data: data?.data?.map(e => [new Date(e.time).getTime(), e[dataPoint?.fieldName]])
                    })
                    if (dataPoint?.highValue) {
                        yaxis.push({
                            y: dataPoint?.highValue,
                            borderColor: '#ff0000',
                            label: {
                                borderColor: '#ff0000',
                                style: {
                                    color: '#fff',
                                    background: '#ff0000'
                                },
                                text: `${dataPoint?.fieldLabel} High : ${dataPoint?.highValue}`
                            }
                        })
                    }
                    if (dataPoint?.lowValue) {
                        yaxis.push({
                            y: dataPoint?.lowValue,
                            borderColor: '#ff0000',
                            label: {
                                borderColor: '#fff',
                                style: {
                                    color: '#fff',
                                    background: '#ff0000'
                                },
                                text: `${dataPoint?.fieldLabel} Low : ${dataPoint?.lowValue}`
                            }
                        })
                    }
                });

                setOptions({
                    ...options,
                    annotations: {
                        ...options?.annotations,
                        yaxis: yaxis
                    }
                })

                setChartData(newData);
            })
            .catch((error) => {
                toastConfig.setToastConfig(error);
            });
    };

    const fetchAlert = () => {
        if (alert) {
            let api = `/report/iot/asset-error-message?asset=${assetId}&from_date=${new Date(dateFilters.from).toISOString()}&to_date=${new Date(dateFilters.to).toISOString()}`
            if (alert?.optionValue !== 'All') {
                api = `${api}&errorDescriptions=${alert?.optionValue}`
            }

            axiosInstance()
                .get(api)
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
                                    strokeColor: '#fff',
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
                    setOptions({
                        ...options, annotations: {
                            ...options?.annotations,
                            xaxis: xaxis,
                            points: points,
                        }
                    })
                })
                .catch((error) => {
                    toastConfig.setToastConfig(error);
                });
        }
        else {
            setOptions({
                ...options, annotations: {
                    xaxis: [],
                    points: []
                }
            })
        }
    };

    useEffect(() => {
        fetchAlert()
    }, [alert, assetId, dateFilters])

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
