import React, { useState, useContext } from 'react'
import { Grid, Box, useTheme, Tooltip, IconButton, CircularProgress, Avatar, Typography, Divider, Button, makeStyles } from '@material-ui/core'
import { useData } from "../../../StateProvider/Provider";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "../../../axios/axiosInstance";
import CommonSkeleton from "../../../components/Helpers/CommonSkeleton";
import UpdateDetailsDialog from "../../../components/Shared/UpdateDetailsDialog";
import DetailsPage from "../../../components/Shared/DetailsPage";
import EditIcon from '@material-ui/icons/Edit'
import { SET_USER } from "../../../StateProvider/actionTypes";
import styles from "../profilePage.module.scss"
import ManageUpdateEmailPasswordDialog from './ManageUpdateEmailAndPassword'
import _ from 'lodash'
import { useHistory } from "react-router-dom";
import ConfirmationDialog from "../../../components/Helpers/ConfirmationDialog";
import CopyToClipboard from '../../../components/Helpers/CopyToClipboard';
import { HiPencil } from 'react-icons/hi';
import { IoMdTrash } from 'react-icons/io';
import { HiOutlinePencilAlt } from 'react-icons/hi';

const useStyles = makeStyles((theme) => ({
    profileEdit: {
        position: "absolute",
        bottom: 0,
        right: 0,
        background: theme.palette.primary.main,
        padding: "1px",
        color: "white",
        border: "3px solid white",
        borderRadius: "50%"
    },
    profileDelete: {
        position: "absolute",
        right: "-16px",
        top: "42px",
        background: theme.palette.error.main,
        color: "white",
        border: "3px solid white",
        borderRadius: "50%"
    },
}));

export default function ManageProfile(props) {
    const classes = useStyles();
    const { displayUserDetails, displayUserProfileImage, userFields,
        userData, loading, userLoading, onFetchUserData, otherDetails } = props
    console.log(displayUserDetails);
    console.log(otherDetails);
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
                                        {
                                            userData?.avatar ?
                                                <div className={classes.profileDelete}>
                                                    <IconButton
                                                        disabled={Boolean(!userData?.avatar)}
                                                        title="Remove picture"
                                                        size="small"
                                                        aria-label="delete picture"
                                                        component="span"
                                                        onClick={() => setShowDeleteConfirmBox(true)}
                                                    >
                                                        <IoMdTrash color="white" size={15} />
                                                    </IconButton>
                                                </div> : null
                                        }
                                        <div className={classes.profileEdit}>
                                            <label htmlFor="avatar">
                                                <IconButton
                                                    title="Add picture"
                                                    size="small"
                                                    aria-label="upload picture"
                                                    component="span">
                                                    <HiPencil color="white" size={15} />
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
                                        </div>
                                    </Box>
                                </Box>
                            </>

                        </div>
                        <Typography variant="h5" className="text-capitalize" ><strong>{`${userData?.firstName ?? ""} ${userData?.lastName ?? ""}`}</strong></Typography>
                        <Divider />
                        <div>
                            {otherDetails && Object.keys(otherDetails).map((k, i) => (
                                <span className="d-flex align-items-center gap-1">
                                    { k === "EmployeeNumber" && otherDetails[k] ? <span>Employee No : {otherDetails[k]}</span> : null}
                                    { k === "Email" && otherDetails[k] ? <> <span> Email : {otherDetails[k]}</span> <HiPencil className="cursor-pointer" onClick={() => setEmailUpdate(true)} /></> : null}
                                </span>
                            ))
                            }
                        </div>
                        <Divider />

                        <Button color="primary"
                            fullWidth
                            variant="outlined"
                            size="small"
                            onClick={() => setPasswordUpdate(true)}>Change Password</Button>
                        <Divider />
                    </div>
                    : null
            }


            <div style={{ borderRadius: 8, minWidth: "300px" }}>
                {
                    displayUserDetails ?
                        <>
                            <Box style={{ padding: "8px" }}>
                                <Tooltip title="Edit">
                                    <IconButton onClick={handleOpenUpdateDialog} style={{ float: 'right', marginBottom: '5px' }}>
                                        <HiOutlinePencilAlt color="primary" />
                                    </IconButton>
                                </Tooltip>
                                {loading || userLoading ? (
                                    <Grid container spacing={2} style={{ padding: "8px" }}>
                                        <CommonSkeleton lenArray={[...Array(7).keys()]} />
                                    </Grid>
                                ) : !userFields.length ? <Typography>No Data Found</Typography>
                                    : (
                                        <DetailsPage data={userData} fields={filteredUserFields} />
                                    )}
                            </Box>
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