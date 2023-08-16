import React, { useState } from 'react';
import Chart from 'react-chartjs-2';

import { FilterHandler } from './FilterHandler';
import { Box, Grid, Typography, useMediaQuery, useTheme } from '@material-ui/core';
import { Dialog } from '@material-ui/core';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';

export function ChartRenderer({ dataVal, particularCategory, chart }) {
  const [tempDataVal, setTempDataVal] = useState(dataVal);
  const [openFullScreen, setOpenFullScreen] = useState(false);
  const theme = useTheme();

  const isScreenSmall = useMediaQuery(theme.breakpoints.down('xs'));

  function myDates() {
    let subcategories =
      Object.keys(tempDataVal).length !== 0
        ? Object.keys(tempDataVal[particularCategory]).filter((item) => {
            if (tempDataVal[particularCategory][item]['hide'] === false) {
              return item;
            }
          })
        : [];

    let labels = [];
    subcategories?.map((cat) => {
      const currentData = tempDataVal[particularCategory][cat]?.dataPoints;
      currentData?.map((m) => {
        labels.push(m?.date);
      });
    });

    // const dateObjects = labels?.map((dateString) => {

    //     const [day, month, year] = dateString.split("/");

    //     // Creating a new Date object using the parsed values
    //     return new Date(`${year}-${month}-${day}`);
    // });
    // return dateObjects;
    return labels;
  }

  const returnDates = myDates();
  const fromDate = new Date(Math.min(...returnDates));
  const toDate = new Date(Math.max(...returnDates));
  const [dateFilters, setDateFilters] = useState({
    from: fromDate,
    to: toDate
  });

  // Function to align data with labels
  function alignDataWithLabels(dataSet, labels) {
    const alignedData = new Array(labels.length).fill(null);
    dataSet.forEach((item) => {
      const index = labels.indexOf(item.date);
      if (index !== -1) {
        alignedData[index] = item.data;
      }
    });
    return alignedData;
  }

  const generateChartData = (particularCategory) => {
    // const subcategories = Object.keys(dataVal).length !== 0 ? Object.keys(dataVal[particularCategory]) : [];
    let subcategories =
      Object.keys(tempDataVal).length !== 0
        ? Object.keys(tempDataVal[particularCategory]).filter((item) => {
            return tempDataVal[particularCategory][item]['hide'] === false;
          })
        : [];

    let labels = [];
    const { from, to } = dateFilters;

    const fromDate = new Date(from);
    const toDate = new Date(to);

    subcategories?.map((cat) => {
      const currentData = tempDataVal[particularCategory][cat]?.dataPoints;
      currentData?.map((m) => {
        labels.push(m?.date);
      });
    });
    // Filtering
    const filteredLabels = labels.filter((date) => date >= fromDate && date <= toDate);

    // Sorting
    filteredLabels.sort((a, b) => a - b);

    let datasets = [];
    subcategories?.map((cat) =>
      datasets.push({
        label: tempDataVal[particularCategory][cat].fieldLabel,
        data: alignDataWithLabels(tempDataVal[particularCategory][cat]?.dataPoints, filteredLabels),
        backgroundColor: `rgba(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, 1)`,
        borderColor: `rgba(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, 1)`
      })
    );

    // Assuming data is in line chart format
    return {
      labels: filteredLabels.map((randomDate) => {
        const day = randomDate.getDate();
        const month = randomDate.getMonth() + 1; // Months are 0-based
        const year = randomDate.getFullYear();
        const hours = randomDate.getHours();
        const minutes = randomDate.getMinutes();

        // Create a formatted string
        const formattedDateTime = `${day}/${month}/${year} ${hours}:${minutes}`;
        return formattedDateTime;
      }),
      datasets: datasets
    };
  };

  const handleChange = (category, subcategory) => {
    setTempDataVal((prevDataVal) => {
      const updatedDataVal = {
        ...prevDataVal,
        [category]: {
          ...prevDataVal[category],
          [subcategory]: {
            ...prevDataVal[category][subcategory],
            hide: !prevDataVal[category][subcategory].hide
          }
        }
      };
      return updatedDataVal;
    });
  };

  const chartData = generateChartData(particularCategory);

  return (
    <>
      <Box
        className="max-w-full m-2"
        sx={{
          border: '1px solid var(--common-border-color)',
          boxShadow: '0px 20.3165px 40.6331px rgba(0, 0, 0, 0.03)'
        }}
      >
        <Box style={{ padding: '15px 10px' }}>
          <FilterHandler
            fullScreen={openFullScreen}
            setOpenFullScreen={setOpenFullScreen}
            dateFilters={dateFilters}
            setDateFilters={setDateFilters}
            handleChange={handleChange}
            tempDataVal={tempDataVal}
            particularCategory={particularCategory}
          />
        </Box>
        <Box height={openFullScreen ? window.innerHeight - 200 : isScreenSmall ? 350 : 500} className="max-w-full overflow-x-auto px-[10px]">
          <Chart
            id={`${particularCategory}-chart`}
            type={chart.chartType?.toLowerCase()}
            data={chartData}
            options={{
              maintainAspectRatio: false,
              animation: false,
              indexAxis: chart?.kpi?.horizontalBar ? 'y' : 'x',
              ...(chart.stack &&
                !generateChartData(particularCategory).datasets.some((d) => d?.stack === 'stacked') && {
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
        </Box>
      </Box>
      {openFullScreen && (
        <Dialog open onClose={() => setOpenFullScreen(false)} fullScreen>
          <CustomDialogHeader title={'Full Screen Chart'} onClose={() => setOpenFullScreen(false)} showRequiredLabel={false} />
          <CustomDialogContent style={{ maxHeight: '100%' }}>
            <Box style={{ padding: '15px 10px' }}>
              <FilterHandler
                fullScreen={openFullScreen}
                setOpenFullScreen={setOpenFullScreen}
                dateFilters={dateFilters}
                setDateFilters={setDateFilters}
                handleChange={handleChange}
                tempDataVal={tempDataVal}
                particularCategory={particularCategory}
              />
            </Box>
            <Box height={openFullScreen ? window.innerHeight - 200 : isScreenSmall ? 350 : 500}>
              <Chart
                id={`${particularCategory}-chart`}
                type={chart.chartType?.toLowerCase()}
                data={chartData}
                options={{
                  maintainAspectRatio: false,
                  animation: false,
                  indexAxis: chart?.kpi?.horizontalBar ? 'y' : 'x',
                  ...(chart.stack &&
                    !generateChartData(particularCategory).datasets.some((d) => d?.stack === 'stacked') && {
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
            </Box>
          </CustomDialogContent>
        </Dialog>
      )}
    </>
  );
}
