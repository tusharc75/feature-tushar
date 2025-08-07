import React from "react";

interface SvgWithSize extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export const FolderIcon: React.FC<SvgWithSize> = ({ size = 18, ...otherProps }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 128 128" {...otherProps}>
      <path
        fill="none"
        stroke="#61bee2"
        stroke-width="6"
        stroke-linejoin="round"
        d="M20 28c0-4.4 3.6-8 8-8h32l8 10h40c4.4 0 8 3.6 8 8v60c0 4.4-3.6 8-8 8H28c-4.4 0-8-3.6-8-8V28z"
      />
    </svg>
  );
};