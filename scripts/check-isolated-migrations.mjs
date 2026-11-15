import {readFileSync,statSync} from 'node:fs'
import {isAbsolute} from 'node:path'
import {spawnSync} from 'node:child_process'
import {isolatedConfigurationReady} from './lib/integration-safety.mjs'
import {isolatedMigrationService} from './lib/migration-safety.mjs'
const files=['20261115115146_isolated_private_attachment_policies.sql','20261115125432_isolated_recipient_key_enrollment.sql','20261115161155_isolated_pairing_cancellation.sql','20261115164408_isolated_sensitive_session_operations.sql'].map(file=>`supabase/migrations/${file}`)
function privateFile(path){if(!path||!isAbsolute(path))throw new Error();const s=statSync(path);if(!s.isFile()||(s.mode&0o077)!==0||(process.getuid&&s.uid!==process.getuid()))throw new Error()}
try{
 if(!isolatedConfigurationReady(process.env))throw new Error()
 privateFile(process.env.PGSERVICEFILE);privateFile(process.env.PGPASSFILE)
 if(!isolatedMigrationService(readFileSync(process.env.PGSERVICEFILE,'utf8'),process.env.KC_ISOLATED_TEST_PROJECT_REF))throw new Error()
 if(process.argv.length>3 || process.argv[2]&&process.argv[2]!=='--apply')throw new Error()
 if(process.argv[2]!=='--apply')console.log('PENDING: private isolated connection shape accepted; no database connection or migrations executed.')
 else{
  if(process.env.KC_ISOLATED_MIGRATION_OPT_IN!=='reviewed-synthetic-only')throw new Error()
  const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>!key.startsWith('PG')))
  env.PGSERVICEFILE=process.env.PGSERVICEFILE;env.PGPASSFILE=process.env.PGPASSFILE
  const result=spawnSync('psql',['service=kingdom_isolated','-X','-v','ON_ERROR_STOP=1','--single-transaction','-c',"SET LOCAL app.kingdom_isolated_fixture='synthetic-only'",...files.flatMap(file=>['-f',file])],{env,stdio:'inherit'})
  process.exitCode=result.status??1
 }
}catch{console.log('BLOCKED: explicit isolated configuration and owner-only absolute libpq service/password files required; direct isolated host, postgres owner and verify-full TLS only. No connection attempted.');process.exitCode=2}
