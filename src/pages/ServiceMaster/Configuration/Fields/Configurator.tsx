import React from 'react';
import { Grid, Box, Paper } from '@material-ui/core';
import { useDrop } from 'react-dnd';
import update from 'immutability-helper';
import DragField from './DragField';
import DropField from './DropField';
import { FIELDS } from './FieldList';
import ConfigureProperties from './ConfigureProperties';

const Configurator = ({ fields, setFields }) => {

  const fieldsData = Object.keys(FIELDS).map((field, index) => ({
    fieldLabel: FIELDS[field].label,
    type: FIELDS[field].label,
    id: index
  }));

  const [openProperties, setOpenProperties] = React.useState({ isOpen: false, data: null });

  const moveField = React.useCallback((dragIndex: number, hoverIndex: number) => {
    setFields((prevCards: any) =>
      update(prevCards, {
        $splice: [
          [dragIndex, 1],
          [hoverIndex, 0, prevCards[dragIndex]]
        ]
      })
    );
  }, []);

  const [, drop] = useDrop(() => ({
    accept: 'field',
    drop: (item: any) => {
      const field = fieldsData.find((field) => field.id === item.id);
      if (!field || item?.sorting) return;
      setFields((prevState: any) => {
        return [...prevState, { ...field, id: prevState.length }];
      });
    }
  }));

  const handleLabelChange = (id: number, value: string) => {
    setFields((prevState) =>
      prevState.map((field) => {
        if (field.id === id) {
          return { ...field, fieldLabel: value };
        }
        return field;
      })
    );
  };

  const removeField = (id: number) => {
    setFields((prevState) => prevState.filter((field) => field.id !== id));
  };

  const cloneField = (data: any) => {
    setFields((prevState) => [...prevState, { ...data, id: prevState.length }]);
  };

  return (
    <>
      <Grid container spacing={2}>
        <Grid item xs={4}>
          <Box border={'1px solid lightgray'} padding={1} height={window.innerHeight - 150}>
            <Grid container spacing={1}>
              {fieldsData.map((field, index) => (
                <DragField key={index} id={field.id} text={field.fieldLabel} />
              ))}
            </Grid>
          </Box>
        </Grid>
        <Grid item xs={8}>
          <Box border={'1px solid lightgray'} padding={1} height={window.innerHeight - 150}>
            <div style={{ width: '100%', height: '100%' }} ref={drop}>
              <Grid container spacing={2}>
                {fields.map((field, index) => (
                  <DropField
                    id={field?.id}
                    index={index}
                    removeField={removeField}
                    handleLabelChange={handleLabelChange}
                    key={field?.id}
                    data={field}
                    moveField={moveField}
                    cloneField={cloneField}
                    openProperties={() => setOpenProperties({ isOpen: true, data: field })}
                  />
                ))}
              </Grid>
            </div>
          </Box>
        </Grid>
      </Grid>
      {openProperties.isOpen && (
        <ConfigureProperties
          setFields={setFields}
          field={openProperties?.data}
          close={() => setOpenProperties({ isOpen: false, data: null })} />
      )}
    </>
  );
};

export default Configurator;
