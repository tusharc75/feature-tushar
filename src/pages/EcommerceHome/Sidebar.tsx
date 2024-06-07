import { CSS } from '@dnd-kit/utilities';
import { ECOM_SECTIONS } from 'src/constants/helpers';

import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { IconButton } from '@material-ui/core';
import { DragIndicator } from '@material-ui/icons';

const Sidebar = () => {
  return (
    <SortableContext items={ECOM_SECTIONS.map((d) => d._id)}>
      <ul className=" list-none container-with-border p-4 space-y-2">
        {ECOM_SECTIONS.map((item, index) => {
          return <SidebarItem item={item} key={item._id} index={index} />;
        })}
      </ul>
    </SortableContext>
  );
};

export default Sidebar;

export const SidebarItem = ({ item, index }) => {
  const { setNodeRef, attributes, listeners, transform, transition } = useSortable({
    id: item._id,
    data: {
      type: 'SidebarItem',
      index,
      props: { item, index }
    }
  });
  const style = {
    transform: CSS.Translate.toString(transform),
    transition
  };
  return (
    <li
      className="list-none p-2 [border:1px_solid_var(--common-border-color)] bg-[var(--dark-secondary,white)] flex justify-between gap-2 items-center"
      style={style}
      ref={setNodeRef}
    >
      {item.label}
      <IconButton size="small" {...attributes} {...listeners} className=" !cursor-grab drag-handle">
        <DragIndicator />
      </IconButton>
    </li>
  );
};
