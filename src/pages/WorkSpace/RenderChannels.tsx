import { IconButton } from '@material-ui/core';
import { ArrowBackIos, ArrowForwardIos, DeleteOutline } from '@material-ui/icons';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { ButtonType, ThemeButton } from 'src/components/Helpers/Buttons';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

export type ChannelButtons = { visible: boolean; id: string | number } & ButtonType;

type RenderChannelsProps = {
  isColapsed: boolean;
  channels: any;
  handleColapse: () => void;
  setSelectedChannel: any;
  isMobile: boolean;
  setShowConfirmBox: (data: boolean) => void;
  channelButtons: ChannelButtons[]
};

const RenderChannels = ({
  isColapsed,
  channels,
  handleColapse,
  setSelectedChannel,
  isMobile,
  setShowConfirmBox,
  channelButtons
}: RenderChannelsProps) => {

  return (
    <>
      <div className={`${isMobile ? 'p-3' : 'container-with-border p-[20px]'}`}>
        <>
          <div className={`mb-1 gap-2 flex flex-wrap ${isColapsed ? 'justify-around' : 'justify-end'} mb-3 items-center`}>
            {isColapsed ? null : <h6 className="mr-auto text-[16px]">Channels</h6>}
            <IconButton size={'small'} onClick={handleColapse}>
              {isColapsed ? <ArrowForwardIos /> : <ArrowBackIos />}
              {channelButtons?.map(({ id, children, visible, ...rest }) => {
                if (!visible) return null;
                return (
                  <ThemeButton key={id} {...rest} className={isColapsed ? 'hidden' : ''}>
                    {children}
                  </ThemeButton>
                );
              })}
            </IconButton>
          </div>
          <div >
            {channels ? channels?.map((data, index) => {
              return (
                <div
                  key={data._id}
                  className={`duration-300 transition-all ${isMobile ? 'p-2 rounded-md' : 'px-3 py-[14px] first-of-type:[border-radius:5px_5px_0_0] last-of-type:[border-radius:0_0_5px_5px]'
                    } min-w-[var(--tab-size)] max-w-[var(--tab-size)]`}
                  onClick={() => {
                    setSelectedChannel(data);
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`flex items-center relative gap-2 ${isColapsed ? 'hidden' : ''}`}>
                      <HtmlTooltip enterTouchDelay={0} placement="top" arrow title={isMobile ? data?.title : ''}>
                        <h6 className="text-[16px] font-semibold line-clamp-1 min-w-0">{data?.title}</h6>
                      </HtmlTooltip>
                    </div>

                    {!isColapsed && (
                      <>
                        <div className="flex items-center gap-1 flex-grow justify-end">
                          <HtmlTooltip enterTouchDelay={0} title="Delete" placement="top" arrow>
                            <IconButton
                              size="small"
                              color="inherit"
                              style={{ color: 'red', marginTop: '3px' }}
                              aria-label="delete"
                              onClick={() => {
                                setShowConfirmBox(true);
                              }}
                            >
                              <DeleteOutline style={{ fontSize: '18px' }} />
                            </IconButton>
                          </HtmlTooltip>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )
            }) : <>
              <CommonSkeleton lenArray={[...Array(1).keys()]} />
            </>
            }
          </div>
        </>
      </div>
    </>
  );
};

export default RenderChannels;
