import { useEffect, useState } from 'react';
import { Box, Dialog, Grid, IconButton, Typography } from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import HistoryIcon from '@material-ui/icons/History';
import { withStyles } from '@material-ui/core/styles';
import MuiAccordion from '@material-ui/core/Accordion';
import MuiAccordionSummary from '@material-ui/core/AccordionSummary';
import MuiAccordionDetails from '@material-ui/core/AccordionDetails';
import moment from 'moment';
import { CustomDialogTransition, dateTimeFormat24Hours } from 'src/constants/helpers';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import Chart from '../Helper/Chart';
import FilterModel from '../Helper/FilterModel';

const Accordion = withStyles({
  root: {
    border: '0px',
    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.06)',

    '&:not(:last-child)': {
      borderBottom: 0
    },
    '&:before': {
      display: 'none'
    },
    '&$expanded': {
      margin: 'auto',
      boxShadow: '0px 17.7266px 35.4532px rgba(0, 0, 0, 0.03)'
    }
  },
  expanded: {}
})(MuiAccordion);

const AccordionSummary = withStyles({
  root: {
    backgroundColor: 'var(--accordion-summary-bg, #fff)',
    padding: '0 8px',
    minHeight: 48,
    borderRadius: '3.54532px',
    '&$expanded': {
      minHeight: 48,
      backgroundColor: 'var(--accordion-expanded-summary-bg, #f1f5ff)',
      borderRadius: '3.54532px 3.54532px 0px 0px'
    }
  },
  content: {
    '&$expanded': {
      margin: '12px 0'
    }
  },
  expanded: {}
})(MuiAccordionSummary);

const AccordionDetails = withStyles((theme) => ({
  root: {
    display: 'block',
    padding: theme.spacing(2),
    border: '1px solid var(--accordion-details-border)',
    borderRadius: '0px 0px 6px 6px'
  }
}))(MuiAccordionDetails);

export default function TreeView({ expandedAccordition, setExpandedAccordition, category, currentData, assetId, deviceTemplate = null }) {
  const [dateFilters, setDateFilters] = useState({
    from: new Date(moment().subtract(8, 'days').format('MM/DD/YYYY')),
    to: new Date(),
    intervals: 'perCycle'
  });

  const [dataPoint, setDataPoint] = useState(null);

  const handleClose = () => {
    setDateFilters({
      from: new Date(moment().subtract(8, 'days').format('MM/DD/YYYY')),
      to: new Date(),
      intervals: 'perCycle'
    });
    setDataPoint(null);
  };
  return (
    <>
      <Accordion
        expanded={expandedAccordition[category?._id]}
        className={`omsAccordian w-full`}
        onChange={() => {
          setExpandedAccordition((prev) => ({
            ...prev,
            [category?._id]: expandedAccordition[category?._id] ? false : true
          }));
        }}
      >
        <AccordionSummary aria-controls="user-panel-content" id="user-panel-header">
          <Box display="flex">
            <Box>
              <IconButton size="small"> {expandedAccordition[category?._id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
            </Box>
            <Box padding="5px">
              <Typography variant="subtitle2" style={{ fontSize: '14.2056px', fontWeight: 600 }}>
                {category?.iotDataPointsCategoryName}
              </Typography>
              {currentData?.find((d) => d?.category?.optionValue === category?._id && d?.redAlert) && (
                <span className={`absolute -left-[3px] -top-[3px] z-10 flex h-[6px] w-[6px]`}>
                  <span className="absolute -left-[3px] -top-[3px] inline-flex h-3 w-3 animate-ping rounded-full bg-red-400 opacity-75"></span>
                  <span className="inline-flex h-full w-full rounded-full bg-red-500"></span>
                </span>
              )}
            </Box>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {expandedAccordition[category?._id] && (
            <>
              <Grid container spacing={1}>
                {currentData?.filter((d) => d?.category?.optionValue === category?._id)?.length ? (
                  <Box className="p-[10px] " width={'100%'} textAlign="end">
                    {' '}
                    Last Updated -{' '}
                    <span className="text-[12px] text-gray-500 dark:text-gray-300">
                      {moment(currentData?.filter((d) => d?.category?.optionValue === category?._id)[0]?.time).format(dateTimeFormat24Hours)}
                    </span>
                  </Box>
                ) : null}
                {currentData
                  ?.filter((d) => d?.category?.optionValue === category?._id)
                  ?.sort((a, b) => parseInt(a?.order) - parseInt(b?.order))
                  ?.map((data) => {
                    return (
                      <Grid item xs={12} sm={6} lg={4} md={4}>
                        <Box
                          border="1px solid var(--common-border-color)"
                          className={`min-h-full rounded-md p-[10px] ${data?.redAlert ? 'bg-red-300' : ''}`}
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <p style={{ width: '100%' }} className="flex flex-wrap justify-between text-[14px] text-[var(--primary-text)]">
                            <strong className="line-clamp-1">{data?.fieldLabel} : </strong>
                            <span className="font-medium">
                              {data?.fieldValue || 0}
                              {data?.unit && `(${data?.unit})`}
                            </span>
                          </p>
                          <Box ml={1}>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setDataPoint(data);
                              }}
                            >
                              <HistoryIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      </Grid>
                    );
                  })}
              </Grid>
              <div className="grid gap-3">
                {category?.child?.map((child: any) => (
                  <TreeView
                    deviceTemplate={deviceTemplate}
                    expandedAccordition={expandedAccordition}
                    setExpandedAccordition={setExpandedAccordition}
                    category={child}
                    currentData={currentData}
                    assetId={assetId}
                  />
                ))}
              </div>
            </>
          )}
        </AccordionDetails>
      </Accordion>
      {dataPoint && (
        <Dialog
          TransitionComponent={CustomDialogTransition}
          fullWidth
          maxWidth="md"
          open
          onClose={handleClose}
          fullScreen
          aria-labelledby="assign-roles-dialog"
        >
          <CustomDialogHeader title={`${dataPoint?.fieldLabel}`} showRequiredLabel={false} onClose={handleClose} />
          <CustomDialogContent isFooterPresent={false}>
            <Box mt={2}>
              <Grid direction="row" justifyContent="flex-end" alignItems="center" container spacing={2}>
                <Grid>
                  <FilterModel dateFilters={dateFilters} setDateFilters={setDateFilters} />
                </Grid>
              </Grid>
              <Box mt={2}>
                <div>
                  <Chart deviceTemplate={deviceTemplate} dateFilters={dateFilters} assetId={assetId} dataPoints={[dataPoint]} />
                </div>
              </Box>
            </Box>
          </CustomDialogContent>
        </Dialog>
      )}
    </>
  );
}
