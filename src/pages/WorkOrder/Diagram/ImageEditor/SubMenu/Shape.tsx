import { memo, useEffect, useRef, useState } from 'react';
import { GoCircle } from 'react-icons/go';
import { IoTriangleOutline } from 'react-icons/io5';
import { MdOutlineRectangle } from 'react-icons/md';
import RippleButton from 'src/components/RippleButton';
import { useEditorStore } from 'src/pages/WorkOrder/Diagram/ImageEditor/EditorStore';
import { subMenuButtonClassname, subMenuHelperTextClassName, SubmenuItemProps } from 'src/pages/WorkOrder/Diagram/ImageEditor/SubMenu';
import ColorPicker from 'src/pages/WorkOrder/Diagram/ImageEditor/SubMenu/ColorPicker';
import RangeInput from 'src/pages/WorkOrder/Diagram/ImageEditor/SubMenu/RangeInput';

const PIXELATE_FILTER_DEFAULT_VALUE = 20;

type Data = {
  shape: 'rect' | 'circle' | 'triangle' | null;
  fill: string | null;
  stroke: string;
  strokeWidth: number;
  pixelate: boolean;
};

const minStrokeWidth = 1,
  maxStrokeWidth = 300;

const initialState: Data = { shape: null, fill: null, stroke: '#000000', strokeWidth: 3, pixelate: false };

const Shape = memo(({ hideMenu, imageEditor }: SubmenuItemProps) => {
  const [data, setData] = useState<Data>(initialState);
  const [activeObjectId] = useEditorStore((state) => state.activeObjectId);
  const [currentSelectedShapeType] = useEditorStore((state) => state.currentSelectedShapeType);
  const initialRender = useRef(true);

  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }
    if (imageEditor.getDrawingMode() !== 'SHAPE') {
      imageEditor.stopDrawingMode();
      imageEditor.startDrawingMode('SHAPE');
    }
    imageEditor.setDrawingShape(data.shape, { fill: 'transparent', stroke: initialState.stroke, strokeWidth: initialState.strokeWidth });
  }, [data.shape]);

  const hangleChangeShapeStyle = (options?: tuiImageEditor.IShapeOptions) => {
    if (!activeObjectId) return;
    imageEditor.changeShape(activeObjectId, options);
  };

  return (
    <>
      <ul className=" mb-3 flex list-none justify-center gap-3 border-b pb-3">
        <li>
          <RippleButton
            onClick={() =>
              setData((prev) => {
                imageEditor.setDrawingShape('rect', { fill: 'transparent', stroke: initialState.stroke, strokeWidth: initialState.strokeWidth });
                return { ...initialState, shape: 'rect' };
              })
            }
            className={subMenuButtonClassname}
            data-active={data.shape === 'rect'}
          >
            <MdOutlineRectangle />
            <p className={subMenuHelperTextClassName}>Rectangle</p>
          </RippleButton>
        </li>
        <li>
          <RippleButton
            onClick={() =>
              setData((prev) => {
                imageEditor.setDrawingShape('circle', {
                  fill: 'transparent',
                  stroke: initialState.stroke,
                  strokeWidth: initialState.strokeWidth
                });
                return { ...initialState, shape: 'circle' };
              })
            }
            className={subMenuButtonClassname}
            data-active={data.shape === 'circle'}
          >
            <GoCircle />
            <p className={subMenuHelperTextClassName}>Circle</p>
          </RippleButton>
        </li>
        <li>
          <RippleButton
            onClick={() =>
              setData((prev) => {
                imageEditor.setDrawingShape('triangle', {
                  fill: 'transparent',
                  stroke: initialState.stroke,
                  strokeWidth: initialState.strokeWidth
                });
                return { ...initialState, shape: 'triangle' };
              })
            }
            className={subMenuButtonClassname}
            data-active={data.shape === 'triangle'}
          >
            <IoTriangleOutline />
            <p className={subMenuHelperTextClassName}>Triangle</p>
          </RippleButton>
        </li>
      </ul>
      <div className="mb-3 flex items-center justify-center gap-2 border-b pb-3">
        <ColorPicker
          color={data.fill}
          setColor={(fill) =>
            setData((prev) => {
              hangleChangeShapeStyle({ fill: fill ? fill : 'transparent' });
              return { ...prev, fill };
            })
          }
          label="Fill"
          canColorBeEmpty={true}
        />
        <ColorPicker
          color={data.stroke}
          setColor={(stroke) =>
            setData((prev) => {
              hangleChangeShapeStyle({ stroke });
              return { ...prev, stroke };
            })
          }
          label="Stroke"
        />
      </div>

      <div className="mb-3 gap-2 border-b pb-3">
        <RangeInput
          min={minStrokeWidth}
          max={maxStrokeWidth}
          label="Stroke"
          onChange={(strokeWidth) =>
            setData((prev) => {
              hangleChangeShapeStyle({ strokeWidth });
              return { ...prev, strokeWidth };
            })
          }
          value={data.strokeWidth}
          inputProps={{
            onChange: (e) => {
              const newValue = e.target.value === '' ? minStrokeWidth : Number(e.target.value);
              setData((prev) => {
                return { ...prev, strokeWidth: newValue };
              });
            },
            onBlur: () => {
              setData((prev) => {
                let newVal = { ...prev };
                if (prev.strokeWidth > maxStrokeWidth) {
                  newVal.strokeWidth = maxStrokeWidth;
                }
                if (prev.strokeWidth < minStrokeWidth) {
                  newVal.strokeWidth = minStrokeWidth;
                }
                hangleChangeShapeStyle({ strokeWidth: newVal.strokeWidth });
                return newVal;
              });
            }
          }}
        />
      </div>
    </>
  );
});

export default Shape;

// shapeOption = {
//   type: 'filter',
//   filter: [{ pixelate: PIXELATE_FILTER_DEFAULT_VALUE }],
// };
// imageEditor.setDrawingShape(shapeType, shapeOptions);
