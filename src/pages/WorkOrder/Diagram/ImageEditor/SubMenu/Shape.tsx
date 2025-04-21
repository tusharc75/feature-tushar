import { memo, useEffect, useState } from 'react';
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
  shape: 'rect' | 'circle' | 'triangle';
  fill: string | null;
  stroke: string;
  strokeWidth: number;
  pixelate: boolean;
};

const minStrokeWidth = 1,
  maxStrokeWidth = 300;

const Shape = memo(({ hideMenu, imageEditor }: SubmenuItemProps) => {
  const [data, setData] = useState<Data>({ shape: 'rect', fill: null, stroke: '#000000', strokeWidth: 3, pixelate: false });
  const [activeObject] = useEditorStore((state) => state.activeObject);

  useEffect(() => {
    if (imageEditor.getDrawingMode() !== 'SHAPE') {
      imageEditor.stopDrawingMode();
      imageEditor.startDrawingMode('SHAPE', { width: data.strokeWidth, color: data.stroke });
    }
  }, []);

  useEffect(() => {
    imageEditor.setDrawingShape(data.shape, {
      stroke: data.stroke,
      fill: data.fill ? data.fill : 'transparent',
      strokeWidth: data.strokeWidth
    });
  }, [data.shape]);

  useEffect(() => {
    if (activeObject) {
      imageEditor.changeShape(activeObject, {
        stroke: data.stroke,
        fill: data.fill ? data.fill : 'transparent',
        strokeWidth: data.strokeWidth
      });
    }
  }, [data, imageEditor, activeObject]);

  return (
    <>
      <ul className=" mb-3 flex list-none justify-center gap-3 border-b pb-3">
        <li>
          <RippleButton
            onClick={() => setData((prev) => ({ ...prev, shape: 'rect' }))}
            className={subMenuButtonClassname}
            data-active={data.shape === 'rect'}
          >
            <MdOutlineRectangle />
            <p className={subMenuHelperTextClassName}>Rectangle</p>
          </RippleButton>
        </li>
        <li>
          <RippleButton
            onClick={() => setData((prev) => ({ ...prev, shape: 'circle' }))}
            className={subMenuButtonClassname}
            data-active={data.shape === 'circle'}
          >
            <GoCircle />
            <p className={subMenuHelperTextClassName}>Circle</p>
          </RippleButton>
        </li>
        <li>
          <RippleButton
            onClick={() => setData((prev) => ({ ...prev, shape: 'triangle' }))}
            className={subMenuButtonClassname}
            data-active={data.shape === 'triangle'}
          >
            <IoTriangleOutline />
            <p className={subMenuHelperTextClassName}>Triangle</p>
          </RippleButton>
        </li>
      </ul>
      <div className="mb-3 flex items-center justify-center gap-2 border-b pb-3">
        <ColorPicker color={data.fill} setColor={(fill) => setData((prev) => ({ ...prev, fill }))} label="Fill" canColorBeEmpty={true} />
        <ColorPicker color={data.stroke} setColor={(stroke) => setData((prev) => ({ ...prev, stroke }))} label="Stroke" />
      </div>

      <div className="mb-3 gap-2 border-b pb-3">
        <RangeInput
          min={minStrokeWidth}
          max={maxStrokeWidth}
          label="Stroke"
          onChange={(strokeWidth) => setData((prev) => ({ ...prev, strokeWidth }))}
          value={data.strokeWidth}
          inputProps={{
            onChange: (e) => {
              const newValue = e.target.value === '' ? minStrokeWidth : Number(e.target.value);
              setData((prev) => ({ ...prev, strokeWidth: newValue }));
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
