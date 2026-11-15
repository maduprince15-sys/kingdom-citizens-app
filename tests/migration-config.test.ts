import {expect,it} from 'vitest'
import {isolatedMigrationService} from '../scripts/lib/migration-safety.mjs'
import {spawnSync} from 'node:child_process'
const service='[kingdom_isolated]\nhost=db.synthetic-test.supabase.co\nuser=postgres\ndbname=postgres\nsslmode=verify-full\n'
it('accepts only the explicitly isolated direct TLS service',()=>{expect(isolatedMigrationService(service,'synthetic-test')).toBe(true)})
it.each([
 service.replace('synthetic-test','jngbhejfqbyjletfknkh'),
 service+'hostaddr=127.0.0.1\n',
 service+'host=db.other-project.supabase.co\n',
 service.replace('verify-full','disable'),
 service.replace('host=db.synthetic-test.supabase.co','host=pooler.supabase.com'),
 service.replace('user=postgres','user=ordinary'),
 service+'[kingdom_isolated]\nhost=db.synthetic-test.supabase.co\n',
])('rejects ambiguous, Production or insecure migration service',text=>{expect(isolatedMigrationService(text,'synthetic-test')).toBe(false)})
it('rejects Production ref even with a matching direct service',()=>{expect(isolatedMigrationService(service.replace('synthetic-test','jngbhejfqbyjletfknkh'),'jngbhejfqbyjletfknkh')).toBe(false)})
it('default command and apply both fail BLOCKED without config and never launch psql',()=>{
 for(const args of [[],['--apply']]){const r=spawnSync(process.execPath,['scripts/check-isolated-migrations.mjs',...args],{env:{NODE_ENV:'test',PATH:'/path-without-psql'},encoding:'utf8'});expect(r.status).toBe(2);expect(r.stdout).toContain('No connection attempted')}
})
