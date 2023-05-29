import React from "react";
import TextField from "@material-ui/core/TextField";
import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";
import { CustomDialogTransition, INVENTORY_STATUS } from "../../constants/helpers"
import Dialog from "@material-ui/core/Dialog"
import CustomDialogHeader from "../../components/CustomDialog/CustomDialogHeader"
import CustomDialogContent from "../../components/CustomDialog/CustomDialogContent"
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';

export default function ReasonDialog({ onClose, status, onAddReason, ...rest }) {
    const [value, setValue] = React.useState("");

    const handleChange = (event) => {
        setValue(event.target.value.trimStart());
    };

    return (
        <Dialog
            TransitionComponent={CustomDialogTransition}
            open={true}
            aria-labelledby="customized-dialog-title"
            fullWidth
            maxWidth={"sm"}
            onClose={(e, reason) => {
                if (reason !== 'backdropClick') { }
            }}
        >
            <CustomDialogHeader
                onClose={onClose}
                title={status === INVENTORY_STATUS.scrap ? "Scrapping Reason" : status === INVENTORY_STATUS.lost ? "Lost Reason" : "Comment"}></CustomDialogHeader>
            <CustomDialogContent>
                <Box>
                    <Box pt={3} pb={3}>
                        <Grid container spacing={3} >
                            <Grid item xs={12} sm={12} md={12}>
                                <TextField
                                    id="outlined-multiline-static"
                                    label={status === INVENTORY_STATUS.scrap ? "Scrapping Reason" : status === INVENTORY_STATUS.lost ? "Lost Reason" : "Comment"}
                                    placeholder={status === INVENTORY_STATUS.scrap ? "Scrapping Reason" : status === INVENTORY_STATUS.lost ? "Lost Reason" : "Comment"}
                                    fullWidth
                                    value={value}
                                    required
                                    onChange={handleChange}
                                    variant="outlined"
                                    multiline={true}
                                    rows={3}
                                    size="small"
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
                    disabled={!Boolean(value)}
                    type="button"
                    color="primary"
                    variant="contained" onClick={() => { onAddReason(value) }}>Save</Button>
            </CustomDialogFooter>
        </Dialog>
    );
};
