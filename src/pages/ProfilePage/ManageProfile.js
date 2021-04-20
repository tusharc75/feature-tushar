import React, { useEffect, useState, useContext } from 'react'
import { Grid, Box, Tooltip, IconButton, CircularProgress, Avatar, Typography, Divider } from '@material-ui/core'
import { useData } from "../../StateProvider/Provider";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "../../axios/axiosInstance";
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import UpdateDetailsDialog from "../../components/Shared/UpdateDetailsDialog";
import Container from "../../components/Container";
import DetailsPage from "../../components/Shared/DetailsPage";
import EditIcon from '@material-ui/icons/Edit'
import DeleteIcon from "@material-ui/icons/Delete";
import {
    SET_USER,
    USER_LOADING,
    SET_SELECTED_ENTITY,
} from "../../StateProvider/actionTypes";
import "./profilePage.scss"

export default function ManageProfile(props) {
    const { displayUserDetails, displayUserProfileImage } = props
    const { state: { user }, dispatch }: any = useData();
    const [userFields, setUserFields] = useState([]);
    const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isUpdating, setUpdating] = useState(false);
    const [isUploading, setUploading] = useState(false);
    const toastConfig = useContext(CustomToastContext);

    useEffect(() => {
        if (userFields.length == 0) {
            getUserFields()
        }
    }, [])
    const getUserFields = () => {
        setLoading(true)
        axiosInstance()
            .get("/field?resource=User")
            .then(({ data }) => {
                setUserFields(data.data);
                setLoading(false)
            })
            .catch((error) => {
                toastConfig.setToastConfig(error);
                setLoading(false)
            });
    };

    const handleOpenUpdateDialog = () => {
        setOpenUpdateDialog(true);
    };

    const closeUpdateDialog = () => {
        setOpenUpdateDialog(false);
    };

    const handleUpdateUser = (values) => {
        if (user?.user?._id) {
            setUpdating(true);
            axiosInstance()
                .put(`/user`, { ...values, _id: user.user._id })
                .then(({ data }) => {
                    toastConfig.setToastConfig({
                        open: true,
                        type: "success",
                        message: data.message,
                    });
                    fetchUserData()
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
                handleUpdateUser({ ...user.user, avatar: data.fileUrl })
                setUploading(false);
            })
            .catch((err) => {
                setUploading(false);
                toastConfig.setToastConfig(err);
            });
    };
    const handleUploadImage = (event) => {
        if (event.target.files && event.target.files.length) {
            const file = event.target.files[0];
            getImageUrl(file);
        }
    };
    const fetchUserData = () => {
        dispatch({ type: USER_LOADING, payload: true });
        axiosInstance()
            .get("/user/me")
            .then(({ data: response }) => {
                const { data } = response;
                dispatch({ type: SET_USER, payload: data });
                if (data?.role?.selectedEntity?._id) {
                    dispatch({
                        type: SET_SELECTED_ENTITY,
                        payload: data.role.selectedEntity._id,
                    });
                }
                dispatch({ type: USER_LOADING, payload: false });
            })
            .catch((err) => {
                localStorage.setItem("token", "");
                dispatch({ type: USER_LOADING, payload: false });
            });
    };
    let filteredUserFields = userFields && userFields.length ? userFields.filter(field => field?.fieldData?.sectionName !== "Profile Image") : []
    return <>
        {openUpdateDialog && (
            <UpdateDetailsDialog
                title="Update"
                openDialog={openUpdateDialog}
                onClose={closeUpdateDialog}
                data={user.user}
                fields={userFields}
                isUpdating={isUpdating}
                handleUpdate={handleUpdateUser}
            />
        )}
        <>
            {
                displayUserProfileImage ?
                    <div className="userDetail">
                        <div className="profileAvatarContainer">
                            <>
                                <Box display="flex" flexDirection="row">
                                    <Box position="relative">
                                        <Avatar
                                            src={user.user.avatar}
                                            style={{ width: 100, height: 100 }}
                                            alt={user?.user?.firstName ?? ''}
                                        />
                                        <Box
                                            title={user?.user?.avatar ?? "No picture selected"}
                                            display="flex"
                                            justifyContent="center"
                                            alignItems="center"
                                        >
                                            {isUploading && <CircularProgress size={22} />}
                                        </Box>
                                    </Box>
                                    <Box>
                                        <IconButton
                                            disabled={Boolean(!user?.user?.avatar)}
                                            title="Remove picture"
                                            color="secondary"
                                            size="small"
                                            aria-label="delete picture"
                                            component="span"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>
                                </Box>
                            </>

                        </div>
                        <Typography variant="h5"><strong>{`${user?.user?.firstName ?? ""} ${user?.user?.lastName ?? ""}`}</strong></Typography>
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
                                    type="file"
                                />
                            </IconButton>
                        </label>
                        <Divider />
                    </div>
                    : null
            }
            <Container styles={{ borderRadius: 8 }}>
                {
                    displayUserDetails ?
                        <>
                            <div className="editProfileContainer">
                                <Tooltip title="Edit">
                                    <IconButton onClick={handleOpenUpdateDialog} style={{ float: 'right', marginBottom: '5px' }}>
                                        <EditIcon color="primary" />
                                    </IconButton>
                                </Tooltip>
                            </div>
                            <Box style={{ padding: "8px", minHeight: "500px" }}>
                                {loading || !userFields.length ? (
                                    <Grid container spacing={2} style={{ padding: "8px" }}>
                                        <CommonSkeleton lenArray={[...Array(7).keys()]} />
                                    </Grid>
                                ) : (
                                    <DetailsPage data={user.user} fields={filteredUserFields} />
                                )}
                            </Box>
                        </> : null
                }

            </Container>
        </>
    </>
}