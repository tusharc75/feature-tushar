import add from './add.svg';
import assign from './assign.svg';
import dispatch from './dispatch.svg';
import invoice from './invoice.svg';
import { LeftIcon } from './left';
import { RightIcon } from './right';

export const getIcon = (name: string) => {
  name = name.toLowerCase();
  switch (true) {
    case name.includes('add'):
      return add;
      break;
    case name.includes('assign'):
      return assign;
      break;
    case name.includes('dispatch'):
      return dispatch;
      break;
    case name.includes('invoice'):
      return invoice;
      break;
    default:
      return dispatch;
  }
};
export { LeftIcon, RightIcon };
