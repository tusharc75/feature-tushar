import { useState, useCallback } from 'react';
import { Box, IconButton, Typography } from '@material-ui/core';
import moment from 'moment';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import { Accordion, AccordionDetails, AccordionSummary } from 'src/components/CustomAccordion';
import Chart from '../Helper/Chart';
import FilterModel from '../Helper/FilterModel';

const Analysis = ({ assetId, dataPoints, customDataPoints }) => {
  const [dateFilters, setDateFilters] = useState({
    from: new Date(moment().subtract(8, 'days').format('MM-DD-YYYY')),
    to: new Date(),
    intervals: '1hour'
  });

  const [expandedAccordition, setExpandedAccordition] = useState<string | false>('');

  const handleChange = useCallback((name: string) => {
    setExpandedAccordition((prev) => (!prev ? name : prev === name ? false : name));
  }, []);

  return (
    <>
      <FilterModel dateFilters={dateFilters} setDateFilters={setDateFilters} />
      <Box mt={2}>
        {dataPoints?.map((dataPoint) => {
          return (
            <Box mt={2}>
              <Accordion
                expanded={expandedAccordition === dataPoint?._id}
                className={`omsAccordian`}
                onChange={() => {
                  handleChange(dataPoint?._id);
                }}
              >
                <AccordionSummary aria-controls="user-panel-content" id="user-panel-header">
                  <Box display="flex">
                    <Box>
                      <IconButton size="small"> {expandedAccordition === dataPoint?._id ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
                    </Box>
                    <Box padding="5px">
                      <Typography variant="subtitle2" style={{ fontSize: '14.2056px', fontWeight: 600 }}>
                        {dataPoint?.fieldLabel}
                      </Typography>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {expandedAccordition === dataPoint?._id && (
                    <div className="container-with-border w-100 sm:h-[calc(574px-48px)] h-[250px] px-4 overflow-auto py-1">
                      <Chart dateFilters={dateFilters} assetId={assetId} dataPoints={[dataPoint]} />
                    </div>
                  )}
                </AccordionDetails>
              </Accordion>
            </Box>
          );
        })}
      </Box>
      <Box mt={2}>
        {customDataPoints?.map((customDataPoint) => {
          return (
            <Box mt={2}>
              <Accordion
                expanded={expandedAccordition === customDataPoint?._id}
                className={`omsAccordian`}
                onChange={() => {
                  handleChange(customDataPoint?._id);
                }}
              >
                <AccordionSummary aria-controls="user-panel-content" id="user-panel-header">
                  <Box display="flex">
                    <Box>
                      <IconButton size="small"> {expandedAccordition === customDataPoint?._id ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
                    </Box>
                    <Box padding="5px">
                      <Typography variant="subtitle2" style={{ fontSize: '14.2056px', fontWeight: 600 }}>
                        {customDataPoint?.fieldLabel}
                      </Typography>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {expandedAccordition === customDataPoint?._id && (
                    <div className="container-with-border w-100 sm:h-[calc(574px-48px)] h-[250px] px-4 overflow-auto py-1">
                      <Chart dateFilters={dateFilters} assetId={assetId} dataPoints={[customDataPoint]} customDataPoint={true}/>
                    </div>
                  )}
                </AccordionDetails>
              </Accordion>
            </Box>
          );
        })}
      </Box>
    </>
  );
};

export default Analysis;
