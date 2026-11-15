import {beforeEach,expect,it,vi} from 'vitest'
import {createSessionKeyAccess} from '../lib/e2ee/session-access'
import type {ActiveIdentityRecord} from '../lib/e2ee/identity-vault'
const active={citizenId:'citizen-a',deviceId:'device-a',state:'active',revision:1,keyId:'pin',revokedAt:null} as ActiveIdentityRecord
const getCitizen=vi.fn(),getActive=vi.fn(),load=vi.fn()
const setup=()=>createSessionKeyAccess({citizenId:'citizen-a',assertUnlocked:()=>{},getCitizen,getActive,vault:{load}})
beforeEach(()=>{getCitizen.mockReset().mockResolvedValue('citizen-a');getActive.mockReset().mockImplementation(async()=>({...active}));load.mockReset().mockResolvedValue({privateKey:{extractable:false}})})
it('validates sessions and current registry before and after protected work',async()=>{
 const access=setup(),operation=vi.fn().mockResolvedValue('approved')
 expect(await access.use('pin',operation)).toBe('approved');expect(getCitizen).toHaveBeenCalledTimes(4);expect(getActive).toHaveBeenCalledTimes(2)
 expect(load).toHaveBeenCalledWith('citizen-a',active,'pin',1)
})
it.each([null,'citizen-b'])('rejects expired or switched identity %s before local key access',async id=>{
 getCitizen.mockResolvedValue(id);await expect(setup().use('pin',vi.fn())).rejects.toThrow('Reauthenticate');expect(load).not.toHaveBeenCalled()
})
it('rejects a substituted registry account before key access',async()=>{
 getActive.mockResolvedValue({...active,citizenId:'citizen-b'});await expect(setup().use('pin',vi.fn())).rejects.toThrow('identity');expect(load).not.toHaveBeenCalled()
})
it('invalidates in-flight approval on logout before it can be published',async()=>{
 const access=setup();await expect(access.use('pin',async()=>{access.invalidate();return 'proof'})).rejects.toThrow('Reauthenticate')
})
it('checks session again after asynchronous vault loading',async()=>{
 const access=setup();load.mockImplementation(async()=>{access.invalidate();return {}})
 const operation=vi.fn();await expect(access.use('pin',operation)).rejects.toThrow();expect(operation).not.toHaveBeenCalled()
})
it.each(['keyId','deviceId','revision','state','revokedAt','citizenId'])('rejects changed authorization field %s after crypto',async field=>{
 getActive.mockResolvedValueOnce(active).mockResolvedValueOnce({...active,[field]:field==='revision'?2:'changed'})
 await expect(setup().use('pin',async()=>'proof')).rejects.toThrow('authorization changed')
})
it('does not rotate or regenerate missing material',async()=>{load.mockResolvedValue(null);await expect(setup().use('pin',vi.fn())).rejects.toThrow('no matching private key')})
it('cannot use a disposed controller after remount or account switch',async()=>{const access=setup();access.dispose();await expect(access.use('pin',vi.fn())).rejects.toThrow()})
it('propagates denied registry/profile access without using keys',async()=>{getActive.mockRejectedValue(new Error('profile removed'));await expect(setup().use('pin',vi.fn())).rejects.toThrow();expect(load).not.toHaveBeenCalled()})
it('reauthentication keeps the same retained key without rotating',async()=>{const access=setup();access.invalidate();expect(await access.use('pin',async()=>'same-key')).toBe('same-key')})

it('checks explicit unlock state before touching identity or storage',async()=>{
 const access=createSessionKeyAccess({citizenId:'citizen-a',getCitizen,getActive,vault:{load},assertUnlocked:()=>{throw new Error('locked')}})
 await expect(access.use('pin',vi.fn())).rejects.toThrow('locked');expect(load).not.toHaveBeenCalled();expect(getCitizen).not.toHaveBeenCalled()
})
