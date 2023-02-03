import React, { useState, useContext } from 'react'
import { Grid, Box, Tooltip, IconButton, CircularProgress, Avatar, Typography, Divider, Button, makeStyles, Table, TableCell, TableContainer, TableHead, TableRow, TableBody } from '@material-ui/core'
import { useData } from "../../../StateProvider/Provider";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "../../../axios/axiosInstance";
import CommonSkeleton from "../../../components/Helpers/CommonSkeleton";
import UpdateDetailsDialog from "../../../components/Shared/UpdateDetailsDialog";
import DetailsPage from "../../../components/Shared/DetailsPage";
import { SET_USER } from "../../../StateProvider/actionTypes";
import styles from "../profilePage.module.scss"
import ManageUpdateEmailPasswordDialog from './ManageUpdateEmailAndPassword'
import { cloneDeep } from 'lodash'
import { useHistory, Link } from "react-router-dom";
import ConfirmationDialog from "../../../components/Helpers/ConfirmationDialog";
import { HiPencil } from 'react-icons/hi';
import { IoMdTrash } from 'react-icons/io';
import { HiOutlinePencilAlt } from 'react-icons/hi';
import { displayDate, imageUploadMaxSize } from "../../../constants/helpers"
import AddProxyDialog from './AddProxyDialog';
import DeleteIcon from "@material-ui/icons/Delete";
import routes from '../../../components/Helpers/Routes';
import { FaDiceOne, FaUserAltSlash, FaUserCheck } from 'react-icons/fa';

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
    dataValue: {
        fontWeight: 500,
        color: theme.palette.primary.main,
    },
    detailLabel: {
        fontSize: "0.8rem",
        fontWeight: "normal",
        color: "#656464",
    }
}));

