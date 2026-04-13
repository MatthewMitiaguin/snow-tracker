import { ResortConfig } from '../types/index.js';

const SHARED_FIELD_MAP = {
  'top snow depth': 'snow_depth_top_cm',
  'bottom snow depth': 'snow_depth_base_cm',
  'fresh snowfall depth': 'fresh_snow_cm',
  'last snowfall': 'last_snowfall',
};

const SHARED_TABLE_CLASS = 'snow-depths-table__table';

export const RESORT_CONFIGS: Record<string, ResortConfig> = {
  niseko: {
    name: 'Niseko Grand Hirafu',
    url: 'https://www.snow-forecast.com/resorts/Niseko/6day/mid',
    tableClass: SHARED_TABLE_CLASS,
    fieldMap: SHARED_FIELD_MAP,
    coordinates: [42.804, 140.687],
  },
  'falls-creek': {
    name: 'Falls Creek',
    url: 'https://www.snow-forecast.com/resorts/Falls-Creek/6day/mid',
    tableClass: SHARED_TABLE_CLASS,
    fieldMap: SHARED_FIELD_MAP,
    coordinates: [-36.868, 147.283],
  },
  hotham: {
    name: 'Mount Hotham',
    url: 'https://www.snow-forecast.com/resorts/Mount-Hotham/6day/mid',
    tableClass: SHARED_TABLE_CLASS,
    fieldMap: SHARED_FIELD_MAP,
    coordinates: [-36.990, 147.157],
  },
  perisher: {
    name: 'Perisher',
    url: 'https://www.snow-forecast.com/resorts/Perisher-Blue/6day/mid',
    tableClass: SHARED_TABLE_CLASS,
    fieldMap: SHARED_FIELD_MAP,
    coordinates: [-36.407, 148.410],
  },
  thredbo: {
    name: 'Thredbo',
    url: 'https://www.snow-forecast.com/resorts/Thredbo/6day/mid',
    tableClass: SHARED_TABLE_CLASS,
    fieldMap: SHARED_FIELD_MAP,
    coordinates: [-36.504, 148.299],
  },
};
