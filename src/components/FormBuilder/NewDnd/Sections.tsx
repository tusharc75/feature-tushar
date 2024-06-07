import { SortableContext } from '@dnd-kit/sortable';
import { useMemo } from 'react';
import SingleSection from './SingleSection';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { useDroppable } from '@dnd-kit/core';

type SectionPorps = {
  sections: any[];
  setSections: (data: any[]) => void;
  addSection: (index?: number) => void;
  onAddRemoveField: any;
  addDeleteField: any;
  module: any;
  extraFields: any;
  isCalculativeField: any;
  brandId: any;
};

export default function Sections({
  sections,
  setSections,
  addSection,
  onAddRemoveField,
  addDeleteField,
  module,
  extraFields,
  isCalculativeField,
  brandId
}: SectionPorps) {
  const sectionIds = useMemo(() => sections.map((s) => `${s.sectionId}`), [sections]);

  const { setNodeRef, isOver, over, active } = useDroppable({
    id: 'droppable',
    data: {
      type: 'droppable'
    }
  });

  const isNewSectionPreviewActive = active?.data.current.type === 'NewSection' && isOver;

  return (
    <div className=" container-with-border max-h-[calc(100vh-200px)] space-y-2 overflow-auto !overflow-y-auto overflow-x-hidden p-5 max-[960px]:h-[calc(100vh-200px)]">
      <SortableContext items={sectionIds} strategy={() => null}>
        {sections.length > 0 ? (
          <>
            {sections?.map((section, index) => (
              <SingleSection
                sections={sections}
                key={section.sectionId}
                section={section}
                index={index}
                addSection={addSection}
                setSections={setSections}
                onAddRemoveField={onAddRemoveField}
                addDeleteField={addDeleteField}
                module={module}
                extraFields={extraFields}
                isCalculativeField={isCalculativeField}
                brandId={brandId}
              />
            ))}
          </>
        ) : (
          <div
            className={`${isNewSectionPreviewActive ? 'flex min-h-[160px] items-center justify-center bg-blue-200 p-10' : 'p-8'} transition-all`}
            ref={setNodeRef}
          >
            <p className={`${isNewSectionPreviewActive ? 'text-center text-2xl font-bold text-gray-400 dark:text-gray-600' : ''} text-center`}>
              {isNewSectionPreviewActive ? 'Drop New Section' : 'Drag and drop your sections here'}
            </p>
          </div>
        )}
      </SortableContext>
      <div className=" my-4 text-center">
        <ThemeButton iconForMobile={false} onClick={() => addSection(sections.length)}>
          Add Section
        </ThemeButton>
      </div>
    </div>
  );
}
