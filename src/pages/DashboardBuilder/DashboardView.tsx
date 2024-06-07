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

const View = ({ formData, setFormData, handleEdit, handleRemove, selectedData }: ViewProps) => {
  return (
    <>
      {formData.length > 0 && (
        <>
          <SortableContext items={formData.map((d) => d.uniqueId) || []} strategy={() => null}>
            <ul className="grid max-h-[75vh] list-none grid-cols-12 gap-3 overflow-y-auto">
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
