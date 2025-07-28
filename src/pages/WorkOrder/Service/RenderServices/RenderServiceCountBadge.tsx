import React, { useMemo } from 'react';
import { cn, WORKORDER_SERVICE_STEP_STATUS } from 'src/constants/helpers';

const RenderServiceCountBadge = ({ serviceSteps }) => {
  const isAllCompleted = useMemo(() => {
    if (!serviceSteps || serviceSteps?.length === 0) return false;
    return serviceSteps.every((d) => [WORKORDER_SERVICE_STEP_STATUS.passed, WORKORDER_SERVICE_STEP_STATUS.completed].includes(d.status));
  }, [serviceSteps]);

  if (!serviceSteps || serviceSteps?.length === 0) return null;
  return (
    <span
      className={cn(
        'absolute  flex size-[--size] items-center justify-center rounded-full  text-[white] ',
        '-right-[calc(var(--size)_*_0.4)] -top-[calc(var(--size)_*_0.4)] text-[calc(var(--size)*0.6)] [--size:18px]',
        'font-semibold',
        isAllCompleted ? 'bg-green-500 dark:bg-green-600' : 'bg-darkPrimary dark:bg-[white] dark:text-black'
      )}
    >
      {serviceSteps?.length}
    </span>
  );
};

export default RenderServiceCountBadge;
