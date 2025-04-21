import { memo } from 'react';
import { SingleButtonOption } from 'src/pages/WorkOrder/Diagram/ImageEditor/LeftSidebar';
import Crop from 'src/pages/WorkOrder/Diagram/ImageEditor/SubMenu/Crop';
import DrawLine from 'src/pages/WorkOrder/Diagram/ImageEditor/SubMenu/DrawLine';
import Flip from 'src/pages/WorkOrder/Diagram/ImageEditor/SubMenu/Flip';
import Rotate from 'src/pages/WorkOrder/Diagram/ImageEditor/SubMenu/Rotate';
import Shape from 'src/pages/WorkOrder/Diagram/ImageEditor/SubMenu/Shape';
import TUIImageEditor from 'tui-image-editor';

export const subMenuHelperTextClassName = '!text-xs !font-light';
export const subMenuButtonClassname =
  'rounded-md p-2 hover:bg-new-theme-color/10 [&>svg]:size-6 text-center [&>svg]:mx-auto data-[active="true"]:bg-theme data-[active="true"]:text-white w-fit min-w-[65px]';
type SubMenuPorps = {
  activeMenu: SingleButtonOption;
  imageEditor: TUIImageEditor;
  hideMenu: () => void;
};

export type SubmenuItemProps = {
  imageEditor: TUIImageEditor;
  hideMenu: () => void;
};

const Submenu = memo(({ activeMenu, imageEditor, hideMenu }: SubMenuPorps) => {
  switch (activeMenu.type) {
    case 'crop':
      return <Crop hideMenu={hideMenu} imageEditor={imageEditor} />;
    case 'flip':
      return <Flip hideMenu={hideMenu} imageEditor={imageEditor} />;
    case 'rotate':
      return <Rotate imageEditor={imageEditor} hideMenu={hideMenu} />;
    case 'drawLine':
      return <DrawLine imageEditor={imageEditor} hideMenu={hideMenu} />;
    case 'shape':
      return <Shape imageEditor={imageEditor} hideMenu={hideMenu} />;
    default:
      return null;
  }
});

export default Submenu;
