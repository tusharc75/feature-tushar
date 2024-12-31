import Box from '@mui/material/Box';
import { CHILD_RESOURCE, addItemAtIndex, removeItemAtIndex } from '../../constants/helpers';

import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useDndSensors } from 'src/hooks';
import DndOverlayWrapper from './NewDnd/DndOverlayWrapper';
import Sections from './NewDnd/Sections';
import Sidebar from './NewDnd/Sidebar';
import { generateId } from './NewDnd/helper';

export const subForms = [
  CHILD_RESOURCE.rentalManagementProduct,
  CHILD_RESOURCE.rentalManagementCost,
  CHILD_RESOURCE.salesOrderProduct,
  CHILD_RESOURCE.salesOrderCost,
  CHILD_RESOURCE.purchaseOrderProduct,
  CHILD_RESOURCE.purchaseOrderCost,
  CHILD_RESOURCE.repairJobAsset,
  CHILD_RESOURCE.subleaseProduct
];

export const FormBuilder = ({
  section,
  setSection,
  deleteField,
  setDeleteField,
  isCustomField,
  module,
  extraFields,
  resource,
  onAddRemoveField = null,
  brandId
}) => {
  const addSection = (sectionHoverIndex) => {
    let data = [...section];
    if (onAddRemoveField) onAddRemoveField();
    if (sectionHoverIndex !== null) {
      const obj = {
        sectionId: generateId(),
        sectionName: 'New Section ' + (data.length + 1),
        srno: data.length + 1,
        field: []
      };
      data.splice(sectionHoverIndex, 0, obj);
    } else {
      data.push({
        sectionId: generateId(),
        sectionName: 'New Section ' + (data.length + 1),
        srno: data.length + 1,
        field: []
      });
    }
    setSection(data);
  };

  const addDeleteField = (_id) => {
    if (isNaN(_id)) {
      let data = [...deleteField];
      data.push({ _id: _id });
      setDeleteField(data);
    }
  };

  var filterFieldType = [];
  var isCalculativeField = true;
  if (module === 'form-builder') {
    isCalculativeField = true;
  }
  if (subForms.includes(resource)) {
    filterFieldType = [];
    isCalculativeField = true;
  }

  const movefield = (event: DragEndEvent) => {
    const { active, over } = event;

    const { data: item, sectionId } = active.data.current?.props || {};
    const activeItemType = active.data.current?.type;
    const overItemType = over.data.current?.type;
    const activeIndex = active.data.current?.index;
    const overIndex = over.data.current?.index;
    const overSectionId = over.data.current?.sectionId;
    if (activeItemType !== 'Field') return;

    const newSections = [...section];
    const sourceSectionIndex = newSections.findIndex((section) => section.sectionId === sectionId);

    if (overItemType === 'Field' && activeItemType === 'Field') {
      const destinationSectionIndex = newSections.findIndex((section) => section.sectionId === overSectionId);
      if (destinationSectionIndex === -1) return;
      const destionationSection = newSections[destinationSectionIndex];
      const isInSameSection = destionationSection.sectionId === sectionId;
      if (isInSameSection) {
        newSections[destinationSectionIndex].field = arrayMove(newSections[destinationSectionIndex].field, activeIndex, overIndex);
        setSection([...newSections]);
      } else {
        const sourceSection = newSections[sourceSectionIndex];
        const sourceFields = removeItemAtIndex(sourceSection.field, activeIndex);
        const destinationFields = addItemAtIndex(destionationSection.field, item, overIndex);
        newSections[sourceSectionIndex].field = sourceFields;
        newSections[destinationSectionIndex].field = destinationFields;
        setSection([...newSections]);
      }
    } else if (activeItemType === 'Field' && overItemType === 'Section') {
      const overSectionId = over.data.current?.props?.section?.sectionId;
      if (sectionId === overSectionId) {
        return;
      }
      const destinationSectionIndex = over.data.current.index;
      const destionationSection = newSections[destinationSectionIndex];
      const overIndex = destionationSection.field.length;
      const sourceSection = newSections[sourceSectionIndex];
      const sourceFields = removeItemAtIndex(sourceSection.field, activeIndex);
      const destinationFields = addItemAtIndex(destionationSection.field, item, overIndex);
      newSections[sourceSectionIndex].field = sourceFields;
      newSections[destinationSectionIndex].field = destinationFields;
      setSection([...newSections]);
    }
  };

  const moveSection = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;
    const activeItemType = active.data.current?.type;
    const overItemType = over.data.current?.type;
    if (activeItemType !== 'Section' || overItemType !== 'Section') return;
    const activeIndex = active.data.current?.index;
    const overIndex = over.data.current?.index;
    const newSections = arrayMove(section, activeIndex, overIndex);
    setSection(newSections);
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;
    movefield(event);
  };

  const sensors = useDndSensors();

  return (
    <Box>
      <DndContext onDragEnd={onDragEnd} onDragOver={moveSection} sensors={sensors}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[280px_1fr] lg:grid-cols-[300px_1fr] xl:grid-cols-[350px_1fr]">
          <Sidebar
            filterFieldType={filterFieldType}
            sections={section}
            setSections={setSection}
            onAddRemoveField={onAddRemoveField}
            addSection={addSection}
            isCustomField={isCustomField}
          />
          <Sections
            addSection={addSection}
            sections={section}
            setSections={setSection}
            onAddRemoveField={onAddRemoveField}
            addDeleteField={addDeleteField}
            module={module}
            extraFields={extraFields}
            isCalculativeField={isCalculativeField}
            brandId={brandId}
          />
        </div>
        <DndOverlayWrapper />
      </DndContext>
      {/* <DndProvider backend={isMobile || isTablet ? TouchBackend : HTML5Backend}>
        <Grid container spacing={1}>
          <Grid item xs={12} md={3} sm={4}>
            <Box
              border={1}
              p={2}
              borderColor="var(--common-border-color)"
              className={`h-[calc(100vh-200px)] overflow-auto max-[960px]:h-[calc(100vh-200px)] overflow-x-hidden`}
            >
              <Box pt={1} pb={1} pr={'8px'}>
                <DragBox name="New Section" label="New Section" type="master"></DragBox>
              </Box>
              <Grid container spacing={1} className={`max-[960px]:grid grid-cols-1 max-[960px]:w-[200%] max-[960px]:pb-[15px]`}>
                {Object.keys(FieldList).map((type, index) => {
                  return !filterFieldType.includes(type) ? (
                    <DragBox key={index} type="field" label={FieldList[type].label} name={FieldList[type].type} removeExtraField={removeExtraField} />
                  ) : null;
                })}
              </Grid>
              <CustomField />
              {isCustomField && (
                <Box>
                  <CustomField />
                </Box>
              )}
            </Box>
          </Grid>
          <Grid item xs={12} md={9} sm={8}>
            <Box
              border={1}
              p={2}
              borderColor="var(--common-border-color)"
              className={module === 'form-builder' ? classes.screenHeightAutoFormBuilder : classes.screenHeightAutoFormTemplate}
            >
              <DropMaster
                addSection={addSection}
                setSection={setSection}
                section={section}
                addDeleteField={addDeleteField}
                screenHeight={classes.screenHeight}
                module={module}
                extraFields={extraFields}
                onAddRemoveField={onAddRemoveField}
                isCalculativeField={isCalculativeField}
                brandId={brandId}
              />
            </Box>
          </Grid>
        </Grid>
      </DndProvider> */}
    </Box>
  );
};
