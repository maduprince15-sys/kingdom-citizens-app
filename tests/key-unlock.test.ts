import {expect,it} from 'vitest'
import {createKeyUnlock} from '../lib/e2ee/key-unlock'
it('starts locked and never inherits a previous page unlock',()=>{const first=createKeyUnlock();expect(()=>first.assertUnlocked()).toThrow();first.grant();expect(first.isUnlocked()).toBe(true);expect(createKeyUnlock().isUnlocked()).toBe(false)})
it('expires after five minutes without extending on use',()=>{let time=1;const lock=createKeyUnlock(()=>time);lock.grant();time+=299999;lock.assertUnlocked();time++;expect(()=>lock.assertUnlocked()).toThrow()})
it('locks immediately on explicit account lifecycle invalidation',()=>{const lock=createKeyUnlock();lock.grant();lock.lock();expect(()=>lock.assertUnlocked()).toThrow();expect(lock.expiresAt).toBe(0)})
