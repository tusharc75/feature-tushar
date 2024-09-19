import { Dialog } from '@material-ui/core';
import bgImage from 'src/assets/svg/home/force_update_cover.jpg';
import { ThemeButton } from 'src/components/Helpers/Buttons';

type ForceUpdatePopupProps = {
  onClose: () => void;
  data: any;
};

const ForceUpdatePopup = ({ onClose, data }: ForceUpdatePopupProps) => {
  return (
    <div>
      <Dialog
        open={true}
        PaperProps={{
          className: 'relative ',
          style: { margin: 10, background: 'white', borderRadius: '6px' }
        }}
        BackdropProps={{
          style: {
            backdropFilter: 'blur(10px)'
          }
        }}
      >
        <div className="relative isolate flex min-h-[530px] items-end overflow-hidden bg-cover">
          <img src={bgImage} alt="" className=" absolute inset-0 -z-[1] w-full bg-cover" />
          <div className=" mx-auto w-full max-w-[442px] px-8 py-8 text-center">
            <h4 className="mb-3 text-[20px] leading-[1.5] text-[var(--primary)]">New update is available</h4>
            {data?.comment &&
              <p className="mb-3 leading-[1.5] text-gray-500">
                {data?.comment}
              </p>
            }
            <ThemeButton
              onClick={onClose}
              iconForMobile={false}
              color="primary"
              borderColor="none"
              fullWidth
              style={{ padding: '9px 10px', borderRadius: '6px' }}
            >
              Update Now
            </ThemeButton>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default ForceUpdatePopup;
