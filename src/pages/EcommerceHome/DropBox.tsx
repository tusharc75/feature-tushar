import { Draggable, Droppable } from '@hello-pangea/dnd';
import ItemView from './ItemView';

const DropBox = ({ formData, handleRemove, findCard, moveCard, setFormData }) => {
  return (
    <>
      <Droppable droppableId="pageSection">
        {(provided) => (
          <ul className="list-none grid gap-2" {...provided.droppableProps} ref={provided.innerRef}>
            {formData?.map((col, index) => (
              <Draggable key={col._id} draggableId={`${col._id}`} index={index}>
                {(provided, snapshot) => (
                  <li
                    {...provided.draggableProps}
                    ref={provided.innerRef}
                    className={`${snapshot.isDragging ? ' bg-[var(--dark-secondary,#ebebeb)]' : ''} transition-colors`}
                  >
                    <ItemView
                      key={index}
                      label={col?.label}
                      handleRemove={handleRemove}
                      id={col?._id}
                      dragHandleProps={provided.dragHandleProps}
                      itemData={col}
                      setFormData={setFormData}
                    />
                  </li>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </ul>
        )}
      </Droppable>
    </>
  );
};

export default DropBox;
