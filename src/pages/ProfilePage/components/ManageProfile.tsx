import React, { useState, useContext } from 'react'
import { Grid, Box, useTheme, Tooltip, IconButton, CircularProgress, Avatar, Typography, Divider, Button } from '@material-ui/core'
import { useData } from "../../../StateProvider/Provider";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "../../../axios/axiosInstance";
import CommonSkeleton from "../../../components/Helpers/CommonSkeleton";
import UpdateDetailsDialog from "../../../components/Shared/UpdateDetailsDialog";
import DetailsPage from "../../../components/Shared/DetailsPage";
import EditIcon from '@material-ui/icons/Edit'
import DeleteIcon from "@material-ui/icons/Delete";
import { SET_USER } from "../../../StateProvider/actionTypes";
import styles from "../profilePage.module.scss"
import ManageUpdateEmailPasswordDialog from './ManageUpdateEmailAndPassword'
import _ from 'lodash'
import { useHistory } from "react-router-dom";
import ConfirmationDialog from "../../../components/Helpers/ConfirmationDialog";
import CopyToClipboard from '../../../components/Helpers/CopyToClipboard'

export default function ManageProfile(props) {

    const { displayUserDetails, displayUserProfileImage, userFields,
        userData, loading, userLoading, onFetchUserData, otherDetails } = props

    const { state: { user }, dispatch }: any = useData();
    const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
    const [isUpdating, setUpdating] = useState(false);
    const [isUploading, setUploading] = useState(false);
    const [isEmailUpdate, setEmailUpdate] = useState(false)
    const [isPasswordUpdate, setPasswordUpdate] = useState(false)
    const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false)
    const toastConfig = useContext(CustomToastContext);
    const theme = useTheme();
    const history = useHistory();

    const handleOpenUpdateDialog = () => {
        setOpenUpdateDialog(true);
    };

    const closeUpdateDialog = () => {
        setOpenUpdateDialog(false);
    };

    const handleUpdateUser = (values) => {
        if (userData?._id) {
            setUpdating(true);
            let clonedValues = _.cloneDeep(values)
            axiosInstance()
                .put(`/user/me`, { ...clonedValues })
                .then(({ data }) => {
                    toastConfig.setToastConfig({
                        open: true,
                        type: "success",
                        message: data.message,
                    });
                    onFetchUserData()
                    let updatedUserDetails = { ...user, user: { ...user.user, ...values } }
                    dispatch({ type: SET_USER, payload: updatedUserDetails });
                    setUpdating(false);
                    closeUpdateDialog();
                })
                .catch((error) => {
                    toastConfig.setToastConfig(error);
                    setUpdating(false);
                });
        }
    };
    const getImageUrl = (file) => {
        let formData = new FormData();
        formData.append("file", file);
        setUploading(true);
        axiosInstance()
            .post("/user/upload-public", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            })
            .then(({ data }) => {
                let values = {
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    avatar: data.fileUrl
                }
                handleUpdateUser({ ...values })
                setUploading(false);
            })
            .catch((err) => {
                setUploading(false);
                toastConfig.setToastConfig(err);
            });
    };
    const logoutUser = async () => {
        history.push("/");
        dispatch({ type: SET_USER, payload: null });
        localStorage.removeItem("token");
        history.push("/login");
    };
    const handleUploadImage = (event) => {
        if (event.target.files && event.target.files.length) {
            const file = event.target.files[0];
            getImageUrl(file);
        }
    };

    const handleDeleteProfilePic = () => {
        let values = {
            firstName: userData.firstName,
            lastName: userData.lastName,
            avatar: ""
        }
        handleUpdateUser({ ...values })
        setShowDeleteConfirmBox(false)
    }
    let filteredUserFields = userFields && userFields.length ? userFields.filter(field => field?.fieldData?.sectionName !== "Profile Image" && field?.fieldData?.fieldName !== "reportsTo") : []

    return <>
        {openUpdateDialog && (
            <UpdateDetailsDialog
                title="Update"
                openDialog={openUpdateDialog}
                onClose={closeUpdateDialog}
                data={userData}
                fields={filteredUserFields}
                isUpdating={isUpdating}
                handleUpdate={handleUpdateUser}
            />
        )}
        <>
            {
                displayUserProfileImage ?
                    <div className={styles.userDetail}>
                        <div className={styles.profileAvatarContainer}>
                            <>
                                <Box display="flex" flexDirection="row">
                                    <Box position="relative">
                                        <Avatar
                                            src={userData?.avatar}
                                            style={{ width: 100, height: 100 }}
                                            alt={userData?.firstName ?? ''}
                                        />
                                        <Box
                                            title={userData?.avatar ?? "No picture selected"}
                                            display="flex"
                                            justifyContent="center"
                                            alignItems="center"
                                        >
                                            {isUploading && <CircularProgress size={22} />}
                                        </Box>
                                    </Box>
                                    {
                                        userData?.avatar ?
                                            <Box>
                                                <IconButton
                                                    disabled={Boolean(!userData?.avatar)}
                                                    title="Remove picture"
                                                    color="secondary"
                                                    size="small"
                                                    aria-label="delete picture"
                                                    component="span"
                                                    onClick={() => setShowDeleteConfirmBox(true)}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Box> : null
                                    }

                                </Box>
                            </>

                        </div>
                        <Typography variant="h5" className="text-capitalize" ><strong>{`${userData?.firstName ?? ""} ${userData?.lastName ?? ""}`}</strong></Typography>
                        <label htmlFor="avatar">
                            <IconButton
                                title="Add picture"
                                color="primary"
                                size="small"
                                aria-label="upload picture"
                                component="span">
                                <Typography>{"{click here to change your image}"}</Typography>
                                <input
                                    disabled={isUploading}
                                    id="avatar"
                                    name="avatar"
                                    onChange={handleUploadImage}
                                    accept="image/x-png,image/gif,image/jpeg"
                                    style={{
                                        opacity: "0",
                                        position: "absolute",
                                        zIndex: -1,
                                    }}
                                    onClick={(e: any) => (e.target.value = null)}
                                    type="file"
                                />
                            </IconButton>
                        </label>
                        <Divider />
                    </div>
                    : null
            }
            <div style={{ borderRadius: 8, minWidth: "300px" }}>
                {
                    displayUserDetails ?
                        <>
                            <div className={styles.editProfileContainer}>
                                <Tooltip title="Edit">
                                    <IconButton onClick={handleOpenUpdateDialog} style={{ float: 'right', marginBottom: '5px' }}>
                                        <EditIcon color="primary" />
                                    </IconButton>
                                </Tooltip>
                            </div>
                            <Box style={{ padding: "8px" }}>
                                {loading || userLoading ? (
                                    <Grid container spacing={2} style={{ padding: "8px" }}>
                                        <CommonSkeleton lenArray={[...Array(7).keys()]} />
                                    </Grid>
                                ) : !userFields.length ? <Typography>No Data Found</Typography>
                                    : (
                                        <DetailsPage data={userData} fields={filteredUserFields} />
                                    )}
                                {
                                    <Grid container spacing={2} style={{ padding: '10px 20px' }}>
                                        {otherDetails ? Object.keys(otherDetails).map((k, i) => (
                                            <Grid item xs={12} md={6} sm={6} key={i} >
                                                <Grid container alignItems="center">
                                                    <Grid item xs={6} md={5} sm={5}>
                                                        <Box height="100%" display="flex" alignItems="center">
                                                            <Box marginX="2px" />
                                                            <h4
                                                                title={k}
                                                                className={styles.userProfileFieldText}
                                                                style={{
                                                                    color: theme.palette.text.secondary,
                                                                    fontWeight: "normal",
                                                                }}>
                                                                {k}
                                                            </h4>
                                                        </Box>
                                                    </Grid>
                                                    <Grid item xs={6} md={7} sm={7}><Typography
                                                        align="left"
                                                        title={otherDetails[k] || "_ _ _"}
                                                        className={styles.userProfileFieldText}
                                                        variant="body2"
                                                    >{otherDetails[k] || "_ _ _"}
                                                        {k === "Email" ? <CopyToClipboard textToCopy={otherDetails[k]} /> : null}
                                                    </Typography>

                                                    </Grid>
                                                </Grid>
                                                <Box marginY={1} />
                                            </Grid>)) : null
                                        }
                                    </Grid>
                                }
                            </Box>
                            <Grid container spacing={6} style={{ marginTop: '10px' }}>
                                <Grid item sm={6}>
                                    <Button color="primary"
                                        fullWidth
                                        variant="outlined"
                                        onClick={() => setEmailUpdate(true)}>Update Email</Button>
                                </Grid>
                                <Grid item sm={6}>
                                    <Button color="primary"
                                        fullWidth
                                        variant="outlined"
                                        onClick={() => setPasswordUpdate(true)}>Update Password</Button>
                                </Grid>
                            </Grid>
                        </> : null
                }

                {
                    isPasswordUpdate ?
                        <ManageUpdateEmailPasswordDialog
                            isUpdatePassword={true}
                            open={isPasswordUpdate}
                            onFetchUserData={onFetchUserData}
                            onClose={() => setPasswordUpdate(false)}
                            logoutUser={logoutUser}
                        /> : null
                }
                {
                    isEmailUpdate ?
                        <ManageUpdateEmailPasswordDialog
                            isUpdateEmail={true}
                            userData={userData}
                            open={isEmailUpdate}
                            onFetchUserData={onFetchUserData}
                            onClose={() => setEmailUpdate(false)}
                            logoutUser={logoutUser}
                        /> : null
                }
                {showDeleteConfirmBox ? (
                    <ConfirmationDialog
                        open={showDeleteConfirmBox}
                        message={`Are you sure you want to remove profile picture ?`}
                        onClose={() => setShowDeleteConfirmBox(false)}
                        onOk={handleDeleteProfilePic}
                    />
                ) : null}
            </div>
        </>
    </>
}