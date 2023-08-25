export interface TProductStatus {
  _id?: string;
  productName?: string;
  name?: string;
  planning?: Planning[];
}

export interface Planning {
  _id?: string;
  qty?: number;
  product?: string;
  type?: Type;
  startDate?: Date;
  endDate?: Date;
}

export type Type = 'available' | 'inUse' | 'planned';
