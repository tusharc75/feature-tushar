import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { IconButton, Menu, MenuItem, TextField } from '@mui/material';
import { DragIndicator, Settings } from '@material-ui/icons';
import update from 'immutability-helper';
import React, { useMemo } from 'react';
import Field from './Field';
import { SectionProperties } from '../Properties/SectionProperties';

type SingleSectionPorps = {
  section: any;
  setSections: (data: any[]) => void;
  addSection: (index?: number) => void;
  index: number;
  sections: any[];
  onAddRemoveField: any;
  addDeleteField: any;
  module: any;
  extraFields: any;
  isCalculativeField: any;
  brandId: any;
};

const SingleSection = ({
  section,
  addSection,
  index,
  setSections,
  sections,
  onAddRemoveField,
  addDeleteField,
  module,
  extraFields,
  isCalculativeField,
  brandId
}: SingleSectionPorps) => {
  const fieldIdList = useMemo(() => section.field?.map((f) => f._id) || [], [section.field]);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const [openProperties, setOpenProperties] = React.useState(false);

  const handleClose = () => {
    setAnchorEl(null);
  };

  const onChangeSectionName = (sectionId, value) => {
    setSections(
      update(sections, {
        $apply: (b) =>
          b.map((item) => {
            if (item.sectionId !== sectionId) return item;
            return {
              ...item,
              sectionName: value
            };
          })
      })
    );
  };

  const deleteSection = (sectionId) => {
    if (onAddRemoveField) onAddRemoveField();
    setSections(sections.filter((i) => i.sectionId.toString() !== sectionId.toString()));
    handleClose();
  };

  const { setNodeRef, attributes, listeners, transform, transition, active, over, isDragging } = useSortable({
    id: `${section.sectionId}`,
    data: {
      type: 'Section',
      index,
      data: section,
      props: {
        section,
        addSection,
        index,
        setSections,
        sections,
        onAddRemoveField,
        addDeleteField,
        module,
        extraFields,
        isCalculativeField,
        brandId
      }
    }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition
  };

  const isPreviewVisible = active?.data.current?.type === 'NewSection' && over && over.id === `${section.sectionId}`;
  const isDropPreviewVisible =
    ['SidebarItem', 'SidebarCustomItem', 'Field'].includes(active?.data.current?.type) &&
    over &&
    over.id === `${section.sectionId}` &&
    section.field?.length === 0;

  return (
    <>
      {isPreviewVisible && (
        <div className="flex min-h-[128px] items-center justify-center bg-[var(--dark-secondary,theme('colors.slate.100'))] p-2 text-center text-4xl font-bold text-gray-300 [border:5px_dashed_var(--common-border-color)] dark:text-gray-600">
          Drop
        </div>
      )}
      <div
        ref={setNodeRef}
        style={style}
        className={`p-2 ${
          isDragging
            ? "bg-[var(--dark-secondary,theme('colors.cyan.100'))] [border:1px_dashed_var(--common-border-color)]"
            : 'border border-[var(--common-border-color)] bg-[var(--dark-primary,white)]'
        }   transition-all duration-300`}
      >
        <div className={isDragging ? 'opacity-40' : ''}>
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <IconButton size="small" {...attributes} {...listeners} className="drag-handle !cursor-grab">
                <DragIndicator fontSize="small" />
              </IconButton>
              <TextField
                id="standard-basic"
                variant="outlined"
                margin="dense"
                value={section.sectionName}
                onChange={(event) => onChangeSectionName(section.sectionId, event.target.value)}
              />
            </div>
            <IconButton aria-label="setting" onClick={handleClick}>
              <Settings fontSize="small" />
            </IconButton>
            <Menu id="simple-menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleClose}>
              <MenuItem
                onClick={() => {
                  setOpenProperties(true);
                  handleClose();
                }}
              >
                Edit Properties
              </MenuItem>
              {/* <MenuItem
                onClick={() => deleteSection(section.sectionId)}
                disabled={section.field.filter((_field) => _field.editAble === false).length > 0 ? true : true}
              >
                Delete
              </MenuItem> */}
            </Menu>
          </div>
          {section.field.length === 0 ? (
            <div className="text-center">
              {isDropPreviewVisible ? (
                <div className=" py-8 text-4xl font-bold text-gray-300 [border:5px_dashed_var(--dark-secondary,theme('colors.cyan.100'))] dark:text-gray-600">
                  Drop
                </div>
              ) : (
                <div className="py-8 ">Drag and drop your fields here</div>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-12 gap-2">
                <SortableContext items={fieldIdList}>
                  {section.field.map((f, index) => {
                    return (
                      <Field
                        sections={sections}
                        key={f._id}
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
                        sectionId={section.sectionId}
                        data={f}
                      />
                    );
                  })}
                </SortableContext>
              </div>
            </>
          )}
        </div>
      </div>
      {openProperties && (
        <SectionProperties handleClose={() => setOpenProperties(false)} section={section} setSections={setSections} sections={sections} />
      )}
    </>
  );
};

export default SingleSection;
