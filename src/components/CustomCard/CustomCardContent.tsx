import CardContent from '@mui/material/CardContent';
import React from 'react';

export default function CustomCardContent({ children }) {
  return (
    <React.Fragment>
      <CardContent>{children}</CardContent>
    </React.Fragment>
  );
}
