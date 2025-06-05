import { BorderColorOutlined, Close, Crop, Flip, GradeOutlined, Loop, Tune } from '@mui/icons-material';
import { IconButton, useMediaQuery } from '@mui/material';
import { memo, useEffect, useState } from 'react';
import { LuShapes } from 'react-icons/lu';
import { PiTextAa } from 'react-icons/pi';
import { RxMaskOff } from 'react-icons/rx';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import RippleButton from 'src/components/RippleButton';
import { cn } from 'src/constants/helpers';
import { useEditorStore } from 'src/pages/WorkOrder/Diagram/ImageEditor/EditorStore';
import Submenu from 'src/pages/WorkOrder/Diagram/ImageEditor/SubMenu';
import { handleSetImageEditorMode } from 'src/pages/WorkOrder/Diagram/ImageEditor/utils';
import TUIImageEditor from 'tui-image-editor';

type LeftSidebarPorps = {
  imageEditor: TUIImageEditor;
};

const buttonMaps = [
  {
    type: 'crop',
    icon: <Crop />,
    text: 'Crop'
  },
  {
    type: 'flip',
    icon: <Flip />,
    text: 'Flip'
  },
  {
    type: 'rotate',
    icon: <Loop />,
    text: 'Rotate'
  },
  {
    type: 'drawLine',
    icon: <BorderColorOutlined />,
    text: 'Draw Line'
  },
  {
    type: 'shape',
    icon: <LuShapes size={24} />,
    text: 'Shape'
  },
  {
    type: 'icon',
    icon: <GradeOutlined />,
    text: 'Icon'
  },
  {
    type: 'text',
    icon: <PiTextAa size={22} />,
    text: 'Text'
  },
  {
    type: 'mask',
    icon: <RxMaskOff size={20} />,
    text: 'Mask'
  },
  {
    type: 'filter',
    icon: <Tune />,
    text: 'Filter'
  }
] as const;

export type SingleButtonOption = (typeof buttonMaps)[number];

const LeftSidebar = ({ imageEditor }: LeftSidebarPorps) => {
  const [activeButton, setActiveButton] = useState<SingleButtonOption | null>(null);
  const [currentSelectedShapeType] = useEditorStore((state) => state.currentSelectedShapeType);

  const showMenu = (type: SingleButtonOption) => {
    handleSetImageEditorMode(type, imageEditor);
    setActiveButton(type);
  };
  const hideMenu = () => {
    imageEditor.stopDrawingMode();
    setActiveButton(null);
  };

  useEffect(() => {
    if (currentSelectedShapeType === 'i-text') {
      imageEditor.stopDrawingMode();
      setActiveButton(buttonMaps.find((d) => d.type === 'text'));
    }
    if (['rect', 'circle', 'triangle'].includes(currentSelectedShapeType)) {
      imageEditor.stopDrawingMode();
      setActiveButton(buttonMaps.find((d) => d.type === 'shape'));
    }
  }, [currentSelectedShapeType]);

  return (
    <div className="flex w-full items-center border-r border-t bg-[--dark-primary,white] px-2 text-center max-md:h-[64px] max-md:overflow-x-auto max-md:overflow-y-hidden md:-order-1 md:w-[64px] md:overflow-x-hidden">
      <ul className="list-none items-center justify-center max-md:flex max-md:space-x-2 md:space-y-2 md:overflow-y-auto md:overflow-x-hidden ">
        {buttonMaps.map((item) => (
          <SingleMenuItem item={item} showMenu={showMenu} key={item.type} activeButton={activeButton} />
        ))}
      </ul>
      <div
        className={cn(
          'absolute bottom-0 overflow-hidden transition-all duration-200 max-md:bottom-[57px] max-md:left-0 max-md:w-[min(300px,100%)] md:-top-[1px] md:left-[60px] md:h-full',
          activeButton ? '[--mobile-h:250px] max-md:h-[--mobile-h] md:w-[300px]' : 'max-md:h-0 md:w-0'
        )}
      >
        <div className="absolute inset-0 flex flex-col border bg-white/95 [backdrop-filter:blur(4px)] dark:bg-darkPrimary/80 max-md:w-[min(300px,100%)] md:w-[300px]">
          {activeButton && (
            <>
              <nav className="flex items-center justify-between border-b px-1 py-2">
                <h6 className="ml-2 text-base font-semibold">{activeButton?.text}</h6>
                <IconButton size="small" sx={{ borderRadius: '4px' }} onClick={hideMenu}>
                  <Close />
                </IconButton>
              </nav>
              <main className="flex w-full flex-grow items-center justify-center ">
                <div className="w-full flex-grow overflow-y-auto p-4 max-md:max-h-[calc(var(--mobile-h)-51px)]">
                  <Submenu activeMenu={activeButton} imageEditor={imageEditor} hideMenu={hideMenu} />
                </div>
              </main>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeftSidebar;

const SingleMenuItem = memo(
  ({
    item,
    showMenu,
    activeButton
  }: {
    item: SingleButtonOption;
    showMenu: (data: SingleButtonOption) => void;
    activeButton: SingleButtonOption;
  }) => {
    const isMobile = useMediaQuery('(max-width:768px)');
    return (
      <li aria-label={item.text} className="flex-shrink-0 list-none">
        <HtmlTooltip title={item.text} placement={isMobile ? 'top' : 'right'}>
          <RippleButton
            className={cn(
              'flex h-[44px] w-[44px] items-center justify-center rounded-md',
              activeButton?.type === item.type ? 'bg-theme text-[white]' : 'hover:bg-theme/15'
            )}
            onClick={() => showMenu(item)}
          >
            {item.icon}
          </RippleButton>
        </HtmlTooltip>
      </li>
    );
  }
);
