import React from 'react';
import DeleteActiveLayer from 'src/pages/WorkOrder/Diagram/ImageEditor/RightSideButtons/DeleteActiveLayer';
import DeleteAllLayers from 'src/pages/WorkOrder/Diagram/ImageEditor/RightSideButtons/DeleteAllLayers';
import Redo from 'src/pages/WorkOrder/Diagram/ImageEditor/RightSideButtons/Redo';
import Undo from 'src/pages/WorkOrder/Diagram/ImageEditor/RightSideButtons/Undo';
// import Zoom from 'src/pages/WorkOrder/Diagram/ImageEditor/RightSideButtons/Zoom';
import TUIImageEditor from 'tui-image-editor';

export type RightSideButtonsProps = {
  imageEditor: TUIImageEditor;
};

const RightSideButtons = ({ imageEditor }: RightSideButtonsProps) => {
  return (
    <>
      {/* <Zoom imageEditor={imageEditor} /> */}
      <Undo imageEditor={imageEditor} />
      <Redo imageEditor={imageEditor} />
      <DeleteActiveLayer imageEditor={imageEditor} />
      <DeleteAllLayers imageEditor={imageEditor} />
    </>
  );
};

export default RightSideButtons;
