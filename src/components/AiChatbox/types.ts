export type Field = {
  primary: boolean;
  field: string;
  label?: string;
  type: string;
  order: number;
  value?: string;
  lookupDependentOn?: string;
  option?: Option[];
  description?: string;
};

export type Option = {
  _id: string;
  accountName?: string;
  parentAccount?: string;
  billingAddress?: string[];
  shippingAddress?: string[];
  optionLabel: string;
  optionValue: string;
  order: number;
  default: boolean;
  customerNumber?: number | string;
  fieldServiceManager?: string[];
  lead?: any[];
  customerAccount?: string[] | string;
  entity?: string[];
  address?: string;
};
export type FormValueStateObj = { [key: string]: { [key: string]: string } | string | { [key: string]: string }[] | string[] };

export type QuestionPayload = {
  question: string;
  topicIds: any[];
  _id?: string;
};

export type ReplyBody = {
  _id: string;
  user: string;
  brand: string;
  history: History;
  title: string;
  topics: any[];
  session: string;
  createdAt: Date;
  reply: Reply;
  fields: Field[];
  scrapData: ScrapData;
  data?: FormValueStateObj;
  status?: string;
  error?: string;
};

export type Reply = {
  content: string;
  role: string;
  name: string;
};

export type ScrapData = {};

export type HistoryBody = {
  _id: string;
  user: string;
  brand: string;
  history: History[];
  title: string;
  topics: any[];
  session: string;
  createdAt: Date;
};

export type History = {
  message: string;
  content: string;
  fields?: Field[];
  date: Date;
  data?: FormValueStateObj;
};

export type Topics = { _id: string; aiModelTopicName: string };
