import { SingleButtonOption } from 'src/pages/WorkOrder/Diagram/ImageEditor/LeftSidebar';
import TUIImageEditor from 'tui-image-editor';
import ReactDOMServer from 'react-dom/server';

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

export function polygonToPath(polygonString: string, width: number = 50, height: number = 50): string {
  const points = polygonString
    .trim()
    .split(/\s+|,/)
    .map((val, i) => {
      // Convert percentage values to absolute pixel values
      if (val.includes('%')) {
        const num = parseFloat(val) / 100;
        return i % 2 === 0 ? num * width : num * height;
      }
      return parseFloat(val);
    });

  if (points.length < 4) {
    throw new Error('Invalid polygon input. At least two points required.');
  }
  const [x0, y0, ...restPoints] = points;
  let pathData = `M${x0},${y0} L${restPoints.join(' ')}`;
  return pathData + ' Z'; // Close the shape
}

export function scalePath(pathData: string, widthFactor: number, heightFactor: number): string {
  return pathData.replace(/(-?\d+(\.\d+)?)/g, (match, num) => {
    const value = parseFloat(num);
    const isXCoordinate = pathData.indexOf(match) % 2 === 0; // Assume alternating x/y pairs
    return (isXCoordinate ? value * widthFactor : value * heightFactor).toString();
  });
}

export const getIconPath = (icon: React.ReactElement) => {
  if (!icon) return;
  const svgString = ReactDOMServer.renderToStaticMarkup(icon);
  const div = document.createElement('div');
  div.innerHTML = svgString;
  const path = div.querySelector('path');
  if (path) {
    const d = path.getAttribute('d');
    if (!d) return;
    return d;
  }
  return null;
};
