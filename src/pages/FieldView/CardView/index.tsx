import { East } from '@mui/icons-material';
import { useEffect, useRef } from 'react';
import RippleButton from 'src/components/RippleButton';
import { cn } from 'src/constants/helpers';
import { generateData } from 'src/pages/FieldView/CardView/utils';
import { FieldViewResource } from 'src/pages/FieldView/types';
import { useFieldStore } from 'src/pages/FieldView/useFieldStore';

type CardViewProps = {
  resource: FieldViewResource;
  data: any[];
  clickOnCard: (data: any) => void;
};

const CardView = ({ resource, data, clickOnCard }: CardViewProps) => {
  const [activeItem, setStore] = useFieldStore((store) => store.activeItem);
  const itemRefs = useRef<Record<string, HTMLButtonElement>>({});

  useEffect(() => {
    if (activeItem) {
      const node = itemRefs.current[activeItem];
      if (node) {
        node.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
      }
    }
  }, [activeItem]);

  return (
    <section className="@container">
      <div className="@[750px]:grid-cols-3 @[950px]:grid-cols-4 @[500px]:grid-cols-2 grid max-h-[calc(100vh-200px)] grid-cols-1 gap-4 overflow-auto ">
        {data?.map((item) => {
          const dataList = generateData(item, resource);
          const dataHasTag = dataList.find((d) => d.type === 'tag');

          return (
            <RippleButton
              className={cn(
                'group relative flex cursor-pointer flex-col rounded-md border bg-[var(--dark-secondary,white)] text-left',
                activeItem && activeItem === item._id && '[box-shadow:0px_0px_0px_2px_var(--new-theme-color)_inset]'
              )}
              key={item?._id}
              onClick={() => {
                clickOnCard(item);
                setStore({ activeItem: null });
              }}
              ref={(node) => {
                if (node) {
                  itemRefs.current[item._id] = node;
                }
              }}
            >
              <div className={cn(' space-y-1 p-[8px]', dataHasTag ? 'pt-10' : '')}>
                {dataList.map(({ type, label, value, className, ...rest }) => {
                  if (type === 'tag') {
                    return (
                      <div
                        className={cn(
                          'absolute right-2 top-2 flex items-center rounded-full bg-green-400 px-2 py-[2px] text-xs font-medium text-white',
                          className
                        )}
                        {...rest}
                      >
                        {value}
                      </div>
                    );
                  }
                  return (
                    <div key={label} className={cn('grid grid-cols-[1fr_1.7fr] items-start', className)} {...rest}>
                      <h6 className="text-sm font-semibold text-[--primary-text]">{label}: </h6>
                      <p
                        className="line-clamp-2 text-sm font-medium text-[#6B7280] dark:text-gray-300"
                        title={typeof value === 'string' ? value : ''}
                      >
                        {value}
                      </p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-auto flex justify-end border-t p-[12px]">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-500">
                  <span>View</span>
                  <span className="transition-all duration-300 group-hover:-mr-1 group-hover:ml-1">
                    <East fontSize="small" />
                  </span>
                </div>
              </div>
            </RippleButton>
          );
        })}
      </div>
    </section>
  );
};

export default CardView;
