import { Box, Checkbox, FormControlLabel, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Accordion, AccordionDetails, AccordionSummary } from 'src/components/CustomAccordion';

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
                    <Grid size={{ xs: 12, sm: 12, lg: 12, md: 12 }}>
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
                        label={<div className="line-clamp-1 [overflow-wrap:anywhere]">{data?.fieldLabel}</div>}
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
