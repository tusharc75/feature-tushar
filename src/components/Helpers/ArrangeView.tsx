import { Button, createStyles, Dialog, Theme, makeStyles, Box, Grid, Typography } from '@material-ui/core';
import React, { useEffect } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { DndProvider, DropTargetMonitor, useDrag, useDrop, XYCoord } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import update from 'immutability-helper';
import CustomButton from 'src/components/Helpers/CustomButton';
import IconButton from "@material-ui/core/IconButton";
import { DragIndicator } from "@material-ui/icons";
import TextField from "@material-ui/core/TextField";

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            width: '100%',
            maxHeight: 400,
            backgroundColor: theme.palette.background.paper
        },
        cursor: {
            cursor: 'move'
        }
    })
);

const ItemTypes = {
    CARD: 'card'
};

const ArrangeView = ({ data, title, handleClose, handleSubmit, loading }) => {

    const [rows, setRows] = React.useState([]);

    useEffect(() => {
        setRows(data?.sort((a, b) => a.order - b.order));
    }, [data]);

    const moveItem = React.useCallback(
        (dragIndex: number, hoverIndex: number) => {
            const dragCard = rows[dragIndex];
            const updatedIndexColumns = update(rows, {
                $splice: [
                    [dragIndex, 1],
                    [hoverIndex, 0, dragCard]
                ]
            });
            setRows(updatedIndexColumns);
        },
        [rows]
    );

    const onChangeValue = (index, field, value) => {
        let data = [...rows];
        data[index][field] = value;
        setRows(data);
    };

    return (<Dialog
        open
        fullWidth
        maxWidth="sm"
        onClose={handleClose}
    >
        <CustomDialogHeader
            title={title}
            showRequiredLabel={false}
            onClose={handleClose} />
        <CustomDialogContent>
            <DndProvider backend={isMobile || isTablet ? TouchBackend : HTML5Backend}>
                {rows?.length ? (
                    rows?.map((column: any, index) => (
                        <RenderListItem
                            key={column.field}
                            column={column}
                            moveItem={moveItem}
                            index={index}
                            onChangeValue={onChangeValue}
                            id={column.field}
                        />
                    ))
                ) : (
                    <div>No Data Found</div>
                )}
            </DndProvider>
        </CustomDialogContent>
        <CustomDialogFooter>
            <Button
                variant="outlined"
                size="small"
                color="primary"
                onClick={handleClose}>
                Cancel
            </Button>
            <CustomButton
                loading={loading}
                variant="contained"
                color="primary"
                type="submit"
                onClick={(e) => {
                    e.preventDefault();
                    handleSubmit(rows);
                }}
                disabled={loading}
            >Save
            </CustomButton>
        </CustomDialogFooter>
    </Dialog>
    );
};

interface DragItem {
    index: number;
    id: string;
    type: string;
}

const RenderListItem = ({ column, moveItem, id, index, onChangeValue }) => {

    const ref = React.useRef<HTMLDivElement>(null);
    const [{ handlerId }, drop] = useDrop({
        accept: ItemTypes.CARD,
        collect(monitor) {
            return {
                handlerId: monitor.getHandlerId()
            };
        },
        hover(item: DragItem, monitor: DropTargetMonitor) {
            if (!ref.current) {
                return;
            }
            const dragIndex = item.index;
            const hoverIndex = index;

            // Don't replace items with themselves
            if (dragIndex === hoverIndex) {
                return;
            }
            // Determine rectangle on screen
            const hoverBoundingRect = ref.current?.getBoundingClientRect();
            // Get vertical middle
            const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
            // Determine mouse position
            const clientOffset = monitor.getClientOffset();
            // Get pixels to the top
            const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;
            // Dragging downwards
            if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
                return;
            }
            // Dragging upwards
            if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
                return;
            }
            moveItem(dragIndex, hoverIndex);
            item.index = hoverIndex;
        }
    });

    const [{ isDragging }, drag] = useDrag({
        type: ItemTypes.CARD,
        item: () => {
            return { id, index };
        },
        collect: (monitor: any) => ({
            isDragging: monitor.isDragging()
        })
    });

    const opacity = isDragging ? 0 : 1;
    drag(drop(ref));

    return (
        <div ref={ref} style={{ opacity }} data-handler-id={handlerId}>
            <Box bgcolor="white" border={1} mb={1} p={1} borderColor="grey.300">
                <Grid container spacing={1}>
                    <Grid item xs={1}>
                        <Box pt={1}>
                            <IconButton size='small'>
                                <DragIndicator fontSize='small' />
                            </IconButton>
                        </Box>
                    </Grid>
                    <Grid item xs={7}>
                        <Box pt={1}>
                            <Typography variant="subtitle2" gutterBottom>{column?.name}</Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={4}>
                        <TextField
                            id="standard-basic"
                            variant="outlined"
                            margin="dense"
                            type="number"
                            fullWidth
                            style={{ margin: 0 }}
                            value={column?.order}
                            onChange={(e) =>
                                onChangeValue(index, "order", parseInt(e.target.value))
                            }
                        />
                    </Grid>
                </Grid>
            </Box>
        </div>
    );
};

export default ArrangeView;
