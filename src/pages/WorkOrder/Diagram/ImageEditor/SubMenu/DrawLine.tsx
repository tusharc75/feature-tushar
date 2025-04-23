import { memo, useEffect, useState } from 'react';
import { TbWriting } from 'react-icons/tb';
import { TfiLayoutLineSolid } from 'react-icons/tfi';
import RippleButton from 'src/components/RippleButton';
import { subMenuButtonClassname, subMenuHelperTextClassName, SubmenuItemProps } from 'src/pages/WorkOrder/Diagram/ImageEditor/SubMenu';
import ColorPicker from 'src/pages/WorkOrder/Diagram/ImageEditor/SubMenu/ColorPicker';
import RangeInput from 'src/pages/WorkOrder/Diagram/ImageEditor/SubMenu/RangeInput';
import { hexToRGBa } from 'src/pages/WorkOrder/Diagram/ImageEditor/utils';

type Mode = 'FREE_DRAWING' | 'LINE_DRAWING';

let timeout: NodeJS.Timeout;
const minBrushSize = 5;
const maxBrushSize = 50;

const DrawLine = memo(({ hideMenu, imageEditor }: SubmenuItemProps) => {
  const [mode, setMode] = useState<Mode>('FREE_DRAWING');
  const [brushSetting, setBrushSetting] = useState({ width: 10, color: '#000000', opacity: 85 });

  useEffect(() => {
    timeout = setTimeout(() => {
      const color = hexToRGBa(brushSetting.color, brushSetting.opacity / 100);
      imageEditor.stopDrawingMode();
      imageEditor.startDrawingMode(mode, { ...brushSetting, color });
    }, 100);
    return () => {
      clearTimeout(timeout);
    };
  }, [brushSetting, mode, imageEditor]);

  return (
    <>
      <ul className=" mb-3 flex list-none justify-center gap-3 border-b pb-3">
        <li>
          <RippleButton onClick={() => setMode('FREE_DRAWING')} className={subMenuButtonClassname} data-active={mode === 'FREE_DRAWING'}>
            <TbWriting />
            <p className={subMenuHelperTextClassName}>Free</p>
          </RippleButton>
        </li>
        <li>
          <RippleButton onClick={() => setMode('LINE_DRAWING')} className={subMenuButtonClassname} data-active={mode === 'LINE_DRAWING'}>
            <TfiLayoutLineSolid />
            <p className={subMenuHelperTextClassName}>Straight</p>
          </RippleButton>
        </li>
      </ul>
      <div className="mb-3 border-b pb-3">
        <ColorPicker
          label={'Brush color'}
          setOpacity={(opacity) => setBrushSetting((prev) => ({ ...prev, opacity }))}
          opacity={brushSetting.opacity}
          color={brushSetting.color}
          setColor={(color) => setBrushSetting((prev) => ({ ...prev, color }))}
        />
      </div>

      <div className="mb-3 pb-3">
        <RangeInput
          min={minBrushSize}
          max={maxBrushSize}
          label="Brush Size"
          onChange={(width) => setBrushSetting((prev) => ({ ...prev, width }))}
          value={brushSetting.width}
        />
      </div>
    </>
  );
});

export default DrawLine;
