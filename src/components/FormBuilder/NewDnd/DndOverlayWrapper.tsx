import { DragOverlay, DragStartEvent, useDndMonitor } from '@dnd-kit/core';
import { useState } from 'react';
import { SidebarItem } from './Sidebar';
import SingleSection from './SingleSection';
import Field from './Field';
import { SingleCustomField } from './CustomFields';

const DndOverlayWrapper = () => {
  const [activeSidebarItem, setActiveSidebarItem] = useState(null);
  const [activeSection, setActiveSection] = useState(null);
  const [activeField, setActiveField] = useState(null);
  const [activeSidebarCustomItem, setActiveSidebarCustomItem] = useState(null);

  const onDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'SidebarItem' || active.data.current?.type === 'NewSection') {
      setActiveSidebarItem(active.data.current?.data);
    }
    if (active.data.current?.type === 'Section') {
      setActiveSection(active.data.current?.props);
    }
    if (active.data.current?.type === 'Field') {
      setActiveField(active.data.current?.props);
    }
    if (active.data.current?.type === 'SidebarCustomItem') {
      setActiveSidebarCustomItem(active.data.current?.props);
    }
  };

  const onDragEnd = () => {
    setActiveSidebarItem(null);
    setActiveSection(null);
    setActiveField(null);
    setActiveSidebarCustomItem(null);
  };

  useDndMonitor({
    onDragStart,
    onDragEnd
  });

  return (
    <>
      <DragOverlay>
        {activeSection && (
          <span className=" [&_.drag-handle]:!cursor-grabbing">
            <SingleSection {...activeSection} />
          </span>
        )}
        {activeField && (
          <span className=" [&_.drag-handle]:!cursor-grabbing">
            <Field {...activeField} />
          </span>
        )}
      </DragOverlay>
      <DragOverlay dropAnimation={null}>
        {activeSidebarItem && (
          <span className=" [&_.drag-handle]:!cursor-grabbing">
            <SidebarItem item={activeSidebarItem} />
          </span>
        )}
        {activeSidebarCustomItem && (
          <span className=" [&_.drag-handle]:!cursor-grabbing">
            <SingleCustomField {...activeSidebarCustomItem} />
          </span>
        )}
      </DragOverlay>
    </>
  );
};

export default DndOverlayWrapper;
