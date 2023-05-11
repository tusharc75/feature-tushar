import { useState, useEffect, useContext } from 'react';
import { Box, Dialog } from '@material-ui/core';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import styles from './logs.module.scss';
import moment from 'moment';
import { FaUser as UserIcon } from 'react-icons/fa';
import { TextField, Button, Grid } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';

const Comments = ({ handleClose, workOrderId, serviceId, uniqueId, serviceName, stepId }) => {
  const toastConfig = useContext(CustomToastContext);
  const [data, setData] = useState(null);
  const [comment, setComment] = useState('');

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
        comment: comment,
      })
      .then(({data : {data}}) => {
        fetchData();
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
      // clear the comment text
      setComment("");
  };

  return (
    <Dialog fullWidth maxWidth="md" open={true} onClose={handleClose} aria-labelledby="comments-dialog">
      <CustomDialogHeader
        title={`${serviceName ? serviceName : ''} Comments`}
        showManimizeMaximize={false}
        showRequiredLabel={false}
        onClose={handleClose}
        style={{ textTransform: 'capitalize' }}
      />
      <CustomDialogContent>
        {data ? (
          data?.length > 0 ? (
            <Box className={styles.main}>
            {data.map((item: any) => (
              <div key={item._id}>
                <div>
                  <h4>{item.comment}</h4>
                  <p>
                    <UserIcon style={{ marginRight: '5px' }} />
                    {item.user.firstName} {item.user.lastName}
                  </p>
                  <p>{moment(item.date).format('MMM Do YYYY, LT')}</p>
                </div>
              </div>
            ))}
          </Box>
          ) : (
            <h5>No Comments found.</h5>
          )
        ) : (
          <Box p={2} height={500} bgcolor="white">
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
        <Grid container justifyContent="center" alignItems="center" spacing={2}>
        <Grid item xs={12}>
            <TextField
                fullWidth
                value={comment}
                onChange={e => setComment(e.target.value)}
                variant="outlined"
                placeholder="Add a comment"
                multiline
                rows={2}
                style={{ width: '60%' }}
            />
        </Grid>
        <Grid item xs={12}>
            <Button
                variant="contained"
                color="primary"
                size="small"
                onClick={handleSubmit}
                startIcon={<AddIcon />}
            >
                Add
            </Button>
        </Grid>
        </Grid>
      </CustomDialogContent>
    </Dialog>
  );
};

export default Comments;