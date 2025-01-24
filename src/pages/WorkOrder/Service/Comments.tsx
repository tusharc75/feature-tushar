import { useState, useEffect, useContext } from 'react';
import { Box, Dialog, IconButton } from '@mui/material';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import { TextField } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { CustomDialogTransition, displayDateTime } from 'src/constants/helpers';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import EditIcon from '@mui/icons-material/Edit';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const Comments = ({ handleClose, workOrderId, uniqueId, serviceName, stepId, userId }) => {
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
    let url = `${routes?.workOrder?.path}/${workOrderId}/comment?uniqueId=${uniqueId}`;
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
      .post(`${routes?.workOrder?.path}/${workOrderId}/comment`, {
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
      .put(`${routes?.workOrder?.path}/${editingCommentId}/comment`, {
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
      TransitionComponent={CustomDialogTransition}
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
                    className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--common-border-color)] md:gap-[32px]"
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
                        <div className="mt-[8px] flex flex-wrap justify-end gap-[8px]">
                          <ThemeButton
                            onClick={handleCancel}
                            buttonType='transparent'
                          >
                            Cancel
                          </ThemeButton>
                          <ThemeButton
                            onClick={handleSave}
                            buttonType='theme'
                            disabled={!editedComment?.trim().length}
                          >
                            Save
                          </ThemeButton>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="basis-[calc(100%-100px)] text-[16px] font-[500]">{item.comment}</p>
                        {userId === item?.user?.optionValue ? (
                          <HtmlTooltip title="Edit">
                            <IconButton
                              aria-label="edit"
                              onClick={(e) => {
                                handleEdit(item);
                              }}
                              size="small"
                            >
                              <EditIcon color="primary" fontSize="small" />
                            </IconButton>
                          </HtmlTooltip>
                        ) : null}
                      </>
                    )}
                  </div>
                  <div className="mt-[9px] flex flex-wrap justify-between gap-[10px] text-[13px] text-[var(--primary-text)]">
                    <p>
                      Created by : <span className="font-semibold">{item?.user?.optionLabel}</span>
                      <span className="ml-2 text-[#969696] dark:text-gray-400">{displayDateTime(item.date)}</span>
                    </p>
                    {item.updatedBy && item.updatedAt ? (
                      <p>
                        Edited by : <span className="font-semibold">{item?.user?.optionLabel}</span>
                        <span className="ml-2 text-[#969696] dark:text-gray-400">{displayDateTime(item.updatedAt)}</span>
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
          <Grid size={{ xs: 12 }}>
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
          <Grid size={{ xs: 12 }}>
            <ThemeButton
              onClick={handleSubmit}
              buttonType='theme'
              disabled={comment === ''}
            >
              Add
            </ThemeButton>
          </Grid>
        </Grid>
      </CustomDialogContent>
      <CustomDialogFooter>
        <ThemeButton
          onClick={handleClose}
          buttonType='transparent'
        >
          Cancel
        </ThemeButton>
      </CustomDialogFooter>
    </Dialog>
  );
};
export default Comments;
