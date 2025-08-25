import { cn } from 'src/constants/helpers';
import { RawGroup } from 'src/pages/PlanningView/GanttView/utils';

const PlanningGroupTemplate = ({ data }: { data: RawGroup }) => {
  return (
    <div className={cn('flex w-full max-w-[299px] cursor-grab items-center bg-[--dark-primary,white] px-4 py-2 transition-colors')}>
      <div className="div">
        <h6 className="text-base font-semibold dark:text-white">{data.productName}</h6>
        <p className="text-xs text-gray-500">{data.productDescription}</p>
      </div>
    </div>
  );
};

export default PlanningGroupTemplate;
