import { useState, useEffect, Fragment } from "react";
import Box from "@material-ui/core/Box";
import Grid from "@material-ui/core/Grid";
import { CreateCase } from "./CreateCase";
import { GetCase, DeleteCase } from "../../../axios/activity";
import Typography from "@material-ui/core/Typography";
import moment from "moment";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import IconButton from "@material-ui/core/IconButton";
import MoreHorizIcon from "@material-ui/icons/MoreHoriz";
import Dialog from "@material-ui/core/Dialog";
import { ListRelatedTo } from "../Helpers/ListRelatedTo";
import { ViewAll } from "../Helpers/ViewAll";
import ActivityLoader from "../../Helpers/ActivityLoader";
import { isMobile, isTablet } from "react-device-detect";
import { CustomDialogTransition} from "../../../constants/helpers";

export const Case = ({ relatedTo, handleActivityRefresh, onSetCount }) => {
  const [open, setOpen] = useState(false);
  const [cases, setCases] = useState(null);
  const [caseId, setCaseId] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCash();
  }, []);

  const fetchCash = async () => {
    setLoading(true);
    await GetCase(JSON.stringify(relatedTo))
      .then(({ data }) => {
        setCases(data);
        onSetCount("Case", data.length)
        setLoading(false);
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
    DeleteCase(caseId)
      .then(({ data }) => {
        setAnchorEl(null);
        fetchCash();
        handleActivityRefresh();
      })
      .catch((err) => { });
  };

  const handleClose = () => {
    fetchCash();
    setOpen(false);
    handleActivityRefresh();
  };

  return (
    <Box className="activityDetailBox">
      {loading ? (
        <ActivityLoader />
      ) : cases.length ? (
        <Fragment>
          {cases.map((_case, index) => (
            <Box key={_case._id} className="activity">
              <Box>
                <Grid container>
                  <Grid
                    item
                    xs={10}
                    className="d-flex align-items-center gap-1"
                  >
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
                    <span className="activity-date">
                      Due Date : {moment(_case.dueDate).format("MMM DD YYYY")}
                    </span>
                  </Grid>
                  <Grid item xs={2} container justify="flex-end">
                    <IconButton
                      size="small"
                      color="primary"
                      aria-label="delete"
                      onClick={(event) => handleOpenMenu(event, _case._id)}
                    >
                      <MoreHorizIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </Box>
              <Box pt={1}>
                <Grid container>
                  <Grid item xs={12}>
                    <ListRelatedTo
                      relatedTo={_case.relatedTo}
                      originRelatedTo={relatedTo}
                    />
                    {/* <Chip label={_case.status} size="small" color="primary" /> */}
                  </Grid>
                </Grid>
              </Box>
            </Box>
          ))}
          <ViewAll type="case" relatedTo={relatedTo} />
        </Fragment>
      ) : (
        <Box p={1} border={1} borderColor="grey.300" textAlign="center">
          <Typography variant="subtitle2">No Past Case</Typography>
        </Box>
      )}
      <Menu
        id="simple-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={handleEdit}>Edit</MenuItem>
        <MenuItem onClick={handleDelete}>Delete</MenuItem>
      </Menu>
      <Dialog
        open={open}
        aria-labelledby="customized-dialog-title"
        maxWidth="md"
        onClose={handleClose}
        fullWidth
        fullScreen={isMobile || isTablet}
        TransitionComponent={CustomDialogTransition}
      >
        <CreateCase
          caseId={caseId}
          handleClose={handleClose}
          relatedTo={relatedTo}
        />
      </Dialog>
    </Box>
  );
};
