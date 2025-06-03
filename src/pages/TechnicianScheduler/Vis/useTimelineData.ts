import React, { useEffect } from 'react';
import { DataSet, Timeline } from 'vis-timeline/standalone';

const useTimelineData = (timelineData: { groups: DataSet<any, 'id'> | null; items: DataSet<any, 'id'> | null }, timeline: Timeline) => {
  const groupExpandedState: Record<string, boolean> = {};

  function getFilteredItems() {
    const grouped = {};

    timelineData.groups.forEach((item) => {
      if (!grouped[item.group]) grouped[item.group] = [];
      grouped[item.group].push(item);
    });

    let filtered = [];

    for (const groupId in grouped) {
      const items = grouped[groupId];
      if (groupExpandedState[groupId]) {
        filtered = filtered.concat(items);
      } else {
        filtered = filtered.concat(items.slice(0, 4));
      }
    }

    console.log(filtered);

    return new DataSet(filtered);
  }

  function renderShowMoreButtons() {
    const container = document.getElementById('buttons-container');
    container.innerHTML = '';

    const grouped = {};

    timelineData.items.forEach((item) => {
      if (!grouped[item.group]) grouped[item.group] = [];
      grouped[item.group].push(item);
    });

    for (const groupId in grouped) {
      if (grouped[groupId].length > 4 && !groupExpandedState[groupId]) {
        const btn = document.createElement('button');
        btn.textContent = `Show more for Group ${groupId}`;
        btn.onclick = () => {
          groupExpandedState[groupId] = true;
          timeline.setItems(getFilteredItems());
          renderShowMoreButtons();
        };
        container.appendChild(btn);
      }
    }
  }
  useEffect(() => {
    if (timeline) {
      renderShowMoreButtons();
    }
  }, [timeline]);
};

export default useTimelineData;
