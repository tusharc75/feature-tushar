import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import FieldList, { sidebarItems } from '../FieldList';
import { generateId } from './helper';
import { FieldListType } from './types';
import { useMemo } from 'react';
import { useDndMonitor } from '@dnd-kit/core';
import CustomFields from './CustomFields';

const newSection = {
  id: generateId(),
  label: 'New Section',
  type: 'NewSection',
  icon: '',
  key: 'NEW_SECTION'
} as const;

const Sidebar = ({ filterFieldType, sections, setSections, onAddRemoveField, addSection, isCustomField }) => {
  const newSidebarItems = useMemo(() => {
    return sidebarItems.filter((t) => !filterFieldType.includes(t.key));
  }, [filterFieldType]);
  const ids = [newSection.id, ...newSidebarItems.map((t) => t.id)];

  const addField = (sectionId, type, index) => {
    if (onAddRemoveField) onAddRemoveField();
    let data = [...sections];
    data.forEach((row) => {
      row.field = row.field.filter((i) => i._id);
      if (row.sectionId.toString() === sectionId.toString()) {
        let count = row.field.filter((i) => i.type === type).length;
        let option = [];
        if (
          type === FieldList.DROPDOWN.type ||
          type === FieldList.MULTISELECT.type ||
          type === FieldList.RADIO.type ||
          type === FieldList.VLOOKUPDROPDOWN.type ||
          type === FieldList.PROCESS.type
        ) {
          option = [{ optionLabel: 'Option 1', optionValue: 'Option 1' }];
        }
        let insert_object: any = {
          _id: generateId().toString(),
          fieldLabel: FieldList[type?.toUpperCase()]?.label + ' ' + (count + 1),
          type: type,
          option: option,
          required: false,
          isTooltip: false,
          tooltipMessage: '',
          editAble: true,
          deletAble: true,
          order: 0
        };
        if (type === FieldList.FORMULA.type) {
          insert_object.formula = 'return ';
          insert_object.inputFields = [];
          insert_object.returnType = 'decimal';
        }
        if (
          type === FieldList.FORMULA.type ||
          type === FieldList.DECIMAL.type ||
          type === FieldList.CONVERTER.type ||
          type === FieldList.CURRENCYAMOUNT.type
        ) {
          insert_object.decimalPlaces = 2;
        }
        if (type === FieldList.VLOOKUPDROPDOWN.type) {
          insert_object.vlookupInputFields = [];
        }
        if (type === FieldList.CURRENCYAMOUNT.type) {
          insert_object.displayCurrency = ['CUR'];
        }
        if (type === FieldList.CONVERTER.type) {
          insert_object.units = [];
          insert_object.unitoption = [];
          insert_object.displayUnits = [];
          insert_object.formulaUnits = [];
        }
        if (index !== null) {
          row.field.splice(index, 0, insert_object);
        } else {
          row.field.push(insert_object);
        }
      }
    });
    setSections(data);
  };

  const addCustomField = (sectionId, fieldData, index) => {
    if (onAddRemoveField) onAddRemoveField();
    const newFieldData = new Map(Object.entries(fieldData));
    let data = [...sections];
    data.forEach((row) => {
      row.field = row.field.filter((i) => i._id);
      if (row.sectionId.toString() === sectionId.toString()) {
        newFieldData.delete('brand');
        newFieldData.delete('createdBy');
        newFieldData.delete('updatedBy');
        newFieldData.delete('_id');
        newFieldData.delete('fieldName');

        const newObj = {
          ...Object.fromEntries(newFieldData),
          _id: parseInt((Math.random() * 100000).toString()),
          ...newFieldData,
          editAble: true,
          deletAble: true,
          order: 0
        };

        if (index !== null) {
          row.field.splice(index, 0, newObj);
        } else {
          row.field.push(newObj);
        }
      }
    });
    setSections(data);
  };

  useDndMonitor({
    onDragEnd: (event) => {
      const { active, over } = event;
      const activeItemType = active.data.current?.type;
      const overItemType = over.data.current?.type;
      const overIndex = over.data.current?.index;
      const isActiveTypeSidebarItem = ['SidebarItem', 'NewSection', 'SidebarCustomItem'].includes(activeItemType);
      if (!isActiveTypeSidebarItem) return;
      const sidebarItem = active.data.current?.data;

      // Normal fields
      if (activeItemType === 'SidebarItem') {
        if (overItemType === 'Section') {
          const fieldLength = over.data.current?.data?.field?.length || 0;
          addField(over.id, sidebarItem.type, fieldLength);
        }
        if (overItemType === 'Field') {
          const sectionId = over.data.current?.sectionId;
          addField(sectionId, sidebarItem.type, overIndex);
        }
      }

      // Custom fields
      if (activeItemType === 'SidebarCustomItem') {
        if (overItemType === 'Section') {
          const fieldLength = over.data.current?.data?.field?.length || 0;
          addCustomField(over.id, sidebarItem, fieldLength);
        }
        if (overItemType === 'Field') {
          const sectionId = over.data.current?.sectionId;
          addCustomField(sectionId, sidebarItem, overIndex);
        }
      }

      // Add new section
      if (activeItemType === 'NewSection' && overItemType === 'Section') {
        addSection(overIndex);
      }
    }
  });

  return (
    <div className="container-with-border p-5 grid grid-cols-2 gap-2 h-[calc(100vh-200px)] overflow-auto max-[960px]:h-[calc(100vh-200px)] overflow-x-hidden !overflow-y-auto">
      <SortableContext items={ids} strategy={() => null}>
        <SidebarItem type={newSection.type} item={newSection} />
        {sidebarItems.map((item) => (
          <SidebarItem key={item.id} item={item} />
        ))}
      </SortableContext>
      {isCustomField && <CustomFields />}
    </div>
  );
};

export default Sidebar;

type SidebarItemProps = {
  item: FieldListType;
  type?: 'SidebarItem' | 'NewSection' | undefined;
};

export const SidebarItem = ({ item, type = 'SidebarItem' }: SidebarItemProps) => {
  const { setNodeRef, attributes, listeners, transform, transition } = useSortable({
    id: item.id,
    data: {
      type,
      data: item
    }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition
  };

  return (
    <div
      className={`p-2 border border-[var(--common-border-color)] bg-[var(--dark-secondary,white)] ${
        type === 'NewSection' ? 'col-span-2' : ''
      } cursor-grab`}
      style={style}
      {...attributes}
      {...listeners}
      ref={setNodeRef}
    >
      <p className="MuiTypography-body2 line-clamp-1" title={item.label}>
        {item.label}
      </p>
    </div>
  );
};
