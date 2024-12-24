import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Grid, IconButton } from '@mui/material';
import { Delete, DragIndicator, Edit } from '@material-ui/icons';
import React, { useState } from 'react';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import ConfigureItemDialog from './ConfigureItemDialog';

export type FormData = {
  _id: string;
  type: string;
  label: string;
  column: string;
  order: number;
  detail?: string;
  url?: string;
  images?: string[];
  title?: string;
  image?: string;
  kpi?: string;
};

type DropContainerProps = {
  formData: FormData[];
  setFormData: React.Dispatch<React.SetStateAction<FormData[]>>;
  handleRemove: (id: string) => void;
};

const DropContainer = ({ formData, setFormData, handleRemove }: DropContainerProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'EmptySection',
    data: {
      type: 'EmptySection'
    }
  });

  return (
    <Grid component={'ul'} container className=" min-h-[200px] list-none" ref={setNodeRef} spacing={1}>
      <SortableContext items={formData?.map((d) => d._id) || []} strategy={verticalListSortingStrategy}>
        {formData.map((d, index) => {
          return <SingleSection key={d._id} itemData={d} index={index} setFormData={setFormData} handleRemove={handleRemove} />;
        })}
      </SortableContext>
      {isOver && (
        <Grid item xs={12} className="bg-[var(--dark-secondary, white)]">
          <div className="p-10  text-center text-4xl font-bold text-gray-400 [border:4px_dashed_var(--common-border-color)] dark:text-gray-600">
            Drop here
          </div>
        </Grid>
      )}
    </Grid>
  );
};

export default DropContainer;

export const SingleSection = ({ itemData, index, handleRemove, setFormData }) => {
  const [editDialog, setEditDialog] = useState(false);

  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: itemData._id,
    data: {
      type: 'Section',
      index,
      props: { itemData, index, handleRemove, setFormData }
    }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition
  };
  return (
    <>
      <Grid item component={'li'} xs={itemData.column} ref={setNodeRef} style={style} className=" list-none">
        <div
          className={`flex items-center justify-between gap-2 ${
            isDragging ? 'bg-[var(--dark-primary,theme("colors.blue.200"))]' : 'bg-[var(--dark-secondary,white)] '
          } list-none p-4 [border:1px_solid_var(--common-border-color)]`}
        >
          <div className="flex items-center gap-2">
            <IconButton size="small" {...attributes} {...listeners} className="drag-handle !cursor-grab">
              <DragIndicator />
            </IconButton>
            <h6 className="truncate text-[1rem] font-semibold leading-[1.5]">{itemData.label}</h6>
          </div>
          <div className="flex items-center">
            <HtmlTooltip title="Edit">
              <IconButton
                onClick={() => {
                  setEditDialog(true);
                }}
                style={{ display: 'flex', justifyContent: 'flex-end' }}
                size="small"
              >
                <Edit color="primary" />
              </IconButton>
            </HtmlTooltip>
            <HtmlTooltip title="Delete">
              <IconButton onClick={() => handleRemove(itemData._id)} style={{ display: 'flex', justifyContent: 'flex-end' }} size="small">
                <Delete color="error" />
              </IconButton>
            </HtmlTooltip>
          </div>
        </div>
      </Grid>
      {editDialog && (
        <ConfigureItemDialog
          open={editDialog}
          onClose={() => {
            setEditDialog(false);
          }}
          itemData={itemData}
          setFormData={setFormData}
        />
      )}
    </>
  );
};
