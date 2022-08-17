import React from 'react';
import { Grid, Box, Paper } from '@material-ui/core';
import { useDrop } from 'react-dnd';
import update from 'immutability-helper';
import DragField from './DragField';
import DropField from './DropField';
import FieldList from './FieldList';
import ConfigureProperties from './ConfigureProperties';

const Configurator = ({ fields, setFields }) => {

  const fieldsData = Object.keys(FieldList).map((field, index) => ({
    fieldLabel: FieldList[field].label,
    type: FieldList[field].type,
    _id: index
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
      const field = fieldsData.find((field) => field._id === item._id);
      if (!field || item?.sorting) return;
      setFields((prevState: any) => {
        return [...prevState, { ...field, _id: parseInt((Math.random() * 100000).toString()) }];
      });
    }
  }));

  const handleLabelChange = (_id: any, value: string) => {
    setFields((prevState) =>
      prevState.map((field) => {
        if (field._id === _id) {
          return { ...field, fieldLabel: value };
        }
        return field;
      })
    );
  };

  const removeField = (_id: any) => {
    setFields((prevState) => prevState.filter((field) => field._id !== _id));
  };

  const cloneField = (data: any) => {
    setFields((prevState) => [...prevState, { ...data, _id: parseInt((Math.random() * 100000).toString()) }]);
  };

  return (
    <>
      <Grid container spacing={2}>
        <Grid item xs={4}>
          <Box border={'1px solid lightgray'} padding={1} height={window.innerHeight - 150}>
            <Grid container spacing={1}>
              {fieldsData.map((field, index) => (
                <DragField key={index} _id={field._id} text={field.fieldLabel} />
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
                    _id={field?._id}
                    index={index}
                    removeField={removeField}
                    handleLabelChange={handleLabelChange}
                    key={field?._id}
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
