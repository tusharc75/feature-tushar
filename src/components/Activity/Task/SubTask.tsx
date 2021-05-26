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
} from "@material-ui/core";
import { DeleteOutline } from "@material-ui/icons";
import { Formik, Form } from "formik";
import * as Yup from "yup";

import axiosInstance from "../../../axios/axiosInstance";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";

const useStyles = makeStyles((theme) => ({
  marginLeft: {
    marginLeft: 10,
  },
  boldFont: {
    fontWeight: 500,
  },
}));

const ActivitySchema = Yup.object().shape({
  name: Yup.string()
    .min(3, "Too Short!")
    .max(50, "Too Long")
    .required("task name is required"),
});

export const SubTask = ({
  setId,
  openAddSub,
  setOpenAddSub,
  fetchTaskDetail,
  data,
}) => {
  const { setToastConfig } = useContext(CustomToastContext);

  const [childTasks, setChildTasks] = useState(data.childTask || null);
  const handleSave = (values) => {
    values.parentId = data._id;
    values.description = "";
    values.status = data.status;
    values.assignee = data.assignee;
    values.reporter = data.reporter;
    values.startDate = data.startDate;
    values.dueDate = data.dueDate;
    values.relatedTo = data.relatedTo;
    axiosInstance()
      .post("/task", values)
      .then(({ data }) => {
        setOpenAddSub(false);
        fetchTaskDetail();
      })
      .catch((err) => {
        setToastConfig(err);
      });
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
      .then(() => {})
      .catch((err) => {
        setToastConfig(err);
      });
  };

  const classes = useStyles();

  return (
    <Box mt={3} mb={3}>
      {((childTasks && childTasks.length > 0) || openAddSub === true) && (
        <Box mb={1}>
          <Typography variant="body2" className={classes.boldFont}>
            Child Task
          </Typography>
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
          <Formik
            initialValues={{ name: "" }}
            validationSchema={ActivitySchema}
            onSubmit={handleSave}
          >
            {({ submitForm, touched, errors, setFieldValue, values }) => (
              <Form autoComplete="off" autoCorrect="off" noValidate>
                <TextField
                  variant="outlined"
                  type="text"
                  label="Task Name"
                  required={true}
                  name="name"
                  fullWidth
                  margin="dense"
                  value={values["name"]}
                  error={touched["name"] && Boolean(errors["name"])}
                  helperText={touched["name"] && errors["name"]}
                  onChange={(e) =>
                    setFieldValue("name", e.target.value.trimStart())
                  }
                />
                <Box mt={1}>
                  <Button
                    color="primary"
                    size="small"
                    variant="contained"
                    onClick={submitForm}
                  >
                    Create
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
              </Form>
            )}
          </Formik>
        </Box>
      )}
    </Box>
  );
};
