import React from 'react';
import { SvgPropsWithSize } from 'src/assets/svg/SvgElements';

const ReceiveUser = ({ size = 18, ...rest }: SvgPropsWithSize) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="none" viewBox="0 0 512 512" {...rest}>
      <path
        fill="currentcolor"
        d="M202 277.333c70.692 0 128-57.307 128-128 0-70.692-57.308-128-128-128s-128 57.308-128 128 57.308 128 128 128"
      ></path>
      <path
        fill="currentcolor"
        fillRule="evenodd"
        d="M116.667 320h170.666A106.667 106.667 0 0 1 394 426.667a64 64 0 0 1-64 64H74a64 64 0 0 1-64-64A106.667 106.667 0 0 1 116.667 320"
        clipRule="evenodd"
      ></path>
      <path
        fill="currentcolor"
        d="M408.367 217.953c6.654-6.653 17.442-6.653 24.096 0 6.653 6.654 6.653 17.442 0 24.095l-23.699 23.706h76.653c8.975 0 16.25 7.275 16.25 16.249 0 8.975-7.275 16.25-16.25 16.25h-76.653l23.699 23.699c6.653 6.653 6.653 17.441 0 24.095-6.654 6.653-17.442 6.653-24.096 0l-61.749-61.749a3.25 3.25 0 0 1 0-4.596z"
      ></path>
    </svg>
  );
};

export default ReceiveUser;
