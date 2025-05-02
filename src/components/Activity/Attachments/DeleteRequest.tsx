import { IconButton, Popover } from '@mui/material';
import { useContext, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { isEmpty } from 'lodash';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { PriorityHigh } from '@mui/icons-material';
import { displayDate } from 'src/constants/helpers';


const DeleteRequest = ({ file, handleSucess }: any) => {

  const {
    state: { user: { user } }
  }: any = useData();

  const toastConfig = useContext(CustomToastContext);
  const [deleteRequestAnchorEl, setDeleteRequestAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleDeleteFile = async (ids) => {
    if (ids?.length) {
      axiosInstance().put('attachment/deletemany', { ids })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          handleSucess()
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleRequestReject = (id) => {
    axiosInstance()
      .put('/attachment/delete-request', { ids: [id], type: 'cancel' })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        handleSucess()
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <>
      {!isEmpty(file?.deleteRequest) && file?.createdBy?.user?._id === user?._id && (
        <div className="flex gap-2">
          <span className="relative">
            <span className="absolute right-[3px] top-[3px] flex size-[5px] items-center justify-center rounded-full bg-red-500">
              <span className="size-2 flex-shrink-0 animate-ping rounded-full bg-red-500/70"></span>
            </span>
            <HtmlTooltip title="Delete Request">
              <IconButton
                size="small"
                color="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setDeleteRequestAnchorEl(e.currentTarget);
                }}
              >
                <PriorityHigh fontSize="small" />
              </IconButton>
            </HtmlTooltip>
          </span>
          <Popover
            open={!!deleteRequestAnchorEl}
            onClose={() => setDeleteRequestAnchorEl(null)}
            anchorEl={deleteRequestAnchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right'
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right'
            }}
          >
            <div className="w-[290px] p-3">
              <p className="mb-2 border-b pb-1 font-semibold">Delete Request</p>
              <p className="mb-2 text-xs">
                A deletion request was submitted by&nbsp;
                <span className="rounded-md bg-gray-100 px-1 py-[0px] font-semibold dark:bg-gray-600">
                  {file?.deleteRequest?.user?.concatedName}
                </span>{' '}
                on&nbsp;
                {displayDate(file?.deleteRequest?.date)}
              </p>
              <p className="mb-1 max-w-[200px] text-xs font-semibold text-gray-500 dark:text-gray-400">
                Reason: <span className="font-normal">{file?.deleteRequest?.comment}</span>
              </p>
              <div className="mt-2 flex  gap-2 border-t pt-2">
                <ThemeButton
                  buttonType="theme"
                  onClick={() => {
                    handleDeleteFile([file._id]);
                  }}
                >
                  Approve
                </ThemeButton>
                <ThemeButton
                  buttonType="red"
                  onClick={() => {
                    handleRequestReject(file._id);
                  }}
                >
                  Reject
                </ThemeButton>
              </div>
            </div>
          </Popover>
        </div>
      )}
    </>
  );
};

export default DeleteRequest;
