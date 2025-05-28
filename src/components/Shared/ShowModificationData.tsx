import { Typography } from '@mui/material';
import { useMemo } from 'react';
import { cn, displayDate, displayDateTime } from 'src/constants/helpers';

type HandleGetUpdateDataProps = {
  date: string;
  user?: {
    concatedName?: string;
    firstName?: string;
    lastName?: string;
    _id: string;
  };
};
type HandleGetUpdateDataR = { name: string; user: string; date: string; id: string };
const handleGetUpdateData = (data: HandleGetUpdateDataProps, name: string) => {
  const newData: HandleGetUpdateDataR = { name: name, user: '', date: data.date, id: data.user?._id };
  if (data.user?.concatedName) {
    newData['user'] = data.user?.concatedName;
  } else {
    newData['user'] = `${data.user?.firstName} ${data.user?.lastName}`;
  }
  return newData;
};

const ShowModificationData = ({ data, containerPadding, resource }: { data: Record<string, any>; containerPadding: string | number, resource: string }) => {
  const modificationData = useMemo(() => {
    const newData: HandleGetUpdateDataR[] = [];
    if (data?.createdBy?.user && (data?.createdBy?.user?.firstName || data?.createdBy?.user?.concatedName)) {
      newData.push(handleGetUpdateData(data.createdBy, 'Created by'));
    }
    if (data?.updatedBy?.user && (data?.updatedBy?.user?.firstName || data?.updatedBy.user?.concatedName)) {
      newData.push(handleGetUpdateData(data.updatedBy, 'Updated by'));
    }
    if (data?.completedBy?.user && (data?.completedBy?.user?.firstName || data?.completedBy?.user?.concatedName)) {
      newData.push(handleGetUpdateData(data.completedBy, 'Completed by'));
    }
    if (resource && data?.lastActivityBy?.user && (data?.lastActivityBy?.user?.firstName || data?.lastActivityBy?.user?.concatedName)) {
      newData.push(handleGetUpdateData(data.lastActivityBy, 'Last Activity by'));
    }
    return newData;
  }, [data]);

  if (modificationData.length === 0) return null;

  return (
    <div className={`single-form-v1`} style={containerPadding ? { padding: containerPadding } : {}}>
      <div className="grid grid-cols-12 border ">
        {modificationData.map((d) => (
          <div key={d.id} className={cn('-mb-[1px] -mr-[1px] border-b md:border-r', `md:col-span-6`, 'col-span-12')}>
            <div className="flex min-h-full">
              <div className="w-1/2 md:w-[150px] lg:w-[180px] ">
                <div className="d-flex formdata-title-v1 min-h-full items-center">
                  <h4>{d.name}</h4>
                </div>
              </div>
              <div className="w-1/2 md:flex-grow">
                <Typography
                  className={`w-fullitems-center flex min-h-[35px] flex-wrap gap-1 px-[10px] py-[7px] max-[600px]:!text-[0.8rem]`}
                  variant="body2"
                >
                  <span className="text-[#5e5e5e] dark:text-[#e5e5e5]">{d.user}</span>{' '}
                  <span className="rounded-[2px] border bg-[var(--dark-secondary,#ebf9ff)] p-[0_6px] text-[13px] font-normal">
                    {displayDateTime(d.date)}
                  </span>
                </Typography>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShowModificationData;
