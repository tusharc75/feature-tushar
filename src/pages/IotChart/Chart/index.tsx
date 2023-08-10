import React, { useEffect, useState } from 'react'
import Chart from 'react-chartjs-2';

// Dummy Data Generator
const generateDummyData = (categories, count) => {
    const data = Array.from({ length: count }).map(() => {
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        return {
            categoryName: randomCategory,
            data: Math.floor(Math.random() * 100),
            date: `${Math.floor(Math.random() * 31) + 1}/${Math.floor(Math.random() * 12) + 1}/2023`
        };
    });

    // Assuming data is in line chart format
    return {
        labels: data.map(item => item.date),
        datasets: categories.map(category => ({
            label: category,
            data: data.filter(item => item.categoryName === category).map(item => item.data),
            borderColor: `rgba(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, 1)`,
            fill: false
        }))
    };
};

const categories = ['Technology', 'Health', 'Business', 'Education', 'Entertainment'];
const chartData = generateDummyData(categories, 15);

function Index() {
    const chart = {
        uniqueId: "someUniqueId",
        chartType: "line", // or "bar" or any other type
        stack: true,       // example attribute, you can modify as per your actual usage
        kpi: {
            horizontalBar: false
        }
    };

    return (
        <Chart
            id={chart.uniqueId}
            type={chart.chartType?.toLowerCase()}
            data={{
                ...chartData,
                datasets: chartData.datasets?.map((d) => {
                    if (!chart.stack) {
                        delete d.stack;
                    }
                    return d;
                })
            }}
            options={{
                maintainAspectRatio: false,
                indexAxis: chart?.kpi?.horizontalBar ? 'y' : 'x',
                ...(chart.stack &&
                    !chartData.datasets.some((d) => d.stack === 'stacked') && {
                    scales: {
                        x: {
                            stacked: true
                        },
                        y: {
                            stacked: true
                        }
                    }
                })
            }}
        />
    );
}

export default Index;