import { Fragment, useCallback, useEffect } from 'react';
import { Box, Button, Dialog } from '@material-ui/core';
import { isMobile, isTablet } from 'react-device-detect';
import { useState } from 'react';
import { CustomDialogTransition } from 'src/constants/helpers';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomButton from 'src/components/Helpers/CustomButton';
import React from 'react';
import { Card } from './card';
import { FixedSizeList } from 'react-window';
import update from 'immutability-helper';
import { DndProvider } from 'react-dnd';
import { TouchBackend } from 'react-dnd-touch-backend';
import { HTML5Backend } from 'react-dnd-html5-backend';

export default function ManageServiceSteps({ title, onClose, handleUpdateSteps, isAssigning, options, setOptions }) {
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [isUpdate, setUpdate] = useState(false);
  const defaultOption = [{ step: 'Step 1' }];

  useEffect(() => {
    options.length === 0 && setOptions([...defaultOption]);
  }, [title]);

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
      setUpdate(!isUpdate);
      console.log('drag');
    },
    [options]
  );

  const onChangeValue = (index, value) => {
    let data = [...options];
    data[index].step = value;
    setOptions([...data]);
  };
  const AddRemoveValue = (type, index) => {
    let data = options;
    if (type === 'add') {
      data.splice(index + 1, 0, {
        step: 'Step ' + (data.length + 1)
      });
    } else {
      if (data.length !== 1) {
        data.splice(index, 1);
      }
    }
    setOptions(data);
    setUpdate(!isUpdate);
  };

  const Row = React.useMemo(() => {
    return React.forwardRef((props2: any, ref2: any) => (
      <div style={props2.style} ref={ref2}>
        {options && (
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
  }, [isUpdate, options]);

  return (
    <Dialog
      maxWidth="md"
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          onClose();
        }
      }}
      fullWidth
    >
      <Fragment>
        <CustomDialogHeader
          title={title || 'Assign Steps'}
          onClose={() => {
            onClose();
          }}
          isMinimized={!fullScreen}
          onMinimizeMaximize={() => {
            setFullScreen((prevState) => !prevState);
          }}
          showManimizeMaximize={true}
        ></CustomDialogHeader>
        <CustomDialogContent>
          <DndProvider backend={isMobile || isTablet ? TouchBackend : HTML5Backend}>
            <Box border={1} mt={1} bgcolor="grey.100" borderColor="grey.300">
              <FixedSizeList height={300} width={'100%'} itemSize={60} itemData={options && options} itemCount={options && options.length}>
                {Row}
              </FixedSizeList>
            </Box>
          </DndProvider>
        </CustomDialogContent>
        <CustomDialogFooter>
          <Button
            size="small"
            color="primary"
            onClick={() => {
              onClose();
            }}
          >
            Cancel
          </Button>
          <CustomButton
            loading={isAssigning}
            variant="contained"
            color="primary"
            type="submit"
            onClick={(e) => {
              e.preventDefault();
              handleUpdateSteps();
            }}
            disabled={isAssigning}
          >
            {' '}
            Save
          </CustomButton>
        </CustomDialogFooter>
      </Fragment>
    </Dialog>
  );
}
