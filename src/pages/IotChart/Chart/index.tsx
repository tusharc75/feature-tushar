import React, { useCallback, useEffect, useState } from 'react';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { Box, Grid, IconButton, Typography } from '@material-ui/core';
import placeholder_img from 'src/assets/PerformanceTuning.png';
import { prepareDataForGrid } from 'src/constants/helpers';
import { ChartRenderer } from './ChartRenderer';
import Loader from 'src/components/Loader';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import { Accordion, AccordionSummary, AccordionDetails } from 'src/components/CustomAccordion';

function Index({ serializedAssets = [], type }) {
  const {
    state: { userLoading }
  }: any = useData();

  const [dataVal, setDataVal] = useState({});
  const [loading, setLoading] = useState(false);

  const [expandedAccordition, setExpandedAccordition] = React.useState<string | false>('');

  function getRandomDateInMonth(monthYearStr) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const [monthStr, yearStr] = monthYearStr.split('-');
    const month = monthNames.indexOf(monthStr);
    const year = parseInt(yearStr);

    // Calculate the number of days in the month (taking leap years into account for Feb)
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Generate a random day
    const randomDay = Math.floor(Math.random() * daysInMonth) + 1;

    return new Date(year, month, randomDay);
  }

  const fetchIotDataPointsData = async () => {
    setLoading(true);
    const data: any = await axiosInstance().get(
      `/report/iot/data-points${
        serializedAssets?.length > 0
          ? `? filterById=${JSON.stringify([
              {
                field: 'asset',
                term: {
                  $in: serializedAssets
                }
              }
            ])}
}`
          : ``
      }`
    );
    const reportData = data?.data?.data?.data;
    console.log('report', reportData);
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
        let result = {};
        rows.map((obj, i) => {
          const { category, fieldLabel, fieldName } = obj;

          if (type === 'dataPoint') {
            if (i === 0) {
              setExpandedAccordition(fieldLabel);
            }
            if (!result[fieldLabel]) {
              result[fieldLabel] = {};
            }

            if (!result[fieldLabel].hasOwnProperty(fieldName)) {
              let dataArr = [];

              reportData?.map((d) => {
                if (d[fieldName]) {
                  dataArr.push({
                    data: d[fieldName],
                    date: getRandomDateInMonth(d.date)
                  });
                }
              });
              console.log('dataArr', dataArr);

              const newObj = {
                fieldLabel: fieldLabel,
                dataPoints: dataArr,
                hide: false,
                fill: false
              };

              result[fieldLabel][fieldName] = newObj;
            }
          } else {
            if (!result[category]) {
              result[category] = {};
            }
            if (!result[category].hasOwnProperty(fieldName)) {
              let dataArr = [];
              reportData?.map((d) => {
                if (d[fieldName]) {
                  dataArr.push({
                    data: d[fieldName],
                    date: getRandomDateInMonth(d.date)
                  });
                }
              });
              console.log('dataArr', dataArr);
              const newObj = {
                fieldLabel: fieldLabel,
                dataPoints: dataArr,
                hide: false,
                tension: 0.4,
                fill: false,
                borderWidth: 1
              };

              result[category][fieldName] = newObj;
            }
          }
        });

        setDataVal(result);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        console.error(err);
      });
  };

  useEffect(() => {
    fetchIotDataPointsData();
  }, [type]);

  const chart = {
    uniqueId: 'someUniqueId',
    chartType: 'line', // or "bar" or any other type
    stack: true, // example attribute, you can modify as per your actual usage
    kpi: {
      horizontalBar: false
    }
  };

  const handleChange = useCallback((name: string) => {
    setExpandedAccordition((prev) => (!prev ? name : prev === name ? false : name));
  }, []);

  return (
    <div>
      {!userLoading ? (
        <>
          <Box pt={1}>
            {loading ? (
              <Loader minHeight="100%" height="calc(100vh - 200px)" noLoader={false} text="Loading Data..." />
            ) : Object.keys(dataVal).length === 0 ? (
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
              <div className="flex flex-col gap-2">
                {type === 'dataPoint'
                  ? Object.keys(dataVal).length !== 0 &&
                    Object.keys(dataVal).map((particularCategory) => (
                      <Accordion
                        expanded={expandedAccordition === particularCategory}
                        onChange={() => {
                          handleChange(particularCategory);
                        }}
                        className="w-full"
                      >
                        <AccordionSummary aria-controls="panel1d-content" id="particularCategory">
                          <Typography style={{ fontSize: '14.2056px', fontWeight: 600 }}>
                            {particularCategory}
                            <IconButton size="small">
                              {expandedAccordition === particularCategory ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <ChartRenderer key={particularCategory} dataVal={dataVal} particularCategory={particularCategory} chart={chart} />
                        </AccordionDetails>
                      </Accordion>
                    ))
                  : Object.keys(dataVal).map((particularCategory) => (
                      <ChartRenderer key={particularCategory} dataVal={dataVal} particularCategory={particularCategory} chart={chart} />
                    ))}
                {/* {Object.keys(dataVal).length !== 0 &&
                  Object.keys(dataVal).map((particularCategory) => (
                    <ChartRenderer key={particularCategory} dataVal={dataVal} particularCategory={particularCategory} chart={chart} />
                  ))} */}
              </div>
            )}
          </Box>
        </>
      ) : (
        <Loader minHeight="100%" noLoader={false} text="Loading Data..." />
      )}
    </div>
  );
}

export default Index;
