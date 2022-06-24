import MomentUtils from "@date-io/moment";
import { Box, Button, Grid, IconButton, Paper, Typography } from "@material-ui/core";
import Dialog from "@material-ui/core/Dialog";
import MuiPickersUtilsProvider from "@material-ui/pickers/MuiPickersUtilsProvider";
import { CustomDialogTransition, imageUploadMaxSize } from "src/constants/helpers";
import ImageAttachments from "../Activity/Email/ImageAttachments";
import CustomDialogContent from "../CustomDialog/CustomDialogContent";
import CustomDialogFooter from "../CustomDialog/CustomDialogFooter";
import CustomDialogHeader from "../CustomDialog/CustomDialogHeader";
import CustomButton from "../Helpers/CustomButton";
import TinyMce from "../TinyMCE"
import DeleteIcon from "@material-ui/icons/Delete";
import { GoArrowDown } from "react-icons/go";
import { fileIcons } from "../Activity/Email/FileIcons";
import { useContext, useState } from "react";
import emailStyles from "../../pages/Activity/Email/email.module.scss";
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "src/axios/axiosInstance";

const AskSupplierPriceDialog = (props) => {

    const {
        setAskSupplierPriceDialog,
        askSupplierPriceDialog,
        handelAskPriceToSupplier,
    } = props;

    const [otherAttachments, setOtherAttachments] = useState([]);
    const [fileImageAttachments, setFileImageAttachments] = useState([]);
    const [open, setOpen] = useState(false);
    const [imageSource, setImageSource] = useState(null);
    const [imageAttachments, setImageAttachments] = useState([]);
    const [contantValue, setContantValue] = useState(null);
    const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0);
    const toastConfig = useContext(CustomToastContext);


    const getFileIconSrc = (file) => {
        let extension = file.substring(file.lastIndexOf(".")).toLowerCase();
        let data = fileIcons.find((o) => o.extensions.indexOf(extension) >= 0);
        if (data && data?.source) return data.source;
    };

    const handleDeleteAttachment = (url) => {
        setOtherAttachments(
            otherAttachments.filter((currentUrl) => currentUrl !== url)
        );
    };


    const handleDeleteImageAttachment = (url) => {
        setImageAttachments(
            imageAttachments.filter((currentUrl) => currentUrl !== url)
        );
    };
    const handleDeleteFileImageAttachment = (url) => {
        setFileImageAttachments(
            fileImageAttachments.filter((currentUrl) => currentUrl !== url)
        );
    };

    const checkImageUrl = (url) => {
        let extension = url.substring(url.lastIndexOf(".")).toLowerCase();
        let imageExtensions = [
            ".tif",
            ".tiff",
            ".bmp",
            ".jpg",
            ".jpeg",
            ".gif",
            ".png",
            ".eps",
            ".raw",
            ".cr2",
            ".nef",
            ".orf",
            ".sr2",
        ];
        return imageExtensions.indexOf(extension) >= 0;
    };

    const onUploadFile = (file) => {
        if (checkImageUrl(file)) {
            setFileImageAttachments((prevState) => [...prevState, file]);
        } else {
            setOtherAttachments((prevState) => [...prevState, file]);
        }
    };

    const getImageUrl = (file) => {
        let formData = new FormData();
        formData.append("file", file);
        axiosInstance()
            .post("/user/upload-public", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            })
            .then(({ data }) => {
                setImageAttachments((prevState) => [...prevState, data.fileUrl]);
            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
            });
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

    const renderFileThumbnails = (
        <Grid container spacing={1} className={emailStyles.createEmailContainer}>
            {otherAttachments && otherAttachments.length > 0 ? (
                <>
                    {otherAttachments.map((attachment, i) => {
                        return (
                            <>
                                <Grid item key={i} sm={3} xs={3} md={3} xl={3}>
                                    <Paper className={emailStyles.fileContainer}>
                                        <img
                                            src={getFileIconSrc(attachment)}
                                            className={emailStyles.file}
                                            alt="attchment"
                                        />
                                        <Typography noWrap variant="body2">
                                            {attachment
                                                ? attachment.substring(attachment.lastIndexOf("/") + 1)
                                                : "attachment"}
                                        </Typography>
                                        <div className={emailStyles.fileOverlay}>
                                            <Typography variant="subtitle2">
                                                {attachment
                                                    ? attachment.substring(
                                                        attachment.lastIndexOf("/") + 1
                                                    )
                                                    : "attachment"}
                                            </Typography>
                                            <div className={emailStyles.actionButton}>
                                                <IconButton className={emailStyles.text}>
                                                    <a href={`${attachment} `} download={true}>
                                                        <GoArrowDown color="white" size={21} />
                                                    </a>
                                                </IconButton>
                                                <IconButton className={emailStyles.text}>
                                                    <DeleteIcon
                                                        className={emailStyles.deleteIcon}
                                                        onClick={() => handleDeleteAttachment(attachment)}
                                                    />
                                                </IconButton>
                                            </div>
                                        </div>

                                    </Paper>
                                </Grid>
                            </>
                        );
                    })}
                </>
            ) : null}
        </Grid>
    );

    return (
        <>
            <Dialog
                maxWidth="lg"
                fullWidth={true}
                fullScreen={false}
                TransitionComponent={CustomDialogTransition}
                aria-labelledby="customized-dialog-title"
                onClose={() => {
                    setAskSupplierPriceDialog(false)
                }}
                open={askSupplierPriceDialog}
                disableBackdropClick={true}
            >
                <CustomDialogHeader title="Ask Supplier Price Dialog" onClose={() => {
                    setAskSupplierPriceDialog(false)
                }}
                    isMinimized={!false}
                    onMinimizeMaximize={() => { }}
                    showManimizeMaximize={true}
                />

                <CustomDialogContent>
                    <MuiPickersUtilsProvider utils={MomentUtils}>
                        <Box padding={1}>
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <Box>
                                        {renderFileThumbnails}
                                        <ImageAttachments
                                            imageAttachments={fileImageAttachments}
                                            onImageClick={(attachment) => {
                                                setImageSource(attachment);
                                                setOpen(true);
                                            }}
                                            isCreateOnly={true}
                                            onDelete={handleDeleteFileImageAttachment}
                                            emailId={null}
                                        />
                                        <ImageAttachments
                                            imageAttachments={imageAttachments}
                                            onImageClick={(attachment) => {
                                                setImageSource(attachment);
                                                setOpen(true);
                                            }}
                                            isCreateOnly={true}
                                            onDelete={handleDeleteImageAttachment}
                                            emailId={null}
                                        />
                                        <TinyMce
                                            onChange={(value) => {
                                                setContantValue(value)
                                            }}
                                            initialValue={""}
                                            imageOrFileUploadCompletePercentage={(
                                                completePercentage
                                            ) => {
                                                setUploadingImageOrFileProgress(
                                                    completePercentage
                                                );
                                            }}
                                            doNotShowUploadFile={false}
                                            onUploadFile={onUploadFile}
                                            onUploadImage={handleUploadImage}
                                            usePublicUrlforFileUpload={true}
                                            isSendToCustomer={false}
                                        />
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>
                    </MuiPickersUtilsProvider>
                </CustomDialogContent>

                <CustomDialogFooter>
                    <Button type="button" variant="outlined" color="primary" size="small" onClick={() => {
                        setAskSupplierPriceDialog(false)
                    }}>
                        Cancel
                    </Button>

                    <CustomButton
                        variant="contained"
                        color="primary"
                        onClick={()=>handelAskPriceToSupplier(contantValue)}
                    >
                        Submit
                    </CustomButton>
                </CustomDialogFooter>

            </Dialog>
        </>
    )
}
export default AskSupplierPriceDialog;