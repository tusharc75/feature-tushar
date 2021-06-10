import React, { useCallback, useState } from 'react';
import { useDrop } from 'react-dnd';
import Box from '@material-ui/core/Box';
import { DropSection } from './DropSection';
import update from 'immutability-helper';
import { Typography } from '@material-ui/core';

const dropstyle = {
    backgroundColor: "#e3f2fd",
    borderColor: "#90caf9",
    borderStyle: "dashed",
    cursor: 'move',
    height: "150px"
}


export const DropMaster = ({ module, screenHeight, section, setSection, addSection, addDeleteField }) => {

    const [sectionHoverIndex, setSectionHoverIndex] = useState(null);
    const [fieldHoverId, setFieldHoverId] = React.useState(null);

    const [{ }, drop] = useDrop({
        accept: "master",
        drop: () => {
            addSection(sectionHoverIndex)
            setSectionHoverIndex(null)
        }
    });

    const moveSection = useCallback((dragIndex, hoverIndex) => {
        const dragCard = section[dragIndex];
        setSection(update(section, {
            $splice: [
                [dragIndex, 1],
                [hoverIndex, 0, dragCard],
            ],
        }));
    }, [section]);

    return (<div ref={drop}>
        <Box className={screenHeight}>
            {section.length > 0 ?
                section.map((data, index) => (
                    <DropSection key={data.sectionId} index={index} id={data.sectionId}
                        setSectionHoverIndex={setSectionHoverIndex} sectionHoverIndex={sectionHoverIndex}
                        // addSection={addSection} 
                        sectionId={data.sectionId} data={data} moveSection={moveSection}
                        fieldHoverId={fieldHoverId} setFieldHoverId={setFieldHoverId}
                        section={section} setSection={setSection}
                        addDeleteField={addDeleteField}
                        module={module} />
                )) : <Typography variant="body2" align="center">Drag and drop your sections here</Typography>}
        </Box>
    </div>);
};
