import { uniqBy } from 'lodash';
import type { TCategories, TDataPoints } from './types';

export const group = ({ dataPoints, seachKeyword = '' }: { dataPoints: TDataPoints[]; seachKeyword?: string }): TCategories[] => {
  if (!dataPoints || dataPoints.length === 0) return null;

  const data = dataPoints?.filter((e) =>
    seachKeyword?.trim() === '' ? true : e?.fieldLabel?.toLowerCase()?.includes(seachKeyword?.trim()?.toLowerCase())
  );

  let uniqueCategories: TDataPoints[] = uniqBy(data, 'category.optionValue');
  let categories: TCategories[] = [];
  let child: TCategories[] = [];

  for (let i = 0; i < uniqueCategories.length; i++) {
    const uCategory = uniqueCategories[i];
    if (uCategory?.child?.length) {
      child = group({ dataPoints: uCategory.child, seachKeyword });
    }
    const dataPoints: TDataPoints[] = [];
    for (let index = 0; index < data?.length; index++) {
      const dPoint = data[index];
      if (dPoint.category?.optionValue === uCategory.category?.optionValue) {
        dataPoints.push(dPoint);
      }
    }
    const category: TCategories = {
      name: uCategory.category?.optionLabel || '',
      _id: uCategory.category?.optionValue || '',
      dataPoints,
      child: child || []
    };
    categories.push(category);
  }
  return categories;
};
