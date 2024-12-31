import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Box, Card, CardContent, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useEffect, useState } from 'react';
import { BiCustomize } from 'react-icons/bi';
import { IoCalendarOutline } from 'react-icons/io5';
import { Link } from 'react-router-dom';
import DisplayData from 'src/components/CardDisplayData';
import { Accordion, AccordionDetails, AccordionSummary } from 'src/components/CustomAccordion';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { displayDate } from 'src/constants/helpers';
import { useData } from '../../StateProvider/Provider';
import routes from '../../components/Helpers/Routes';
import { formatAmountWithCurrency } from '../../constants/helpers';

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
          <div className="flex items-center justify-between">
            <Typography variant="subtitle2">Opportunity ({opportunity ? 1 : 0})</Typography>
          </div>
        </AccordionSummary>
        <AccordionDetails>
          <>
            {expandOpportunity && (
              <>
                {opportunity ? (
                  <Grid container spacing={1}>
                    {
                      <Grid size={{ xs: 12, sm: 12, md: recordsPerLineInLargeScreen }} key={1}>
                        <Card className="detailCard  card-v1" variant="outlined">
                          <CardContent className="card-link">
                            <div className="mb-2">
                              {opportunity.entity === selectedEntity ? (
                                <Link
                                  className="link"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  to={`${routes.opportunityDetail.path}/${opportunity._id}`}
                                >
                                  <Typography>{opportunity?.opportunityName}</Typography>
                                </Link>
                              ) : (
                                <span className="d-flex align-items-center gap-2">
                                  <Typography>{opportunity.opportunityName}</Typography>{' '}
                                  <HtmlTooltip title={`${opportunity.opportunityName} belongs to different entity`}>
                                    <InfoOutlinedIcon fontSize="small" />
                                  </HtmlTooltip>
                                </span>
                              )}
                            </div>
                            {opportunity?.estimatedAmount && (
                              <p
                                className="text-[14px] font-semibold text-gray-400"
                                title={formatAmountWithCurrency(opportunity['currency'], opportunity?.estimatedAmount).fullFormatAmount}
                              >
                                Estimated Amount : {formatAmountWithCurrency(opportunity['currency'], opportunity?.estimatedAmount).fullFormatAmount}
                              </p>
                            )}
                            <div className="grid max-[960px]:grid-cols-2 max-[500px]:grid-cols-1 min-[1153px]:grid-cols-2">
                              <div>
                                {opportunity?.stage ? (
                                  <DisplayData label="Stage" value={opportunity?.stage ?? ''} icon={<BiCustomize size={20} />} />
                                ) : (
                                  ''
                                )}
                              </div>
                              <div>
                                {opportunity?.closeDate ? (
                                  <DisplayData
                                    label="Closing Date"
                                    value={displayDate(opportunity.closeDate)}
                                    icon={<IoCalendarOutline size={20} />}
                                  />
                                ) : (
                                  ''
                                )}
                              </div>
                            </div>
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
