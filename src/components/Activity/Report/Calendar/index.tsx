import React, { useEffect, useState } from 'react';
import Container from '@material-ui/core/Container';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import { Typography } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import { makeStyles } from '@material-ui/core/styles';
import AddIcon from '@material-ui/icons/Add';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import { useHistory } from "react-router-dom";
import { GetRoadmap } from "../../../../axios/activity";
import Tooltip from '@material-ui/core/Tooltip';
import grey from '@material-ui/core/colors/grey';
import queryString from 'query-string';
import moment from 'moment';
import Chip from '@material-ui/core/Chip';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import Loader from "../../../../components/Loader";
import BigCalander from "./BigCalander";
import { GetBoard } from "../../../../axios/activity";


const useStyles = makeStyles((theme) => ({
    hover: {
        "&:hover": {
            backgroundColor: grey[100]
        }
    }
}));

export default function Calender({ type, filter, activityId }) {


    const [activity, setActivity] = useState(null);

    useEffect(() => {
        fetchBoard();
    }, [filter, activityId]);

    const fetchBoard = async () => {
        await GetBoard(type, JSON.stringify(filter))
            .then(({ data }) => {
                setActivity(data);
            })
            .catch((err) => {
            });
    };


    const classes = useStyles();
    return (activity ? <Box bgcolor="white">
        <BigCalander
            activity={activity}
            type={type}
        />
    </Box> : <Loader text="" />
    );
}