import { SingleButtonOption } from 'src/pages/WorkOrder/Diagram/ImageEditor/LeftSidebar';
import TUIImageEditor from 'tui-image-editor';

export const handleSetImageEditorMode = (option: SingleButtonOption, imageEditor: TUIImageEditor) => {
  switch (option.type) {
    case 'flip':
      imageEditor.stopDrawingMode();
      break;
    case 'crop':
      imageEditor.startDrawingMode('CROPPER');
      break;
    case 'rotate':
      imageEditor.stopDrawingMode();
      break;
    case 'drawLine':
      imageEditor.stopDrawingMode();
      break;
    case 'shape': {
      imageEditor.stopDrawingMode();

      break;
    }

    default:
      break;
  }
};

export function hexToRGBa(hex: string, alpha: number) {
  var r = parseInt(hex.slice(1, 3), 16);
  var g = parseInt(hex.slice(3, 5), 16);
  var b = parseInt(hex.slice(5, 7), 16);
  var a = alpha || 1;
  return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
}

export const isValidHexColor = (color: string): boolean => {
  const hexColorRegex = /^#([A-Fa-f0-9]{6})$/;
  return hexColorRegex.test(color);
};
