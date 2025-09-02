import { useState, useEffect, useContext } from 'react';
import { Box, IconButton } from '@mui/material';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import RefreshIcon from '@mui/icons-material/Refresh';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { displayDateTime } from 'src/constants/helpers';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { useData } from 'src/StateProvider/Provider';
import AddCommentDialog from 'src/pages/SupportTicket/AddCommentDialog';
import AttachmentThumbnail from 'src/components/AttachmentThumbnail';
import AddIcon from '@mui/icons-material/Add';

const Comments = ({ uniqueId, supportTicketData }) => {
  const toastConfig = useContext(CustomToastContext);
  const [data, setData] = useState(null);
  const {
    state: { permissions },
  }: any = useData();

  const [showAddCommentDialog, setShowAddCommentDialog] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setData(null);
    let url = `${routes.supportTicket.path}/${uniqueId}/comment`;
    axiosInstance()
      .get(url)
      .then(({ data: { data } }) => {
        if (data && data?.length) {
          setData(data);
        } else {
          setData([]);
        }
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };


  return (
    <div className="relative">
      <div className='my-4'>
        {permissions?.brandSupportTickets?.isUpdate &&
          <ThemeButton
            buttonType='theme'
            onClick={() => setShowAddCommentDialog(true)}
            startIcon={<AddIcon fontSize='small' />}
          >
            Add
          </ThemeButton>
        }
        <span className="absolute right-0 top-0 z-[1] flex size-[40px] items-center justify-center">
          <HtmlTooltip title={'Refresh'}>
            <IconButton size="small" onClick={() => fetchData()}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </HtmlTooltip>
        </span>
      </div>
      {data ? (<>
        <div className="[scrollbar-gutter: stable] relative mb-2 max-h-[calc(100vh-250px)] min-h-[300px] space-y-2 overflow-y-auto ">
          {data.length > 0 ? (
            data.map((item: any) => (
              <div key={item._id} className="rounded-md border p-2">
                <p className="mb-2 flex flex-wrap gap-[10px] text-[13px] text-[var(--primary-text)] ">
                  <span className="font-semibold">{item?.user?.optionLabel}</span>
                  <span className="ml-2 text-[#969696] dark:text-gray-400">{displayDateTime(item.date)}</span>
                </p>
                <div className="max-image [&_*:last-child]:mb-0"
                  dangerouslySetInnerHTML={{
                    __html: item?.comment
                  }}
                />
                {item?.attachments && item.attachments.length > 0 && (
                  <div className='mt-3'>
                    <AttachmentThumbnail
                      attachments={item.attachments}
                      handleDeleteAttachment={() => { }}
                      allowedToEdit={false}
                    />
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="absolute left-1/2 top-1/2 select-none text-gray-500 [transform:translate(-50%,-50%)]">There are no comments yet</div>
          )}
        </div>
        {showAddCommentDialog && (
          <AddCommentDialog
            onClose={() => setShowAddCommentDialog(false)}
            uniqueId={uniqueId}
            supportTicketData={supportTicketData}
            fetchData={fetchData}
          />
        )
        }
      </>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </div>
  );
};
export default Comments;
