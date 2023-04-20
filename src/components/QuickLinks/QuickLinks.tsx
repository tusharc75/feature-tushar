import React from 'react';
import { Box, Grid, Icon, Paper, Typography } from '@material-ui/core';
import { Link } from 'react-router-dom';
export interface IQuickLinks {
  label: string;
  show: boolean;
  count?: number;
  onClick?: Function;
  to?: string;
  icon?: any;
  class: string;
}

const quickLinkColorPalette = ['#F2F9FF', '#FFFCF0', '#FFEEEE', '#F1FEED', '#FFF0E5', '#F3F2FF'];

const getColor = (index: number) => {
  return quickLinkColorPalette[index % quickLinkColorPalette.length];
};

export default function QuickLinks({ quickLinks, title = 'Quick Links' }) {
  return quickLinks && Array.isArray(quickLinks) ? (
    <>
      <div className="single-form-v1">
        <div className="form-head-v1">
          <h3 className="form-label-style-v1">{title}</h3>
        </div>
        <div className="formdata-v1 ">
          <Grid container spacing={2}>
            {quickLinks.map((k, index) => {
              return (
                <Grid item xs={12} lg={2}>
                  <Box
                    py={3}
                    px={1}
                    style={{ backgroundColor: getColor(index), borderRadius: 11, cursor: 'pointer' }}
                    onClick={k.onClick}
                    key={index}
                  >
                    {k.to ? (
                      <>
                        <Link key={index} to={k.to} className={`link`}>
                          {k.label} {k.count != null ? `(${k.count})` : null}
                        </Link>
                      </>
                    ) : (
                      <div style={{ textAlign: 'center' }}>
                        <Box mb={1}>{k.icon}</Box>
                        <Typography key={index} style={{ color: '#1D1D1D', fontWeight: 600 }}>
                          {k.label} {k.count != null ? `(${k.count})` : null}
                        </Typography>
                      </div>
                    )}
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </div>
      </div>
    </>
  ) : (
    <Typography color="error">Quick Links are passed in incorrect format</Typography>
  );
}
