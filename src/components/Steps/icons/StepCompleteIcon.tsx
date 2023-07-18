import React, { SVGProps } from 'react';

interface svgInterface extends SVGProps<SVGSVGElement> {
  color?: string;
}

const StepCompleteIcon: React.FC<svgInterface> = ({ color = 'var(--new_theme_color)', ...others }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" fill="none" {...others}>
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M0.423828 9.34584C0.423828 7.07256 1.32689 4.89238 2.93434 3.28493C4.5418 1.67747 6.72197 0.774414 8.99526 0.774414C11.2685 0.774414 13.4487 1.67747 15.0562 3.28493C16.6636 4.89238 17.5667 7.07256 17.5667 9.34584C17.5667 11.6191 16.6636 13.7993 15.0562 15.4068C13.4487 17.0142 11.2685 17.9173 8.99526 17.9173C6.72197 17.9173 4.5418 17.0142 2.93434 15.4068C1.32689 13.7993 0.423828 11.6191 0.423828 9.34584H0.423828ZM8.50611 13.0144L13.441 6.84527L12.5495 6.13213L8.34154 11.3904L5.36097 8.90699L4.62954 9.7847L8.50611 13.0156V13.0144Z"
        fill={color || 'currentcolor'}
      />
    </svg>
  );
};

export default StepCompleteIcon;
