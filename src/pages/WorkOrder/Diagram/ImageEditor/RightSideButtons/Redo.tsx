import { Redo as RedoIcon } from '@mui/icons-material';
import { useCallback } from 'react';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import RippleButton from 'src/components/RippleButton';
import { cn } from 'src/constants/helpers';
import { useEditorStore } from 'src/pages/WorkOrder/Diagram/ImageEditor/EditorStore';
import { RightSideButtonsProps } from 'src/pages/WorkOrder/Diagram/ImageEditor/RightSideButtons';

const Redo = ({ imageEditor }: RightSideButtonsProps) => {
  const [redoStackLength] = useEditorStore((state) => state.redoStackLength);

  const handleRedo = useCallback(() => {
    imageEditor.discardSelection();
    imageEditor.redo();
  }, [imageEditor]);

  return (
    <li>
      <HtmlTooltip title={'Redo'} placement="right">
        <RippleButton
          onClick={handleRedo}
          disabled={redoStackLength === 0}
          className={cn('flex h-[35px] w-[35px] items-center justify-center rounded-md ', redoStackLength === 0 ? '' : 'hover:bg-theme/20')}
        >
          <RedoIcon fontSize="small" />
        </RippleButton>
      </HtmlTooltip>
    </li>
  );
};

export default Redo;
