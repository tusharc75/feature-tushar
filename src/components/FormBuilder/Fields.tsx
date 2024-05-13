import React from 'react';

import {
  DragDropContext,
  Draggable,
  DraggableProvided,
  DraggableProvidedDragHandleProps,
  DraggableStateSnapshot,
  DropResult,
  Droppable
} from '@hello-pangea/dnd';
import FieldList from './FieldList';
import { DragBox } from './DragBox';

const Fields = ({ filterFieldType }) => {
  return (
    <div>
      <Droppable isDropDisabled={true} id={'fields'} type={'fields'}>
        {(provided, snapshot) => {
          return (
            <ul ref={provided.innerRef} {...provided.droppableProps} className="list-none space-y-2">
              {Object.keys(FieldList).map((type, index) => {
                return !filterFieldType.includes(type) ? (
                  <DragBox key={index} type="field" label={FieldList[type].label} name={FieldList[type].type} />
                ) : null;
              })}
              {provided.placeholder}
            </ul>
          );
        }}
      </Droppable>
    </div>
  );
};

const RednerItem = ({}) => {
  return <div></div>;
};

export default Fields;
