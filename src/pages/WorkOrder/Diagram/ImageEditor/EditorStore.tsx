import createFastContext from 'src/StateProvider/createFastContext';

type InitialState = {
  activeObject: number | null;
  undoStackLength: number;
  redoStackLength: number;
  currentSelectedShapeType: null | 'rect' | 'circle' | 'triangle' | 'icon' | 'text';
};

const initialState: InitialState = {
  activeObject: null,
  undoStackLength: 0,
  redoStackLength: 0,
  currentSelectedShapeType: null
};

const { Provider, useStore } = createFastContext<InitialState>(initialState);

export { Provider as EditorProvider, useStore as useEditorStore };
