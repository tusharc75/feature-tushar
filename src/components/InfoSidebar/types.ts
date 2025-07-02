export type PositionType = 'top' | 'bottom' | 'left' | 'right';
export type PositionValues = Partial<{
  top: string;
  bottom: string;
  left: string;
  right: string;
}>;

export type AutoPosition = PositionType | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export type HostMessage =
  | { type: 'start'; payload: null }
  | { type: 'stop'; payload: null }
  | { type: 'delete'; payload: string }
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
  resource?: string;
  actions?: Action[];
  createdBy?: AtedBy;
  updatedBy?: AtedBy;
};

export type AtedBy = {
  user?: string;
  date?: Date;
};
export type Action = {
  _id?: string;
  actionName?: string;
  actionId?: string;
  content?: string;
  anchorElementPadding?: React.CSSProperties;
  autoPosition?: string;
  buttonPosition?: React.CSSProperties;
  insideAnchor?: boolean;
  label?: string;
  manualPosition?: boolean;
  originalUrl?: string;
  targetSelector?: string;
  tooltip?: string;
  url?: string;
};
