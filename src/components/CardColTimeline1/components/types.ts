import { CardColTimelineProps, Group } from 'src/components/CardColTimeline1/types';

export type CommonProps<D, C extends readonly string[]> = {
  primaryField: any;
  actionField: any;
  defaultDisplay: any[];
  column: C[number];
  estimatedItemSize?: number;
  group?: Group;
} & CardColTimelineProps<D, C>;
