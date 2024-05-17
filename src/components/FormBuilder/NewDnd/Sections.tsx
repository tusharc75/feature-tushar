import { SortableContext } from '@dnd-kit/sortable';
import { useMemo } from 'react';
import SingleSection from './SingleSection';
import { ThemeButton } from 'src/components/Helpers/Buttons';

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
  const sectionIds = useMemo(() => sections.map((s) => s.sectionId), [sections]);

  return (
    <div className=" container-with-border p-5 space-y-2 max-h-[calc(100vh-200px)] overflow-auto max-[960px]:h-[calc(100vh-200px)] overflow-x-hidden !overflow-y-auto">
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
          <div className="p-8">
            <p className="text-center">Drag and drop your sections here</p>
          </div>
        )}
      </SortableContext>
      <div className=" text-center my-4">
        <ThemeButton iconForMobile={false} onClick={() => addSection(sections.length)}>
          Add Section
        </ThemeButton>
      </div>
    </div>
  );
}
