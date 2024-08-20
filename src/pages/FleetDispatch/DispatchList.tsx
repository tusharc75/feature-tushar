import { SortableContext } from '@dnd-kit/sortable';
import DispatchCard from './DispatchCard';

const DispatchList = ({ activity, cardType }) => {
  if (activity.length === 0) return null;
  return (
    <>
      <SortableContext items={activity.map((d) => d._id)} strategy={() => null}>
        {activity.map((element, index) => (
          <DispatchCard data={element} key={element?._id} id={element?._id} index={index} cardType={cardType} />
        ))}
      </SortableContext>
    </>
  );
};

export default DispatchList;
