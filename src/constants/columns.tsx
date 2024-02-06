import { flatMapDeep } from 'lodash';

const getMembers = (mem) => {
  const member = { ...mem };
  delete member.subRows;
  if (!mem.subRows || !mem.subRows.length) {
    return member;
  }
  return [member, flatMapDeep(mem.subRows, getMembers)];
};

export function flattenArray(array) {
  return flatMapDeep(array, getMembers);
}
