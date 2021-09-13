import React from "react";
import TextField from "@material-ui/core/TextField";
import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";
import { CustomDialogTransition } from "../../constants/helpers"
import Dialog from "@material-ui/core/Dialog"
import CustomDialogHeader from "../../components/CustomDialog/CustomDialogHeader"
import CustomDialogContent from "../../components/CustomDialog/CustomDialogContent"
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';

export default function ReasonDialog({ onClose, onAddReason, ...rest }) {
    const [value, setValue] = React.useState("");

    const handleChange = (event) => {
        setValue(event.target.value);
    };

    return (
        <Dialog
            TransitionComponent={CustomDialogTransition}
            open={true}
            aria-labelledby="customized-dialog-title"
            maxWidth={"sm"}
            onClose={(e, reason) => {
                if (reason !== 'backdropClick') { }
            }}
        >
            <CustomDialogHeader
                onClose={onClose}
                title="Scrapping Reason"></CustomDialogHeader>
            <CustomDialogContent>
                <Box>
                    <Box pt={3} pb={3}>
                        <Grid container spacing={3} >
                            <Grid item xs={10} sm={11} md={11}>
                                <TextField
                                    id="outlined-multiline-static"
                                    label="Reason"
                                    placeholder="Add a scrapping reason"
                                    fullWidth
                                    value={value}
                                    onChange={handleChange}
                                    variant="outlined"
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </Box>
            </CustomDialogContent>
            <CustomDialogFooter>
                <Button color="primary" size="small"
                    onClick={onClose}>Cancel</Button>
                <Button
                    type="button"
                    color="primary"
                    variant="contained" onClick={() => { onAddReason(value) }}>Save</Button>
            </CustomDialogFooter>
        </Dialog>
    );
};
