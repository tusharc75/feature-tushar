import { MoreVert } from '@mui/icons-material';
import { Card, CardContent, IconButton, Menu, MenuItem } from '@mui/material';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { AiOutlineMail, AiOutlineUser } from 'react-icons/ai';
import { BiPhone } from 'react-icons/bi';
import { FaArrowAltCircleDown } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import DisplayData from 'src/components/CardDisplayData';
import { Accordion, AccordionDetails, AccordionSummary } from 'src/components/CustomAccordion';
import { customerContact, supplierAccount, supplierContact } from '../../constants/helpers';
import ManageContactDialog from '../Contact/ManageContact';

export default function OpportunityContacts({
  contacts,
  title,
  onAddContact,
  contactApi,
  onSetExpanded,
  isExpanded,
  recordsPerLine,
  accounts = null,
  saveContactToOpportunity = null,
  accountId = null,
  allowedToEdit
}) {
  const [maxRecordsToShow, setMaxRecordsToShow] = useState(recordsPerLine);
  const [anchorEl, setAnchorEl] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };
  function ContactDetails({ contacts, contactApi }) {
    return (
      <>
        {contacts && contacts.length ? (
          <Grid container spacing={2}>
            {[...contacts].slice(0, maxRecordsToShow).map((obj, index) => {
              return (
                <Grid key={index} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card className="detailCard   card-v1">
                    <CardContent className="card-link">
                      <Grid size={{ xs: 12 }}>
                        <Grid container className="detailCardHeader">
                          <Grid size={{ xs: 12, sm: 12 }}>
                            {
                              <Link className="link" target="_blank" rel="noopener noreferrer" to={`/${contactApi}/detail/${obj._id}`}>
                                <Typography className="detailName">
                                  {' '}
                                  {`${obj.firstName || ''}  ${obj.lastName || ''}`}
                                  {obj.title && <span className="role">( {obj.title} )</span>}
                                </Typography>
                              </Link>
                            }
                          </Grid>
                        </Grid>
                        <Grid container>
                          <Grid size={{ xs: 12, md: 6 }}>
                            {<DisplayData key="2" label="Email" showCopyToText={true} icon={<AiOutlineMail size={15} />} value={obj.email || ''} />}
                          </Grid>
                          {supplierContact.contactApi === contactApi && (
                            <Grid size={{ xs: 12, md: 6 }}>
                              {
                                <Link
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="link"
                                  to={`/${supplierAccount.accountApi}/detail/${obj.accountName}`}
                                >
                                  <DisplayData
                                    key="3"
                                    label="Supplier Account"
                                    icon={<AiOutlineUser size={15} />}
                                    value={accounts?.find((item) => item?.optionValue === obj.accountName)?.optionLabel || ''}
                                  />
                                </Link>
                              }
                            </Grid>
                          )}
                          <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                            {<DisplayData key="3" label="Phone" showCopyToText={true} icon={<BiPhone size={15} />} value={obj.phone || ''} />}
                          </Grid>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        ) : (
          <Typography className="m-2 text-center">No Contacts found</Typography>
        )}
      </>
    );
  }
  return (
    <Accordion expanded={isExpanded} className="omsAccordian" onChange={onSetExpanded}>
      <AccordionSummary aria-controls="user-panel-content" id="user-panel-header">
        <div className="flex items-center justify-between">
          <Typography variant="subtitle2">
            {title} {`(${contacts.length})`}
          </Typography>

          {allowedToEdit && (
            <>
              <IconButton
                aria-haspopup="true"
                color="primary"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleOpenMenu(e);
                }}
              >
                <MoreVert />
              </IconButton>
              <Menu id="menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleCloseMenu}>
                {contactApi === customerContact.contactApi && (
                  <MenuItem
                    onClick={() => {
                      setShowCreateDialog(true);
                      handleCloseMenu();
                    }}
                  >
                    Create New
                  </MenuItem>
                )}
                <MenuItem
                  onClick={() => {
                    onAddContact();
                    handleCloseMenu();
                  }}
                >
                  Add Existing
                </MenuItem>
              </Menu>
            </>
          )}
        </div>
      </AccordionSummary>
      <AccordionDetails>
        <ContactDetails contacts={contacts} contactApi={contactApi} />
        {contacts && contacts.length > maxRecordsToShow ? (
          <>
            <Box
              margin={1}
              className="btn-view gap-1"
              p={1}
              display="flex"
              justifyContent="center"
              alignItems="center"
              onClick={() => setMaxRecordsToShow((prevState) => prevState + recordsPerLine * 2)}
            >
              <FaArrowAltCircleDown size={25} />
            </Box>
          </>
        ) : null}
      </AccordionDetails>
      {showCreateDialog && (
        <ManageContactDialog
          onClose={() => setShowCreateDialog(false)}
          contactResource={customerContact.contactResource}
          contactApi={customerContact.contactApi}
          isRedirectToDetailPage={false}
          onSuccess={(data) => {
            if (data) {
              setShowCreateDialog(false);
              saveContactToOpportunity(data._id, 'customer', contacts);
            }
          }}
          isClone={false}
          contactId={null}
          referenceData={{ accountName: accountId }}
        />
      )}
    </Accordion>
  );
}
