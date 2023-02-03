import React, { useContext, useState } from 'react';
import Box from '@material-ui/core/Box';
import { makeStyles } from '@material-ui/core/styles';
import { Typography, Button, Grid, Chip, IconButton, TextField, CircularProgress, Avatar } from '@material-ui/core';
import { DeleteOutline } from '@material-ui/icons';

import axiosInstance from '../../../axios/axiosInstance';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import ConfirmationDialog from '../../Helpers/ConfirmationDialog';
import { BsDot } from 'react-icons/bs';
import { MdDelete } from 'react-icons/md';
import { SubCaseColors } from '../Helpers/utils';

const useStyles = makeStyles(() => ({
  marginLeft: {
    marginLeft: 10
  },
  boldFont: {
    fontWeight: 500
  },
  childBtn: {
    position: 'absolute',
    top: '-16px',
    right: '0'
  },
  childChipLayout: {
    fontSize: '10px',
    minWidth: '70px !important'
  }
}));

export const SubTask = ({ setId, openAddSub, setOpenAddSub, fetchTaskDetail, data }) => {
  const { setToastConfig } = useContext(CustomToastContext);

  const [childTasks, setChildTasks] = useState(data.childTask || null);
  const [isSubmitting, setSubmitting] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [isError, setError] = useState(false);
  const [deleteTaskId, setDeleteTaskId] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);

  const handleSave = () => {
    if (taskName && taskName.length >= 3) {
      setSubmitting(true);
      const values = { ...data };
      delete values._id;
      values.parentId = data._id;
      values.description = '';
      values.name = taskName;

      axiosInstance()
        .post('/task', values)
        .then(() => {
          setOpenAddSub(false);
          setSubmitting(false);
          fetchTaskDetail();
        })
        .catch((err) => {
          setToastConfig(err);
          setSubmitting(false);
        });
    } else {
      setError(true);
    }
  };

  const handleOpenActivity = (id) => {
    setId(id);
  };

  const deleteTask = () => {
    if (!deleteTaskId) return;

    // setTimeout(() => {
    //   const updTasks = childTasks?.filter((t) => t._id !== deleteTaskId);
    //   setChildTasks(updTasks || null);
    // }, 500);

    axiosInstance()
      .delete(`/task/${deleteTaskId}`)
      .then(() => {
        setShowConfirmBox(false);
        setDeleteTaskId(null);
        const updTasks = childTasks?.filter((t) => t._id !== deleteTaskId);
        setChildTasks(updTasks || null);
      })
      .catch((err) => {
        setToastConfig(err);
      });
  };

  const classes = useStyles();

  return (
    <>
      <Box>
        {((childTasks && childTasks.length > 0) || openAddSub === true) && (
          <Box mb={1}>
            <div className="position-relative">
              <h4 className="form-label-style" title="Add Terms & Conditions">
                Child Task
              </h4>
            </div>
          </Box>
        )}
        {childTasks &&
          childTasks.map((element, index) => (
            <Box
              key={index}
              border={1}
              onClick={() => handleOpenActivity(element._id)}
              borderColor="grey.300"
              p={1.5}
              mb={1}
              boxShadow={1}
              borderRadius={4}
              style={{ cursor: 'pointer', padding: '8px', marginBottom: '10px', boxShadow: 'none' }}
            >
              <Grid container spacing={1}>
                <Grid item xs={12} className="d-flex justify-content-space-between">
                  <Grid style={{ display: 'flex', gap: '15px' }}>
                    {/* <Typography
                      variant="body1"
                      color="primary"
                      style={{ paddingLeft: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#a3a0a0' }}
                    >
                      <BsDot />
                    </Typography> */}

                    <Typography variant="body1" color="primary">
                      {element.name}
                    </Typography>
                  </Grid>

                  <Grid style={{ display: 'flex', gap: '15px' }}>
                    <Avatar style={{ width: '24px', height: '24px', fontSize: '12px' }}>M</Avatar>
                    <Chip
                      size="small"
                      label={`${element.status}`}
                      color="primary"
                      className={classes.childChipLayout}
                      style={{
                        backgroundColor: SubCaseColors[element.status],
                        color: 'white'
                      }}
                    />

                    <IconButton
                      size="small"
                      color="default"
                      onClick={(e) => {
                        setShowConfirmBox(true);
                        setDeleteTaskId(element._id);
                        e.stopPropagation();
                        // deleteTask(e, element._id)
                      }}
                      style={{ color: 'var(--error)' }}
                    >
                      <MdDelete />
                    </IconButton>
                  </Grid>
                </Grid>
              </Grid>
            </Box>
          ))}
        {openAddSub && (
          <Box>
            <TextField
              variant="outlined"
              type="text"
              label="Task Name"
              required={true}
              name="name"
              fullWidth
              margin="dense"
              onChange={(e) => setTaskName(e.target.value)}
              error={isError && taskName.length < 3}
              helperText={isError && taskName.length < 3 && 'Task name must be at least 3 letters'}
            />
            <Box mt={1}>
              <Button color="primary" size="small" variant="contained" disabled={!taskName || isSubmitting} onClick={handleSave}>
                {isSubmitting ? <CircularProgress size={18} /> : 'Create'}
              </Button>
              <Button variant="contained" size="small" className={classes.marginLeft} disableElevation onClick={() => setOpenAddSub(false)}>
                {' '}
                Cancel
              </Button>
            </Box>
          </Box>
        )}
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${childTasks?.find((t) => t._id === deleteTaskId)?.name} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={deleteTask}
        />
      )}
    </>
  );
};
