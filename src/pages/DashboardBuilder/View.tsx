import React from 'react';
import { Grid, Paper, Box, IconButton, makeStyles, ThemeOptions } from '@material-ui/core';
import { Edit, Delete } from '@material-ui/icons';
import { DndProvider, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import update from 'immutability-helper';

import { IFormDataType } from './builderHelpers';

const useClasses = makeStyles((theme: ThemeOptions) => ({
  chartViews: {
    overflowY: 'auto',
    maxHeight: 'calc(80vh + 10px)'
  },
  paper: {
    padding: '16px',
    textAlign: 'center',
    color: theme.palette.text.secondary,
    width: '100%',
    minHeight: '250px',

    '&:hover': {
      icons: {
        display: 'block'
      }
    }
  },
  icons: {
    display: 'none'
  }
}));

interface ViewProps {
  formData: IFormDataType[];
  setFormData?: React.Dispatch<React.SetStateAction<IFormDataType[]>>;
}

const itemTypes = {
  CARD: 'card'
};

const View = ({ formData, setFormData }: ViewProps) => {
  const classes = useClasses();

  const findCard = React.useCallback(
    (id: string) => {
      const card = formData.find((c) => c.uniqueId === id);
      return {
        card,
        index: formData.indexOf(card)
      };
    },
    [formData]
  );

  const moveCard = React.useCallback(
    (id: string, atIndex: number) => {
      const { card, index } = findCard(id);
      setFormData(
        update(formData, {
          $splice: [
            [index, 1],
            [atIndex, 0, card]
          ]
        })
      );
    },
    [findCard, formData, setFormData]
  );

  const [, drop] = useDrop(() => ({ accept: itemTypes.CARD }));
  

  return (
    <DndProvider backend={HTML5Backend}>
      <Grid ref={drop} container spacing={1} className={classes.chartViews}>
        {formData.length > 0 &&
          formData.map((form: IFormDataType, index) => (
            <Grid item xs={form.column} key={form.chartTitle + ' ' + index}>
              <Paper className={classes.paper}>
                <p>{form.chartTitle}</p>
                <p>col = {form.column}</p>
                <Box mt={2} className={classes.icons}>
                  <IconButton size="small">
                    <Edit />
                  </IconButton>
                  <IconButton size="small">
                    <Delete />
                  </IconButton>
                </Box>
              </Paper>
            </Grid>
          ))}
      </Grid>
    </DndProvider>
  );
};

export default View;
