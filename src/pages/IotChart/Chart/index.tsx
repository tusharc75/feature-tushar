import React, { useEffect, useState } from 'react'
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { gridFilterParser } from '../../../constants/useColumns';
import {
    prepareDataForGrid,
} from 'src/constants/helpers';
import {ChartRenderer} from './ChartRenderer'


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
        state: { permissions, selectedEntity, user }
    }: any = useData();

    const [dataVal, setDataVal] = useState({});
    const [loading, setLoading] = useState(false);

    const getQueryString = (isExport = false) => {
        let page = 0, limit = 25;
        let filters = {}
        let deepFilter = `?page=${page}&limit=${limit}`;

        if (isExport) {
            deepFilter = `?`;
        }

        if (selectedEntity) {
            deepFilter = `${deepFilter}&entity=${selectedEntity}`;
        }

        const { filterByIds, deepFilters } = gridFilterParser(filters);

        if (filterByIds?.length) {
            deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterByIds)}`;
        }
        if (deepFilters?.length) {
            deepFilter = `${deepFilter}&deepFilter=${encodeURI(JSON.stringify(deepFilters))}`;
        }
        if (filterByIds?.length || deepFilters?.length) {
            deepFilter = `${deepFilter}&filterType=and`;
        }

        return deepFilter;
    };

    const fetchIotDataPointsData = () => {
        setLoading(true);
        const queryString = getQueryString();
        axiosInstance()
            .get(`${routes?.iotDataPoints?.path}${queryString}`)
            .then(({ data: { data } }) => {
                let count = data?.count;
                let rows = data?.data?.map((u: any) => {
                    let finalObject: any = prepareDataForGrid(u);
                    finalObject['canDelete'] = permissions?.iotDataPoints?.isDelete;
                    finalObject['allowedToEdit'] = permissions?.iotDataPoints?.isUpdate;

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
                            dataArr.push({
                                data: d,
                                date: `${Math.floor(Math.random() * 31) + 1}/${Math.floor(Math.random() * 12) + 1}/2023`
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
        <div style={{overflowY: 'auto', padding: '16px' }}>
            {loading ? (
                <div className="loader">
                    <h3>Loading</h3>
                </div>
            ) : (
                Object.keys(dataVal).length !== 0 && (
                    Object.keys(dataVal).map((particularCategory) => (
                       
                        <ChartRenderer
                            key={particularCategory}
                            dataVal={dataVal}
                            particularCategory={particularCategory}
                            chart={chart}
                        />
                    ))
                )
            )}
        </div>
    );
}

export default Index;