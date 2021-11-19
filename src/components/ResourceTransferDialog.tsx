import React, { useState, useContext } from 'react'
import CustomDialogFooter from './CustomDialog/CustomDialogFooter';
import CustomDialogHeader from './CustomDialog/CustomDialogHeader';
import Dialog from '@material-ui/core/Dialog'
import Button from "@material-ui/core/Button"
import CircularProgress from "@material-ui/core/CircularProgress"
import DialogContent from "@material-ui/core/DialogContent"
import TextField from "@material-ui/core/TextField"
import Autocomplete from "@material-ui/lab/Autocomplete"
import Box from "@material-ui/core/Box"
import Typography from "@material-ui/core/Typography"
import axiosInstance from "../axios/axiosInstance";
import ConfirmationDialog from './Helpers/ConfirmationDialog';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomToastContext } from "../StateProvider/CustomToastContext/CustomToastContext";
import { entity } from "../constants/helpers";

export default function ResourceTransferDialog(props) {
    const { resource = "", open, onClose, allResourceData, fromResource,
        handleDelete, selectedRecords = [] } = props
    const [loading, setLoading] = useState(false)
    const [toResource, setToResource] = useState(undefined)
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
    const [deleteLoading, setDeleteLoading] = useState(false)
    const toastConfig = useContext(CustomToastContext);
    const { entityResource, entityApi } = entity;

    const handleTransfer = () => {
        setLoading(true)
        let api = resource === "User" ? `user/resource-change/${fromResource?._id}/${toResource?.optionValue}` : `entity/entity-change/${fromResource?._id}/${toResource?.optionValue}`
        if (fromResource?._id && toResource?.optionValue) {
            axiosInstance()
                .put(api)
                .then((data) => {
                    setLoading(false)
                    setShowConfirmDialog(true)
                }).then(error => {
                    setLoading(false)
                })
        }
    }

    const handleDeleteResource = () => {

        let deleteId = fromResource?._id ? fromResource?._id : selectedRecords[0]?._id ? selectedRecords[0]?._id : ""
        let api = resource === "Entity" ? `${entityApi}/remove` : `/user/remove`
        if (deleteId && api) {
            setDeleteLoading(true)
            axiosInstance(api)
                .put(api, { ids: [deleteId] })
                .then(({ data }) => {
                    setDeleteLoading(false)
                    toastConfig.setToastConfig({
                        open: true,
                        type: 'success',
                        message: data.message
                    });
                    handleDelete()
                })
                .catch((error) => {
                    setDeleteLoading(false)
                    toastConfig.setToastConfig(error);
                })
        }
    }
    return <Dialog
        open={true}
        maxWidth="md"
        fullScreen={fullScreen || (isMobile || isTablet)}
        onClose={(e, reason) => {
            if (reason !== 'backdropClick') {
                onClose()
            }
        }}
    >
        <CustomDialogHeader
            title={`Transfer ${resource}`}
            onClose={onClose}
            isMinimized={!fullScreen}
            onMinimizeMaximize={() => {
                setFullScreen(prevState => !prevState)
            }}
            showManimizeMaximize={true}
        />
        <DialogContent>
            <Box p={2}>
                <Typography>
                    {`First you have to transfer all the resources related to this ${fromResource.name} to another ${resource}`}
                </Typography>
            </Box>
            <Box p={2}>
                <Autocomplete
                    size="small"
                    fullWidth
                    options={allResourceData}
                    autoHighlight
                    value={toResource}
                    getOptionLabel={(option) => option.optionLabel || ''}
                    getOptionSelected={(option, val) => (option ? option.optionLabel === val.optionLabel : false)}
                    onChange={(_, val) => setToResource(val)}
                    renderInput={(params) => <TextField {...params} label={`To ${resource}`} variant="outlined" />}
                />
            </Box>
        </DialogContent>

        <CustomDialogFooter>
            <Button
                variant="outlined"
                color="primary"
                size="small"
                disabled={loading}
                onClick={onClose}>
                Cancel
            </Button>
            <Button
                variant="contained"
                color="primary"
                size="small"
                onClick={handleTransfer}
                disabled={loading}
            >
                {loading ? <CircularProgress size={22} /> : "Submit"}
            </Button>
        </CustomDialogFooter>
        {showConfirmDialog ? (
            <ConfirmationDialog
                open={showConfirmDialog}
                message={`All Resources related to ${fromResource?.name} is transferred to ${toResource?.optionLabel}. Are you want to continue to delete ${fromResource?.name}?`}
                onClose={() =>
                    setShowConfirmDialog(false)
                }
                okBtnLoading={deleteLoading}
                onOk={handleDeleteResource}
            />
        ) : null}
    </Dialog >
}