import React from 'react';

export type HostMessage =
  | { type: 'start'; payload: null }
  | { type: 'stop'; payload: null }
  | { type: 'move'; itemStyle: React.CSSProperties; actionStyle: React.CSSProperties };
export type PostMessage = { type: 'select'; payload: SelectedItemData } | { type: 'initialized'; payload: true };
type SelectedItemData = {
  targetSelector: string;
  url: string;
  id: string;
};
