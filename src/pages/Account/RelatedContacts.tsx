import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Button, Card, CardContent, Grid, List, ListItemIcon, Typography } from '@material-ui/core';
import accountClass from './account.module.scss';
import { useHistory } from 'react-router-dom';
import { FaEye } from 'react-icons/fa';
import { BsPerson } from 'react-icons/bs';
import { BiFace } from 'react-icons/bi';
import ListItem from '@material-ui/core/ListItem/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import { ListItemText } from '@material-ui/core';
import VisibilityIcon from '@material-ui/icons/Visibility';

function DisplayData({ key, label, value, icon, highlightsHead = false }) {
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
                    display: 'inline-block',
                    color: '#298B88',
                    fontWeight: 600
                  }}
                >
                  {value ? value : '-'}
                </span>
              ) : value ? (
                value
              ) : (
                '-'
              )
            }
            secondary={label}
          />
        </ListItem>
      </List>
    </div>
  );
}

function RelatedContacts({ contacts, accountId, accountName, contactApi, contactRoute, children = null }) {
  const history = useHistory();
  return (
    <>
      {contacts && contacts.length ? (
        <>
          <Grid container spacing={1}>
            {contacts.map((obj, index) => {
              return (
                <Grid item xs={12} sm={12} md={6} lg={4} className="omsAccordian" key={obj?._id ?? `contact${index}`}>
                  <Card key={obj?._id ?? `contact${index}`} className="detailCard card-v1" variant="outlined">
                    <CardContent className="card-link">
                      <Link className={`${accountClass.account_name_link} f_size`} to={`/${contactApi}/detail/${obj._id}`}>
                        <Typography className="detailName">{`${obj.firstName || ''}  ${obj.lastName || ''}`}</Typography>
                      </Link>

                      <Grid container>
                        <Grid item xs={12} sm={6} md={6}>
                          {<DisplayData key={index} label="Account" value={accountName || '-'} icon={<BsPerson size={15} />} />}
                        </Grid>
                        <Grid item xs={12} sm={6} md={6}>
                          {<DisplayData key={index} label="Title" value={obj.title || '-'} icon={<BiFace size={15} />} />}
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
          {children && <Box mt={1}>{children}</Box>}
          <Box mt={2}>
            <Button
              className="accordion-outlined-button"
              onClick={() =>
                history.push(`/${contactRoute}`, {
                  accountId: accountId,
                  accountName: accountName
                })
              }
              startIcon={<VisibilityIcon />}
              variant="outlined"
            >
              <span>View All</span>
            </Button>
          </Box>
        </>
      ) : null}
    </>
  );
}
export default RelatedContacts;
