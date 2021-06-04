import React, { Fragment, useState, useContext } from 'react'
import { Box, Avatar, CircularProgress, Typography, IconButton } from '@material-ui/core';
import axiosInstance from '../../axios/axiosInstance';
import { imageUploadMaxSize } from "../../constants/helpers";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import AddCircleIcon from "@material-ui/icons/AddCircle";
import DeleteIcon from "@material-ui/icons/Delete";

export default function ImageUpload({ values, name, setFieldValue, touched, errors }) {

    const { setToastConfig } = useContext(CustomToastContext);

    const [isImgUploading, setImgUploading] = useState(false);
    const [imageUploadProgress, setImageUploadProgress] = useState(0);

    const getImageUrl = (file) => {
        setImageUploadProgress(0);
        let formData = new FormData();
        formData.append("file", file);
        setImgUploading(true);
        axiosInstance()
            .post("/user/upload-public", formData, {
                headers: { "Content-Type": "multipart/form-data" },
                onUploadProgress: (pE) => {
                    const completedPercent = Math.floor((pE.loaded * 100) / pE.total);
                    setImageUploadProgress(completedPercent);

                    if (completedPercent === 100) {
                        setTimeout(() => {
                            setImageUploadProgress(0);
                        }, 4000);
                    }
                },
            })
            .then(({ data }) => {
                setFieldValue(name, data.fileUrl);
                setImgUploading(false);
            })
            .catch((err) => {
                setImgUploading(false);
                setToastConfig(err);
                setImageUploadProgress(0);
            });
    };

    const handleUploadImage = (event) => {
        if (event.target.files && event.target.files.length) {
            const file = event.target.files[0];

            if (file.size > imageUploadMaxSize.size) {
                setToastConfig({
                    open: true,
                    type: "error",
                    message: `Image must be less than ${imageUploadMaxSize.text} size`,
                });
            } else {
                getImageUrl(file);
            }
            event.target.value = "";
        }
    };

    return (
        <Fragment>
            <Box display="flex" flexDirection="row">
                <Box position="relative">
                    <Avatar
                        src={values[name]}
                        style={{ width: 70, height: 70 }}
                        alt="org_logo"
                    />
                    <Box
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                        position="absolute"
                        top="0"
                        right="0"
                        width="100%"
                        height="100%"
                    >
                        {isImgUploading && (
                            <>
                                <CircularProgress
                                    variant="determinate"
                                    value={imageUploadProgress}
                                />
                                <Box
                                    top={0}
                                    left={0}
                                    bottom={0}
                                    right={0}
                                    position="absolute"
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                >
                                    <Typography
                                        variant="caption"
                                        component="div"
                                        color="textSecondary"
                                    >{`${imageUploadProgress}%`}</Typography>
                                </Box>
                            </>
                        )}
                    </Box>
                </Box>
                <Box>
                    <label htmlFor={name}>
                        <IconButton
                            title="Add picture"
                            color="primary"
                            size="small"
                            aria-label="upload picture"
                            component="span"
                        >
                            <AddCircleIcon />
                            <input
                                onClick={(e: any) => (e.target.value = null)}
                                disabled={isImgUploading}
                                id={name}
                                name={name}
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
                    {
                        <IconButton
                            disabled={Boolean(!values[name])}
                            title="Remove picture"
                            color="secondary"
                            size="small"
                            aria-label="delete picture"
                            component="span"
                            onClick={() => setFieldValue(name, "")}
                        >
                            <DeleteIcon />
                        </IconButton>
                    }
                    <Box flex="1">
                        <Typography
                            variant="body2"
                            className="text-truncate"
                            style={{
                                marginLeft: "4px",
                                display: touched[name] && Boolean(errors[name]) ? "" : "none",
                            }}
                            color={
                                touched[name] && Boolean(errors[name]) ? "error" : "textPrimary"
                            }
                        >
                            {touched[name] && Boolean(errors[name]) ? errors[name] : null}
                        </Typography>
                    </Box>
                </Box>
            </Box>
        </Fragment>
    )
}
