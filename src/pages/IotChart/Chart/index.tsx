import React, { useCallback } from 'react';
import { Box, Grid, IconButton, Typography } from '@material-ui/core';
import { ChartRenderer } from './ChartRenderer';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import { Accordion, AccordionSummary, AccordionDetails } from 'src/components/CustomAccordion';

function Index({ filterById, dashBoardType, dataPoints }) {

  const [expandedAccordition, setExpandedAccordition] = React.useState<string | false>('');

  const handleChange = useCallback((name: string) => {
    setExpandedAccordition((prev) => (!prev ? name : prev === name ? false : name));
  }, []);

  return (<Box pt={1}>
    <div className="flex flex-col gap-2">
      {dashBoardType === 'dataPoint' ?
        dataPoints?.map((dataPoint) => (
          <Accordion
            expanded={expandedAccordition === dataPoint?._id}
            onChange={() => {
              handleChange(dataPoint?._id);
            }}
            className="w-full"
          >
            <AccordionSummary aria-controls="panel1d-content" id="particularCategory">
              <Typography style={{ fontSize: '14.2056px', fontWeight: 600 }}>
                {dataPoint?.fieldLabel}
                <IconButton size="small">
                  {expandedAccordition === dataPoint?._id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {dataPoint?._id === expandedAccordition &&
                <ChartRenderer
                  dashBoardType={dashBoardType}
                  dataPoints={dataPoints}
                  dataPoint={dataPoint}
                  filterById={filterById}
                />
              }
            </AccordionDetails>
          </Accordion>
        ))
        : null
        // Object.keys(dataVal).map((particularCategory) => (
        //   <ChartRenderer
        //     key={particularCategory}
        //     dataVal={dataVal}
        //     particularCategory={particularCategory}
        //     chart={chart} />
        // ))
      }

    </div>
  </Box>
  );
}

export default Index;
