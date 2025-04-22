import { Menu } from '@mui/material';
import React, { memo, useEffect, useRef, useState } from 'react';
import { MdBlock } from 'react-icons/md';
import RippleButton from 'src/components/RippleButton';
import { cn } from 'src/constants/helpers';
import { subMenuHelperTextClassName } from 'src/pages/WorkOrder/Diagram/ImageEditor/SubMenu';
import RangeInput, { RangeInputProps } from 'src/pages/WorkOrder/Diagram/ImageEditor/SubMenu/RangeInput';
import { isValidHexColor } from 'src/pages/WorkOrder/Diagram/ImageEditor/utils';

const minOpacity = 2;
const maxOpacity = 100;

const colors = [
  '#000000',
  '#2a2a2a',
  '#545454',
  '#7e7e7e',
  '#a8a8a8',
  '#d2d2d2',
  '#ffffff',
  '#ff4040',
  '#ff6518',
  '#ffbb3b',
  '#03bd9e',
  '#00a9ff',
  '#515ce6',
  '#9e5fff',
  '#ff5583'
] as const;

let colorTimeout: NodeJS.Timeout;
let opacityTimeout: NodeJS.Timeout;

const ColorPicker = memo(
  ({
    color,
    setColor,
    label,
    canColorBeEmpty,
    setOpacity,
    opacity = minOpacity,
    defaultColor,
    rangeInputProps = {},
    children = null,
    autoHidePopup = true
  }: {
    defaultColor?: string;
    color?: string | null;
    setColor?: (color: string | null) => void;
    label?: string;
    canColorBeEmpty?: boolean;
    opacity?: number;
    setOpacity?: (opacity: number) => void;
    rangeInputProps?: Partial<Omit<RangeInputProps, 'label' | 'onChange' | 'value'>>;
    children?: React.ReactNode | Element[];
    autoHidePopup?: boolean;
  }) => {
    const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
    const [stateOpacity, setStateOpacity] = useState(rangeInputProps.defaultValue ? rangeInputProps.defaultValue : opacity);
    const [stateColor, setStateColor] = useState(defaultColor ? defaultColor : color);
    const iniitialRender = useRef({ opacity: true, color: true });

    const handleClose = () => {
      setAnchor(null);
    };

    // debounce color setter
    useEffect(() => {
      if (iniitialRender.current.color) {
        iniitialRender.current.color = false;
        return () => clearTimeout(colorTimeout);
      }
      colorTimeout = setTimeout(() => {
        setColor?.(stateColor);
      }, 100);
      return () => {
        clearTimeout(colorTimeout);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stateColor]);

    // debounce opacity setter
    useEffect(() => {
      if (typeof setOpacity !== 'function') return;
      if (iniitialRender.current.opacity) {
        iniitialRender.current.opacity = false;
        return () => clearTimeout(opacityTimeout);
      }
      opacityTimeout = setTimeout(() => {
        let opacity = stateOpacity;
        if (opacity > maxOpacity) {
          opacity = maxOpacity;
        }
        if (opacity < minOpacity) {
          opacity = minOpacity;
        }
        setOpacity(opacity);
      }, 100);
      return () => {
        clearTimeout(opacityTimeout);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stateOpacity]);

    return (
      <div>
        <RippleButton onClick={(e) => setAnchor(e.currentTarget)} className="inline-block max-w-fit cursor-pointer rounded-full border text-center">
          <div
            className="circle relative mx-auto size-10 cursor-pointer overflow-hidden rounded-full border"
            style={{ background: stateColor ? stateColor : 'transparent', opacity: `${typeof setOpacity === 'function' ? stateOpacity / 100 : 1}` }}
          >
            {!stateColor && <MdBlock size={45} className="absolute bottom-[-3.5px] left-[-3.5px] right-[-3.5px] top-[-3.5px] text-gray-500" />}
          </div>
        </RippleButton>

        {label && <p className={cn(subMenuHelperTextClassName, 'mx-auto max-w-fit')}>{label}</p>}
        <Menu disableScrollLock open={Boolean(anchor)} anchorEl={anchor} onClose={handleClose}>
          <div className="w-[200px] p-3">
            <ColorList setColor={setStateColor} canColorBeEmpty={canColorBeEmpty} handleClose={() => (autoHidePopup ? handleClose : () => {})} />
            <Picker
              color={stateColor}
              setColor={setStateColor}
              canColorBeEmpty={canColorBeEmpty}
              handleClose={() => (autoHidePopup ? handleClose : () => {})}
            />
            {typeof setOpacity === 'function' && (
              <div className="mt-2 ">
                <RangeInput
                  labelClass="text-center"
                  min={minOpacity}
                  max={maxOpacity}
                  label="Opacity"
                  onChange={(opacity) => setStateOpacity(opacity)}
                  value={stateOpacity}
                  {...rangeInputProps}
                />
              </div>
            )}
            {children}
          </div>
        </Menu>
      </div>
    );
  }
);

export default ColorPicker;

const ColorList = memo(
  ({ setColor, canColorBeEmpty, handleClose }: { setColor: (color: string | null) => void; canColorBeEmpty?: boolean; handleClose: () => void }) => {
    return (
      <ul className="mb-3 flex flex-wrap items-center justify-center gap-[2px]">
        {canColorBeEmpty && (
          <RippleButton
            onClick={() => {
              setColor(null);
              handleClose();
            }}
            className="relative block size-5 cursor-pointer rounded-full border"
            style={{ background: 'transparent' }}
            title={'transparent'}
          >
            <MdBlock size={22} className="absolute bottom-[-2px] left-[-2px] right-[-2px] top-[-2px] text-gray-500" />
          </RippleButton>
        )}
        {colors.map((c) => (
          <RippleButton
            key={c}
            onClick={() => {
              setColor(c);
              handleClose();
            }}
            className="relative block size-5 cursor-pointer rounded-full border"
            style={{ background: c ? c : 'transparent' }}
            title={c}
          >
            <span className="sr-only">{c}</span>
          </RippleButton>
        ))}
      </ul>
    );
  }
);

const Picker = memo(
  ({
    color,
    setColor,
    canColorBeEmpty,
    handleClose
  }: {
    color: string;
    canColorBeEmpty?: boolean;
    setColor: (color: string | null) => void;
    handleClose: () => void;
  }) => {
    const [colorValue, setColorValue] = useState(color ? color : 'Transparent');

    useEffect(() => {
      if (!color) {
        setColorValue('Transparent');
      } else {
        setColorValue(color);
      }
    }, [color]);

    const handleBlur = (val: string) => {
      if (isValidHexColor(val)) {
        setColor(colorValue);
      } else {
        if (canColorBeEmpty) {
          setColor(null);
          setColorValue('Transparent');
        } else {
          setColor(color);
          setColorValue(color);
        }
      }

      handleClose();
    };

    return (
      <div className="flex gap-1 rounded-md border p-1">
        <label
          className="relative block size-5 flex-shrink-0 cursor-pointer rounded-full border"
          style={{ background: color ? color : 'transparent' }}
        >
          {!color && <MdBlock size={22} className="absolute bottom-[-2px] left-[-2px] right-[-2px] top-[-2px] text-gray-500" />}
          <input
            className="sr-only border-none outline-none focus-visible:outline-1 focus-visible:outline-theme "
            type={'color'}
            value={color}
            onChange={(e) => setColorValue(e.target.value)}
            onBlur={(e) => {
              handleBlur(e.currentTarget.value);
            }}
          />
        </label>
        <input
          onBlur={(e) => handleBlur(e.target.value)}
          onChange={(e) => setColorValue(e.target.value)}
          className="flex-grow border-none bg-transparent text-sm outline-none dark:text-white"
          value={colorValue}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleBlur(e.currentTarget.value);
            }
          }}
        />
      </div>
    );
  }
);
