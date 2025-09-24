import { Download } from "@mui/icons-material";
import { Dialog } from "@mui/material";
import { useContext, useEffect, useRef, useState } from "react";
import { FileIcon } from "src/assets/fileIcons";
import axiosInstance from "src/axios/axiosInstance";
import { download, renderTextFileFromUrl } from "src/components/Activity/AttachmentsNew/helper";
import CustomDialogContent from "src/components/CustomDialog/CustomDialogContent";
import CustomDialogHeader from "src/components/CustomDialog/CustomDialogHeader";
import { ThemeButton } from "src/components/Helpers/Buttons";
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";

function isImageFile(filename: string): boolean {
  if (!filename) return false;
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.heic', '.gif', '.bmp', '.tiff', '.svg', '.webp'];
  return imageExtensions.some((ext) => filename.toLowerCase().endsWith(ext));
}
function isPdf(fileName: string): boolean {
  if (!fileName) return false;
  return fileName.toLowerCase().endsWith('.pdf');
}

function isTextFile(fileName: string): boolean {
  if (!fileName) return false;
  return fileName.toLowerCase().endsWith('.txt');
}

function isVideoFile(fileName: string): boolean {
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
  return videoExtensions.some((ext) => fileName?.toLowerCase().endsWith(ext));
}
function isAudioFile(fileName: string): boolean {
  const audioExtensions = ['.mp3', '.wav', '.ogg'];
  return audioExtensions.some((ext) => fileName?.toLowerCase().endsWith(ext));
}

const PreviewDialog = ({ onClose, file }) => {
  const toastConfig = useContext(CustomToastContext);

  const [url, stUrl] = useState<string>(null);
  const textFileDiv = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isImageFile(file.name) && !isPdf(file.name) && !isTextFile(file.name) && !isVideoFile(file.name) && !isAudioFile(file.name)) {
      stUrl('undefined');
      return
    }
    stUrl(null);

    let url = '';
    axiosInstance().get(`/attachment-new/preview?fileId=${file?._id}`, { responseType: 'blob' })
      .then((response: any) => {
        const blob = response.data || response;
        const isPDFFile = isPdf(file?.name);
        const finalBlob = isPDFFile && !blob.type.includes('pdf') ? new Blob([blob], { type: isPDFFile ? 'application/pdf' : 'text/plain' }) : blob;
        url = URL.createObjectURL(finalBlob);
        stUrl(url);
      }).catch(err => {
        toastConfig.setToastConfig(err);
      })

    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [file.fileName]);

  useEffect(() => {
    if (!textFileDiv.current) return;
    if (isTextFile(file.name)) {
      renderTextFileFromUrl(url, textFileDiv.current);
    }
  }, [file?.name, url]);

  return (
    <Dialog onClose={onClose} open={true} fullScreen>
      <CustomDialogHeader showRequiredLabel={false} title={file?.name} onClose={onClose} />
      <CustomDialogContent className="flex flex-col">
        <div className="relative isolate flex h-full flex-grow items-center justify-center">
          {!url ? (
            <p className="text-2xl font-semibold">Loading...</p>
          ) : isImageFile(file.name) ? (
            <img src={url} className="max-h-[calc(100vh-100px)] max-w-full object-contain" />
          ) : isPdf(file?.name) ? (
            <>
              <p className="absolute inset-0 -z-[1] m-auto flex items-center justify-center text-2xl font-semibold">Loading...</p>
              <iframe key={url} src={url} height="100%" width="100%" className="h-[calc(100vh-100px)] w-full"></iframe>
            </>
          ) : isTextFile(file.name) ? (
            <div className="mb-1 flex h-full w-full flex-grow flex-col overflow-auto pb-1">
              <h6 className="mb-2 text-center font-medium text-gray-500">{file.name}</h6>
              <div className="max-h-[calc(100vh-135px)] rounded-md border p-2" ref={textFileDiv} />
            </div>
          ) : isVideoFile(file.name) ? (
            <video
              controls
              className='w-full h-full object-contain rounded-md'
              src={url}
              controlsList="nodownload"
            >
              Your browser does not support the video preview.
            </video>
          ) : isAudioFile(file.name) ? (
            <audio
              controls
              className="w-3/5 rounded-md"
              src={url}
              controlsList="nodownload"
            >
              Your browser does not support the audio preview.
            </audio>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <div className="mx-auto text-center">
                <FileIcon size={100} />
                <p className="mb-2 text-sm">
                  This preview didn't load because the file type is unsupported. Please try to open or download the file to view.
                </p>
                <ThemeButton buttonType="theme" endIcon={<Download />} isLoading={false} onClick={() => download(file, toastConfig)}>
                  Download
                </ThemeButton>
              </div>
            </div>
          )}
        </div>
      </CustomDialogContent>
    </Dialog>
  )
}

export default PreviewDialog;
