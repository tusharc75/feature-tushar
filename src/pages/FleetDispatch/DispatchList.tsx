import { Draggable, Droppable } from '@hello-pangea/dnd';
import DispatchCard from './DispatchCard';

const DispatchList = ({ activity, cardType, handleDispatch }) => {
  return (
    <>
      <Droppable droppableId={cardType}>
        {(provided) => (
          <ul className={`list-none `} {...provided.droppableProps} ref={provided.innerRef}>
            {activity.map((element, index) => (
              <Draggable key={element._id} draggableId={`${element._id}`} index={index}>
                {(provided, snapshot) => (
                  <li {...provided.draggableProps} {...provided.dragHandleProps} ref={provided.innerRef}>
                    <DispatchCard
                      data={element}
                      key={element?.id}
                      id={element?.id}
                      index={index}
                      cardType={cardType}
                      handleDispatch={handleDispatch}
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

export default DispatchList;
