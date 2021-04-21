import React, { useEffect, useState, useContext } from 'react'
import { Grid, Box, Tooltip, IconButton, CircularProgress, Avatar, Typography, Divider } from '@material-ui/core'
import { useData } from "../../../StateProvider/Provider";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "../../../axios/axiosInstance";
import CommonSkeleton from "../../../components/Helpers/CommonSkeleton";
import UpdateDetailsDialog from "../../../components/Shared/UpdateDetailsDialog";
import Container from "../../../components/Container";
import DetailsPage from "../../../components/Shared/DetailsPage";
import EditIcon from '@material-ui/icons/Edit'
import DeleteIcon from "@material-ui/icons/Delete";
import {
    SET_USER,
    USER_LOADING,
    SET_SELECTED_ENTITY,
} from "../../../StateProvider/actionTypes";
import "../profilePage.scss"

export default function ManageProfile(props) {
    const { displayUserDetails, displayUserProfileImage } = props
    const { state: { user }, dispatch }: any = useData();
    const [userFields, setUserFields] = useState([]);
    const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
    const [userData, setUserData] = useState(null)
    const [loading, setLoading] = useState(false);
    const [userLoading, setUserLoading] = useState(false);
    const [isUpdating, setUpdating] = useState(false);
    const [isUploading, setUploading] = useState(false);
    const toastConfig = useContext(CustomToastContext);

    useEffect(() => {
        if (userFields.length == 0) {
            getUserFields()
            fetchUserData()
        }
    }, [])
    const fetchUserData = () => {
        setUserLoading(true)
        axiosInstance()
            .get(`/user/${user?.user?._id}`)
            .then(({ data }) => {
                if (data?.data) {
                    delete data.data["updatedBy"]
                    setUserData(data.data)
                }
                setUserLoading(false)
            }).catch((error) => {
                setUserLoading(false)
                toastConfig.setToastConfig(error);
            });
    }
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
        if (userData?._id) {
            setUpdating(true);
            axiosInstance()
                .put(`/user`, { ...values, _id: userData?._id })
                .then(({ data }) => {
                    toastConfig.setToastConfig({
                        open: true,
                        type: "success",
                        message: data.message,
                    });

                    let updatedUserDetails = { ...user, user: { ...user.user, ...values } }
                    dispatch({ type: SET_USER, payload: updatedUserDetails });
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
                handleUpdateUser({ ...userData, avatar: data.fileUrl })
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
    let filteredUserFields = userFields && userFields.length ? userFields.filter(field => field?.fieldData?.sectionName !== "Profile Image") : []
    return <>
        {openUpdateDialog && (
            <UpdateDetailsDialog
                title="Update"
                openDialog={openUpdateDialog}
                onClose={closeUpdateDialog}
                data={userData}
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
                                                    onClick={() => handleUpdateUser({ ...userData, avatar: '' })}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Box> : null
                                    }

                                </Box>
                            </>

                        </div>
                        <Typography variant="h5"><strong>{`${userData?.firstName ?? ""} ${userData?.lastName ?? ""}`}</strong></Typography>
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
            <Container styles={{ borderRadius: 8, minWidth: "300px" }}>
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
                            <Box style={{ padding: "8px" }}>
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

            </Container>
        </>
    </>
}