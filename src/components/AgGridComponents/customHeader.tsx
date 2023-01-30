import React, { useEffect, useRef, useState } from 'react';
import CustomAgGridFilter from './CustomAgGridFilter';

export default (props) => {
  return (
    <div className="d-flex align-items-center justify-content-space-between pos-rel ">
      <div className="customHeaderLabel">{props.displayName}</div>
      {props.column.filter && <CustomAgGridFilter props={props} />}
    </div>
  );
};
