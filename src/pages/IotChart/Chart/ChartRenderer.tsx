import React, { useState } from 'react'
import Chart from 'react-chartjs-2';

import {FilterHandler} from './FilterHandler';


export function ChartRenderer({ dataVal, particularCategory, chart }) {

    const [tempDataVal, setTempDataVal] = useState(dataVal);
    function myDates() {
        let subcategories = Object.keys(tempDataVal).length !== 0 ? Object.keys(tempDataVal[particularCategory]).filter((item) => {
            if (tempDataVal[particularCategory][item]['hide'] === false) {
                return item;
            }
        }) : []

        let labels = [];
        subcategories?.map((cat) => {
            const currentData = tempDataVal[particularCategory][cat]?.dataPoints
            currentData?.map((m) => {
                labels.push(m?.date)
            })
        })

        const dateObjects = labels?.map((dateString) => {

            const [day, month, year] = dateString.split("/");

            // Creating a new Date object using the parsed values
            return new Date(`${year}-${month}-${day}`);
        });
        return dateObjects;

    }

    const returnDates = myDates()
    const fromDate = new Date(Math.min(...returnDates));
    const toDate = new Date(Math.max(...returnDates));
    const [dateFilters, setDateFilters] = useState({
        from: fromDate,
        to: toDate
    })

    // Function to align data with labels
    function alignDataWithLabels(dataSet, labels) {
        const alignedData = new Array(labels.length).fill(null);
        dataSet.forEach(item => {
            const index = labels.indexOf(item.date);
            if (index !== -1) {
                alignedData[index] = item.data;
            }
        });
        return alignedData;
    }


    const generateChartData = (particularCategory) => {
        // const subcategories = Object.keys(dataVal).length !== 0 ? Object.keys(dataVal[particularCategory]) : [];
        let subcategories = Object.keys(tempDataVal).length !== 0 ? Object.keys(tempDataVal[particularCategory]).filter((item) => {
            return tempDataVal[particularCategory][item]['hide'] === false;
        }) : []

        let labels = [];
        const {from, to} = dateFilters;

        const fromDate = new Date(from);
        const toDate = new Date(to);
        
        subcategories?.map((cat) => {
            const currentData = tempDataVal[particularCategory][cat]?.dataPoints
            currentData?.map((m) => {
                labels.push(m?.date);
            })
        })
        const filteredLabels = labels.filter(label => {
            const [day, month, year] = label.split('/').map(Number);
            const date = new Date(year, month - 1, day); // Months are 0-based in Date
            return date >= fromDate && date <= toDate;
        });

       filteredLabels.sort((a, b) => {
            const [dayA, monthA, yearA] = a.split('/').map(Number);
            const [dayB, monthB, yearB] = b.split('/').map(Number);
            
            // Compare years first
            if (yearA !== yearB) {
                return yearA - yearB;
            }
            
            // If years are the same, compare months
            if (monthA !== monthB) {
                return monthA - monthB;
            }
            
            // If months are the same, compare days
            return dayA - dayB;
        });
        
        let datasets = []
        subcategories?.map(cat => (
            
            datasets.push({
            label: tempDataVal[particularCategory][cat].fieldLabel,
            data: alignDataWithLabels(tempDataVal[particularCategory][cat]?.dataPoints, filteredLabels),
            backgroundColor: `rgba(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, 1)`,
            borderColor: `rgba(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, 1)`,
    
        })))

        // Assuming data is in line chart format
        return {
            labels: filteredLabels,
            datasets: datasets
           
        };
    };

    const handleChange = (category,subcategory) => {
        setTempDataVal((prevDataVal) => {
            const updatedDataVal = {
                ...prevDataVal,
                [category]: {
                    ...prevDataVal[category],
                    [subcategory]: {
                        ...prevDataVal[category][subcategory],
                        hide: !prevDataVal[category][subcategory].hide,
                    },
                },
            };
            return updatedDataVal;
        });
    };

    const chartData = generateChartData(particularCategory);   

    return (
        <div style={{ border: '1px solid #ccc', padding: '16px', borderRadius: '8px', margin : '10px', maxWidth: '100%' }}>
            {/* <h3 style={{textAlign:"center", fontSize:30}}>{particularCategory + ' Chart'}</h3> */}
            <div>
                 <FilterHandler dateFilters={dateFilters} setDateFilters={setDateFilters} handleChange={handleChange} tempDataVal={tempDataVal} particularCategory={particularCategory}/>
            </div>
        
            <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                <Chart
                    id={`${particularCategory}-chart`}
                    type={chart.chartType?.toLowerCase()}
                    data={chartData}
                    style={{ height: '250px' }}
                    options={{
                        maintainAspectRatio: false,
                        indexAxis: chart?.kpi?.horizontalBar ? 'y' : 'x',
                        ...(chart.stack &&
                            !(generateChartData(particularCategory).datasets.some((d) => d?.stack === 'stacked')) && {
                            scales: {
                                x: {
                                    stacked : true,
                                },
                                y: {
                            
                                    stacked: true
                                }
                            }
                        })
                    }}
                />
            </div>
        </div>
    );
}
