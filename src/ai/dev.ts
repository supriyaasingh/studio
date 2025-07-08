import { config } from 'dotenv';
config();

import '@/ai/flows/auto-categorize-drug.ts';
import '@/ai/flows/drug-search.ts';
import '@/ai/flows/offline-dosage-calculation.ts';