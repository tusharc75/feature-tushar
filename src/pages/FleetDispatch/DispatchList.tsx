import { SortableContext } from '@dnd-kit/sortable';
import DispatchCard from './DispatchCard';

const DispatchList = ({ activity, cardType, handleDispatch }) => {
  if (activity.length === 0) return null;
  console.log(activity);
  return (
    <>
      <SortableContext items={activity.map((d) => d._id)}>
        {activity.map((element, index) => (
          <DispatchCard data={element} key={element?._id} id={element?._id} index={index} cardType={cardType} handleDispatch={handleDispatch} />
        ))}
      </SortableContext>
    </>
  );
};

export default DispatchList;
