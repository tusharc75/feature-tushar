import { RotateLeft, RotateRight } from '@mui/icons-material';
import { Input, Slider } from '@mui/material';
import React, { memo, useState } from 'react';
import RippleButton from 'src/components/RippleButton';
import { cn } from 'src/constants/helpers';
import { subMenuButtonClassname, subMenuHelperTextClassName, SubmenuItemProps } from 'src/pages/WorkOrder/Diagram/ImageEditor/SubMenu';
import RangeInput from 'src/pages/WorkOrder/Diagram/ImageEditor/SubMenu/RangeInput';

const min = 0;
const max = 360;

const Rotate = memo(({ imageEditor }: SubmenuItemProps) => {
  const [angle, setAngle] = useState(0);

  const handleSetAngle = (angle: number) => {
    imageEditor.rotate(angle);
    setAngle((prev) => {
      let newAngle = (prev + angle) % max; // Ensure it wraps around at 360
      if (newAngle < 0) {
        newAngle += max; // Adjust for negative angles
      }
      return newAngle;
    });
  };

  return (
    <div>
      <ul className=" mb-3 flex list-none justify-center gap-3 border-b pb-3">
        <li>
          <RippleButton onClick={() => handleSetAngle(-90)} className={subMenuButtonClassname}>
            <RotateLeft />
            <p className={subMenuHelperTextClassName}>-90 Deg</p>
          </RippleButton>
        </li>
        <li>
          <RippleButton onClick={() => handleSetAngle(90)} className={subMenuButtonClassname}>
            <RotateRight />
            <p className={subMenuHelperTextClassName}>90 deg</p>
          </RippleButton>
        </li>
      </ul>
      <RangeInput
        label="Angle"
        max={360}
        min={0}
        onChange={(val) => {
          setAngle(val);
          imageEditor.setAngle(val);
        }}
        value={angle}
      />
    </div>
  );
});

export default Rotate;
