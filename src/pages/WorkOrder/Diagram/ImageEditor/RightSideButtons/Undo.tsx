import { Undo as UndoIcon } from '@mui/icons-material';
import { useCallback } from 'react';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import RippleButton from 'src/components/RippleButton';
import { cn } from 'src/constants/helpers';
import { useEditorStore } from 'src/pages/WorkOrder/Diagram/ImageEditor/EditorStore';
import { RightSideButtonsProps } from 'src/pages/WorkOrder/Diagram/ImageEditor/RightSideButtons';

const Undo = ({ imageEditor }: RightSideButtonsProps) => {
  const [undoStackLength] = useEditorStore((state) => state.undoStackLength);

  const handleUndo = useCallback(() => {
    imageEditor.discardSelection();
    imageEditor.undo();
  }, [imageEditor]);

  return (
    <li>
      <HtmlTooltip title={'Undo'} placement="right">
        <RippleButton
          disabled={undoStackLength === 0}
          onClick={handleUndo}
          className={cn('flex h-[35px] w-[35px] items-center justify-center rounded-md  ', undoStackLength === 0 ? '' : 'hover:bg-theme/20')}
        >
          <UndoIcon fontSize="small" color="inherit" />
        </RippleButton>
      </HtmlTooltip>
    </li>
  );
};

export default Undo;
