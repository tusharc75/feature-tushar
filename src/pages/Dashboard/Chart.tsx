import { Box, Grid, Typography } from '@material-ui/core';
import React from 'react';
import DateFnsUtils from '@date-io/date-fns';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import moment from 'moment';
import axiosInstance from 'src/axios/axiosInstance';
import ChartTypes from '../NewDashboard-Test/ChartTypes';
import countriesData from 'src/constants/Country.json';
import GlobalFilter from '../NewDashboard-Test/GlobalFilter';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import { ChartDataType } from '../NewDashboard-Test/ChartTypes';
import FullScreenChart from '../NewDashboard-Test/FullScreenChart';
import { periodOption } from '../DashboardBuilder/builderHelpers';

const Chart = () => {

    const { state: { user, userLoading, selectedEntity } } = useData();
    const { setToastConfig } = React.useContext(CustomToastContext);
    const [filtersOptions, setFilterOptions] = React.useState(null);
    const [charts, setCharts] = React.useState(null);
    const [openFullScreenChart, setOpenFullScreenChart] = React.useState(false);
    const [selectedChart, setSelectedChart] = React.useState(null);
    const [globalFilters, setGlobalFilters] = React.useState(() => {
        return {
            currency: user?.user?.currency || `USD`,
            between: {
                from: new Date(moment().subtract(1, 'year').calendar()),
                to: new Date()
            }
        };
    });

    React.useEffect(() => {
        fetchDashboards();
    }, []);

    const fetchFilter = () => {
        axiosInstance().get(`sa-formbuilder/lookup?lookupResource=Product Category,Market Segment,Customer Account,Product,User,Warehouse`)
            .then(({ data: { data } }) => {
                if (data) {
                    Object.keys(data).forEach((_d) => {
                        setFilterOptions({
                            productDescription: data['Product'],
                            productCategory: data['Product Category'],
                            customerAccount: data['Customer Account'].filter((c: any) =>
                                Array.isArray(c?.entity) ? c?.entity?.findIndex((entity: any) => entity === selectedEntity) !== -1 : c?.entity === selectedEntity
                            ),
                            salesRep: data['User'].filter((u: any) => u?.entities?.findIndex((d: any) => d.entity === selectedEntity) !== -1),
                            marketSegment: data['Market Segment'].filter((d) => !d.parentMarketSegment),
                            subMarketSegment: data['Market Segment'].filter((d) => d.parentMarketSegment),
                            warehouse: data['Warehouse'],
                            countryBillTo: countriesData,
                            countrySellTo: countriesData,
                            country: countriesData,
                            period: periodOption
                        });
                    });
                }
            })
            .catch((err) => {
                setToastConfig(err);
            });
    }

    const fetchDashboards = () => {
        axiosInstance()
            .get('/dashboard-master/pin-charts')
            .then(({ data: { data } }) => {
                if (data?.length) {
                    data?.forEach((e) => {
                        e.column = 12;
                    })
                    setCharts(data);
                    fetchFilter()
                }
            })
            .catch((err) => {
                //setToastConfig(err);
            });
    };

    return (charts && !userLoading ?
        <Box pt={3}>
            <MuiPickersUtilsProvider utils={DateFnsUtils}>
                <React.Fragment>
                    <GlobalFilter
                        globalFilters={globalFilters}
                        setGlobalFilters={setGlobalFilters}
                        disabled={false}
                        dashboardList={[]} />
                    <Box bgcolor="#efefef" p={1} pt={1}>
                        <Grid container spacing={1} justifyContent="space-between" alignItems="stretch">
                            {charts.map((chart: ChartDataType, index: number) => (
                                <ChartTypes
                                    globalFilters={globalFilters}
                                    key={chart.chartType + ' ' + index + 1}
                                    chart={chart}
                                    filterData={{ ...filtersOptions }}
                                    setSelectedChart={(currentChart: ChartDataType) => {
                                        setSelectedChart(currentChart);
                                        setOpenFullScreenChart(true);
                                    }}
                                    fetchDashboards={fetchDashboards}
                                />
                            ))}
                        </Grid>
                    </Box>
                </React.Fragment>
                {openFullScreenChart && (
                    <FullScreenChart
                        chart={selectedChart}
                        globalFilters={globalFilters}
                        filterData={{ ...filtersOptions }}
                        close={() => {
                            setOpenFullScreenChart(false);
                            setSelectedChart(null);
                        }}
                        selectedDashboardId={null}
                        fetchDashboards={fetchDashboards}
                    />
                )}
            </MuiPickersUtilsProvider>
        </Box>
        : <div>
        </div>
    );
};

export default Chart;
