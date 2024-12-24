import { CSS } from '@dnd-kit/utilities';
import { ECOM_SECTIONS } from 'src/constants/helpers';

import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { IconButton } from '@mui/material';
import { DragIndicator } from '@mui/icons-material';

const Sidebar = () => {
  return (
    <SortableContext items={ECOM_SECTIONS.map((d) => d._id)}>
      <ul className=" container-with-border list-none space-y-2 p-4">
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
      className="flex list-none items-center justify-between gap-2 bg-[var(--dark-secondary,white)] p-2 [border:1px_solid_var(--common-border-color)]"
      style={style}
      ref={setNodeRef}
    >
      {item.label}
      <IconButton size="small" {...attributes} {...listeners} className=" drag-handle !cursor-grab">
        <DragIndicator />
      </IconButton>
    </li>
  );
};
