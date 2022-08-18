import { Fragment, useCallback, useContext, useEffect } from 'react';
import { Box, Button, Dialog, Grid, TextField } from '@material-ui/core';
import { isMobile, isTablet } from 'react-device-detect';
import { useState } from 'react';
import React from 'react';
import { Card } from './card';
import { FixedSizeList } from 'react-window';
import update from 'immutability-helper';
import { DndProvider } from 'react-dnd';
import { TouchBackend } from 'react-dnd-touch-backend';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Autocomplete } from '@material-ui/lab';

export default function Options({ field, setFields }) {

  const [isUpdate, setUpdate] = useState(false);
  
  const defaultOption = [{ optionLabel: 'Option 1', optionValue: 'Option 1' }];
  const [options, setOptions] = useState(field?.options && field?.options?.length > 0 ? field?.options : defaultOption);

  useEffect(() => {
    setUpdate(!isUpdate);
  }, [options]);

  const onChangeValue = (index, value) => {
    let data = [...options];
    data[index].optionLabel = value;
    data[index].optionValue = value;
    setOptions([...data]);
    setFields((prevState) => ({ ...prevState, options: options }));
  };

  const moveCard = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const dragCard = options[dragIndex];
      setOptions([
        ...update(options, {
          $splice: [
            [dragIndex, 1],
            [hoverIndex, 0, dragCard]
          ]
        })
      ]);
      setFields((prevState) => ({ ...prevState, options: options }));
    },
    [options]
  );

  const AddRemoveValue = (type, index) => {
    let data = options;
    if (type === 'add') {
      data.splice(index + 1, 0, {
        optionLabel: 'Option ' + (data.length + 1),
        optionValue: 'Option ' + (data.length + 1)
      });
    } else {
      if (data.length !== 1) {
        data.splice(index, 1);
      }
    }
    setOptions(data);
    setUpdate(!isUpdate);
    setFields((prevState) => ({ ...prevState, options: options }));
  };

  const Row = React.useMemo(() => {
    return React.forwardRef((props2: any, ref2: any) => (
      <div style={props2.style} ref={ref2}>
        {options && options[props2.index] && (
          <Card
            key={props2.index}
            index={props2.index}
            id={props2.index}
            data={options[props2.index]}
            moveCard={moveCard}
            onChangeValue={onChangeValue}
            AddRemoveValue={AddRemoveValue}
          />
        )}
      </div>
    ));
  }, [isUpdate]);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <DndProvider backend={isMobile || isTablet ? TouchBackend : HTML5Backend}>
          <Box border={1} mt={1} bgcolor="grey.100" borderColor="grey.300">
            <FixedSizeList height={300} width={'100%'} itemSize={60} itemData={options && options} itemCount={options && options.length}>
              {Row}
            </FixedSizeList>
          </Box>
        </DndProvider>
      </Grid>
      <Grid item xs={12}>
        <Autocomplete
          size="small"
          options={options}
          value={
            options?.filter((o) => o?.optionLabel === field?.defaultOptionDropdown)?.length
              ? options?.filter((o) => o?.optionLabel === field?.defaultOptionDropdown)[0]
              : ''
          }
          getOptionLabel={(option) => option?.optionLabel || ''}
          getOptionSelected={(option: any, val) => option.optionValue === val}
          renderInput={(params) => <TextField size={'small'} {...params} label="Option" variant="outlined" />}
          onChange={(e, value) => {
            setFields((prevState) => ({ ...prevState, defaultOptionDropdown: value?.optionLabel || '' }));
          }}
        />
      </Grid>
    </Grid>
  );
}
