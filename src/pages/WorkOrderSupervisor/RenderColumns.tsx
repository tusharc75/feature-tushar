import React from 'react';
import ColCard from 'src/pages/WorkOrderSupervisor/ColCard';

interface colDataInterface extends React.HTMLAttributes<HTMLDivElement> {
  colData: singleColData[];
}

export interface singleColData {
  _id?: string;
  qty?: number;
  order?: number;
  materialId?: string;
  steps?: Step[];
  type?: string;
  status?: string;
  serviceStatus?: string;
  assignedUsers?: string;
  service?: string;
  serviceId?: string;
  id?: string;
  workOrder?: string;
  serviceName?: string;
  assignedUser?: string;
  createDate?: Date;
}

export interface Step {
  _id?: string;
  fields?: any[];
  order?: number;
  stepName?: string;
  leadDay?: number;
  costPrice?: number;
  listPrice?: number;
  currency?: string;
  isPassFail?: boolean;
  isFailAddon?: boolean;
  failAddon?: any[];
  isPassAddon?: boolean;
  passAddon?: any[];
  isJumpStepPass?: boolean;
  jumpStepsPass?: any[];
  isJumpStepFail?: boolean;
  jumpStepsFail?: any[];
  isQuoteRevisionOnFail?: boolean;
  isReturnToStepOnFail?: boolean;
  returnToStepOnFail?: string;
  isReturnToServiceOnFail?: boolean;
  returnToServiceOnFail?: string;
}

const RenderColumns: React.FC<colDataInterface> = ({ colData }) => {
  return (
    <div>
      {colData.map((data) => (
        <ColCard data={data} />
      ))}
    </div>
  );
};

export default RenderColumns;