export default function ManageProfile(props) {
    const classes = useStyles();
    const { displayUserDetails, displayUserProfileImage, userFields,
        userData, loading, userLoading, onFetchUserData, otherDetails, userProxy } = props
    const { state: { user }, dispatch }: any = useData();
    const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
    const [isUpdating, setUpdating] = useState(false);
    const [isUploading, setUploading] = useState(false);
    const [isDeleteProxy, setIsDeleteProxy] = useState(false);
    const [isEmailUpdate, setEmailUpdate] = useState(false)
    const [isPasswordUpdate, setPasswordUpdate] = useState(false)
    const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false)
    const [showAddProxyDialog, setShowAddProxyDialog] = useState(false)
    const toastConfig = useContext(CustomToastContext);
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
            let clonedValues = cloneDeep(values)
            axiosInstance()
                .put(`/user/me`, clonedValues)
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
            if (file.size > imageUploadMaxSize.size) {
                toastConfig.setToastConfig({
                    open: true,
                    type: "error",
                    message: `Image must be less than ${imageUploadMaxSize.text} size`,
                });
            } else {
                getImageUrl(file);
            }
        }
    };

    const handleDeleteProxy = () => {
        axiosInstance()
            .delete("/user/doa/proxy")
            .then(({ data }) => {
                toastConfig.setToastConfig({
                    open: true,
                    type: "success",
                    message: data.message,
                });
                setShowDeleteConfirmBox(false)
                onFetchUserData();
            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
            });
    }

    const handleDeleteProfilePic = () => {
        let values = {
            firstName: userData.firstName,
            lastName: userData.lastName,
            avatar: ""
        }
        handleUpdateUser({ ...values })
        setShowDeleteConfirmBox(false)
    }
    let filteredUserFields = userFields &&
        userFields.length ? userFields.filter(field => field?.fieldData?.sectionName !== "Profile Image" && field?.fieldData?.fieldName !== "reportsTo") : []

    const isActiveProxy = (startDate, endDate) => {
        let result = false;
        let parsedCurrentDate = new Date();
        let parsedStartDate = new Date(startDate);
        let parsedEndDate = new Date(endDate);

        if (parsedCurrentDate >= parsedStartDate && parsedCurrentDate <= parsedEndDate) {
            result = true;
        } else {
            result = false;
        }
        return result;
    }



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
            {displayUserProfileImage ?
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
                                {k === "EmployeeNumber" && otherDetails[k] ? <span>Employee No : {otherDetails[k]}</span> : null}
                                {k === "Email" && otherDetails[k] ? <> <span> Email : {otherDetails[k]}</span> <HiPencil className="cursor-pointer" onClick={() => setEmailUpdate(true)} /></> : null}
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

                    <Button color="primary"
                        fullWidth
                        variant="outlined"
                        size="small"
                        onClick={() => setShowAddProxyDialog(true)}>Add DOA Proxy</Button>
                    <Divider />
                </div>
                : null
            }
            <div style={{ borderRadius: 8, minWidth: "300px" }}>
                {displayUserDetails ?
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
                        <div className="detail-box">
                            <div className={"detail-box-content"}>
                                <FaDiceOne size={16} color={"var(--white)"} style={{ marginRight: "5px" }} />
                                <h2 className={`${"form-label-style"} ${"form-label-quotes"}`}>DOA Proxy</h2>
                            </div>
                            {userData?.proxyDOA ?
                                (
                                    <TableContainer>
                                        <Table aria-label="DOA Proxy Table" size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>
                                                        <h4
                                                            title="assignedTo"
                                                            className={classes.detailLabel}
                                                        >
                                                            Assigned To
                                                        </h4>
                                                    </TableCell>

                                                    <TableCell align="center">
                                                        <h4
                                                            title="startDate"
                                                            className={classes.detailLabel}
                                                        >
                                                            Start Date
                                                        </h4>
                                                    </TableCell>

                                                    <TableCell align="center">
                                                        <h4
                                                            title="endDate"
                                                            className={classes.detailLabel}
                                                        >
                                                            End Date
                                                        </h4>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        Action
                                                    </TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                <TableRow key={userData.proxyDOA.user}>
                                                    <TableCell>
                                                        <Link className="link" to={`${routes.userDetail.path}/${userData.proxyDOA.optionValue}`}>{userData.proxyDOA.optionLabel}</Link>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <span className={classes.dataValue}>{displayDate(userData.proxyDOA.startDate)}</span>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <span className={classes.dataValue}>{displayDate(userData.proxyDOA.endDate)}</span>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <IconButton
                                                            size="small"
                                                            edge="end"
                                                            aria-label="delete"
                                                            onClick={() => {
                                                                setShowDeleteConfirmBox(true)
                                                                setIsDeleteProxy(true)
                                                            }
                                                            }
                                                        >
                                                            <DeleteIcon
                                                                color="error"
                                                            />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>

                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                ) :
                                (
                                    <Box textAlign="center" padding={2}>
                                        <Typography>No proxy is assigned </Typography>
                                    </Box>
                                )
                            }
                        </div>
                        <div className="detail-box">
                            <div className={"detail-box-content"}>
                                <FaDiceOne size={16} color={"var(--white)"} style={{ marginRight: "5px" }} />
                                <h2 className={`${"form-label-style"} ${"form-label-quotes"}`}> Me as a Proxy</h2>
                            </div>
                            {userProxy.length > 0 ?
                                (
                                    <TableContainer>
                                        <Table aria-label="Me as a Proxy Table" size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>
                                                        <h4
                                                            title="assignedBy"
                                                            className={classes.detailLabel}
                                                        >
                                                            Assigned By
                                                        </h4>
                                                    </TableCell>

                                                    <TableCell align="center">
                                                        <h4
                                                            title="startDate"
                                                            className={classes.detailLabel}
                                                        >
                                                            Start Date
                                                        </h4>
                                                    </TableCell>

                                                    <TableCell align="center">
                                                        <h4
                                                            title="endDate"
                                                            className={classes.detailLabel}
                                                        >
                                                            End Date
                                                        </h4>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        Status
                                                    </TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {userProxy?.map((obj) => (
                                                    <TableRow key={obj._id}>
                                                        <TableCell>
                                                            <Link className="link" to={`${routes.userDetail.path}/${obj._id}`}>{`${obj.firstName} ${obj.lastName}`}</Link>
                                                        </TableCell>
                                                        <TableCell align="center">
                                                            <span className={classes.dataValue}>{displayDate(obj.startDate)}</span>
                                                        </TableCell>
                                                        <TableCell align="center">
                                                            <span className={classes.dataValue}>{displayDate(obj.endDate)}</span>
                                                        </TableCell>
                                                        <TableCell align="center">
                                                            {isActiveProxy(obj.startDate, obj.endDate) ? (
                                                                <Tooltip title="Active">
                                                                    <IconButton>
                                                                        <FaUserCheck className="text-success" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            ) : (
                                                                <Tooltip title="Inactive">
                                                                    <IconButton>
                                                                        <FaUserAltSlash className="text-error" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                                }

                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                ) :
                                (
                                    <Box textAlign="center" padding={2}>
                                        <Typography>No assigned proxy</Typography>
                                    </Box>
                                )
                            }
                        </div>


                    </Box>
                    : null
                }
                {isPasswordUpdate ?
                    <ManageUpdateEmailPasswordDialog
                        isUpdatePassword={true}
                        open={isPasswordUpdate}
                        onFetchUserData={onFetchUserData}
                        onClose={() => setPasswordUpdate(false)}
                        logoutUser={logoutUser}
                    /> : null
                }
                {isEmailUpdate ?
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
                        message={isDeleteProxy ?
                            `Are you sure you want to delete DOA proxy ?`
                            : `Are you sure you want to remove profile picture ?`}
                        onClose={() => setShowDeleteConfirmBox(false)}
                        onOk={() => {
                            isDeleteProxy ?
                                handleDeleteProxy()
                                : handleDeleteProfilePic()
                        }}
                    />
                ) : null}
                {showAddProxyDialog && <AddProxyDialog
                    open={showAddProxyDialog}
                    onClose={() => {
                        setShowAddProxyDialog(false)
                    }}
                    onSuccess={(data) => {
                        axiosInstance().post("/user/doa/proxy", data).then(({ data }) => {
                            toastConfig.setToastConfig({ open: true, type: "success", message: data.message })
                            setShowAddProxyDialog(false);
                            onFetchUserData();
                        }).catch((error) => {
                            setShowAddProxyDialog(false);
                            toastConfig.setToastConfig(error);
                        })
                    }}
                    userId={user?.user?._id}
                />}
            </div>
        </>
    </>
}