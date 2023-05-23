import { useState, useEffect, useContext } from 'react';
import { Box, Chip, Dialog, Typography } from '@material-ui/core';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import styles from './logs.module.scss';
import moment from 'moment';
import { TextField, Button, Grid } from '@material-ui/core';
import { dateTimeFormat } from 'src/constants/helpers';
import PersonIcon from '@material-ui/icons/Person';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';

const Comments = ({ handleClose, workOrderId, uniqueId, serviceName, stepId }) => {
  const toastConfig = useContext(CustomToastContext);
  const [data, setData] = useState(null);
  const [comment, setComment] = useState('');
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    let url = `${routes.workOrder.path}/${workOrderId}/comment?uniqueId=${uniqueId}`;
    if (stepId) {
      url += `&stepId=${stepId}`;
    }
    axiosInstance()
      .get(url)
      .then(({ data: { data } }) => {
        if (data && data?.length) {
          setData(data);
        } else {
          setData([]);
        }
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    axiosInstance()
      .post(`${routes.workOrder.path}/${workOrderId}/comment`, {
        uniqueId: uniqueId,
        stepId: stepId,
        comment: comment
      })
      .then(({ data: { data } }) => {
        fetchData();
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
    setComment('');
  };

  return (
    <Dialog
      fullScreen={fullScreen || isMobile || isTablet}
      fullWidth
      maxWidth="sm"
      open={true}
      onClose={handleClose}
      aria-labelledby="comments-dialog"
    >
      <CustomDialogHeader
        title={`Comments - ${serviceName}`}
        showRequiredLabel={false}
        onClose={handleClose}
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
        showManimizeMaximize={true}
      />
      <CustomDialogContent>
        {data ? (
          <Box className={styles.main}>
            {data.map((item: any) => (
              <div key={item._id}>
                <Typography variant="subtitle1">{item.comment}</Typography>
                <Box pt={1} display="flex">
                  <Chip avatar={<PersonIcon />} label={item?.user?.optionLabel} />
                  <Box ml={2}>
                    <Typography variant="body2">{moment(item.date).format(dateTimeFormat)}</Typography>
                  </Box>
                </Box>
              </div>
            ))}
          </Box>
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
        <Grid container justifyContent="center" alignItems="center" spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              variant="outlined"
              placeholder="Comment"
              label={'Comment'}
              multiline
              rows={2}
            />
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained" color="primary" size="small" onClick={handleSubmit}>
              Add
            </Button>
          </Grid>
        </Grid>
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button variant="outlined" color="primary" size="small" onClick={handleClose}>
          Cancel
        </Button>
      </CustomDialogFooter>
    </Dialog>
  );
};
export default Comments;
