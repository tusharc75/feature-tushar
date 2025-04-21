import createFastContext from 'src/StateProvider/createFastContext';

type InitialState = {
  activeObjectId: number | null;
  undoStackLength: number;
  redoStackLength: number;
  currentSelectedShapeType: null | 'rect' | 'circle' | 'triangle' | 'icon' | 'i-text';
  newTextPosition: { x: number; y: number } | null;
};

const initialState: InitialState = {
  activeObjectId: null,
  undoStackLength: 0,
  redoStackLength: 0,
  currentSelectedShapeType: null,
  newTextPosition: null
};

const { Provider, useStore } = createFastContext<InitialState>(initialState);

export { Provider as EditorProvider, useStore as useEditorStore };
