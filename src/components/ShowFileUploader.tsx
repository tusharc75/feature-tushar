import { CircularProgress, IconButton } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { Cancel, CheckCircle, UploadFile } from "@mui/icons-material";
import HtmlTooltip from "src/components/CustomTooltipTitle";
import { formatBytes } from "src/hooks";

const ShowFileUploader = ({ uploads, setUploads }) => {

  if (uploads?.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 w-80 rounded-lg border bg-primary-foreground shadow-lg">
      <div className="flex items-center justify-between border-b p-3">
        <h3 className="text-lg font-medium">Uploads</h3>
        <IconButton onClick={() => setUploads([])}>
          <CloseIcon fontSize="small" color="primary" />
        </IconButton>
      </div>
      <div className="max-h-60 space-y-2 overflow-y-auto p-3">
        {uploads?.map((upload) => (
          <div key={upload?._id || upload.id} className="flex items-center gap-2 rounded-lg border border-b p-2">
            <UploadFile className="text-blue-500 dark:text-blue-700" />
            <div className="flex-grow">
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="line-clamp-1 text-sm font-semibold">{upload?.file?.name}</p>
                {upload?.status === 'uploading' ? (
                  <CircularProgress size={16} />
                ) : upload?.status === 'completed' ? (
                  <HtmlTooltip title={'File uploaded successfully'}>
                    <CheckCircle color="success" fontSize="small" />
                  </HtmlTooltip>
                ) : (
                  <HtmlTooltip title={'Upload Failed'}>
                    <Cancel color="error" fontSize="small" className="cursor-pointer" />
                  </HtmlTooltip>
                )}
              </div>
              <div className="relative mb-1 h-[6px] w-full rounded-md bg-gray-200 dark:bg-gray-800">
                <span
                  className="absolute bottom-[1px] left-0 top-[1px] rounded-[inherit] bg-blue-500 transition-all duration-300 dark:bg-blue-800"
                  style={{ width: `${upload?.progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
                <p>
                  {upload?.status === 'uploading' ? (
                    <>Uploading {formatBytes(upload?.file?.size)}</>
                  ) : upload?.status === 'completed' ? (
                    <>Upload Successfull!</>
                  ) : (
                    <>Upload Failed! Please try again.</>
                  )}
                </p>
                <p>{upload?.status !== 'failed' ? `${upload?.progress}%` : 'Upload Failed'}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ShowFileUploader;
