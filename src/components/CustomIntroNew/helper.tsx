import { findIndex } from 'lodash';
import axiosInstance from 'src/axios/axiosInstance';
import { StepDefination, useSetWalkmeData, WalkmeData } from 'src/components/CustomIntro';

export const getCurrentUrl = () => {
  const url = window.location.pathname;
  // const search = window.location.search;
  const hexPattern = /^[0-9a-fA-F]{24}$/;
  const splittedUrl = url.split('/');
  const newUrl = splittedUrl
    .map((url) => {
      if (hexPattern.test(url)) {
        return ':id';
      } else {
        return url;
      }
    })
    .join('/');
  return newUrl.endsWith('/') ? newUrl.slice(0, -1) : newUrl;
};