#!/usr/bin/env node
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

// Test which file is being loaded
import * as Lark from '@larksuiteoapi/node-sdk';

console.log('Lark SDK loaded from:');
console.log(require.resolve('@larksuiteoapi/node-sdk'));
