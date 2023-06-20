import React, { useState } from 'react';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import {
  Card,
  IconButton,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  withStyles,
  Menu,
  MenuItem,
  ListItemIcon
} from '@material-ui/core';
import { Link } from 'react-router-dom';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import { AiOutlineMail, AiOutlineUser } from 'react-icons/ai';
import CopyToClipboard from '../../components/Helpers/CopyToClipboard';
import { BiPhone } from 'react-icons/bi';
import { FaArrowAltCircleDown } from 'react-icons/fa';
import { customerAccount, customerContact, supplierAccount, supplierContact } from '../../constants/helpers';
import { MoreVert } from '@material-ui/icons';
import ManageContactDialog from '../Contact/ManageContact';
import { Accordion, AccordionSummary, AccordionDetails } from 'src/components/CustomAccordion';

// function DisplayData({ key, label, value, icon, showCopyToText = false }) {
//   return (
//     <div style={{ flexGrow: 1 }}>
//       <List>
//         <ListItem key={key}>
//           <ListItemAvatar>{icon}</ListItemAvatar>
//           <ListItemText
//             primary={
//               <>
//                 <Grid container>
//                   <Grid item xs={10} md={10} sm={10} className="text-truncate">
//                     {value ? value : '-'}{' '}
//                   </Grid>
//                   <Grid item xs={2} md={2} sm={2}>
//                     {showCopyToText ? <CopyToClipboard textToCopy={value} /> : null}
//                   </Grid>
//                 </Grid>{' '}
//               </>
//             }
//             secondary={label}
//           />
//         </ListItem>
//       </List>
//     </div>
//   );
// }
function DisplayData({ key, label, value, icon, highlightsHead = false, showCopyToText = false }) {
  return (
    <div style={{ flexGrow: 1 }}>
      <List style={{ padding: 0 }}>
        <ListItem key={key} style={{ alignItems: 'flex-start', paddingInline: '0' }}>
          <ListItemIcon style={{ minWidth: '24px', marginTop: 11 }}>{icon}</ListItemIcon>
          <ListItemText
            primary={
              highlightsHead ? (
                <span
                  style={{
                    background: '#EFFBF9',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    color: '#298B88',
                    fontWeight: 600,
                    display: showCopyToText ? 'inline-flex' : 'inline-block'
                  }}
                >
                  <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', flexBasis: 'calc(100% - 40px)' }} title={value}>
                    {value ? value : '-'}
                  </span>
                  {showCopyToText ? (
                    <span>
                      <CopyToClipboard textToCopy={value} />
                    </span>
                  ) : null}
                </span>
              ) : value ? (
                <span style={{ fontSize: '15px', display: showCopyToText ? 'inline-flex' : 'unset' }}>
                  <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', flexBasis: 'calc(100% - 40px)' }} title={value}>
                    {value}
                  </span>
                  {showCopyToText ? (
                    <span style={{ flexBasis: '10px' }}>
                      <CopyToClipboard textToCopy={value} />
                    </span>
                  ) : null}
                </span>
              ) : (
                '-'
              )
            }
            secondary={<span style={{ fontSize: '14px' }}>{label}</span>}
          />
        </ListItem>
      </List>
    </div>
  );
}
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
  isAllowedToUpdate
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
                <Grid key={index} item xs={12} sm={6} md={4}>
                  <Card className="detailCard   card-v1">
                    <CardContent className="card-link">
                      <Grid item xs={12}>
                        <Grid container className="detailCardHeader">
                          <Grid item xs={12} sm={12}>
                            {
                              <Link className="link" to={`/${contactApi}/detail/${obj._id}`}>
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
                          <Grid item xs={12} sm={6} md={6}>
                            {<DisplayData key="2" label="Email" showCopyToText={true} icon={<AiOutlineMail size={15} />} value={obj.email || ''} />}
                          </Grid>
                          {supplierContact.contactApi === contactApi && (
                            <Grid item xs={12} sm={6} md={6}>
                              {
                                <Link className="link" to={`/${supplierAccount.accountApi}/detail/${obj.accountName}`}>
                                  <DisplayData
                                    key="2"
                                    label="Supplier Account"
                                    icon={<AiOutlineUser size={15} />}
                                    value={accounts?.find((item) => item?.optionValue === obj.accountName)?.optionLabel || ''}
                                  />
                                </Link>
                              }
                            </Grid>
                          )}
                          <Grid item xs={12} sm={6} md={6}>
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
        <Grid container className="pos_rel">
          <Grid item xs={8}>
            <Box display="flex">
              <Box>
                <IconButton size="small">{isExpanded === true ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
              </Box>
              <Box padding="5px">
                <Typography variant="subtitle2">
                  {title} {`(${contacts.length})`}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={4} container justify="flex-end">
            {isAllowedToUpdate && (
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
          </Grid>
        </Grid>
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
          accountId={accountId}
          contactResource={customerContact.contactResource}
          contactApi={customerContact.contactApi}
          account={customerAccount}
          isRedirectToDetailPage={false}
          onSuccess={(obj) => {
            if (obj) {
              setShowCreateDialog(false);
              saveContactToOpportunity(obj.id, 'customer', contacts);
            }
          }}
        />
      )}
    </Accordion>
  );
}
