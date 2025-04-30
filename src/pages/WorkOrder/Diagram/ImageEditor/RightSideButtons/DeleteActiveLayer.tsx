import { LuLayers2 } from 'react-icons/lu';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import RippleButton from 'src/components/RippleButton';
import { cn } from 'src/constants/helpers';
import { useEditorStore } from 'src/pages/WorkOrder/Diagram/ImageEditor/EditorStore';
import { RightSideButtonsProps } from 'src/pages/WorkOrder/Diagram/ImageEditor/RightSideButtons';

const DeleteActiveLayer = ({ imageEditor }: RightSideButtonsProps) => {
  const [activeObjectId] = useEditorStore((state) => state.activeObjectId);

  return (
    <li>
      <HtmlTooltip title={'Remove active layer'} placement="right">
        <RippleButton
          disabled={!activeObjectId}
          onClick={() => {
            imageEditor.discardSelection();
            imageEditor.removeObject(activeObjectId);
          }}
          className={cn('flex h-[35px] w-[35px] items-center justify-center rounded-md hover:bg-theme/20 ')}
        >
          <LuLayers2 size={18} />
        </RippleButton>
      </HtmlTooltip>
    </li>
  );
};

export default DeleteActiveLayer;
