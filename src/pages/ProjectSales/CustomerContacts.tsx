import { Box, Card, CardContent, Grid, List, ListItemText, ListItem, ListItemAvatar, IconButton } from '@material-ui/core';

import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import { Link, useHistory } from 'react-router-dom';
import { FaEye } from 'react-icons/fa';
import { BsPerson } from 'react-icons/bs';
import { BiFace } from 'react-icons/bi';
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline';
import styles from './ProjectSales.module.scss';
import React from 'react';

function DisplayData({ key, label, value, icon }) {
  return (
    <div style={{ flexGrow: 1 }}>
      <List>
        <ListItem key={key} className="px-0 pt-0 pb-0 contact-accodian">
          <ListItemAvatar className={styles.list_start_icon}>{icon}</ListItemAvatar>
          <ListItemText
            primary={
              <>
                <Grid container>
                  <Grid item xs={12} md={11} sm={11} className="text-truncate">
                    {value ? value : '-'}{' '}
                  </Grid>
                </Grid>{' '}
              </>
            }
            secondary={label}
            className={styles.label_size}
          />
        </ListItem>
      </List>
    </div>
  );
}

function RelatedContacts({ contacts, accountId, accountName, contactRoute, handleRemoveContact }) {
  const history = useHistory();

  return (
    <div>
      <div className={styles.detail_main}>
        {contacts && contacts.length ? (
          <>
            {contacts.map((obj, index) => {
              return (
                <>
                  <div className={styles.detailFromCard}>
                    <Card key={obj?._id ?? `contact${index}`} className="detailCard">
                      <CardContent className={styles.detail_view}>
                        <div className="cardStyle"> </div>
                        <Grid item xs={12}>
                          <Grid container className={`${'detailCardHeader'} `}>
                            <Grid item xs={6}>
                              <Link className="account_name_link f_size contact_detailName" to={`/${contactRoute}/detail/${obj._id}`}>
                                {`${obj.firstName || ''}  ${obj.lastName || ''}`}
                              </Link>
                            </Grid>

                            <Grid item xs={6} className={styles.delete_contact}>
                              <IconButton
                                className={'delete_contact_icon'}
                                title={`Remove contact: ${obj?.firstName} ${obj?.lastName}`}
                                aria-haspopup="true"
                                color="primary"
                                size="small"
                                onClick={() => {
                                  handleRemoveContact(obj);
                                }}
                              >
                                <DeleteOutlineIcon color="error" className={styles.delete_icon_button} />
                              </IconButton>
                            </Grid>
                          </Grid>

                          <Grid container>
                            <Grid item xs={6} sm={6} md={6} className={styles.detail_account}>
                              {<DisplayData key={index} label="Account" value={accountName || '-'} icon={<BsPerson size={15} />} />}
                            </Grid>
                            <Grid item xs={12} sm={6} md={6} className={styles.detail_account}>
                              {<DisplayData key={index} label="Title" value={obj.title || '-'} icon={<BiFace size={15} />} />}
                            </Grid>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </div>
                </>
              );
            })}
          </>
        ) : null}
      </div>
      <div>
        <Box margin={1} />
        <Box
          className="btn-view gap-1 view_all_button"
          p={1}
          display="flex"
          justifyContent="center"
          alignItems="center"
          onClick={() =>
            history.push(`/${contactRoute}`, {
              accountId: accountId,
              accountName: accountName
            })
          }
        >
          View All <ExitToAppIcon />
        </Box>
      </div>
    </div>
  );
}
export default RelatedContacts;
