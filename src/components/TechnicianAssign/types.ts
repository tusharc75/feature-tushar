interface Technician {
  _id: string;
  name: string;
}

interface ResourceData {
  uniqueId: string;
  serviceId: string;
  warehouse: string;
  resourceId: string;
  resourceNumber: string;
  estimateStartDate: string;
  estimateEndDate: string;
}

interface Resource {
  resource: string;
  titleSingular: string;
  titlePlural: string;
}

export interface TechnicianAssignProps {
  resourceData: ResourceData[];
  handleClose: () => void;
  handleSuccess: () => void;
  technicians: Technician[];
  resource: Resource;
}