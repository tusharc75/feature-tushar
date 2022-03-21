import React from 'react';
import { Grid, makeStyles, ThemeOptions } from '@material-ui/core';
import { useDrop } from 'react-dnd';
import update from 'immutability-helper';

import { IFormDataType } from './builderHelpers';
import DashboardItem from './DashboardItem';

const useClasses = makeStyles((theme: ThemeOptions) => ({
  chartViews: {
    overflowY: 'auto',
    maxHeight: 'calc(80vh + 10px)',
    transition: '500ms all ease-in-out'
  }
}));

interface ViewProps {
  formData: IFormDataType[];
  setFormData?: React.Dispatch<React.SetStateAction<IFormDataType[]>>;
  handleEdit: (data: IFormDataType) => void;
  handleRemove: (id: string) => void;
  selectedData?: IFormDataType | null;
}

const itemTypes = {
  CARD: 'card'
};

const View = ({ formData, setFormData, handleEdit, handleRemove, selectedData }: ViewProps) => {
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
    <Grid ref={drop} container spacing={1} className={classes.chartViews}>
      {formData.length > 0 &&
        formData.map((form: IFormDataType, index) => (
          <DashboardItem
            key={form.chartTitle + ' ' + index}
            id={form.uniqueId}
            formData={form}
            findCard={findCard}
            moveCard={moveCard}
            itemTypes={itemTypes}
            handleEdit={handleEdit}
            handleRemove={handleRemove}
            selectedData={selectedData}
          />
        ))}
    </Grid>
  );
};

export default View;
