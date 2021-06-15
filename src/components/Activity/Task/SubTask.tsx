import React, { useContext, useState } from "react";
import Box from "@material-ui/core/Box";
import { makeStyles } from "@material-ui/core/styles";
import {
  Typography,
  Button,
  Grid,
  Chip,
  IconButton,
  TextField,
  CircularProgress,
} from "@material-ui/core";
import { DeleteOutline } from "@material-ui/icons";

import axiosInstance from "../../../axios/axiosInstance";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import { FaPlusCircle } from 'react-icons/fa';
import TableChartIcon from "@material-ui/icons/TableChart";

const useStyles = makeStyles((theme) => ({
  marginLeft: {
    marginLeft: 10,
  },
  boldFont: {
    fontWeight: 500,
  },
  childBtn: {
    position: "absolute",
    top: "-16px",
    right: "0",
  },
}));

export const SubTask = ({
  setId,
  openAddSub,
  setOpenAddSub,
  fetchTaskDetail,
  data,
}) => {
  const { setToastConfig } = useContext(CustomToastContext);

  const [childTasks, setChildTasks] = useState(data.childTask || null);
  const [isSubmitting, setSubmitting] = useState(false);
  const [taskName, setTaskName] = useState("");
  const [isError, setError] = useState(false);

  const handleSave = () => {
    if (taskName && taskName.length >= 3) {
      setSubmitting(true);
      const values = { ...data };
      delete values._id;
      values.parentId = data._id;
      values.description = "";
      values.name = taskName;

      axiosInstance()
        .post("/task", values)
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

  const deleteTask = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();

    if (!id) return;

    setTimeout(() => {
      const updTasks = childTasks?.filter((t) => t._id !== id);
      setChildTasks(updTasks);
    }, 500);

    axiosInstance()
      .delete(`/task/${id}`)
      .then(() => { })
      .catch((err) => {
        setToastConfig(err);
      });
  };

  const classes = useStyles();

  return (
    <Box>
      {((childTasks && childTasks.length > 0) || openAddSub === true) && (
        <Box mb={1}>
          <div className="position-relative">
            <h4
              className="form-label-style"
              title="Add Terms & Conditions"
            >
              Child Task
            </h4>
            <Button
              variant="outlined"  
              size="small"
              color="primary"
              disableElevation
              className={classes.childBtn}
              onClick={() => setOpenAddSub(true)}
              startIcon={<TableChartIcon />}
            >
              Add
            </Button>
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
            style={{ cursor: "pointer" }}
          >
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="body1" color="primary">
                  {element.name}
                </Typography>
              </Grid>
              <Grid
                item
                xs={6}
                container
                justify="flex-end"
                alignItems="center"
              >
                <Chip size="small" label={element.status} color="primary" />
                <Box mr={1} />
                <IconButton
                  size="small"
                  color="default"
                  onClick={(e) => deleteTask(e, element._id)}
                >
                  <DeleteOutline color="error" />
                </IconButton>
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
            helperText={
              isError &&
              taskName.length < 3 &&
              "Task name must be at least 3 letters"
            }
          />
          <Box mt={1}>
            <Button
              color="primary"
              size="small"
              variant="contained"
              disabled={!taskName || isSubmitting}
              onClick={handleSave}
            >
              {isSubmitting ? <CircularProgress size={18} /> : "Create"}
            </Button>
            <Button
              variant="contained"
              size="small"
              className={classes.marginLeft}
              disableElevation
              onClick={() => setOpenAddSub(false)}
            >
              {" "}
              Cancel
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};
