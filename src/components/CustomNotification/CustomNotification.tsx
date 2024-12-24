import React from 'react';
import { Card, CardContent, Snackbar, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { Theme } from '@mui/material/styles';

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    width: '350px',
    '& > * + *': {
      marginTop: theme.spacing(2)
    }
  },
  title: {
    fontSize: 14
  },
  pos: {
    marginBottom: 12
  }
}));

export default function CustomNotification({ open, title, message, close }) {
  const classes = useStyles();

  return (
    <>
      {open && (
        <div className={classes.root}>
          <Snackbar
            open={open}
            autoHideDuration={6000000}
            onClose={close}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right'
            }}
          >
            <Card className={classes.root} variant="outlined">
              <CardContent>
                <Typography className={classes.title} color="textSecondary" gutterBottom>
                  {title}
                </Typography>
                <Typography variant="h6" component="h2">
                  {message}
                </Typography>
              </CardContent>
              {/* <CardActions>
                            <Button size="small">Learn More</Button>
                        </CardActions> */}
            </Card>
          </Snackbar>
        </div>
      )}
    </>
  );
}
