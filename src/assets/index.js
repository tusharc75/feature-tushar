import activities from "./svg/activities.svg";
import calendar from "./svg/calender.svg";
import contact from "./svg/contact.svg";
import customer from "./svg/customer.svg";
import dashboard from "./svg/dashboard.svg";
import doa from "./svg/doa.svg";
import flags from "./svg/flag.svg";
import currency from "./svg/dollar.svg";
import leads from "./svg/leads.svg";
import entity from "./svg/location.svg";
import logo from "./svg/logo.svg";
import opportunities from "./svg/opportunities.svg";
import pricing from "./svg/pricing.svg";
import product from "./svg/product.svg";
import quote_builder from "./svg/quote_builder.svg";
import reminder from "./svg/reminder.svg";
import suppliers from "./svg/suppliers.svg";
import terms_conditions from "./svg/terms_conditions.svg";
import users from "./svg/users.svg";
import menu_icon from "./svg/menu_icon.svg";
import ai_robot from "./svg/artificial_intelligence-pana.svg";
import contacts_placeholder from "./svg/contacts_placeholder.svg";
import timeline_placeholder from "./svg/timeline_placeholder.svg";

export const SVG = (name) => {
  switch (name) {
    case "Logo":
      return logo;
    case "Menu Icon":
      return menu_icon;
    case "Dashboard":
      return dashboard;
    case "Activities":
      return activities;
    case "Customer":
      return customer;
    case "Pricing":
      return pricing;
    case "Suppliers":
      return suppliers;
    case "Product":
      return product;
    case "Entity":
      return entity;
    case "User":
      return users;
    case "Terms & Conditions":
      return terms_conditions;
    case "DOA":
      return doa;
    case "Currency Convertor":
      return currency;
    case "Contacts":
      return contact;
    case "Leads":
      return leads;
    case "Opportunities":
      return opportunities;
    case "Price Builder":
      return currency;
    case "Quote Builder":
      return quote_builder;
    case "Reminder":
      return reminder;
    case "Calendar":
      return calendar;
    case "Flags":
      return flags;
    case "AI Robot":
      return ai_robot;
    case "Contacts Placeholder":
      return contacts_placeholder;
    case "Timepline Placeholder":
      return timeline_placeholder;

    default:
      return;
  }
};
