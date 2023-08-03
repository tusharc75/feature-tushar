import React from 'react';
import { Box, Grid, Icon, Paper, Typography } from '@material-ui/core';
import { Link } from 'react-router-dom';
import { useAppTheme } from 'src/constants/AppConfig';
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
const quickLinksDarkColorPalette = ['rgb(46 73 97)', 'rgb(84 77 49)', 'rgb(87 46 46)', 'rgb(59 83 52)', 'rgb(107 81 61)', 'rgb(50 48 76)'];

export default function QuickLinks({ quickLinks, title = 'Quick Links' }) {
  const [themeColor] = useAppTheme();

  const getColor = (index: number) => {
    if (themeColor === 'light') return quickLinkColorPalette[index % quickLinkColorPalette.length];
    else return quickLinksDarkColorPalette[index % quickLinksDarkColorPalette.length];
  };

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
                        <Typography key={index} style={{ color: themeColor === 'light' ? '#1D1D1D' : '#FFF', fontWeight: 600 }}>
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
