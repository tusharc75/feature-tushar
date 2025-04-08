import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { AccountCircle, AddCircleOutline, Map } from '@mui/icons-material';
import { Avatar, IconButton, ListItem, ListItemButton, Skeleton, Typography } from '@mui/material';
import { memo, useState } from 'react';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { cn } from 'src/constants/helpers';
import { useTechnicianContext } from 'src/pages/TechnicianScheduler/Context';
import { HandleSelect } from 'src/pages/TechnicianScheduler/Roadmap';
import SearchButton from 'src/pages/TechnicianScheduler/SearchButton';
import { TActivity } from 'src/pages/TechnicianScheduler/Roadmap/types';

type SidebarProps = {
  activity: TActivity[];
  handleSelect: HandleSelect;
  loading: boolean;
  selectedResource: any;
};

const Sidebar = memo(({ activity, selectedResource, handleSelect, loading }: SidebarProps) => {
  const { technicianSearchValue, setTechnicianSearchValue } = useTechnicianContext();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  return (
    <aside className="sticky right-0 z-[3] border-l bg-[white] dark:bg-[--dark-primary]">
      <div className="sticky top-0 z-[4] flex h-[--header-h] items-center justify-between gap-2 border-b bg-[--dark-primary,white] p-4">
        <h6 className="line-clamp-1 text-[1rem] font-semibold">Technicians</h6>
        <div className="flex">
          <SearchButton value={technicianSearchValue} setValue={setTechnicianSearchValue} onOpenToggle={setIsSearchOpen} />
          <div className={cn('flex items-center overflow-hidden transition-all', isSearchOpen ? 'w-0' : 'w-[30px] ')}>
            <IconButton size="small" color="primary">
              <Map fontSize="small" />
            </IconButton>
          </div>
        </div>
      </div>
      {!loading ? (
        <ul className="list-none">
          {activity?.map((data, index) => {
            return <SingleTechnician data={data} index={index} handleSelect={handleSelect} selectedResource={selectedResource} key={data._id} />;
          })}
        </ul>
      ) : (
        <ul className="list-none">
          {[...Array(8).keys()]?.map((data, index) => {
            return (
              <li className="border-b">
                <ListItemButton className="flex !h-[calc(var(--data-h)-1px)] items-center !justify-between  px-4">
                  <div className="flex min-w-0 items-center gap-4">
                    <Avatar sizes="small" style={{ height: 45, width: 45 }} alt="Remy Sharp">
                      <AccountCircle style={{ fontSize: 28 }} />
                    </Avatar>
                    <div className="">
                      <Typography style={{ fontWeight: 'bolder', fontSize: '1rem' }}>
                        <Skeleton width={'60%'} />
                      </Typography>
                      <p className="line-clamp-1 text-[0.8rem] text-gray-500">
                        <Skeleton width={'80%'} />
                      </p>
                      <p className="line-clamp-1 text-[0.6rem] text-gray-500">
                        <Skeleton width={Math.random() * (200 - 100) + 100} />
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <IconButton>
                      <Map fontSize="medium" />
                    </IconButton>
                  </div>
                </ListItemButton>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
});

export default Sidebar;

export const SingleTechnician = memo(({ data, handleSelect, index, selectedResource, className = '' }: any) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: data._id,
    data: {
      index: index,
      item: data,
      props: { data, type: 'technician' },
      type: 'technician'
    }
  });

  const styleDnd = {
    transform: CSS.Translate.toString(transform)
  };

  return (
    <li
      className={cn('cursor-grab list-none border-b bg-[--dark-primary,white] p-0', isDragging ? 'h-[90px]' : '', className)}
      {...attributes}
      {...listeners}
      ref={setNodeRef}
      style={{ ...styleDnd }}
    >
      <ListItem className="flex !h-[calc(var(--data-h)-1px)] items-center !justify-between  px-4">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar sizes="small" style={{ height: 45, width: 45 }} alt="Remy Sharp" src={data?.photo}>
            <AccountCircle style={{ fontSize: 28 }} />
          </Avatar>
          <div className="">
            <Typography style={{ fontWeight: 'bolder', fontSize: '1rem' }}>{`${data?.firstName} ${data?.lastName}`}</Typography>
            <p className="line-clamp-1 text-[0.8rem] text-gray-500" title={`${data?.competencyType?.optionLabel || ''}`}>
              {`${data?.competencyType?.optionLabel || ''}`}
            </p>
            <p className="line-clamp-1 text-[0.6rem] text-gray-500" title={`${data?.competencies?.map((e) => e?.optionLabel)?.toString() || ''}`}>
              {`${data?.competencies?.map((e) => e?.optionLabel)?.toString() || ''}`}
            </p>
          </div>
        </div>
        <div className="flex-shrink-0">
          <HtmlTooltip title={`Assign ${selectedResource?.title}`}>
            <IconButton
              onClick={(event) => {
                event.stopPropagation();
                handleSelect(event, data, 'assign');
              }}
              size="small"
              color="primary"
            >
              <AddCircleOutline fontSize="small" />
            </IconButton>
          </HtmlTooltip>
          <IconButton
            color="primary"
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              handleSelect(event, data, 'map');
            }}
          >
            <Map fontSize="small" />
          </IconButton>
        </div>
      </ListItem>
    </li>
  );
});
