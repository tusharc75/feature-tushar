import { CardColTimelineProps } from 'src/components/CardColTimeline1/types';

export type CommonProps<D, C extends readonly string[]> = {
  primaryField: any;
  actionField: any;
  defaultDisplay: any[];
  column: C[number];
  estimatedItemSize?: number;
} & CardColTimelineProps<D, C>;
