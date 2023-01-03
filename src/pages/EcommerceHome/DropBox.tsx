import { useDrop } from 'react-dnd';
import ItemView from './ItemView';

const DropBox = ({ data, handleRemove, findCard, moveCard }) => {
  const [{}, drop] = useDrop(
    () => ({
      accept: 'field'
    }),
    []
  );

  return (
    <div style={{ height: '80vh' }} ref={drop}>
      <div>
        {data &&
          data?.map((i: any, index) => (
            <ItemView
              key={index}
              label={i?.label}
              handleRemove={handleRemove}
              id={i?._id ? i?._id : i?.name}
              findCard={findCard}
              moveCard={moveCard}
              formData={i}
            />
          ))}
      </div>
    </div>
  );
};

export default DropBox;
