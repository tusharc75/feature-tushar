import { BorderColorOutlined, Close, Crop, Flip, GradeOutlined, Loop, Tune } from '@mui/icons-material';
import { IconButton } from '@mui/material';
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
  //! Need to implement
  // {
  //   type: 'icon',
  //   icon: <GradeOutlined />,
  //   text: 'Icon'
  // },
  {
    type: 'text',
    icon: <PiTextAa size={22} />,
    text: 'Text'
  },
  {
    type: 'mask',
    icon: <RxMaskOff size={20} />,
    text: 'Mask'
  }
  //! Need to implement
  // {
  //   type: 'filter',
  //   icon: <Tune />,
  //   text: 'Filter'
  // }
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
    <div className="absolute bottom-0 left-0 top-0 flex items-center border-r border-t bg-[--dark-primary,white] px-2 text-center">
      <ul className="flex-grow list-none space-y-2 overflow-y-auto overflow-x-hidden ">
        {buttonMaps.map((item) => (
          <SingleMenuItem item={item} showMenu={showMenu} key={item.type} activeButton={activeButton} />
        ))}
      </ul>
      <div
        className={cn(
          'absolute -top-[1px] bottom-0 left-[60px] h-full overflow-hidden transition-all duration-200',
          activeButton ? 'w-[300px]' : 'w-0'
        )}
      >
        <div className="dark:bg-darkPrimary/60 absolute inset-0 flex w-[300px] flex-col border bg-white/70 [backdrop-filter:blur(4px)] ">
          {activeButton && (
            <>
              <nav className="flex items-center justify-between border-b px-1 py-2">
                <h6 className="ml-2 text-base font-semibold">{activeButton?.text}</h6>
                <IconButton size="small" sx={{ borderRadius: '4px' }} onClick={hideMenu}>
                  <Close />
                </IconButton>
              </nav>
              <main className="flex w-full flex-grow items-center justify-center">
                <div className="w-full p-4">
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
    return (
      <li aria-label={item.text} className="list-none">
        <HtmlTooltip title={item.text} placement="right">
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
