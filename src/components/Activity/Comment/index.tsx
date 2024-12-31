import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import Grid from '@mui/material/Grid2';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { makeStyles } from '@mui/styles';
import axios, { CancelTokenSource } from 'axios';
import React, { useEffect } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { Theme } from '@mui/material';
import { displayDateTime } from 'src/constants/helpers';

const useStyles = makeStyles((theme: Theme) => ({
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
    axiosInstance()
      .post('/comment', data)
      .then(() => {
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
              <Grid className={` ${classes.comment_avatar}`}>
                <Avatar className={` ${avatarClass} `}>{element.firstName[0] + element.lastName[0]}</Avatar>
              </Grid>
              <Grid className={`${classes.comments_container} `}>
                <Typography variant="body2" className={classes.boldFont}>
                  {element.firstName + ' ' + element.lastName}
                  <Typography variant="caption" className={classes.marginLeft}>
                    {' '}
                    {displayDateTime(element.createdAt, 'MMM DD YYYY hh:mm A')}
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
          <div className=" flex-grow space-y-3">
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
            <ThemeButton buttonType="theme" onClick={postComment}>
              Send
            </ThemeButton>
          </div>
        </div>
      </Box>
    </Box>
  );
};
