import { useState, useEffect, Fragment, useContext } from "react";
import {
  makeStyles,
  Dialog,
  Typography,
  IconButton,
  Grid,
  Box,
} from "@material-ui/core";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import { BiTask } from "react-icons/bi";
import { VscCalendar } from "react-icons/vsc";
import { BsBriefcase } from "react-icons/bs";
import { GoNote } from "react-icons/go";
import { HiOutlineMail } from "react-icons/hi";
import { FiPlusSquare } from "react-icons/fi";
import { AiOutlinePaperClip } from "react-icons/ai";
import { Task } from "./Task";
import { CreateTask } from "./Task/CreateTask";
import { Event } from "./Event";
import { CreateEvent } from "./Event/CreateEvent";
import { Case } from "./Case";
import { CreateCase } from "./Case/CreateCase";
import { Note } from "./Note";
import { CreateNote } from "./Note/CreateNote";
import { Email } from "./Email";
import { CreateEmail } from "./Email/CreateEmail";
import { Chip } from "@material-ui/core";
import Attachments from "./Attachments/index";
import axiosInstance from "./../../axios/axiosInstance";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import ManageAttachment from "./Attachments/ManageAttachment";
import Chatter from "./Chatter";
import { isMobile, isTablet } from "react-device-detect";
import { CustomDialogTransition } from "./../../constants/helpers";

