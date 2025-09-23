import { Dialog, IconButton, List, ListItem, ListItemIcon, ListItemText } from "@mui/material";
import { useContext, useState } from "react";
import CustomDialogContent from "src/components/CustomDialog/CustomDialogContent";
import CustomDialogHeader from "src/components/CustomDialog/CustomDialogHeader";
import HtmlTooltip from "src/components/CustomTooltipTitle";
import { CustomDialogTransition, getFileIconSrc } from "src/constants/helpers";
import { useData } from "src/StateProvider/Provider";
import GetAppIcon from '@mui/icons-material/GetApp';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { download, IMAGE_EXTENSIONS, PDF_EXTENSION } from "src/components/Activity/AttachmentsNew/helper";
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "src/axios/axiosInstance";

const ShowAttachemntsDialog = ({ onClose, attachments }) => {

  const toastConfig = useContext(CustomToastContext);

  const {
    state: { resources }
  }: any = useData();

  const [fullScreen, setFullScreen] = useState(false);

  const viewFile = (fileName) => {
    toastConfig.setToastConfig({
      open: true,
      type: 'info',
      message: `File is Loading, Please wait...`
    });
    axiosInstance()
      .get(`user/download`, {
        params: {
          fileName: fileName
        },
        responseType: 'blob',
        onDownloadProgress: (progressEvent) => {
          let percentCompleted = Math.floor((progressEvent.loaded * 100) / progressEvent.total);
          if (percentCompleted === 100) {
            toastConfig.setToastConfig({
              message: 'File Viewed Successfully',
              open: true,
              type: 'success'
            });
          }
        }
      })
      .then(({ data }) => {
        const ext = fileName?.split('.').pop().toLowerCase();
        let mimeType = 'application/octet-stream';
        if (PDF_EXTENSION?.includes(ext)) {
          mimeType = 'application/pdf';
        } else if (IMAGE_EXTENSIONS?.includes(ext)) {
          mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
        }
        const blob = new Blob([data], { type: mimeType });
        const fileURL = URL.createObjectURL(blob);
        const newWindow = window.open();
        newWindow.location.href = fileURL;
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  return (
    <Dialog
      open
      fullScreen={fullScreen}
      TransitionComponent={CustomDialogTransition}
      maxWidth="md"
      fullWidth
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
        }
      }}
    >
      <CustomDialogHeader
        title={`${resources?.attachment?.titlePlural}`}
        onClose={onClose}
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
        showRequiredLabel={false}
        showManimizeMaximize={true}
      />
      <CustomDialogContent isFooterPresent={false}>
        <div className="p-2">
          {attachments && attachments?.length > 0 ? (
            <List dense>
              {attachments?.map((file, index) => {
                const Icon = getFileIconSrc(file?.fileName);
                const extension = file?.fileName?.split('.').pop();
                return (
                  <ListItem key={`selected-${index}`} divider>
                    <ListItemIcon>
                      <Icon size={24} className="mx-auto" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <p className="truncate text-[15px] font-medium text-[#232529] dark:text-white">
                          {file?.name}
                        </p>
                      }
                      secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                    />
                    {[...IMAGE_EXTENSIONS, ...PDF_EXTENSION]?.includes(extension?.toLowerCase()) && (
                      <HtmlTooltip title={'Preview'}>
                        <IconButton
                          size="small"
                          color="inherit"
                          onClick={(e) => {
                            e.stopPropagation();
                            viewFile(file?.fileName);
                          }}
                        >
                          <VisibilityIcon fontSize="small" color="primary" />
                        </IconButton>
                      </HtmlTooltip>
                    )}
                    <HtmlTooltip title={'Download'}>
                      <IconButton
                        size="small"
                        color="inherit"
                        onClick={(e) => {
                          e.stopPropagation();
                          download(file, toastConfig);
                        }}
                      >
                        <GetAppIcon fontSize="small" color="primary" />
                      </IconButton>
                    </HtmlTooltip>
                  </ListItem>
                )
              })}
            </List>
          ) : (
            <div></div>
          )}
        </div>
      </CustomDialogContent>
    </Dialog>
  )
}

export default ShowAttachemntsDialog;
