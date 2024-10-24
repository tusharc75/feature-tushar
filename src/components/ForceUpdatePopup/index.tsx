import { Dialog } from '@material-ui/core';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { UpdateIllustration } from 'src/assets/svg/Illustrations';

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
          className: 'relative w-[min(552px,100%)] text-center',
          style: { margin: 0, borderRadius: '25px', overflow: 'initial' }
        }}
        BackdropProps={{
          style: {
            backdropFilter: 'blur(10px)'
          }
        }}
      >
        <div className="relative isolate h-[544px]">
          <UpdateIllustration className="relative -top-[72px] mb-[18px]" />
          <div className="relative -top-[72px] mx-auto max-w-[406px] p-[8px] pt-0">
            <h4 className="mb-[30px] text-[24px] font-bold leading-[29px] text-[var(--primary)] dark:text-[white]">New Update Available</h4>
            <p className="mb-[51px] max-h-[200px] min-h-[90px] overflow-y-auto overflow-x-hidden text-[20px] font-medium leading-[30px] text-[#777575] dark:text-gray-400">
              {data?.comment}
            </p>
            <ThemeButton
              onClick={onClose}
              iconForMobile={false}
              color="primary"
              borderColor="none"
              fullWidth
              style={{ padding: '9px 10px', borderRadius: '10px', maxWidth: '204px', fontSize: '20px', fontWeight: '600' }}
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
