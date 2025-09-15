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
            data.map((item: any) => {
              const isCustomer = item?.sendFrom === "customer";
              return (
                <div key={item._id} className="relative border-b p-2">
                  <div className="flex items-center mb-2">
                    <span
                      className={`h-3 w-3 rounded-full mr-2 ${
                        isCustomer ? "bg-green-500" : "bg-blue-500"
                      }`}
                    ></span>
                    <p className="font-medium mr-2">{item?.user?.optionLabel}</p>
                    {!isCustomer && (
                      <span className="px-2 py-[2px] rounded-md text-xs font-medium bg-blue-100 text-blue-600">
                        Support
                      </span>
                    )}
                    <Box
                      component="span"
                      className="ml-3 text-gray-500"
                      sx={{ fontSize: '0.625rem' }}
                    >
                      {displayDateTime(item.date)}
                    </Box>
                  </div>
                  <div className="ml-5 text-sm text-gray-800 support-ticket-html [&_*:last-child]:mb-0"
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
              )
            })
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
