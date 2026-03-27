import { ResortConfig } from './types.js';

export const RESORT_CONFIGS: Record<string, ResortConfig> = {
  niseko: {
    name: 'Niseko Grand Hirafu',
    url: 'https://www.snow-forecast.com/resorts/Niseko/6day/mid',
    tableClass: 'snow-depths-table__table',
    fieldMap: {
      'top snow depth': 'snow_depth_top_cm',
      'bottom snow depth': 'snow_depth_base_cm',
      'fresh snowfall depth': 'fresh_snow_cm',
      'last snowfall': 'last_snowfall',
    },
    coordinates: [42.804, 140.687],
  },
};