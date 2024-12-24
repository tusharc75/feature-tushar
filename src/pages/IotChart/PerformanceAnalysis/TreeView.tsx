import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Box, Checkbox, FormControlLabel, Grid, IconButton, Theme, Typography } from '@mui/material';
import MuiAccordion from '@mui/material/Accordion';
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import MuiAccordionSummary from '@mui/material/AccordionSummary';
import { withStyles } from '@mui/styles';

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

const AccordionDetails = withStyles((theme: Theme) => ({
  root: {
    display: 'block',
    padding: theme.spacing(2),
    border: '1px solid var(--accordion-details-border)',
    borderRadius: '0px 0px 6px 6px'
  }
}))(MuiAccordionDetails);

export default function CustomAccordian({ expandedAccordition, setExpandedAccordition, category, currentData, setSelected, selected }) {
  return (
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
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        {expandedAccordition[category?._id] && (
          <>
            <Grid container spacing={1}>
              {currentData
                ?.filter((d) => d?.category?.optionValue === category?._id)
                ?.map((data) => {
                  return (
                    <Grid item xs={12} sm={12} lg={12} md={12}>
                      <FormControlLabel
                        key={data?.fieldName}
                        title={data?.fieldLabel}
                        control={
                          <Checkbox
                            onChange={(e) => {
                              setSelected({
                                dataPoints: { ...selected.dataPoints, [data?.fieldName]: e.target.checked }
                              });
                            }}
                            checked={selected.dataPoints[data?.fieldName]}
                            inputProps={{
                              'aria-labelledby': `checkbox-list-label-select-all`
                            }}
                          />
                        }
                        className="  max-w-full [&>span+span]:line-clamp-1 [&>span+span]:block [&>span+span]:max-w-full "
                        label={<div className="mt-2 line-clamp-1 [overflow-wrap:anywhere]">{data?.fieldLabel}</div>}
                      />
                    </Grid>
                  );
                })}
            </Grid>
            <div className="grid gap-2">
              {category?.child?.map((child: any) => (
                <CustomAccordian
                  expandedAccordition={expandedAccordition}
                  setExpandedAccordition={setExpandedAccordition}
                  category={child}
                  currentData={currentData}
                  selected={selected}
                  setSelected={setSelected}
                />
              ))}
            </div>
          </>
        )}
      </AccordionDetails>
    </Accordion>
  );
}
