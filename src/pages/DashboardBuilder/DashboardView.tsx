import React from 'react';

import { Droppable } from '@hello-pangea/dnd';
import { IFormDataType } from './builderHelpers';
import DashboardItem from './DashboardItem';

interface ViewProps {
  formData: IFormDataType[];
  setFormData?: React.Dispatch<React.SetStateAction<IFormDataType[]>>;
  handleEdit: (data: IFormDataType) => void;
  handleRemove: (id: string) => void;
  selectedData?: IFormDataType | null;
}

const View = ({ formData, setFormData, handleEdit, handleRemove, selectedData }: ViewProps) => {
  return (
    <>
      {formData.length > 0 && (
        <>
          <Droppable droppableId="arrangeView">
            {(provided) => (
              <ul className="list-none overflow-y-auto max-h-[75vh] space-y-3" {...provided.droppableProps} ref={provided.innerRef}>
                {formData.map((form: IFormDataType, index) => (
                  <DashboardItem
                    key={form.chartTitle + ' ' + index}
                    id={form.uniqueId}
                    formData={form}
                    index={index}
                    handleEdit={handleEdit}
                    handleRemove={handleRemove}
                    selectedData={selectedData}
                  />
                ))}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </>
      )}
    </>
  );
};

export default View;
