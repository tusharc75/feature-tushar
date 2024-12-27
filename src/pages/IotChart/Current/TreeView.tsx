import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HistoryIcon from '@mui/icons-material/History';
import { Box, Dialog, Grid, IconButton, Theme, Typography } from '@mui/material';
import MuiAccordion from '@mui/material/Accordion';
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import MuiAccordionSummary from '@mui/material/AccordionSummary';
import { withStyles } from '@mui/styles';
import moment from 'moment';
import { useState } from 'react';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { cn, CustomDialogTransition, dateTimeFormat24Hours, displayDateTime } from 'src/constants/helpers';
import Chart from '../Helper/Chart';
import FilterModel from '../Helper/FilterModel';

const Accordion = withStyles({
  root: {
    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.06)',
    borderRadius: '0.5rem !important',
    border: '1px solid var(--common-border-color) !important',
    overflow: 'hidden',
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
    padding: '0 8px',
    minHeight: 48,
    '&$expanded': {
      minHeight: 48,
      backgroundColor: 'var(--dark-secondary, white)',
      borderBottom: '0px !important'
    }
  },
  content: {
    '&$expanded': {
      margin: '12px 0'
    }
  },
  expanded: {}
})(MuiAccordionSummary);

const AccordionDetails = withStyles((theme: Theme) => ({
  root: {
    display: 'block',
    padding: theme.spacing(2),
    borderRadius: '0px 0px 0.5rem 0.5rem'
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
        className={`omsAccordian w-full !shadow-lg`}
        onChange={() => {
          setExpandedAccordition((prev) => ({
            ...prev,
            [category?._id]: expandedAccordition[category?._id] ? false : true
          }));
        }}
      >
        <AccordionSummary aria-controls="user-panel-content" id="user-panel-header" className="![border:1px_solid_var(--commono-border-color)]">
          <div className="flex w-full items-center">
            <IconButton size="small"> {expandedAccordition[category?._id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
            <div className="flex flex-grow justify-between gap-2 p-[5px]">
              <Typography variant="subtitle2" style={{ fontSize: '14.2056px', fontWeight: 600 }} className="truncate">
                {category?.iotDataPointsCategoryName}
              </Typography>
              {currentData?.find((d) => d?.category?.optionValue === category?._id && d?.redAlert) && (
                <span className={`absolute -left-[3px] -top-[3px] z-10 flex h-[6px] w-[6px] `}>
                  <span className="absolute -left-[3px] -top-[3px] inline-flex h-3 w-3 animate-ping rounded-full bg-red-400 opacity-75"></span>
                  <span className="inline-flex h-full w-full rounded-full bg-red-500"></span>
                </span>
              )}
              {expandedAccordition[category?._id] && currentData?.filter((d) => d?.category?.optionValue === category?._id)?.length ? (
                <h6 className="line-clamp-1 text-right text-sm font-normal leading-[1.5] text-gray-500 dark:text-gray-300 max-sm:text-xs">
                  <span className="max-md:sr-only">Last Updated -</span>
                  <span>{displayDateTime(currentData?.filter((d) => d?.category?.optionValue === category?._id)[0]?.time, dateTimeFormat24Hours)}</span>
                </h6>
              ) : null}
            </div>
          </div>
        </AccordionSummary>
        <AccordionDetails className="bg-gray-100 dark:bg-gray-800">
          {expandedAccordition[category?._id] && (
            <>
              <div className="grid grid-cols-1 gap-2 rounded-lg sm:grid-cols-2 md:grid-cols-3">
                {currentData
                  ?.filter((d) => d?.category?.optionValue === category?._id)
                  ?.sort((a, b) => parseInt(a?.order) - parseInt(b?.order))
                  ?.map((data) => {
                    return (
                      <div
                        key={data?.fieldLabel}
                        className={cn(
                          `flex min-h-full items-center justify-between rounded-lg bg-[var(--dark-primary,white)] p-[10px] shadow-lg`,
                          data?.redAlert ? 'bg-red-300' : ''
                        )}
                      >
                        <div className="text">
                          <p className="mb-2 text-xs text-gray-600 dark:text-gray-400">{data?.fieldLabel}</p>
                          <p className="text-md font-medium text-gray-700 dark:text-gray-200">
                            {data?.fieldValue || 0}
                            {data?.unit && ` (${data?.unit})`}
                          </p>
                        </div>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setDataPoint(data);
                          }}
                        >
                          <HistoryIcon fontSize="small" />
                        </IconButton>
                      </div>
                    );
                  })}
              </div>
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
