import { Redo, Undo, ZoomIn, ZoomOut } from '@mui/icons-material';
import React, { useCallback, useEffect } from 'react';
import { LuLayers2, LuLayers3 } from 'react-icons/lu';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import RippleButton from 'src/components/RippleButton';
import { cn } from 'src/constants/helpers';
import { useEditorStore } from 'src/pages/WorkOrder/Diagram/ImageEditor/EditorStore';
import TUIImageEditor from 'tui-image-editor';

type RightSidebarPorps = {
  imageEditor: TUIImageEditor;
};

const RightSidebar = ({ imageEditor }: RightSidebarPorps) => {
  const [redoStackLength] = useEditorStore((state) => state.redoStackLength);
  const [undoStackLength] = useEditorStore((state) => state.undoStackLength);
  const [activeObjectId] = useEditorStore((state) => state.activeObjectId);

  const handleUndo = useCallback(() => {
    imageEditor.discardSelection();
    imageEditor.undo();
  }, [imageEditor]);

  const handleRedo = useCallback(() => {
    imageEditor.discardSelection();
    imageEditor.redo();
  }, [imageEditor]);

  return (
    <div className="pointer-events-none absolute bottom-0 right-1 top-0 flex h-full w-0 items-center justify-end">
      <div className="pointer-events-auto w-fit min-w-[55px] rounded-[55px] bg-[--dark-secondary,white] px-2 py-4">
        <ul className="flex list-none flex-col items-center justify-center space-y-2">
          {/* <li>
            <HtmlTooltip title={'Zoom in'} placement="right">
              <RippleButton onClick={() => {}} className={cn('flex h-[35px] w-[35px] items-center justify-center rounded-md disabled:text-gray-500 hover:bg-theme/20')}>
                <ZoomIn />
              </RippleButton>
            </HtmlTooltip>
          </li>
          <li>
            <HtmlTooltip title={'Zoom out'} placement="right">
              <RippleButton className={cn('flex h-[35px] w-[35px] items-center justify-center rounded-md disabled:text-gray-500 hover:bg-theme/20')}>
                <ZoomOut />
              </RippleButton>
            </HtmlTooltip>
          </li> */}
          <li>
            <HtmlTooltip title={'Undo'} placement="right">
              <RippleButton
                disabled={undoStackLength === 0}
                onClick={handleUndo}
                className={cn('flex h-[35px] w-[35px] items-center justify-center rounded-md  ', undoStackLength === 0 ? '' : 'hover:bg-theme/20')}
              >
                <Undo fontSize="small" color="inherit" />
              </RippleButton>
            </HtmlTooltip>
          </li>
          <li>
            <HtmlTooltip title={'Redo'} placement="right">
              <RippleButton
                onClick={handleRedo}
                disabled={redoStackLength === 0}
                className={cn('flex h-[35px] w-[35px] items-center justify-center rounded-md ', redoStackLength === 0 ? '' : 'hover:bg-theme/20')}
              >
                <Redo fontSize="small" />
              </RippleButton>
            </HtmlTooltip>
          </li>
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
        </ul>
      </div>
    </div>
  );
};

export default RightSidebar;
