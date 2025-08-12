export type Flow = {
  _id?: string;
  resourceId?: string;
  flowName?: string;
  steps?: Step[];
  createdBy?: AtedBy;
  updatedBy?: AtedBy;
  url?: string;
};

export type AtedBy = {
  user?: string;
  date?: Date;
};

export type Step = {
  _id?: string;
  title?: string;
  originalUrl?: string;
  targetSelector?: string;
  description?: string;
  url?: string;
  order?: number;
  disablePreviousButton?: boolean;
  nextButtonName?: string;
  skipIfValueExist?: boolean;
  targetType?: string;
};

export type StepWithAllData = {
  _id?: string;
  target: HTMLElement;
  title?: string;
  originalUrl?: string;
  targetSelector?: string;
  description?: string;
  url?: string;
  order?: number;
  disablePreviousButton?: boolean;
  nextButtonName?: string;
  skipIfValueExist?: boolean;
  targetType?: string;
};

export type ObserverCallbackProps = {
  mutations: MutationRecord[];
  resolve: (value: boolean) => void;
  validator: (value: any) => boolean;
  targetElement: HTMLElement;
};
