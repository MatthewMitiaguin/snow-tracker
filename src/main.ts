import { ResortService } from './conditions_service.js';

const service = new ResortService('niseko');

console.log('Fetching Niseko snow conditions...\n');
const report = await service.getConditions();

console.log(`--- ${report.resort.toUpperCase()} CONDITIONS ---`);
console.log(`Timestamp:         ${report.timestamp}`);
console.log(`Snow depth (top):  ${report.snow_depth_top_cm}`);
console.log(`Snow depth (base): ${report.snow_depth_base_cm}`);
console.log(`Fresh snow:        ${report.fresh_snow_cm}`);
console.log(`Last snowfall:     ${report.last_snowfall}`);