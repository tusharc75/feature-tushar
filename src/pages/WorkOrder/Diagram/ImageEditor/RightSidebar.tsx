import RightSideButtons from 'src/pages/WorkOrder/Diagram/ImageEditor/RightSideButtons';
import TUIImageEditor from 'tui-image-editor';

type RightSidebarPorps = {
  imageEditor: TUIImageEditor;
};

const RightSidebar = ({ imageEditor }: RightSidebarPorps) => {
  return (
    <div className="pointer-events-none absolute bottom-0 right-1 top-0 flex h-full w-0 items-center justify-end">
      <div className="pointer-events-auto w-fit min-w-[55px] rounded-[55px] border  bg-[--dark-secondary,white] px-2 py-4">
        <ul className="flex list-none flex-col items-center justify-center space-y-2">
          <RightSideButtons imageEditor={imageEditor} />
        </ul>
      </div>
    </div>
  );
};

export default RightSidebar;
