import React from 'react';

import { SortableContext } from '@dnd-kit/sortable';
import DashboardItem from './DashboardItem';
import { IFormDataType } from './builderHelpers';

interface ViewProps {
  formData: IFormDataType[];
  setFormData?: React.Dispatch<React.SetStateAction<IFormDataType[]>>;
  handleEdit: (data: IFormDataType) => void;
  handleRemove: (id: string) => void;
  selectedData?: IFormDataType | null;
}

function disableSortingStrategy() {
  return null;
}

const View = ({ formData, setFormData, handleEdit, handleRemove, selectedData }: ViewProps) => {
  return (
    <>
      {formData.length > 0 && (
        <>
          <SortableContext items={formData?.map((d) => d._id) || []} strategy={disableSortingStrategy}>
            <ul className="list-none overflow-y-auto max-h-[75vh] grid gap-3 grid-cols-12">
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
            </ul>
          </SortableContext>
        </>
      )}
    </>
  );
};

export default View;
