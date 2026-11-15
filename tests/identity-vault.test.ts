import { beforeAll, beforeEach, expect, it } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import { createIdentityVault, type ActiveIdentityRecord } from '../lib/e2ee/identity-vault'
import { generateRecipientIdentity, publicKeyFingerprint } from '../lib/e2ee/recipient-envelope'
import { bytesToBase64 } from '../lib/e2ee/crypto'
const A='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', B='bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb', D='dddddddd-dddd-4ddd-dddd-dddddddddddd'
let identity: CryptoKeyPair, other: CryptoKeyPair, active: ActiveIdentityRecord, factory: IDBFactory
beforeAll(async()=>{
 identity=await generateRecipientIdentity(); other=await generateRecipientIdentity()
 active={citizenId:A,deviceId:D,keyId:await publicKeyFingerprint(identity.publicKey),publicSpki:bytesToBase64(new Uint8Array(await crypto.subtle.exportKey('spki',identity.publicKey))),state:'active',revision:1,version:1,revokedAt:null}
},30_000)
beforeEach(()=>{ factory=new IDBFactory() })
const load=(vault=createIdentityVault(factory))=>vault.load(A,active,active.keyId,1)
it('persists structured-cloned non-extractable keys across vault instances',async()=>{
 await createIdentityVault(factory).stage(A,D,identity)
 const restored=await load();expect(restored?.privateKey.extractable).toBe(false)
 await expect(crypto.subtle.exportKey('pkcs8',restored!.privateKey)).rejects.toThrow()
 expect(await publicKeyFingerprint(restored!.publicKey)).toBe(active.keyId)
})
it('retains the same identity after reauthentication without silently regenerating',async()=>{
 const vault=createIdentityVault(factory);await vault.stage(A,D,identity)
 await expect(vault.load(null,active,active.keyId,1)).rejects.toThrow('Authenticated')
 expect(await load()).not.toBeNull()
})
it('never recovers missing or deleted keys from authentication alone',async()=>{
 expect(await load()).toBeNull()
 const vault=createIdentityVault(factory);await vault.stage(A,D,identity);await vault.forget(A,D)
 expect(await load()).toBeNull()
})
it('isolates two Citizens using the same device identifier',async()=>{
 const vault=createIdentityVault(factory);await vault.stage(A,D,identity)
 await expect(vault.load(B,active,active.keyId,1)).rejects.toThrow()
 expect(await vault.load(B,{...active,citizenId:B},active.keyId,1)).toBeNull()
 await vault.stage(B,D,identity);await vault.forget(B,D);expect(await load()).not.toBeNull()
})
it.each(['revoked','stale','substituted','wrong-device'])('refuses %s registry state',async mode=>{
 const vault=createIdentityVault(factory);await vault.stage(A,D,identity)
 const record={...active}
 if(mode==='revoked'){record.state='revoked';record.revokedAt=new Date().toISOString()}
 if(mode==='stale')record.revision=0
 if(mode==='substituted')record.keyId=await publicKeyFingerprint(other.publicKey)
 if(mode==='wrong-device')record.deviceId=B
 if(mode==='wrong-device')expect(await vault.load(A,record,active.keyId,1)).toBeNull()
 else await expect(vault.load(A,record,active.keyId,1)).rejects.toThrow()
})
it('rejects mismatched private/public material before writing',async()=>{
 await expect(createIdentityVault(factory).stage(A,D,{publicKey:identity.publicKey,privateKey:other.privateKey})).rejects.toThrow('corrupted')
 expect(await load()).toBeNull()
})
it('rejects extractable private keys',async()=>{
 const extractable=await crypto.subtle.generateKey({name:'RSA-OAEP',modulusLength:3072,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['encrypt','decrypt','wrapKey','unwrapKey'])
 await expect(createIdentityVault(factory).stage(A,D,extractable)).rejects.toThrow('corrupted')
},30_000)
it('never overwrites an existing device identity',async()=>{
 const vault=createIdentityVault(factory);await vault.stage(A,D,identity)
 await expect(vault.stage(A,D,other)).rejects.toThrow('storage operation failed')
 expect(await load()).not.toBeNull()
})
it('serializes concurrent enrollment staging with exactly one winner',async()=>{
 const results=await Promise.allSettled([createIdentityVault(factory).stage(A,D,identity),createIdentityVault(factory).stage(A,D,identity)])
 expect(results.filter(result=>result.status==='fulfilled')).toHaveLength(1)
 expect(await load()).not.toBeNull()
})
it('fails closed on corrupted persisted keys rather than replacing them',async()=>{
 await createIdentityVault(factory).stage(A,D,identity)
 await new Promise<void>((resolve,reject)=>{
  const open=factory.open('kingdom-citizens-private-identities-v1',1)
  open.onsuccess=()=>{const db=open.result,tx=db.transaction('identities','readwrite');tx.objectStore('identities').put({citizenId:A,deviceId:D,keyId:active.keyId,identity:{publicKey:identity.publicKey,privateKey:other.privateKey}});tx.oncomplete=()=>{db.close();resolve()};tx.onabort=()=>reject(new Error('fixture failed'))}
 })
 await expect(load()).rejects.toThrow('corrupted')
})
it('requires an authenticated identity for local deletion',async()=>{
 await expect(createIdentityVault(factory).forget(null,D)).rejects.toThrow('Authenticated')
})
