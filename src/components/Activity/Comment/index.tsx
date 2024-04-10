import Avatar from '@material-ui/core/Avatar';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import axios, { CancelTokenSource } from 'axios';
import moment from 'moment';
import React, { useEffect } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { PostComment } from '../../../axios/activity';

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

  add_comment_wrapper: {
    marginTop: '15px'
  },

  comment_container: {
    padding: '0 !important',
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
  },

  comment_avatar: {
    padding: '0 15px 0 0 !important'
  },
  comments_container: {
    padding: '0 !important'
  },
  comments_wrapper: {
    marginTop: '20px',
    flexWrap: 'nowrap'
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
    const cancelToken = axios.CancelToken.source();
    fetchComment(cancelToken);
    return () => cancelToken.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchComment = async (cancelTokenSource?: CancelTokenSource) => {
    axiosInstance()
      .get(`/comment/${referenceId}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data } }) => {
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

  const avatarClass = '[color:var(--primary-text)_!important] [background:var(--dark-secondary,_white)_!important] [font-size:14px_!important]';
  return (
    <Box>
      <Typography variant="body2" className={classes.boldFont}>
        Comments
      </Typography>
      {comment &&
        comment.map((element, index) => (
          <Box key={index} mt={1}>
            <Grid container className={`${classes.comments_wrapper}`}>
              <Grid item className={` ${classes.comment_avatar}`}>
                <Avatar className={` ${avatarClass} `}>{element.firstName[0] + element.lastName[0]}</Avatar>
              </Grid>
              <Grid item className={`${classes.comments_container} `}>
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
        <div className="flex flex-wrap items-start gap-2">
          <Avatar className={` ${avatarClass} `}>{currentUser && currentUser.firstName[0] + currentUser.lastName[0]} </Avatar>
          <div className=" space-y-3 flex-grow">
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
            <Button color="primary" size="small" variant="contained" onClick={postComment}>
              Send
            </Button>
          </div>
        </div>
      </Box>
    </Box>
  );
};
