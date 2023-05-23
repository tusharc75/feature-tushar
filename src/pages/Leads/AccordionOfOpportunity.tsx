import React, { useState, useEffect } from 'react';
import { Grid, Box, IconButton, Typography, Card, CardContent, List, ListItem, ListItemAvatar, ListItemText, Tooltip } from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import MuiAccordion from '@material-ui/core/Accordion';
import MuiAccordionSummary from '@material-ui/core/AccordionSummary';
import MuiAccordionDetails from '@material-ui/core/AccordionDetails';
import { withStyles } from '@material-ui/core/styles';
import { displayDate } from '../../services/util';
import routes from '../../components/Helpers/Routes';
import { Link } from 'react-router-dom';
import { IoCalendarOutline } from 'react-icons/io5';
import { BiCustomize } from 'react-icons/bi';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import { useData } from '../../StateProvider/Provider';
import { formatAmountWithCurrency } from '../../constants/helpers';
import { Accordion, AccordionDetails, AccordionSummary } from 'src/components/CustomAccordion';
import DisplayData from 'src/CardDisplayData';

export default function AccordionOfOpportunity({ opportunity, expanded = true, recordsPerLine = 2 }) {
  const {
    state: { selectedEntity }
  }: any = useData();
  let recordsPerLineInLargeScreen: 3 | 4 | 6 | 12 = 6;

  switch (recordsPerLine) {
    case 1:
      recordsPerLineInLargeScreen = 12;
      break;

    case 3:
      recordsPerLineInLargeScreen = 4;
      break;

    case 4:
      recordsPerLineInLargeScreen = 3;
      break;

    default:
      recordsPerLineInLargeScreen = 6;
      break;
  }

  const [expandOpportunity, setExpandOpportunity] = useState(expanded);
  useEffect(() => {
    setExpandOpportunity(opportunity && opportunity?.length !== 0 ? true : false);
  }, [opportunity]);
  return (
    <>
      <Accordion expanded={expandOpportunity} onChange={() => setExpandOpportunity(!expandOpportunity)}>
        <AccordionSummary aria-controls="user-panel-content" id="user-panel-header">
          <Grid container>
            <Grid item xs={8}>
              <Box display="flex">
                <Box>
                  <IconButton size="small">{expandOpportunity === true ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
                </Box>
                <Box padding="5px">
                  <Typography variant="subtitle2">Opportunity ({opportunity ? 1 : 0})</Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </AccordionSummary>
        <AccordionDetails>
          <>
            {expandOpportunity && (
              <>
                {opportunity ? (
                  <Grid container spacing={1}>
                    {
                      <Grid item xs={12} sm={12} md={recordsPerLineInLargeScreen} key={1}>
                        <Card className="detailCard  card-v1" variant="outlined">
                          <CardContent className="card-link">
                            <Grid container className="detailCardHeader">
                              <Grid item xs={12} sm={12}>
                                <Grid item xs={12} sm={8}>
                                  {opportunity.entity === selectedEntity ? (
                                    <Link className="link" to={`${routes.opportunityDetail.path}/${opportunity._id}`}>
                                      <Typography>{opportunity?.opportunityName}</Typography>
                                    </Link>
                                  ) : (
                                    <span className="d-flex gap-2 align-items-center">
                                      <Typography>{opportunity.opportunityName}</Typography>{' '}
                                      <Tooltip title={`${opportunity.opportunityName} belongs to different entity`}>
                                        <InfoOutlinedIcon fontSize="small" />
                                      </Tooltip>
                                    </span>
                                  )}
                                </Grid>
                                {opportunity?.estimatedAmount && (
                                  <Grid item xs={12} sm={4}>
                                    <Typography
                                      className="amount"
                                      title={formatAmountWithCurrency(opportunity['currency'], opportunity?.estimatedAmount).fullFormatAmount}
                                    >
                                      {formatAmountWithCurrency(opportunity['currency'], opportunity?.estimatedAmount).fullFormatAmount}
                                    </Typography>
                                  </Grid>
                                )}
                                <Grid container>
                                  <Grid item xs={12} sm={12}>
                                    {opportunity?.stage ? (
                                      <DisplayData label="Stage" value={opportunity?.stage ?? ''} icon={<BiCustomize size={20} />} />
                                    ) : (
                                      ''
                                    )}
                                  </Grid>
                                  <Grid item xs={12} sm={12}>
                                    {opportunity?.closeDate ? (
                                      <DisplayData
                                        label="Closing Date"
                                        value={displayDate(opportunity.closeDate)}
                                        icon={<IoCalendarOutline size={20} />}
                                      />
                                    ) : (
                                      ''
                                    )}
                                  </Grid>
                                </Grid>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      </Grid>
                    }
                  </Grid>
                ) : (
                  <Typography variant="subtitle2">No Opportunity To Show</Typography>
                )}
              </>
            )}
          </>
        </AccordionDetails>

        <Box margin={1} />
      </Accordion>
    </>
  );
}
