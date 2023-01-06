import { Grid } from '@material-ui/core';
import { useDrop } from 'react-dnd';
import ItemView from './ItemView';

const DropBox = ({ formData, handleRemove, findCard, moveCard, setFormData }) => {
  const [{ }, drop] = useDrop(
    () => ({
      accept: 'field'
    }),
    []
  );

  return (
    <Grid ref={drop} style={{ height: '80vh', alignContent: "start" }} container spacing={1} >
      {formData &&
        formData?.map((i: any, index) => (
          <ItemView
            key={index}
            label={i?.label}
            handleRemove={handleRemove}
            id={i?._id ? i?._id : i?.name}
            findCard={findCard}
            moveCard={moveCard}
            itemData={i}
            formData={formData}
            setFormData={setFormData}
          />
        ))}
    </Grid>
  );
};

export default DropBox;
