import React, { useState, useEffect } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { Box, Checkbox, FormControlLabel, FormGroup } from '@material-ui/core';
import moment from 'moment';
import Chart from '../Chart';
import { isEmpty } from 'lodash';
import FilterModel from '../Chart/FilterModel';
import { dateTimeFormat } from 'src/constants/helpers';

const PerformanceAnalysis = ({ assetId, dataPoints }) => {
  const [dateFilters, setDateFilters] = useState({
    from: new Date(moment().subtract(15, 'days').format('MM-DD-YYYY')),
    to: new Date(),
    intervals: null
  });
  const [chartData, setChartData] = useState(null);
  const [selectedDataPoint, setSelectedDataPoint] = useState({});

  const fetchData = React.useCallback(async () => {
    const deepFilter: any = [];
    deepFilter.push({
      field: 'from_date',
      term: moment(new Date(dateFilters.from)).format('MM/DD/YYYY')
    });
    deepFilter.push({
      field: 'to_date',
      term: moment(new Date(dateFilters.to)).format('MM/DD/YYYY')
    });

    let query = `?asset=${assetId}&filterType=and`;

    const newfilterById = [];
    newfilterById.push({
      field: 'dataPoints',
      term: {
        $in: Object.keys(selectedDataPoint)
          .filter((_k) => selectedDataPoint[_k])
          ?.map((k) => dataPoints.find((d) => d.fieldName === k)?._id)
      }
    });

    if (newfilterById?.length > 0) {
      query = `${query}&filterById=${JSON.stringify(newfilterById)}`;
    }
    if (deepFilter?.length > 0) {
      query = `${query}&deepFilter=${JSON.stringify(deepFilter)}`;
    }

    axiosInstance()
      .get(`/report/iot/data-points${query}`)
      .then(({ data: { data } }) => {
        setChartData(data?.data);
      })
      .catch((err) => { });
  }, [assetId, dataPoints, dateFilters.from, dateFilters.to, selectedDataPoint]);

  useEffect(() => {
    if (!isEmpty(selectedDataPoint)) {
      fetchData();
    }
  }, [selectedDataPoint, dateFilters, fetchData]);

  return (
    <>
      <FilterModel dateFilters={dateFilters} setDateFilters={setDateFilters} />
      <Box mt={2}>
        <div className="grid gap-y-4 sm:gap-x-3 md:gap-x-4 grid-cols-1 sm:grid-cols-[5fr_9fr] md:grid-cols-[4fr_9fr] lg:grid-cols-[320px_1fr]">
          <div className="container-with-border">
            <p className=" font-semibold px-4 py-3 text-[16px]" style={{ borderBottom: '1px solid var(--common-border-color)' }}>
              Data Points
            </p>
            <div className="sm:h-[calc(574px-48px)] h-[250px] px-4 overflow-auto py-1">
              <FormGroup>
                {dataPoints?.map((dataPoint) => {
                  return (
                    <FormControlLabel
                      control={
                        <Checkbox
                          onChange={(e) => {
                            setSelectedDataPoint({ ...selectedDataPoint, [dataPoint?.fieldName]: e.target.checked });
                          }}
                          checked={selectedDataPoint[dataPoint?.fieldName]}
                          inputProps={{
                            'aria-labelledby': `checkbox-list-label-select-all`
                          }}
                        />
                      }
                      label={dataPoint?.fieldLabel}
                    />
                  );
                })}
              </FormGroup>
            </div>
          </div>
          <div className="container-with-border">
            {Object.keys(selectedDataPoint).filter((item) => selectedDataPoint[item]).length ? (
              <Chart
                id={`${Date.now()}`}
                data={{
                  labels: chartData?.map((e) => moment(e?.time).format(dateTimeFormat)),
                  datasets: Object.keys(selectedDataPoint)
                    .filter((_k) => selectedDataPoint[_k])
                    .map((_d, i) => ({
                      label: dataPoints?.find((d) => d.fieldName === _d)?.fieldLabel,
                      data: chartData?.map((e) => e[_d]),
                      borderColor: ['rgb(255, 99, 132)', 'rgba(54, 162, 235)', 'rgba(255, 206, 86)', 'rgba(75, 192, 192)'],
                      backgroundColor: ['rgba(255, 99, 132, 0.5)', 'rgba(54, 162, 235, 0.5)', 'rgba(255, 206, 86, 0.5)', 'rgba(75, 192, 192, 0.5)']
                    }))
                }}
              />
            ) : (
              <div className="text-center grid place-items-center text-xl font-semibold text-gray-400 dark:text-gray-300 min-h-[574px]">
                <p className="border-dashed border-r-0 border-l-0 py-4">Select Some Datapoints</p>
              </div>
            )}
          </div>
        </div>
      </Box>
    </>
  );
};

export default PerformanceAnalysis;
