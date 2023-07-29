import { useState, useEffect, useContext } from 'react';
import { Box, Chip, Dialog, IconButton, Typography } from '@material-ui/core';
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
import EditIcon from '@material-ui/icons/Edit';

const Comments = ({ handleClose, workOrderId, uniqueId, serviceName, stepId }) => {
  const toastConfig = useContext(CustomToastContext);
  const [data, setData] = useState(null);
  const [comment, setComment] = useState('');
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedComment, setEditedComment] = useState('');

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

  const handleEdit = (comment) => {
    setEditingCommentId(comment?._id);
    setEditedComment(comment?.comment);
  };

  const handleSave = () => {
    axiosInstance()
      .put(`${routes.workOrder.path}/${editingCommentId}/comment`, {
        comment: editedComment
      })
      .then(({ data: { data } }) => {
        fetchData();
        setEditingCommentId(null);
        setEditedComment('');
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleCancel = () => {
    setEditingCommentId(null);
    setEditedComment('');
  };

  return (
    <Dialog
      fullScreen={fullScreen || isMobile || isTablet}
      fullWidth
      maxWidth="md"
      style={{ maxWidth: '800px', marginLeft: 'auto', marginRight: 'auto' }}
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
      <CustomDialogContent style={{ padding: '18px 24px 12px' }}>
        {data ? (
          <div>
            {data.map((item: any) => (
              <div key={item._id}>
                <div key={item._id} className="mb-4 md:mb-[26px]">
                  <div
                    style={{ borderBottomStyle: 'solid' }}
                    className="flex flex-wrap border-b border-[var(--common-border-color)] md:gap-[32px] gap-4 items-start justify-between"
                  >
                    {editingCommentId === item._id ? (
                      <div className=" basis-[100%] pb-[6px]">
                        <TextField
                          fullWidth
                          size="small"
                          value={editedComment}
                          onChange={(e) => setEditedComment(e.target.value)}
                          variant="outlined"
                          placeholder="Comment"
                          label={'Comment'}
                        />
                        <div className="mt-[8px] flex flex-wrap gap-[8px] justify-end">
                          <Button variant="contained" size="small" color="primary" onClick={handleSave} disabled={!editedComment?.trim().length}>
                            Save
                          </Button>
                          <Button variant="outlined" size="small" color="primary" onClick={handleCancel}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="basis-[calc(100%-100px)] font-[500] text-[16px]">{item.comment}</p>
                        <IconButton
                          aria-label="edit"
                          onClick={(e) => {
                            handleEdit(item);
                          }}
                          size="small"
                        >
                          <EditIcon color="primary" fontSize="small" />
                        </IconButton>
                      </>
                    )}
                  </div>
                  <div className="flex mt-[9px] gap-[10px] justify-between flex-wrap text-[13px] text-[var(--primary-text)]">
                    <p>
                      Created by : <span className="font-semibold">{item?.user?.optionLabel}</span>
                      <span className="text-[#969696] dark:text-gray-400 ml-2">{moment(item.date).format(dateTimeFormat)}</span>
                    </p>
                    {item.updatedBy && item.updatedAt ? (
                      <p>
                        Edited by : <span className="font-semibold">{item?.user?.optionLabel}</span>
                        <span className="text-[#969696] dark:text-gray-400 ml-2">{moment(item.updatedAt).format(dateTimeFormat)}</span>
                      </p>
                    ) : null}
                    <div></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
            <Button disabled={comment === ''} variant="contained" color="primary" size="small" onClick={handleSubmit}>
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
