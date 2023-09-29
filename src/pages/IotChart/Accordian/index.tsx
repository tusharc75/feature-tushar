import { useEffect, useState } from 'react';
import { Box, Grid, IconButton, Typography } from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import { withStyles } from '@material-ui/core/styles';
import MuiAccordion from '@material-ui/core/Accordion';
import MuiAccordionSummary from '@material-ui/core/AccordionSummary';
import MuiAccordionDetails from '@material-ui/core/AccordionDetails';
import moment from 'moment';
import { dateTimeFormat } from 'src/constants/helpers';

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

export default function CustomAccordian({ expandedAccordition, setExpandedAccordition, category, currentData }) {

  return (
    <Accordion
      expanded={expandedAccordition[category?._id]}
      className={`omsAccordian w-full`}
      onChange={() => {
        setExpandedAccordition((prev) => (
          {
            ...prev,
            [category?._id]: expandedAccordition[category?._id] ? false : true
          }
        ));
      }}>
      <AccordionSummary aria-controls="user-panel-content" id="user-panel-header">
        <Box display="flex">
          <Box>
            <IconButton size="small"> {expandedAccordition[category?._id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
          </Box>
          <Box padding="5px">
            <Typography variant="subtitle2" style={{ fontSize: '14.2056px', fontWeight: 600 }}>
              {category?.iotDataPointsCategoryName}
            </Typography>
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        {expandedAccordition[category?._id] &&
          <>
            <Grid container spacing={1}>
              {currentData?.filter((d) => d?.category?.optionValue === category?._id)?.map((data) => {
                return (
                  <Grid item xs={12} sm={6} lg={4} md={4}>
                    <Box
                      border="1px solid var(--common-border-color)"
                      className="p-[10px] rounded-md min-h-full"
                      title={`${data?.fieldLabel} : ${data?.value} ${data?.unit ? `(${data.unit})` : ''}`}
                    >
                      <p className="mb-2 flex flex-wrap justify-between text-[14px] text-[var(--primary-text)]">
                        <strong className=" line-clamp-1">{data?.fieldLabel} : </strong>
                        <span className=" font-medium">
                          {data?.fieldValue}
                          {data?.unit && `(${data?.unit})`}
                        </span>
                      </p>
                      <span className="text-gray-500 dark:text-gray-300 text-[12px]">{moment(data?.time).format(dateTimeFormat)}</span>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
            {category?.child?.map((child: any) => (
              <CustomAccordian
                expandedAccordition={expandedAccordition}
                setExpandedAccordition={setExpandedAccordition}
                category={child}
                currentData={currentData}
              />
            ))}
          </>
        }
      </AccordionDetails>
    </Accordion>
  );
}
