import { PriorityHigh } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { useContext } from "react";
import axiosInstance from "src/axios/axiosInstance";
import HtmlTooltip from "src/components/CustomTooltipTitle";
import { ThemeButton } from "src/components/Helpers/Buttons";
import { displayDate } from "src/constants/helpers";
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";

const DeleteRequest = ({ attachment, onSuccess }) => {

  const toastConfig = useContext(CustomToastContext);

  const handleDelete = async (ids) => {
    if (ids?.length) {
      axiosInstance().put('attachment-new/approve-delete-request', { ids })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          onSuccess()
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleRequestReject = (id) => {
    axiosInstance()
      .put('/attachment-new/delete-request', { ids: [id], type: 'cancel' })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        onSuccess()
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };


  return (
    <>
      <p className="mb-2 border-b pb-1 font-semibold">Delete Request</p>
      <p className="mb-2 text-xs">
        A deletion request was submitted by&nbsp;
        <span className="rounded-md bg-gray-100 px-1 py-[0px] font-semibold dark:bg-gray-600">
          {attachment?.deleteRequest?.user?.concatedName}
        </span>{' '}
        on&nbsp;
        {displayDate(attachment?.deleteRequest?.date)}
      </p>
      <p className="mb-1 max-w-[200px] text-xs font-semibold text-gray-500 dark:text-gray-400">
        Reason: <span className="font-normal">{attachment?.deleteRequest?.comment}</span>
      </p>
      <div className="mt-2 flex  gap-2 border-t pt-2">
        <ThemeButton
          buttonType="theme"
          onClick={() => {
            handleDelete([attachment._id]);
          }}
        >
          Approve
        </ThemeButton>
        <ThemeButton
          buttonType="red"
          onClick={() => {
            handleRequestReject(attachment._id);
          }}
        >
          Reject
        </ThemeButton>
      </div>
    </>
  )
}

export default DeleteRequest;

export const DeleteRequestIcon = ({ onClick }) => {
  return (
    <div>
      <span className="relative">
        <span className="absolute right-[3px] top-[3px] flex size-[5px] items-center justify-center rounded-full bg-red-500">
          <span className="size-2 flex-shrink-0 animate-ping rounded-full bg-red-500/70"></span>
        </span>
        <HtmlTooltip title="Delete Request">
          <IconButton
            size="small"
            color="primary"
            onClick={onClick}
          >
            <PriorityHigh fontSize="small" />
          </IconButton>
        </HtmlTooltip>
      </span>
    </div>
  )
}
