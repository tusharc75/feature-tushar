import React from 'react';
import { Link as RouterLink } from 'react-router-dom';

type LinkProps = {
  to?: string;
  href?: string;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>;

const Link = ({ href, to, target, children, ...rest }: LinkProps) => {
  const targetLocation = (href || to) as string;
  const Component = targetLocation.startsWith('http') || target === '_blank' ? 'a' : RouterLink;

  const props: Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { to?: string; href?: string } = {};
  if (Component === 'a') {
    props.rel = 'noopener noreferrer';
    props.href = targetLocation;
    props.target = '_blank';
  } else {
    props.to = targetLocation;
  }

  return (
    <Component {...props} {...rest}>
      {children}
    </Component>
  );
};

export default Link;
