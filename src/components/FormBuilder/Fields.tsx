import { Droppable } from '@hello-pangea/dnd';
import { DragBox } from './DragBox';
import FieldList from './FieldList';

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
