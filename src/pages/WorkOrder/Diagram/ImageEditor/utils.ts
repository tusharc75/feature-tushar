import { SingleButtonOption } from 'src/pages/WorkOrder/Diagram/ImageEditor/LeftSidebar';
import TUIImageEditor from 'tui-image-editor';

export const handleSetImageEditorMode = (option: SingleButtonOption, imageEditor: TUIImageEditor) => {
  imageEditor.discardSelection();
  switch (option.type) {
    case 'flip': {
      imageEditor.stopDrawingMode();
      break;
    }
    case 'crop': {
      imageEditor.startDrawingMode('CROPPER');
      break;
    }
    case 'rotate': {
      imageEditor.stopDrawingMode();
      break;
    }
    case 'drawLine': {
      imageEditor.stopDrawingMode();
      break;
    }
    case 'shape': {
      imageEditor.stopDrawingMode();
      if (imageEditor.getDrawingMode() !== 'SHAPE') {
        imageEditor.stopDrawingMode();
        imageEditor.startDrawingMode('SHAPE');
      }
      break;
    }
    case 'text': {
      if (imageEditor.getDrawingMode() !== 'TEXT') {
        imageEditor.stopDrawingMode();
        imageEditor.startDrawingMode('TEXT');
      }
      break;
    }
    case 'filter': {
      imageEditor.stopDrawingMode();
      break;
    }
    case 'mask': {
      imageEditor.stopDrawingMode();
      break;
    }
    default:
      imageEditor.stopDrawingMode();
      break;
  }
};

export function hexToRGBa(hex: string, alpha?: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const a = typeof alpha === 'number' ? alpha : 1;
  return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
}

export const isValidHexColor = (color: string): boolean => {
  const hexColorRegex = /^#([A-Fa-f0-9]{6})$/;
  return hexColorRegex.test(color);
};
