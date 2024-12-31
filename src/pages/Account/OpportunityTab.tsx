import React from 'react';
import { makeStyles } from '@mui/styles';
import { Card, CardContent, List, ListItem, ListItemAvatar, ListItemText } from '@mui/material';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import { Link } from 'react-router-dom';
import { displayDate } from 'src/constants/helpers';
import routes from './../../components/Helpers/Routes';
import { IoCalendarOutline } from 'react-icons/io5';
import { BiCustomize } from 'react-icons/bi';
import { formatAmountWithCurrency } from '../../constants/helpers';

const useStyles = makeStyles(() => ({
  root: {
    flexGrow: 1
  },
  bullet: {
    display: 'inline-block',
    margin: '0 2px',
    transform: 'scale(0.8)'
  },
  title: {
    fontSize: 14
  },
  pos: {
    marginBottom: 12
  }
  // root: {
  //     // flexGrow: 1,
  // },
  // heading: {
  //     fontSize: theme.typography.pxToRem(17),
  //     flexBasis: '33.33%',
  //     flexShrink: 0,

  // },
  // secondaryHeading: {
  //     fontSize: theme.typography.pxToRem(15),
  //     color: theme.palette.text.secondary,
  // },
  // box: {
  //     border: '1px solid #c4c4c4',
  //     borderRadius: '10px',
  // },
  // actionsItems: {
  //     color: "grey",
  //     float: 'right',
  // },
}));

function DisplayData({ key, label, value, icon }) {
  return (
    <div style={{ flexGrow: 1 }}>
      <List>
        <ListItem key={key}>
          <ListItemAvatar>{icon}</ListItemAvatar>
          <ListItemText primary={value ? value : '-'} secondary={label} />
        </ListItem>
      </List>
    </div>
  );
}

export default function OpportunityTab({ data }) {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      {data && data.length ? (
        <Grid container spacing={1}>
          {data.map((obj, index) => (
            <Grid size={{ xs: 12, sm: 12, md: 6}} key={index}>
              <Card className="detailCard">
                <CardContent className="detailListing">
                  <Grid container className="detailCardHeader">
                    <Grid size={{ xs:7, sm:8}}>
                      {
                        <Link className="link" to={`${routes.opportunityDetail.path}/${obj._id}`}>
                          <Typography className="detailName">{obj?.opportunityName}</Typography>
                        </Link>
                      }
                    </Grid>
                    <Grid size={{ xs:5, sm:4}}>
                      <Typography className="amount" title={formatAmountWithCurrency(obj['currency'], obj?.estimatedAmount).fullFormatAmount}>
                        {formatAmountWithCurrency(obj['currency'], obj?.estimatedAmount).fullFormatAmount}
                      </Typography>
                    </Grid>
                  </Grid>
                  <Grid container>
                    <Grid size={{ xs:12, sm:6, md:6}}>
                      {obj?.stage ? (
                        <DisplayData key={index} label="Stage" value={obj?.stage?.optionLabel ?? ''} icon={<BiCustomize size={15} />} />
                      ) : (
                        ''
                      )}
                    </Grid>
                    <Grid size={{ xs:12, sm:6, md:6}}>
                      {obj.closeDate ? (
                        <DisplayData key={index} label="Closing Date" value={displayDate(obj.closeDate)} icon={<IoCalendarOutline size={15} />} />
                      ) : (
                        ''
                      )}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : null}
    </div>
  );
}
