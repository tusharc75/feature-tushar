import React, { useEffect, useState } from 'react'
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { Box, Grid, Typography } from '@material-ui/core';
import placeholder_img from 'src/assets/PerformanceTuning.png';
import {
    prepareDataForGrid,
} from 'src/constants/helpers';
import { ChartRenderer } from './ChartRenderer';
import Loader from 'src/components/Loader';


function Index() {

    function generateRandomValues(count) {
        const randomValues = [];

        for (let i = 0; i < count; i++) {
            const randomValue = Math.floor(Math.random() * 100);
            randomValues.push(randomValue);
        }

        return randomValues;
    }


    const {
        state: { userLoading }
    }: any = useData();

    const [dataVal, setDataVal] = useState({});
    const [loading, setLoading] = useState(false);

    const fetchIotDataPointsData = () => {
        setLoading(true);
        axiosInstance()
            .get(`${routes?.iotDataPoints?.path}`)
            .then(({ data: { data } }) => {
                let count = data?.count;
                let rows = data?.data?.map((u: any) => {
                    let finalObject: any = prepareDataForGrid(u);

                    return {
                        ...finalObject
                    };
                });
                let result = {}
                rows.map((obj) => {
                    const { category, fieldLabel, fieldName } = obj;

                    if (!result[category]) {
                        result[category] = {};
                    }

                    if (!result[category].hasOwnProperty(fieldName)) {
                        let dataValues = generateRandomValues(3);
                        let dataArr = []
                        dataValues.map((d) => {
                            const randomDay = Math.floor(Math.random() * 31) + 1;
                            const randomMonth = Math.floor(Math.random() * 12) + 1;
                            const randomHour = Math.floor(Math.random() * 24);
                            const randomMinute = Math.floor(Math.random() * 60);
                            const randomSecond = Math.floor(Math.random() * 60);
                            const randomDate = new Date(2023, randomMonth - 1, randomDay, randomHour, randomMinute, randomSecond);
                            dataArr.push({
                                data: d,
                                date: randomDate
                            })
                        })
                        const newObj = {
                            fieldLabel: fieldLabel,
                            dataPoints: dataArr,
                            hide: false
                        }

                        result[category][fieldName] = newObj;
                    }
                    else {
                        result[category][fieldName]['dataPoints'].push({
                            data: 13,
                            date: '29/7/2023'
                        });
                    }

                })

                setDataVal(result);
                setLoading(false);
            }).catch((err) => {
                setLoading(false);
                console.error(err)
            });
    };

    useEffect(() => {
        fetchIotDataPointsData();
    }, [])


    const chart = {
        uniqueId: "someUniqueId",
        chartType: "line", // or "bar" or any other type
        stack: true,       // example attribute, you can modify as per your actual usage
        kpi: {
            horizontalBar: false
        }
    };


    return (
        <div>
            {!userLoading ? (
                <>
                <Box pt={1}>
                    {loading ? (
                        <Loader minHeight="100%" height="calc(100vh - 200px)" noLoader={false} text="Loading Data..." />

                    ) : (
                        Object.keys(dataVal).length === 0 ? (
                            <Box
                                style={{ height: 'calc(100vh - 256px)', minHeight: '400px' }}
                                width={'100%'}
                                display={'flex'}
                                flexDirection="column"
                                justifyContent={'center'}
                                alignItems={'center'}
                                className="asdfkasjhdfkjsdh"
                            >
                                <img width={400} height={340} src={placeholder_img} alt="dashboard" />
                                <Typography color="textSecondary" variant="h5">
                                    No charts to display
                                </Typography>
                            </Box>
                        ) : (
                            <Grid
                                container
                                spacing={1}
                                justifyContent="space-between"
                                alignItems="stretch"
                                // style={{ height: 'calc(100vh - 256px)', minHeight: '600px', overflow: 'auto', display: 'flex', flexDirection: 'column' }}
                                style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}
                            >
                                {Object.keys(dataVal).length !== 0 && (
                                    Object.keys(dataVal).map((particularCategory) => (

                                        <ChartRenderer
                                            key={particularCategory}
                                            dataVal={dataVal}
                                            particularCategory={particularCategory}
                                            chart={chart}
                                        />
                                    ))
                                )}
                            </Grid>
                        )
                    )}

                </Box>
                </>
            ) :
                (
                    <Loader minHeight="100%" noLoader={false} text="Loading Data..." />
                )
            }



        </div>
    );
}

export default Index;