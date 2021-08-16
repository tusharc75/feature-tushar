import React, { useState, useContext } from "react";
import {
    Button,
    Checkbox,
    CircularProgress,
    Dialog,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    TextField,
} from "@material-ui/core";
import CustomDialogContent from "../../components/CustomDialog/CustomDialogContent";
import CustomDialogHeader from "../../components/CustomDialog/CustomDialogHeader";
import CustomDialogFooter from "../../components/CustomDialog/CustomDialogFooter";

const DOAReasonDialog = ({
    reasonDialogOpen,
    handleCloseDialog,
    QuoteStatusChange,
    accepted
}) => {

    const [selectedRec, setSelectedRec] = useState(null);
    const [isAssigning, setAssigning] = useState(false);

    const reasons = ["Price Too High", "Price Too Low", "Incorrect Data", "Not Needed", "DOA", "Others"]
    const [value, setValue] = React.useState('');

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setValue(event.target.value);
    };

    return (
        <>
            {(accepted === "Rejected") ?
                (
                    <Dialog
                        fullWidth
                        maxWidth="xs"
                        open={reasonDialogOpen}
                        onClose={handleCloseDialog}
                        aria-labelledby="assign-roles-dialog"
                    >
                        <CustomDialogHeader title={`Reason For Reject`} />
                        <CustomDialogContent>

                            <>
                                <List style={{ padding: 0 }}>
                                    {reasons.map((reason) => (
                                        <ListItem divider >
                                            <ListItemIcon>
                                                <Checkbox
                                                    edge="start"
                                                    onChange={(e) => {
                                                        e.target.checked ? setSelectedRec(reason) : setSelectedRec(null)
                                                    }
                                                    }
                                                    checked={reason === selectedRec}
                                                    inputProps={{
                                                        "aria-labelledby": `checkbox-list-label-${reason}`,
                                                    }}
                                                />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={reason}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                                {(selectedRec === "Others") && <TextField
                                    id="outlined-multiline-static"
                                    label="Other reasons"
                                    multiline
                                    value={value}
                                    onChange={handleChange}
                                    rows={4}
                                    variant="outlined"
                                />}
                            </>
                        </CustomDialogContent>
                        <CustomDialogFooter>
                            <Button
                                disabled={isAssigning}
                                onClick={handleCloseDialog}
                                color="primary"
                                size="small"
                            >
                                Cancel
                            </Button>
                            <Button
                                disabled={isAssigning}
                                onClick={() => QuoteStatusChange(accepted, "", selectedRec === "Others" ? value : selectedRec)}
                                color="primary"
                                size="small"
                                variant="contained"
                            >
                                {isAssigning ? <CircularProgress size={22} /> : "Save"}
                            </Button>
                        </CustomDialogFooter>
                    </Dialog>
                )
                : null}
        </>

    );
};

export default DOAReasonDialog;
