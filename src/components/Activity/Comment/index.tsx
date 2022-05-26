import React, { useEffect } from 'react';
import TextField from '@material-ui/core/TextField';
import { GetComment, PostComment } from '../../../axios/activity';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Avatar from '@material-ui/core/Avatar';
import moment from 'moment';

const useStyles = makeStyles((theme) => ({
  marginLeft: {
    marginLeft: 10
  },
  marginTop: {
    marginTop: 10
  },
  boldFont: {
    fontWeight: 500
  },
  avatar: {
    fontSize: 'small',
    color: '#fff',
    backgroundColor: theme.palette.primary.main
  },
  avatar_container: {
    ['@media all and (min-width:600px) and (max-width: 800px)']: {
      flexGrow: '0',
      maxWidth: '100%',
      flexBasis: '100%'
    },
    ['@media all and (max-width: 400px)']: {
      flexGrow: '0',
      maxWidth: '100%',
      flexBasis: '100%',
      width: 'unset'
    }
  },
  comment_container: {
    ['@media all and (min-width:600px) and (max-width: 800px)']: {
      flexGrow: '0',
      maxWidth: '100%',
      flexBasis: '100%',
      width: 'unset'
    },
    ['@media all and (max-width: 400px)']: {
      flexGrow: '0',
      maxWidth: '100%',
      flexBasis: '100%',
      width: 'unset'
    }
  }
}));

export const Comment = ({ referenceId }) => {
  const [comment, setComment] = React.useState(null);
  const [currentUser, setCurrentUser] = React.useState(null);
  const [value, setValue] = React.useState('');

  const handleChange = (event) => {
    setValue(event.target.value);
  };

  useEffect(() => {
    fetchComment();
  }, []);

  const fetchComment = async () => {
    await GetComment(referenceId)
      .then(({ data }) => {
        setComment(data.comment);
        setCurrentUser(data.currentUser);
      })
      .catch((err) => {});
  };

  const postComment = () => {
    if (value === '') {
      return false;
    }
    let data: any = {};
    data.referenceId = referenceId;
    data.content = value;
    PostComment(data)
      .then(({ data }) => {
        setValue('');
        fetchComment();
      })
      .catch((err) => {});
  };

  const classes = useStyles();
  return (
    <Box>
      <Typography variant="body2" className={classes.boldFont}>
        Comments
      </Typography>
      {comment &&
        comment.map((element, index) => (
          <Box key={index} mt={1}>
            <Grid container spacing={5}>
              <Grid item xs={2} sm={2} md={2}>
                <Avatar className={`${classes.avatar}`}>{element.firstName[0] + element.lastName[0]}</Avatar>
              </Grid>
              <Grid item xs={10} sm={10} md={10}>
                <Typography variant="body2" className={classes.boldFont}>
                  {element.firstName + ' ' + element.lastName}
                  <Typography variant="caption" className={classes.marginLeft}>
                    {' '}
                    {moment(element.createdAt).format('MMM DD YYYY hh:mm A')}
                  </Typography>
                </Typography>
                <Typography variant="body2">{element.content}</Typography>
              </Grid>
            </Grid>
          </Box>
        ))}
      <Box pt={3}>
        <Grid container spacing={3}>
          <Grid item className={`${classes.avatar_container} `}>
            <Avatar className={`${classes.avatar} `}>{currentUser && currentUser.firstName[0] + currentUser.lastName[0]} </Avatar>
          </Grid>
          <Grid item style={{ width: 'calc(100% - 64px)' }} className={`${classes.comment_container} `}>
            <TextField
              id="outlined-multiline-static"
              label="Comment"
              placeholder="Add a comment..."
              fullWidth
              rows={2}
              value={value}
              onChange={handleChange}
              variant="outlined"
            />
            <Box mt={1}>
              <Button color="primary" size="small" variant="contained" onClick={postComment}>
                Send
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};
