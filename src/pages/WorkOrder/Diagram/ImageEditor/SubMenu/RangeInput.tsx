import { Input, InputProps, Slider } from '@mui/material';
import React, { memo, useEffect, useRef, useState } from 'react';
import { cn } from 'src/constants/helpers';
import { subMenuHelperTextClassName } from 'src/pages/WorkOrder/Diagram/ImageEditor/SubMenu';

let timeout: NodeJS.Timeout;

export type RangeInputProps = {
  value?: number;
  defaultValue?: number;
  onChange?: (val: number) => void;
  min: number;
  max: number;
  label: string;
  disabled?: boolean;
  inputProps?: Omit<InputProps, 'size'>;
  labelClass?: string;
  instant?: boolean;
};

const RangeInput = memo(
  ({ max, min, onChange, value, defaultValue, label, inputProps = null, disabled, labelClass = '', instant = true }: RangeInputProps) => {
    const { onChange: onInputChange, onBlur: onInputBlur, ...restInputProps } = inputProps || {};

    const [stateValue, setStateValue] = useState(defaultValue ? defaultValue : value);
    const initialRender = useRef(true);

    useEffect(() => {
      if (initialRender.current) {
        initialRender.current = false;
        return () => clearTimeout(timeout);
      }
      timeout = setTimeout(
        () => {
          onChange?.(stateValue);
        },
        instant ? 0 : 100
      );
      return () => {
        clearTimeout(timeout);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stateValue, instant]);

    return (
      <div>
        <p className={cn(subMenuHelperTextClassName, 'block w-full text-left ', labelClass)}>{label}</p>
        <div className=" flex items-center gap-4">
          <Slider
            disabled={disabled}
            size="small"
            value={stateValue}
            onChange={(e, newValue: number) => {
              setStateValue(newValue);
            }}
            min={min}
            max={max}
            step={1}
            valueLabelDisplay="auto"
          />
          <Input
            disabled={disabled}
            value={stateValue}
            className={cn(subMenuHelperTextClassName, '!rounded-sm !border before:!content-none [&_input]:!text-center')}
            size="small"
            onChange={(e) => {
              const newValue = e.target.value === '' ? min : Number(e.target.value);
              setStateValue(newValue);
            }}
            onBlur={(e) => {
              let newVal = stateValue;
              if (stateValue > max) {
                newVal = max;
              }
              if (stateValue < min) {
                newVal = min;
              }
              setStateValue(newVal);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.currentTarget.blur();
              }
            }}
            inputProps={{
              step: 10,
              min: 0,
              max: 100,
              type: 'number',
              'aria-labelledby': `input-slider-${label}`
            }}
            {...restInputProps}
          />
        </div>
      </div>
    );
  }
);

export default RangeInput;
