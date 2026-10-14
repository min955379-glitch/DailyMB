import {readFileSync,writeFileSync} from 'node:fs';
const src=readFileSync('lib/answer-core.ts','utf8');
const body=src.split('\n').slice(3).join('\n');
writeFileSync('supabase/functions/_shared/answer-core.ts','// SYNCED COPY of lib/answer-core.ts - edit the lib copy, then run: npm run sync-shared\n'+body);
console.log('synced');