const useStyles = makeStyles((theme) => ({
  activityBox: {
    padding: "1px 1px 9px 1px",
    background: "#f6f6f6",
  },
  activitySubBox: {
    display: "flex",
    padding: "8px",
    margin: "8px 8px 0 8px",
    cursor: "pointer",
    background: "#fff",
    borderRadius: "3px",
    border: "1px solid #c9c0c0",
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
}));

const Activity = (props) => {
  const classes = useStyles();
  const { relatedTo, handleActivityRefresh, emails = [] } = props;
  const toastConfig = useContext(CustomToastContext);

  const [type, setType] = useState(null);
  const [open, setOpen] = useState(false);
  const [emailUsersOptions, setEmailUsersOptions] = useState([]);
  const [countFetched, setCountFetched] = useState(false);
  const [totalCount, setTotalCount] = useState({
    Task: 0,
    Event: 0,
    Case: 0,
    Note: 0,
    Email: 0,
    Attachment: 0,
  });

  const tabs = ["Task", "Event", "Case", "Note", "Email", "Attachment"];

  useEffect(() => {
    fetchUsersEmails();
  }, []);

  useEffect(() => {
    if (Boolean(relatedTo[0]?.referenceId) && !countFetched) {
      fetchTotalCounts();
    }
  }, [relatedTo[0]?.referenceId]);

  useEffect(() => {
    let data = [];
    if (emails && emails.length) {
      emails.map((curEmail) => {
        if (curEmail && emailUsersOptions.indexOf(curEmail) < 0)
          data.push(curEmail);
      });
      setEmailUsersOptions((prevState) => {
        return [...prevState, ...data];
      });
    }
  }, [emails]);

  const fetchTotalCounts = () => {
    axiosInstance()
      .get(`/activity/resource/count?relatedTo=${JSON.stringify(relatedTo)}`)
      .then(({ data: { data } }) => {
        setTotalCount(data);
        setCountFetched(true);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const getIcon = (tab: string) => {
    switch (tab) {
      case "Task":
        return <BiTask className="mr-1" size={20} />;

      case "Event":
        return <VscCalendar className="mr-1" size={20} />;

      case "Case":
        return <BsBriefcase className="mr-1" size={20} />;

      case "Note":
        return <GoNote className="mr-1" size={20} />;

      case "Email":
        return <HiOutlineMail className="mr-1" size={20} />;

      case "Attachment":
        return <AiOutlinePaperClip className="mr-1" size={20} />;
    }
  };

  const handleChangeType = (event, data) => {
    event.stopPropagation();
    if (data === type) {
      setType(null);
    } else {
      setType(data);
    }
  };

  const handleCreateActivity = (event, data) => {
    event.stopPropagation();
    setType(data);
    setOpen(true);
  };

  const handleClose = () => {
    let temptype = type;
    setType(null);
    setOpen(false);
    setType(temptype);
    handleActivityRefresh();
  };

  const fetchUsersEmails = () => {
    axiosInstance()
      .get("/user")
      .then(({ data: { data, count } }) => {
        data = data.reduce((emails, obj) => {
          if (obj?.email && emailUsersOptions.indexOf(obj.email) < 0)
            emails.push(obj.email);
          return emails;
        }, []);
        setEmailUsersOptions((prevState) => {
          return [...prevState, ...data];
        });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };
  const handleSetCount = (name, count) => {
    if (name) {
      setTotalCount((prevState) => ({ ...prevState, [name]: count }));
    }
  };

  return (
    <Box>
      <Box className="detailHeader">
        <h2 className="listingHeader single">Activity</h2>
      </Box>
      <Box className={classes.activityBox}>
        {tabs.map((data, index) => (
          <Fragment key={index}>
            <Box
              className={classes.activitySubBox}
              onClick={(event) => handleChangeType(event, data)}
            >
              <Grid container>
                <Grid item xs={8}>
                  <Box display="flex">
                    <Box>
                      <IconButton size="small">
                        {type === data ? (
                          <ExpandLessIcon />
                        ) : (
                          <ExpandMoreIcon />
                        )}
                      </IconButton>
                    </Box>
                    <Box ml={1} mt={0.5}>
                      <Typography
                        variant="subtitle2"
                        color="primary"
                        className="d-flex align-items-center"
                      >
                        {getIcon(data)} {data} ({totalCount[data]})
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={4} container justify="flex-end">
                  <IconButton
                    color="primary"
                    size="small"
                    onClick={(event) => handleCreateActivity(event, data)}
                  >
                    {" "}
                    <FiPlusSquare />
                  </IconButton>
                </Grid>
              </Grid>
            </Box>
            <Box>
              {type === "Task" && data === "Task" ? (
                <Task
                  relatedTo={relatedTo}
                  handleActivityRefresh={handleActivityRefresh}
                  onSetCount={handleSetCount}
                />
              ) : null}
              {type === "Event" && data === "Event" ? (
                <Event
                  relatedTo={relatedTo}
                  handleActivityRefresh={handleActivityRefresh}
                  onSetCount={handleSetCount}
                />
              ) : null}
              {type === "Case" && data === "Case" ? (
                <Case
                  relatedTo={relatedTo}
                  handleActivityRefresh={handleActivityRefresh}
                  onSetCount={handleSetCount}
                />
              ) : null}
              {type === "Note" && data === "Note" ? (
                <Note
                  relatedTo={relatedTo}
                  handleActivityRefresh={handleActivityRefresh}
                  onSetCount={handleSetCount}
                />
              ) : null}
              {type === "Email" && data === "Email" ? (
                <Email
                  relatedTo={relatedTo}
                  handleActivityRefresh={handleActivityRefresh}
                  onSetCount={handleSetCount}
                />
              ) : null}
              {type === "Attachment" && data === "Attachment" ? (
                <Attachments
                  relatedTo={relatedTo}
                  handleActivityRefresh={handleActivityRefresh}
                  onSetCount={handleSetCount}
                />
              ) : null}
            </Box>
          </Fragment>
        ))}
        {relatedTo && relatedTo[0].referenceId ? (
          <Chatter relatedTo={relatedTo} />
        ) : null}
      </Box>
      <Dialog
        fullScreen={isMobile || isTablet}
        TransitionComponent={CustomDialogTransition}
        open={open}
        aria-labelledby="customized-dialog-title"
        maxWidth={"md"}
        onClose={handleClose}
        fullWidth
      >
        {type === "Task" ? (
          <CreateTask
            taskId={null}
            handleClose={handleClose}
            relatedTo={relatedTo}
          />
        ) : null}
        {type === "Event" ? (
          <CreateEvent
            eventId={null}
            handleClose={handleClose}
            relatedTo={relatedTo}
            email={emails}
          />
        ) : null}
        {type === "Case" ? (
          <CreateCase
            caseId={null}
            handleClose={handleClose}
            relatedTo={relatedTo}
          />
        ) : null}
        {type === "Note" ? (
          <CreateNote
            noteId={null}
            handleClose={handleClose}
            relatedTo={relatedTo}
            handleDialogClose={handleClose}
          />
        ) : null}
        {type === "Email" ? (
          <CreateEmail
            emailId={null}
            handleClose={handleClose}
            relatedTo={relatedTo}
            options={emailUsersOptions}
          />
        ) : null}
        {type === "Attachment" ? (
          <ManageAttachment
            attachmentId={null}
            handleClose={handleClose}
            relatedTo={relatedTo}
          />
        ) : null}
      </Dialog>
    </Box>
  );
};

export default Activity;
