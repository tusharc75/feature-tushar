import { Input, InputProps, Slider } from '@mui/material';
import React, { memo } from 'react';
import { cn } from 'src/constants/helpers';
import { subMenuHelperTextClassName } from 'src/pages/WorkOrder/Diagram/ImageEditor/SubMenu';

const RangeInput = memo(
  ({
    max,
    min,
    onChange,
    value,
    label,
    inputProps = null,
    disabled
  }: {
    value: number;
    onChange: (val: number) => void;
    min: number;
    max: number;
    label: string;
    disabled?: boolean;
    inputProps?: Omit<InputProps, 'size'>;
  }) => {
    const { onChange: onInputChange, onBlur: onInputBlur, ...restInputProps } = inputProps || {};
    return (
      <div>
        <p className={cn(subMenuHelperTextClassName, 'block w-full text-left')}>{label}</p>
        <div className=" flex items-center gap-4">
          <Slider
            disabled={disabled}
            size="small"
            defaultValue={value}
            value={value}
            onChange={(e, newValue: number) => {
              onChange(newValue);
            }}
            min={min}
            max={max}
            step={1}
            valueLabelDisplay="auto"
          />
          {inputProps && (
            <Input
              disabled={disabled}
              value={value}
              className={cn(subMenuHelperTextClassName, '!rounded-sm !border before:!content-none [&_input]:!text-center')}
              size="small"
              onChange={onInputChange}
              onBlur={onInputBlur}
              inputProps={{
                step: 10,
                min: 0,
                max: 100,
                type: 'number',
                'aria-labelledby': `input-slider-${label}`
              }}
              {...restInputProps}
            />
          )}
        </div>
      </div>
    );
  }
);

export default RangeInput;
