import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { useRef, useState } from 'react';

import { subMenuHelperTextClassName, SubmenuItemProps } from 'src/pages/WorkOrder/Diagram/ImageEditor/SubMenu';
import ColorPicker from 'src/pages/WorkOrder/Diagram/ImageEditor/SubMenu/ColorPicker';
import RangeInput from 'src/pages/WorkOrder/Diagram/ImageEditor/SubMenu/RangeInput';

const filterMap = [
  { type: 'Grayscale', label: 'Grayscale', option: null },
  { type: 'Invert', label: 'Invert', option: null },
  { type: 'Sepia', label: 'Sepia', option: null },
  { type: 'vintage', label: 'Bintage', option: null },
  { type: 'Blur', label: 'Blur', option: { blur: 0.1 } },
  { type: 'Sharpen', label: 'Sharpen', option: null },
  { type: 'Emboss', label: 'Emboss', option: null }
];

const rangeFilters = [
  {
    type: 'removeColor',
    label: 'Remove White',
    sliderProps: { min: -255, max: 255, defaultValue: 100, label: '' },
    checkBoxFunctionProp: {
      color: '#FFFFFF',
      useAlpha: false,
      distance: 0
    },
    sliderFunctionObjectCreator: {
      key: 'distance',
      parser: (value: number) => value / 255
    }
  },
  {
    type: 'brightness',
    label: 'Brightness',
    sliderProps: { min: -255, max: 255, defaultValue: 100, label: '' },
    checkBoxFunctionProp: {
      brightness: 100 / 255
    },
    sliderFunctionObjectCreator: {
      key: 'brightness',
      parser: (value: number) => value / 255
    }
  },
  {
    type: 'noise',
    label: 'Noise',
    sliderProps: { min: 0, max: 1000, defaultValue: 100, label: '' },
    checkBoxFunctionProp: {
      noise: 100
    },
    sliderFunctionObjectCreator: {
      key: 'noise',
      parser: (value: number) => value
    }
  },
  {
    type: 'pixelate',
    label: 'Pixelate',
    sliderProps: { min: 2, max: 20, defaultValue: 4, label: '' },
    checkBoxFunctionProp: {
      blocksize: 4
    },
    sliderFunctionObjectCreator: {
      key: 'blocksize',
      parser: (value: number) => value
    }
  }
] as const;

const initialCheckboxState = rangeFilters.reduce(
  (acc, curr) => {
    acc[curr.label] = false;
    return acc;
  },
  { Tint: false, Multiply: false, Blend: false } as { [key in (typeof rangeFilters)[number]['label']]: boolean } & {
    Tint: boolean;
    Multiply: boolean;
    Blend: boolean;
  }
);
type CheckboxStateType = typeof initialCheckboxState;

const blendModes = [
  { label: 'Add', mode: 'add' },
  // { label: 'Diff', mode: 'diff' },
  { label: 'Subtract', mode: 'diff' },
  { label: 'Multiply', mode: 'multiply' },
  { label: 'Screen', mode: 'screen' },
  { label: 'Lighten', mode: 'lighten' },
  { label: 'Darken', mode: 'darken' }
] as const;

