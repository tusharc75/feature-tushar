import { LuLayers3 } from 'react-icons/lu';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import RippleButton from 'src/components/RippleButton';
import { cn } from 'src/constants/helpers';
import { RightSideButtonsProps } from 'src/pages/WorkOrder/Diagram/ImageEditor/RightSideButtons';

const DeleteAllLayers = ({ imageEditor }: RightSideButtonsProps) => {
  return (
    <li>
      <HtmlTooltip title={'Clear all layers'} placement="right">
        <RippleButton
          onClick={() => {
            imageEditor.discardSelection();
            imageEditor.clearObjects();
          }}
          className={cn('flex h-[35px] w-[35px] items-center justify-center rounded-md hover:bg-theme/20 ')}
        >
          <LuLayers3 size={18} />
        </RippleButton>
      </HtmlTooltip>
    </li>
  );
};

export default DeleteAllLayers;
