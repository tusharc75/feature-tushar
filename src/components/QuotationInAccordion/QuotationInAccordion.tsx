import { Box, Button, Card, CardContent, Grid, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import { MoreVert } from '@mui/icons-material';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useEffect, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { Accordion, AccordionDetails, AccordionSummary } from 'src/components/CustomAccordion';
import { useData } from '../../StateProvider/Provider';
import routes from '../Helpers/Routes';
import ManageQuotationDialog from 'src/pages/Quotation/ManageQuotationDialog';
import { QUOTATION_TYPE, displayDate } from 'src/constants/helpers';
import DisplayData from '../CardDisplayData';
import { IoCalendarOutline } from 'react-icons/io5';

export default function QuotationInAccordion({ expanded = false, recordsPerLine = 2, quotations, fetchData, opportunityData, allowedToEdit }) {
  const history = useHistory();
  const {
    state: { permissions, resources }
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

  const [expandQuotation, setExpandQuotation] = useState(expanded);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [resourceName, setResourceName] = useState('');

  useEffect(() => {
    let isExpanded = expandQuotation;
    if (quotations?.length === 0 && isExpanded) isExpanded = false;
    else if (quotations?.length > 0 && !isExpanded) isExpanded = true;
    setExpandQuotation(isExpanded);
    setResourceName('opportunity');
  }, [quotations, resourceName]);

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleViewAll = () => {
    history.push(routes.quotation.path, {
      opportunityId: opportunityData?._id,
      opportunityName: opportunityData?.opportunityName
    });
  };

  return (
    <>
      <Accordion expanded={expandQuotation} className="omsAccordian" onChange={() => setExpandQuotation(!expandQuotation)}>
        <AccordionSummary aria-controls="user-panel-content" id="user-panel-header">
          <Grid container>
            <Grid item xs={8} alignItems="center">
              <Box component="div" display="flex" alignItems="center" flexGrow={1}>
                <IconButton size="small">{expandQuotation === true ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
                <Box padding="5px">
                  <Typography variant="subtitle2" style={{ fontSize: '14.2056px', fontWeight: 600 }}>
                    {resources?.quotation?.titleSingular} ({quotations?.length || 0})
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={4} container justify="flex-end" alignItems="center">
              {allowedToEdit && (
                <>
                  <IconButton
                    aria-haspopup="true"
                    color="primary"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenMenu(e);
                    }}
                  >
                    <MoreVert />
                  </IconButton>
                  <Menu id="menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleCloseMenu}>
                    <MenuItem
                      disabled={!permissions?.quotation?.isCreate}
                      onClick={() => {
                        setShowCreateDialog(true);
                        handleCloseMenu();
                      }}
                    >
                      Create New
                    </MenuItem>
                  </Menu>
                </>
              )}
            </Grid>
          </Grid>
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            {expandQuotation && (
              <>
                {quotations && quotations?.length ? (
                  <Grid container spacing={1}>
                    {quotations.map((obj, index) => (
                      <Grid item xs={12} sm={12} md={recordsPerLineInLargeScreen} key={index}>
                        <Card className="detailCard  card-v1" variant="outlined">
                          <CardContent className="card-link">
                            <Link className="link" to={`${routes.quotationDetail.path}/${obj._id}`} target="_blank" rel="noopener noreferrer">
                              <Typography className="detailName">{obj.quotationNumber}</Typography>
                            </Link>
                          </CardContent>
                          <Grid container>
                            <Grid item xs={12} sm={6} md={6}>
                              {obj.expectedCustomerDeliveryDate && (
                                <DisplayData
                                  key={index}
                                  label="Expected Customer Delivery Date"
                                  value={displayDate(obj.expectedCustomerDeliveryDate)}
                                  icon={<IoCalendarOutline size={15} />}
                                />
                              )}
                            </Grid>
                            <Grid item xs={12} sm={6} md={6}>
                              {obj.supplierSuggestedDeliveryDate && (
                                <DisplayData
                                  key={index}
                                  label="Supplier Suggested Delivery Date"
                                  value={displayDate(obj.supplierSuggestedDeliveryDate)}
                                  icon={<IoCalendarOutline size={15} />}
                                />
                              )}
                            </Grid>
                          </Grid>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography variant="subtitle1" color="primary">
                    {`No ${resources?.quotation?.titleSingular} To Show`}
                  </Typography>
                )}
              </>
            )}
            {quotations && quotations?.length ? (
              <Box mt={2}>
                <Button className="accordion-outlined-button" onClick={() => handleViewAll()} startIcon={<VisibilityIcon />} variant="outlined">
                  <span>View All</span>
                </Button>
              </Box>
            ) : null}
          </Box>
        </AccordionDetails>
      </Accordion>
      {showCreateDialog && (
        <ManageQuotationDialog
          isClone={false}
          quotationId={null}
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onSuccess={(data) => {
            setShowCreateDialog(false);
            fetchData();
          }}
          referenceData={{
            opportunity: opportunityData?._id,
            type: QUOTATION_TYPE.salesOrder,
            customerAccount: opportunityData?.customerAccount?.optionValue
          }}
          isRedirectTodetailPage={false}
        />
      )}
    </>
  );
}
