import { Fragment, useCallback, useContext, useEffect } from 'react';
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
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { serviceMaster } from 'src/constants/helpers';

export default function ManageServiceSteps({ handleClose, handleSucess, serviceId, stepOptions }) {

  const toastConfig = useContext(CustomToastContext);

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [isUpdate, setUpdate] = useState(false);
  const [isUpatingSteps, setIsUpatingSteps] = useState(false);

  const defaultOption = [{ step: 'Step 1' }];
  const [options, setOptions] = useState(stepOptions.length === 0 ? defaultOption : stepOptions);

  const handleUpdateSteps = () => {
    const value = {
      serviceId: serviceId,
      steps: options
    };
    setIsUpatingSteps(true)
    axiosInstance()
      .post(`${serviceMaster.api}/steps`, value)
      .then(() => {
        handleSucess()
        toastConfig.setToastConfig({
          open: true,
          message: 'Steps updated successfully',
          severity: 'success'
        });
        setIsUpatingSteps(false)
      })
      .catch((err) => {
        setIsUpatingSteps(false)
        toastConfig.setToastConfig(err);
      });
  };

  useEffect(() => {
    setUpdate(!isUpdate);
  }, [options]);

  const onChangeValue = (index, value) => {
    let data = [...options];
    data[index].step = value;
    setOptions([...data]);
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
    }, [options]);

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
    <Dialog
      maxWidth="md"
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          handleClose();
        }
      }}
      fullWidth
    >
      <Fragment>
        <CustomDialogHeader
          title={'Add/Update Steps'}
          onClose={() => {
            handleClose();
          }}
          isMinimized={!fullScreen}
          onMinimizeMaximize={() => {
            setFullScreen((prevState) => !prevState);
          }}
          showManimizeMaximize={true}
          showRequiredLabel={false}
        ></CustomDialogHeader>
        <CustomDialogContent>
          <DndProvider backend={isMobile || isTablet ? TouchBackend : HTML5Backend}>
            <Box border={1} mt={1} bgcolor="grey.100" borderColor="grey.300">
              <FixedSizeList
                height={300}
                width={'100%'}
                itemSize={60}
                itemData={options && options}
                itemCount={options && options.length}>
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
              handleClose();
            }}
          >
            Cancel
          </Button>
          <CustomButton
            loading={isUpatingSteps}
            variant="contained"
            color="primary"
            type="submit"
            onClick={(e) => {
              e.preventDefault();
              handleUpdateSteps();
            }}
            disabled={isUpatingSteps}
          >Save
          </CustomButton>
        </CustomDialogFooter>
      </Fragment>
    </Dialog>
  );
}
