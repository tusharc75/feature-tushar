import React from 'react'
import { Button } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
    deleteButton: {
        border: `1px solid ${theme.palette.error.main}`,
        color: theme.palette.error.main
    },
}));

function DeleteButton({ text, action }) {

    const classes = useStyles();

    return (
        <Button
            className={classes.deleteButton}
            variant="outlined"
            onClick={action}
        >
            {text}
        </Button>
    )
}

export default DeleteButton;
