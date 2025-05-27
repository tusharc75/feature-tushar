import React, { useContext } from 'react';
import { cn, displayDate } from '../../constants/helpers';
import { IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

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
  setOpenTask,
  handleRefresh
}: {
  data: FollowUP[];
  columnSize: 6 | 12;
  setOpenTask: React.Dispatch<React.SetStateAction<any>>;
  handleRefresh: any
}) => {

  const toastConfig = useContext(CustomToastContext);

  const {
    state: { user }
  }: any = useData();

  const handleDelete = (taskId) => {
    axiosInstance().delete(`/task/${taskId}`).then(({ data }) => {
      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: data.message
      });
      handleRefresh()
    }).catch((error) => {
      toastConfig.setToastConfig(error);
    });
  };

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
          <div className="flex justify-between items-center pt-2">
            <div className="text-left">
              <span className="block text-[12px] font-bold text-gray-500 dark:text-gray-600">
                Start date: {displayDate(d.startDate)}
                {d.dueDate && <>, Due date: {displayDate(d.dueDate)}</>}
              </span>
            </div>
            {d?.createdBy?.user === user?.user?._id &&
              <div className="text-right">
                <HtmlTooltip title='Delete'>
                  <IconButton
                    size="small"
                    aria-label="delete"
                    onClick={() => {
                      handleDelete(d._id)
                    }}
                  >
                    <DeleteIcon fontSize='small' color='error' />
                  </IconButton>
                </HtmlTooltip>
              </div>}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RenderFollowUP;
