import React from 'react';
import { useDrag } from 'react-dnd';
import { Box, Typography, Grid } from "@material-ui/core";
import PropTypes from "prop-types";

const style = {
    cursor: "pointer",
    backgroundColor: 'white',
    paddingTop: '8px'
};


export const DragBox = ({ name, type, label, removeExtraField }) => {

    const item = { name, type, label };

    const [{ isDragging }, drag] = useDrag({
        item,
        type: type,
        end(item, monitor) {
            const dropResult = monitor.getDropResult();
            if (!dropResult) {
                if (item.type === "field") {
                    removeExtraField()
                }
            }
        },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    const opacity = isDragging ? 0.4 : 1

    return (<>
        <Grid ref={drag} style={{ ...style, opacity }} item xs={type === "field" ? 6 : 12} >
            <Box border={1} p={1} borderColor="grey.300" className="text-truncate">
                <Typography variant="body2" className="text-truncate">{label}</Typography>
            </Box>
        </Grid>
    </>
    );
};

DragBox.propTypes = {
    name: PropTypes.string,
    type: PropTypes.string,
    label: PropTypes.string,
    removeExtraField: PropTypes.any
}
