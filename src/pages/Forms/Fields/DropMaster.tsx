import React, { useCallback, useState } from 'react';
import { useDrop } from 'react-dnd';
import Box from '@material-ui/core/Box';
import update from 'immutability-helper';
import { Button, Typography } from '@material-ui/core';
import styles from './fields.module.css';
import DropSection from './DropSection';

export const DropMaster = ({ section, setSection, addSection }) => {
  const [sectionHoverIndex, setSectionHoverIndex] = useState(null);
  const [fieldHoverId, setFieldHoverId] = React.useState(null);

  const [{}, drop] = useDrop({
    accept: 'master',
    drop: () => {
      addSection(sectionHoverIndex);
      setSectionHoverIndex(null);
    }
  });

  const moveSection = useCallback((dragIndex, hoverIndex) => {
    const dragCard = section[dragIndex];
    setSection(
      update(section, {
        $splice: [
          [dragIndex, 1],
          [hoverIndex, 0, dragCard]
        ]
      })
    );
  }, []);

  return (
    <div ref={drop}>
      <Box className={styles.set_gridbox_layout}>
        {section && section?.length ? (
          section?.map((_section, index) => {
            return (
              <DropSection
                key={_section?.sectionId}
                sectionHoverIndex={sectionHoverIndex}
                setSectionHoverIndex={setSectionHoverIndex}
                fieldHoverId={fieldHoverId}
                setFieldHoverId={setFieldHoverId}
                index={index}
                sectionId={_section.sectionId}
                moveSection={moveSection}
                section={section}
                setSection={setSection}
                data={_section}
              />
            );
          })
        ) : (
          <Typography variant="body2" align="center">
            Drag and drop your sections here
          </Typography>
        )}
        <Box display="flex" justifyContent="center" alignItems="center" pt={2}>
          <Button
            type="button"
            variant="contained"
            color="primary"
            size="small"
            onClick={() => {
              addSection(section?.length);
            }}
          >
            Add Section
          </Button>
        </Box>
      </Box>
    </div>
  );
};
