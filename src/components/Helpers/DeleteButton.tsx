import React from 'react'
import { Button } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import {isMobile} from "react-device-detect";

const useStyles = makeStyles((theme) => ({
    deleteButton: {
        border: `1px solid ${theme.palette.error.main}`,
        color: theme.palette.error.main,
        background: "#fff"
    },
}));

function DeleteButton({ text, onClick, ...rest }) {

    const classes = useStyles();

    return (
        <Button
            className={classes.deleteButton}
            size="small"
            variant="outlined"
            onClick={onClick}
            style={isMobile ? {color:"#f44336", border: "1px solid #f44336", padding:"5px 10px"} : {}}
            {...rest}

        >
            {text}
        </Button>
    )
}

export default DeleteButton;
