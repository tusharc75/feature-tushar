import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography'
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Dialog from '@material-ui/core/Dialog';
import axiosInstance from "../../../axios/axiosInstance"
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import Timeline from '@material-ui/lab/Timeline';
import TimelineItem from '@material-ui/lab/TimelineItem';
import TimelineSeparator from '@material-ui/lab/TimelineSeparator';
import TimelineConnector from '@material-ui/lab/TimelineConnector';
import TimelineContent from '@material-ui/lab/TimelineContent';
import TimelineDot from '@material-ui/lab/TimelineDot';
import TimelineOppositeContent from '@material-ui/lab/TimelineOppositeContent';
import { displayDate } from "../../../constants/helpers"

const useStyles = makeStyles((theme) => ({
    root: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: theme.palette.background.paper,
    },
    paper: {
        width: '80%',
        maxHeight: 435,
    },
}));

export default function HistoryDialog(props) {
    const classes = useStyles();
    const { onClose, open, resourceId, resource } = props;

    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(false)
    const toastConfig = useContext(CustomToastContext);

    useEffect(() => {
        fetchHistory()
    }, [])

    const fetchHistory = () => {
        if (resourceId && resource) {
            setLoading(true)
            axiosInstance()
                .get(`/history/${resource}/${resourceId}`)
                .then(({ data: { data } }) => {
                    setLoading(false)
                    data = data.reverse()
                    setHistory(data)
                })
                .catch((err) => {
                    setLoading(false)
                    toastConfig.setToastConfig(err);
                })
        }
    }

    return (
        <Dialog
            disableBackdropClick
            disableEscapeKeyDown
            maxWidth="xs"
            aria-labelledby="confirmation-dialog-title"
            open={open}
            classes={{
                paper: classes.paper,
            }}
            id="confirmation-dialog"
            keepMounted
        >
            <DialogTitle id="confirmation-dialog-title" className="text-white text-capitalize">
                History
            </DialogTitle>
            <DialogContent dividers>
                {
                    loading ? <Typography>Fetching Data</Typography> :
                        history.length ? <>
                            <Timeline>
                                {
                                    history.map(o => {
                                        return <TimelineItem>
                                            <TimelineOppositeContent style={{ flex: 0.1 }}>
                                                <Typography color="textSecondary">{o?.date ? displayDate(o.date) : null}</Typography>
                                            </TimelineOppositeContent>
                                            <TimelineSeparator>
                                                <TimelineDot />
                                                <TimelineConnector />
                                            </TimelineSeparator>
                                            <TimelineContent>
                                                <Typography className="text-capitalize"><span>{o?.user?.fullName ?? ''} </span><h3 className="font-size-2">{o?.action ? `(${o?.action})` : ""}</h3></Typography>
                                            </TimelineContent>
                                        </TimelineItem>
                                    })
                                }
                            </Timeline>
                        </> : <Typography>No History Available</Typography>
                }
            </DialogContent>
            <DialogActions>
                <Button size="small" autoFocus onClick={onClose} color="primary">Cancel</Button>
            </DialogActions>
        </Dialog>
    );
}

HistoryDialog.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    resourceId: PropTypes.any,
    resource: PropTypes.any,
};

