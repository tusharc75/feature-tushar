import dayjs from 'dayjs';

export function addOverlapCount(dataList) {
  const newDataList = dataList ? [...dataList] : [];

  for (let i = 0; i < newDataList.length; i++) {
    newDataList[i]['overlapCount'] = 0;
    newDataList[i]['overlapIndex'] = 0;
    newDataList[i]['set'] = false;

    let overlapIndex = -1;
    const obj1 = newDataList[i];
    const start1 = dayjs(obj1.startDate || obj1.reference?.estimateStartDate);
    const end1 = dayjs(obj1.endDate || obj1.reference?.estimateEndDate);

    for (let j = 0; j < newDataList.length; j++) {
      const obj2 = newDataList[j];
      const start2 = dayjs(obj2.startDate || obj2.reference?.estimateStartDate);
      const end2 = dayjs(obj2.endDate || obj2.reference?.estimateEndDate);
      // Check for overlaps in both directions
      if (start1.isBefore(end2) && end1.isAfter(start2)) {
        if (i !== j) {
          newDataList[i].overlapCount++;
        }

        overlapIndex++;
        if (!newDataList[j]['set']) {
          newDataList[j].overlapIndex = overlapIndex;
          newDataList[j]['set'] = true;
        }
      }
    }
  }
  return newDataList; // Return the updated list with overlap counts
}

export function getScrollContainer(element: HTMLElement) {
  let parent = element.parentElement;
  while (parent) {
    const style = window.getComputedStyle(parent);
    const overflowY = style.overflowY;
    if (overflowY === 'scroll' || overflowY === 'auto') {
      return parent;
    }
    parent = parent.parentElement;
  }
  return document.documentElement;
}
export function isCollidingOnTop(element: HTMLElement, container: HTMLElement, topOffset = 0) {
  const elementRect = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  return elementRect.top <= containerRect.top + topOffset && elementRect.bottom > containerRect.top;
}
