/**
 * Typed view of menu-data.js for the site's TypeScript code. The data file
 * stays plain JavaScript because the email Worker imports it too.
 */
import { PERFETTO } from "./menu-data.js";

export type MenuItem = { name: string; desc: string; price: number | null; verified?: boolean; favorite?: boolean };
export type MenuSection = { id: string; title: string; subtitle: string; items: MenuItem[] };
export type Choice = {
  id: string;
  label: string;
  plural: string;
  pick: number;
  hot?: boolean;
  options: string[];
  notSameAs?: string;
  title?: string; // upgrades only
  perPerson?: number; // upgrades only
};
export type Package = {
  id: string;
  name: string;
  tag: string;
  perPerson: number;
  min: number;
  featured?: boolean;
  boxed?: boolean;
  boxOptions?: string[];
  choices?: Choice[];
  upgrades?: Choice[];
  included: string[];
};
export type Tray = { id: string; name: string; half: number; full: number };
export type Extra = { id: string; name: string; unit: string; price: number; note?: string };
export type Photo = { src: string; alt?: string; pexels?: number };
export type Schedule = { days: number[]; open: string; close: string; timeZone: string; closed?: string[] };

export type SiteData = {
  info: {
    name: string;
    address: string;
    city: string;
    phone: string;
    phoneHref: string;
    orderOnline: string;
    orderHours: string;
    cateringEndpoint: string;
    mapsQuery: string;
    hours: { days: string; time: string }[];
    schedule: Schedule;
    cateringHours: string;
  };
  menu: MenuSection[];
  media: {
    hero: (Photo & { alt: string })[];
    dishes: Record<string, Photo>;
    signature: string[];
    kitchen: Photo;
    catering: Photo;
    cateringTrays: Photo;
    events: Photo;
  };
  menuNote: string;
  reviews: { quote: string; source: string }[];
  packages: Package[];
  trays: { group: string; items: Tray[] }[];
  extras: Extra[];
  drinks: Extra[];
  services: { deliveryFee: number; chafingPerPan: number; deliveryArea: string };
  cateringTerms: { title: string; text: string }[];
  payment: { title: string; steps: { title: string; text: string }[]; note: string };
};

export const D = PERFETTO as unknown as SiteData;
