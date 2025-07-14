import React from 'react';

export type PositionType = 'top' | 'bottom' | 'left' | 'right';
export type PositionValues = React.CSSProperties;

export type AutoPosition = PositionType | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export type HostMessage =
  | { type: 'start'; payload: null }
  | { type: 'stop'; payload: null }
  | {
      type: 'update';
      payload: {
        buttonPosition: PositionValues;
        targetSelector: string;
        anchorElementPadding: PositionValues;
        manualPosition: boolean;
        insideAnchor: boolean;
        autoPosition: AutoPosition;
        id: string;
      };
    }
  | {
      type: 'add';
      payload: {
        id: string;
        targetSelector: string;
        buttonPosition: PositionValues;
        anchorElementPadding: PositionValues;
        manualPosition: boolean;
        insideAnchor: boolean;
        autoPosition: AutoPosition;
      };
    };
export type PostMessage =
  | { type: 'select'; payload: SelectedItemData }
  | { type: 'initialized'; payload: true }
  | { type: 'reportRoute'; payload: string };
type SelectedItemData = {
  targetSelector: string;
  url: string;
  originalUrl: string;
};

export type ApiFormData = {
  _id?: string;
  actionName?: string;
  targetSelector?: string;
  url?: string;
  originalUrl?: string;
  anchorElementPadding?: AnchorElementPadding;
  buttonPosition?: AnchorElementPadding;
  tooltip?: string;
  manualPosition?: boolean;
  insideAnchor?: boolean;
  autoPosition?: AutoPosition;
  resourceId?: string;
  resource?: string;
};

export type AnchorElementPadding = {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
};

export type Action = {
  _id?: string;
  actionName: string;
  targetSelector: string;
  url: string;
  originalUrl: string;
  anchorElementPadding: React.CSSProperties;
  buttonPosition: React.CSSProperties;
  tooltip: string;
  manualPosition: boolean;
  insideAnchor: boolean;
  autoPosition: AutoPosition;
  content: string;
  actionId: string;
};
