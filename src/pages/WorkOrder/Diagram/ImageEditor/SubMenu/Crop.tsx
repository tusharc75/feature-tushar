import { Check, Close } from '@mui/icons-material';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { SubmenuItemProps } from 'src/pages/WorkOrder/Diagram/ImageEditor/SubMenu';

const Crop = ({ hideMenu, imageEditor }: SubmenuItemProps) => {
  return (
    <div className="flex justify-center gap-2">
      <ThemeButton onClick={() => imageEditor.crop(imageEditor.getCropzoneRect())} startIcon={<Check />}>
        Apply
      </ThemeButton>
      <ThemeButton
        onClick={() => {
          imageEditor.stopDrawingMode();
          hideMenu();
        }}
        startIcon={<Close />}
      >
        Cancel
      </ThemeButton>
    </div>
  );
};

export default Crop;
