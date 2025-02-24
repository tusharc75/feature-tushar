import React from 'react';
import { cn, displayDate } from '../../constants/helpers';

export type FollowUP = {
  _id: string;
  brand: string;
  name: string;
  description: string;
  status: string;
  parentId: null;
  assignee: string[];
  reporter: string;
  startDate: Date;
  dueDate: Date | null;
  relatedTo: RelatedTo[];
  createdBy: CreatedBy;
  position: number;
  formRelatedTo: FormRelatedTo;
};

export type CreatedBy = {
  user: string;
  date: Date;
};

export type FormRelatedTo = {
  section: string;
  fields: Field[];
};

export type Field = {
  fieldLabel: string;
  fieldName: string;
};

export type RelatedTo = {
  type: string;
  referenceId: string;
  name: string;
};

const RenderFollowUP = ({
  data,
  columnSize,
  setOpenTask
}: {
  data: FollowUP[];
  columnSize: 6 | 12;
  setOpenTask: React.Dispatch<React.SetStateAction<any>>;
}) => {
  return (
    <div className="my-2">
      <p className="mx-[10px] pb-1 text-[12px] font-semibold text-gray-500">FOLLOW-UPS</p>
      {data.map((d) => (
        <div
          className={cn(
            `relative mx-[10px] my-2  rounded-md p-2 [border:1px_solid_var(--common-border-color)]`,
            columnSize === 12 ? 'md:w-[calc(50%-20px)]' : ''
          )}
        >
          <div
            className={cn(
              'flex items-start justify-between gap-2 [flex-wrap:wrap] md:flex-nowrap',
              d.description && 'mb-1 pb-1 [border-bottom:1px_solid_var(--common-border-color)]'
            )}
          >
            <p
              className={cn('cursor-pointer text-[14px] font-semibold')}
              onClick={() => {
                setOpenTask({ open: true, _id: d?._id });
              }}
            >
              {d.name}
            </p>
            <span className="block flex-shrink-0 rounded-md bg-[var(--new-theme-color)] px-2 py-1 text-white">{d.status}</span>
          </div>
          {d.description && <p className="py-2 text-gray-600 dark:text-gray-400">{d.description}</p>}
          <span className="block text-[12px] font-bold text-gray-500 dark:text-gray-600">
            Start date: {displayDate(d.startDate)}
            {d.dueDate && <>, Due date: {displayDate(d.dueDate)}</>}
          </span>
        </div>
      ))}
    </div>
  );
};

export default RenderFollowUP;
