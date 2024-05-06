export type FilterModel = Record<string, Date | MultiSelect | SingleLine>;

export type Date = {
  filter: DateFormat;
};

export type DateFormat = {
  from: string;
  to: string;
};

export type MultiSelect = {
  filter: string[];
};

export type SingleLine = {
  filter: string;
};
