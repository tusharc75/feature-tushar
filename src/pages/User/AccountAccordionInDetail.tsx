import { MoreVert } from '@mui/icons-material';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Box, Button, Card, CardContent, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useEffect, useState } from 'react';
import { AiOutlinePhone } from 'react-icons/ai';
import { FaArrowAltCircleDown, FaIndustry } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import DisplayData from 'src/components/CardDisplayData';
import { Accordion, AccordionDetails, AccordionSummary } from 'src/components/CustomAccordion';
import { useData } from '../../StateProvider/Provider';
import { customerAccount, supplierAccount } from '../../constants/helpers';
import routes from './../../components/Helpers/Routes';
import ManageAccountDialog from './../Account/ManageAccount/index';

export default function AccountAccordionDetail({ accounts, type, expanded = true, recordsPerLine = 2, userId, onSuccess, isAllowedToEdit }) {
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

  const [maxRecordsToShow, setMaxRecordsToShow] = useState(recordsPerLine);
  const [expandAccount, setExpandAccount] = useState(expanded);
  const [anchorEl, setAnchorEl] = useState(null);
  const [showCreateAccountDialog, setShowCreateAccountDialog] = useState(false);

  useEffect(() => {
    let isExpanded = expandAccount;
    if (accounts?.length === 0 && isExpanded) isExpanded = false;
    else if (accounts?.length > 0 && !isExpanded) isExpanded = true;

    setExpandAccount(isExpanded);
  }, [accounts]);
  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };
  return (
    <>
      <Accordion expanded={expandAccount} className="accordAccount" onChange={() => setExpandAccount(!expandAccount)}>
        <AccordionSummary aria-controls="user-panel-content" id="user-panel-header">
          <Grid container className="pos_rel">
            <Grid size={{xs:8}}>
              <Box display="flex">
                <Box>
                  <IconButton size="small">{expandAccount === true ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
                </Box>
                <Box padding="5px">
                  <Typography variant="subtitle2">
                    {type === 'customer' ? resources?.customerAccount?.titlePlural : resources?.supplierAccount?.titlePlural} ({accounts?.length ?? 0}
                    )
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid size={{xs:4}} container justifyContent="flex-end" alignItems="center">
              <Typography variant="subtitle2">
                {isAllowedToEdit && (
                  <>
                    {(type === 'customer' ? permissions?.customerAccount?.isCreate : permissions?.supplierAccount?.isCreate) && (
                      <>
                        <IconButton aria-haspopup="true" color="primary" size="small" onClick={handleOpenMenu}>
                          <MoreVert />
                        </IconButton>
                        <Menu id="menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleCloseMenu}>
                          <MenuItem
                            onClick={() => {
                              setShowCreateAccountDialog(true);
                              handleCloseMenu();
                            }}
                          >
                            Create New
                          </MenuItem>
                        </Menu>
                      </>
                    )}
                  </>
                )}
              </Typography>
            </Grid>
          </Grid>
        </AccordionSummary>
        <AccordionDetails>
          <>
            {expandAccount && (
              <>
                {accounts && accounts?.length ? (
                  <Grid container spacing={1}>
                    {accounts.slice(0, maxRecordsToShow).map((obj, index) => (
                      <Grid size={{xs:12, sm:12, md:recordsPerLineInLargeScreen}} key={index}>
                        <Card className="detailCard  card-v1" variant="outlined">
                          <CardContent className="card-link">
                            <Grid container className="detailCardHeader">
                              <Grid size={{xs:12, sm:12}}>
                                <Link
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="link"
                                  to={
                                    type === 'customer'
                                      ? `${routes.customerAccountDetail.path}/${obj._id}`
                                      : `${routes.supplierAccountDetail.path}/${obj._id}`
                                  }
                                >
                                  <Typography className="detailName">{obj?.accountName} </Typography>
                                </Link>
                              </Grid>
                            </Grid>
                            <Grid container>
                              <Grid container>
                                <Grid size={{xs:12, sm:5, md:5}}>
                                  {<DisplayData icon={<FaIndustry size={15} />} label="Industry" value={obj?.industry ?? ''} />}
                                </Grid>
                                <Grid size={{xs:12, sm:7, md:7}}>
                                  {<DisplayData showCopyToText={true} icon={<AiOutlinePhone size={15} />} label="Phone" value={obj?.phone ?? ''} />}
                                </Grid>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography variant="subtitle1">No Accounts To Show</Typography>
                )}
              </>
            )}
            {accounts?.length > 0 && accounts.length > maxRecordsToShow && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button
                  onClick={() => {
                    setMaxRecordsToShow((prevState) => prevState + recordsPerLine * 2);
                  }}
                  endIcon={<FaArrowAltCircleDown size={25} />}
                  className="accordion-outlined-button"
                >
                  <span className="show_more_text">Show More</span>
                </Button>
              </Box>
            )}
          </>
        </AccordionDetails>
      </Accordion>
      {showCreateAccountDialog && (
        <ManageAccountDialog
          open={showCreateAccountDialog}
          onClose={({ fetch }) => {
            setShowCreateAccountDialog(false);
            if (fetch) {
              onSuccess();
            }
          }}
          id={null}
          accountResource={type === 'customer' ? customerAccount.accountResource : supplierAccount.accountResource}
          accountApi={type === 'customer' ? customerAccount.accountApi : supplierAccount.accountApi}
          userId={userId}
          isRedirectToDetailPage={false}
        />
      )}
    </>
  );
}
