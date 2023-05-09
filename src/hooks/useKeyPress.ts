import React, { useState, useEffect } from 'react';

type ModifierKeys =
  | 'Alt'
  | 'AltGraph'
  | 'CapsLock'
  | 'Control'
  | 'Fn'
  | 'FnLock'
  | 'Hyper'
  | 'Meta'
  | 'NumLock'
  | 'ScrollLock'
  | 'Shift'
  | 'Super'
  | 'Symbol'
  | 'SymbolLock';
type WhitespaceKeys = 'Enter' | 'Tab' | ' ';
type NavigationKeys = 'ArrowDown' | 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'End' | 'Home' | 'PageDown' | 'PageUp';
type FunctionKeys =
  | 'F1'
  | 'F2'
  | 'F3'
  | 'F4'
  | 'F5'
  | 'F6'
  | 'F7'
  | 'F8'
  | 'F9'
  | 'F10'
  | 'F11'
  | 'F12'
  | 'F13'
  | 'F14'
  | 'F15'
  | 'F16'
  | 'F17'
  | 'F18'
  | 'F19'
  | 'F20'
  | 'Soft1'
  | 'Soft2'
  | 'Soft3'
  | 'Soft4';
type NumericKeypadKeys =
  | 'Decimal'
  | 'Key11'
  | 'Key12'
  | 'Multiply'
  | 'Add'
  | 'Clear'
  | 'Divide'
  | 'Subtract'
  | 'Separator'
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9';

interface keyInterface {
  readonly targetKey: string | ModifierKeys | WhitespaceKeys | NavigationKeys | FunctionKeys | NumericKeypadKeys;
}

export const useKeyPress = ({ targetKey }: keyInterface) => {
  const [keyPressed, setKeyPressed] = useState(false);

  useEffect(() => {
    const downHandler = ({ key }) => {
      if (key === targetKey) {
        setKeyPressed(true);
      }
    };

    const upHandler = ({ key }) => {
      if (key === targetKey) {
        setKeyPressed(false);
      }
    };

    window.addEventListener('keydown', downHandler);
    window.addEventListener('keyup', upHandler);

    return () => {
      window.removeEventListener('keydown', downHandler);
      window.removeEventListener('keyup', upHandler);
    };
  }, [targetKey]);

  return keyPressed;
};
