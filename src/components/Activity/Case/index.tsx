import Box from '@material-ui/core/Box';
import Dialog from '@material-ui/core/Dialog';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Typography from '@material-ui/core/Typography';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import axios, { CancelTokenSource } from 'axios';
import moment from 'moment';
import { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import { useData } from '../../../StateProvider/Provider';
import { CustomDialogTransition, dateFormat } from '../../../constants/helpers';
import ActivityLoader from '../../Helpers/ActivityLoader';
import { ListRelatedTo } from '../Helpers/ListRelatedTo';
import { ViewAll } from '../Helpers/ViewAll';
import { CreateCase } from './CreateCase';

export const Case = ({ relatedTo, handleActivityRefresh, onSetCount }) => {
  const [open, setOpen] = useState(false);
  const [cases, setCases] = useState(null);
  const [caseId, setCaseId] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(true);
  const {
    state: { permissions }
  }: any = useData();
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const toastConfig = useContext(CustomToastContext);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchCase(cancelTokenSource);
    return () => cancelTokenSource.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCase = async (cancelTokenSource?: CancelTokenSource) => {
    setLoading(true);
    axiosInstance()
      .get(`/case?relatedTo=${JSON.stringify(relatedTo)}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data } }) => {
        setCases(data);
        onSetCount('Case', data.length);
        setTimeout(() => setLoading(false), data.length ? 1000 : 1500);
      })
      .catch((err) => {
        setLoading(false);
      });
  };

  const handleOpenMenu = (event, _id) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setCaseId(_id);
  };

  const handleCloseMenu = (event) => {
    event.stopPropagation();
    setAnchorEl(null);
    setCaseId(null);
  };

  const handleEdit = (event) => {
    event.stopPropagation();
    setAnchorEl(null);
    setOpen(true);
  };

  const handleDelete = (event) => {
    event.stopPropagation();
    axiosInstance()
      .delete(`/case/${caseId}`)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setAnchorEl(null);
        fetchCase();
        handleActivityRefresh();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleClose = () => {
    fetchCase();
    setOpen(false);
    handleActivityRefresh();
  };

  return (
    <Box className="activityDetailBox">
      {loading ? (
        <ActivityLoader />
      ) : cases.length ? (
        <Fragment>
          {cases.slice(0, 5).map((_case, index) => (
            <Box key={_case._id} className="activity">
              <Box>
                <Grid container>
                  <Grid item xs={10} className="d-flex align-items-center task_text_confirm gap-1">
                    <Typography
                      variant="subtitle2"
                      className="cursor-pointer"
                      onClick={() => {
                        setCaseId(_case._id);
                        setOpen(true);
                      }}
                    >
                      {_case.name}
                    </Typography>
                    <span className="activity-date">Due Date : {moment(_case.dueDate).format(dateFormat)}</span>
                  </Grid>
                  {permissions['case']?.isUpdate || permissions['case']?.isDelete ? (
                    <Grid item xs={2} container justify="flex-end">
                      <IconButton size="small" color="primary" aria-label="delete" onClick={(event) => handleOpenMenu(event, _case._id)}>
                        <MoreHorizIcon />
                      </IconButton>
                    </Grid>
                  ) : null}
                </Grid>
              </Box>
              <Box pt={1}>
                <Grid container>
                  <Grid item xs={12}>
                    <ListRelatedTo relatedTo={_case.relatedTo} originRelatedTo={relatedTo} />
                    {/* <Chip label={_case.status} size="small" color="primary" /> */}
                  </Grid>
                </Grid>
              </Box>
            </Box>
          ))}
          <ViewAll type="case" relatedTo={relatedTo} />
        </Fragment>
      ) : (
        <Box p={1} border={1} borderColor="var(--common-border-color)" textAlign="center">
          <Typography variant="subtitle2">No Past Case</Typography>
        </Box>
      )}
      <Menu id="simple-menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleCloseMenu}>
        {permissions['case']?.isUpdate ? <MenuItem onClick={handleEdit}>Edit</MenuItem> : null}
        {permissions['case']?.isDelete ? <MenuItem onClick={handleDelete}>Delete</MenuItem> : null}
      </Menu>
      <Dialog
        open={open}
        aria-labelledby="customized-dialog-title"
        maxWidth="md"
        onClose={(e, reason) => {
          if (reason !== 'backdropClick') {
            handleClose();
            setFullScreen(false);
          }
        }}
        fullWidth
        fullScreen={fullScreen || isMobile || isTablet}
        TransitionComponent={CustomDialogTransition}
      >
        <CreateCase
          caseId={caseId}
          handleClose={() => {
            handleClose();
            setFullScreen(false);
          }}
          relatedTo={relatedTo}
          isMinimized={!fullScreen}
          onMinimizeMaximize={() => {
            setFullScreen((prevState) => !prevState);
          }}
          showManimizeMaximize={true}
        />
      </Dialog>
    </Box>
  );
};
