import { Delete } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import React, { useContext, useMemo, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import DeleteRequestDialog from 'src/components/AttachmentDeleteButton/DeleteRequestDialog';
import { Attachment } from 'src/components/AttachmentDeleteButton/type';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { isEmpty } from 'lodash';

type AttachmentDeleteButtonProps = {
  attachments: Attachment[];
  children?: React.ReactNode | Element[];
  element?: keyof HTMLElementTagNameMap | React.ComponentType<any>;
  onSuccess?: () => void;
  props?: any;
  onClick?: (e: any) => void;
};

const AttachmentDeleteButton = ({
  element = IconButton,
  children = <Delete fontSize="small" />,
  attachments = [],
  onSuccess,
  onClick,
  props
}: AttachmentDeleteButtonProps) => {
  const {
    state: {
      user: { user },
      permissions
    }
  }: any = useData();
  const toastConfig = useContext(CustomToastContext);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState({ open: false });
  const [deleteRequestDialog, setDeleteRequestDialog] = useState({ open: false });

  const handleDeleteFile = async () => {
    if (attachments.length > 0) {
      axiosInstance()
        .put('attachment/deletemany', { ids: attachments.map((attachment) => attachment._id) })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          onSuccess?.();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };
  const isDeleteRequestSent = useMemo(() => attachments?.some((attachment) => !isEmpty(attachment?.deleteRequest)), [attachments]);
  const allAttachmentsAreFromUser = useMemo(
    () => attachments?.every((attachment) => attachment?.createdBy?.user?._id === user?._id),
    [attachments, user]
  );

  if (!permissions['attachment']?.isDelete) return null;

  return (
    <>
      <HtmlTooltip
        title={
          allAttachmentsAreFromUser
            ? 'Delete'
            : isDeleteRequestSent
              ? `Delete request already sent to ${attachments.map((attachment) => attachment?.createdBy?.user?.concatedName).join(', ')}`
              : 'Delete Request'
        }
        placement="top"
        arrow
      >
        {React.createElement(
          element,
          {
            size: 'small',
            color: 'error',
            disabled: allAttachmentsAreFromUser ? false : isDeleteRequestSent ? true : false,
            ...props,
            onClick: (e: any) => {
              e.stopPropagation();
              onClick?.(e);
              if (allAttachmentsAreFromUser) {
                setShowDeleteConfirmBox({ open: true });
              } else {
                setDeleteRequestDialog({ open: true });
              }
            }
          },
          children
        )}
      </HtmlTooltip>
      {showDeleteConfirmBox.open && (
        <ConfirmationDialog
          open={showDeleteConfirmBox.open}
          message={`Are you sure you want to delete ${attachments.map((attachment) => attachment.name).join(', ')}?`}
          onClose={() => {
            setShowDeleteConfirmBox({ open: false });
          }}
          onOk={() => {
            handleDeleteFile();
            setShowDeleteConfirmBox({ open: false });
          }}
        />
      )}
      {deleteRequestDialog.open && (
        <DeleteRequestDialog
          onClose={() => setDeleteRequestDialog({ open: false })}
          files={attachments}
          onSuccess={() => {
            onSuccess?.();
            setDeleteRequestDialog({ open: false });
          }}
        />
      )}
    </>
  );
};

export default AttachmentDeleteButton;