const Filter = ({ hideMenu, imageEditor }: SubmenuItemProps) => {
  const [checkboxState, setCheckboxState] = useState<CheckboxStateType>(initialCheckboxState);
  const blendColor = useRef('#00FF00');

  function applyOrRemoveFilter(applying: boolean, type: string, options: any) {
    if (applying) {
      imageEditor.applyFilter(type, options);
    } else {
      imageEditor.removeFilter(type);
    }
  }

  return (
    <>
      <ul className=" mb-3 grid list-none grid-cols-2 justify-center gap-3 border-b pb-3">
        {filterMap.map((f) => (
          <li>
            <label className="switch-checkbox flex items-center gap-2">
              <input type="checkbox" onClick={(e) => applyOrRemoveFilter(e.currentTarget.checked, f.type, f.option)} />
              <p className={subMenuHelperTextClassName}>{f.label}</p>
            </label>
          </li>
        ))}
      </ul>
      <ul className=" mb-3 list-none gap-3 border-b pb-3">
        {rangeFilters.map((rf) => (
          <li key={rf.label}>
            <label className="switch-checkbox flex items-center gap-2">
              <input
                type="checkbox"
                checked={checkboxState[rf.label]}
                onClick={(e) => {
                  setCheckboxState((prev) => {
                    const newData = { ...prev, [rf.label]: !prev[rf.label] };
                    applyOrRemoveFilter(newData[rf.label], rf.type, rf.checkBoxFunctionProp);
                    return newData;
                  });
                }}
              />
              <p className={subMenuHelperTextClassName}>{rf.label}</p>
            </label>
            <RangeInput
              {...rf.sliderProps}
              disabled={!checkboxState[rf.label]}
              onChange={(value) =>
                applyOrRemoveFilter(checkboxState[rf.label], rf.type, {
                  [rf.sliderFunctionObjectCreator.key]: rf.sliderFunctionObjectCreator.parser(value)
                } as tuiImageEditor.IFilterOptions)
              }
            />
          </li>
        ))}
      </ul>
      <ul className=" mb-3 list-none gap-3 space-y-2">
        <li className="grid grid-cols-2">
          <label className="switch-checkbox mb-2 flex items-center gap-2">
            <input
              type="checkbox"
              checked={checkboxState['Tint']}
              onClick={(e) => {
                setCheckboxState((prev) => {
                  const newData = { ...prev, Tint: !prev['Tint'] };
                  applyOrRemoveFilter(newData['Tint'], 'blendColor', {
                    mode: 'tint',
                    color: '#000000',
                    alpha: 70 / 100
                  });
                  return newData;
                });
              }}
            />
            <p className={subMenuHelperTextClassName}>{'Tint'}</p>
          </label>
          <ColorPicker
            key={`tint-picker-${checkboxState['Tint']}`}
            defaultColor="#000000"
            label=""
            setColor={(color) => {
              applyOrRemoveFilter(checkboxState['Tint'], 'blendColor', {
                color
              });
            }}
            setOpacity={(opacity) => {
              applyOrRemoveFilter(checkboxState['Tint'], 'blendColor', {
                alpha: opacity / 100
              });
            }}
            rangeInputProps={{
              defaultValue: 70
            }}
          />
        </li>
        <li className="grid grid-cols-2">
          <label className="switch-checkbox mb-2 flex items-center gap-2">
            <input
              type="checkbox"
              checked={checkboxState['Multiply']}
              onClick={(e) => {
                setCheckboxState((prev) => {
                  const newData = { ...prev, Multiply: !prev['Multiply'] };
                  applyOrRemoveFilter(newData['Multiply'], 'blendColor', {
                    color: '#808080'
                  });
                  return newData;
                });
              }}
            />
            <p className={subMenuHelperTextClassName}>{'Multiply'}</p>
          </label>
          <ColorPicker
            key={`tint-picker-${checkboxState['Multiply']}`}
            defaultColor="#808080"
            label=""
            setColor={(color) => {
              applyOrRemoveFilter(checkboxState['Multiply'], 'blendColor', {
                color
              });
            }}
            rangeInputProps={{
              defaultValue: 100
            }}
          />
        </li>
        <li className="grid grid-cols-2">
          <label className="switch-checkbox mb-2 flex items-center gap-2">
            <input
              type="checkbox"
              checked={checkboxState['Blend']}
              onClick={(e) => {
                setCheckboxState((prev) => {
                  const newData = { ...prev, Blend: !prev['Blend'] };
                  applyOrRemoveFilter(newData['Blend'], 'blendColor', {
                    color: blendColor.current
                  });
                  return newData;
                });
              }}
            />
            <p className={subMenuHelperTextClassName}>{'Blend'}</p>
          </label>
          <ColorPicker
            key={`tint-picker-${checkboxState['Blend']}`}
            defaultColor={blendColor.current}
            label=""
            setColor={(color) => {
              blendColor.current = color;
              applyOrRemoveFilter(checkboxState['Blend'], 'blendColor', {
                color
              });
            }}
            rangeInputProps={{
              defaultValue: 100
            }}
            autoHidePopup={false}
          >
            <FormControl sx={{ mt: 2 }} fullWidth size="small">
              <InputLabel id="select-blend-mode">Age</InputLabel>
              <Select
                labelId="select-blend-mode"
                id="select-blend-mode"
                label="Age"
                defaultValue={blendModes[0].mode}
                onChange={(e) => {
                  applyOrRemoveFilter(checkboxState['Blend'], 'blendColor', {
                    mode: e.target.value
                  });
                }}
              >
                {blendModes.map((b) => (
                  <MenuItem value={b.mode}>{b.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </ColorPicker>
        </li>
      </ul>
    </>
  );
};

export default Filter;
