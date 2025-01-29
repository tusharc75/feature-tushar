import activities from './svg/activities.svg';
import calendar from './svg/calender.svg';
import contact from './svg/contact.svg';
import customer from './svg/customer.svg';
import dashboard from './svg/dashboard.svg';
import doa from './svg/doa.svg';
import flags from './svg/flag.svg';
import currency from './svg/dollar.svg';
import leads from './svg/leads.svg';
import entity from './svg/location.svg';
import logo from './svg/logo.svg';
import opportunities from './svg/opportunities.svg';
import pricing from './svg/pricing.svg';
import product from './svg/product.svg';
import quote_builder from './svg/quote_builder.svg';
import reminder from './svg/reminder.svg';
import suppliers from './svg/suppliers.svg';
import terms_conditions from './svg/terms_conditions.svg';
import users from './svg/users.svg';
import menu_icon from './svg/menu_icon.svg';
import ai_robot from './svg/artificial_intelligence-pana.svg';
import contacts_placeholder from './svg/contacts_placeholder.svg';
import timeline_placeholder from './svg/timeline_placeholder.svg';
import logoPng from './svg/logo.png';
import imgComputer from './svg/bglaptop.svg';
import total_cost from './svg/total_cost.svg';
import profit from './svg/profit.svg';
import booked_value from './svg/booked_value.svg';
import logoNew from './svg/logoNew.svg';
import LogoShort from './svg/logoShort.svg';
import EGenieWord from './svg/EGenieWord.svg';

const availabelSvgs = {
  Logo: logo,
  LogoNew: logoNew,
  LogoNewShort: LogoShort,
  'Menu Icon': menu_icon,
  Dashboard: dashboard,
  Activities: activities,
  Customer: customer,
  Pricing: pricing,
  Suppliers: suppliers,
  Product: product,
  Entity: entity,
  User: users,
  'Terms & Conditions': terms_conditions,
  DOA: doa,
  'Currency Convertor': currency,
  Contacts: contact,
  Leads: leads,
  Opportunities: opportunities,
  'Price Builder': currency,
  'Quote Builder': quote_builder,
  Reminder: reminder,
  Calendar: calendar,
  Flags: flags,
  'AI Robot': ai_robot,
  'Contacts Placeholder': contacts_placeholder,
  'Timepline Placeholder': timeline_placeholder,
  LogoPng: logoPng,
  imgComputer: imgComputer,
  total_cost: total_cost,
  profit: profit,
  booked_value: booked_value,
  genieWord: EGenieWord
};

type AvailabelSvgs = keyof typeof availabelSvgs;

export const SVG = (name: AvailabelSvgs) => {
  const svg = availabelSvgs[name];
  if (svg) {
    return svg;
  } else {
    return availabelSvgs['LogoNewShort'];
  }
};
