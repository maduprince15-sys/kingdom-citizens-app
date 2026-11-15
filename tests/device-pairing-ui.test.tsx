// @vitest-environment jsdom
import {afterEach,beforeEach,expect,it,vi} from 'vitest'
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
const m=vi.hoisted(()=>({getUser:vi.fn(),subscribe:vi.fn(),unsubscribe:vi.fn(),fetch:vi.fn(),stage:vi.fn(),generate:vi.fn(),answer:vi.fn()}))
vi.mock('../lib/supabase/client',()=>({createClient:()=>({auth:{getUser:m.getUser,onAuthStateChange:m.subscribe}})}))
vi.mock('../lib/e2ee/identity-vault',()=>({createIdentityVault:()=>({load:vi.fn(),forget:vi.fn(),stage:m.stage})}))
vi.mock('../lib/e2ee/recipient-envelope',()=>({generateRecipientIdentity:m.generate,publicKeyFingerprint:async()=>'new-pin'}))
vi.mock('../lib/e2ee/enrollment',()=>({answerNewKeyChallenge:m.answer}))
import DevicePairingPanel from '../app/dashboard/devices/DevicePairingPanel'
const A='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa'
beforeEach(()=>{
 vi.stubGlobal('indexedDB',{});vi.stubGlobal('fetch',m.fetch);m.getUser.mockReset().mockResolvedValue({data:{user:{id:A,email_confirmed_at:'confirmed'}},error:null});m.fetch.mockReset();m.subscribe.mockReturnValue({data:{subscription:{unsubscribe:m.unsubscribe}}})
})
afterEach(()=>{cleanup();vi.unstubAllGlobals()})
it('never generates keys or enrolls automatically when opened',()=>{
 render(<DevicePairingPanel citizenId={A}/>);expect(m.fetch).not.toHaveBeenCalled();expect(screen.getByText(/Only one device can be active/)).toBeTruthy()
 expect((screen.getByRole('button',{name:'Approve request'}) as HTMLButtonElement).disabled).toBe(true)
})
it('displays only the validated account registry',async()=>{
 m.fetch.mockResolvedValue({ok:true,json:async()=>({citizenId:A,state:'unenrolled',revision:0})})
 render(<DevicePairingPanel citizenId={A}/>);fireEvent.click(screen.getByRole('button',{name:'Refresh devices'}))
 await screen.findByText('Status: unenrolled · revision 0')
 expect(m.fetch).toHaveBeenCalledWith('/api/messages/recipient-keys',expect.objectContaining({cache:'no-store',credentials:'same-origin'}))
})
it('rejects account switch without sending a device request',async()=>{
 m.getUser.mockResolvedValue({data:{user:{id:'other',email_confirmed_at:'confirmed'}},error:null})
 render(<DevicePairingPanel citizenId={A}/>);fireEvent.click(screen.getByRole('button',{name:'Refresh devices'}))
 await screen.findByText(/Unable to complete/);expect(m.fetch).not.toHaveBeenCalled()
})
it('clears pairing input and consent immediately when logout begins',async()=>{
 render(<DevicePairingPanel citizenId={A}/>);fireEvent.change(screen.getByLabelText('Pairing request'),{target:{value:'pending'}})
 fireEvent.click(screen.getByRole('checkbox'));window.dispatchEvent(new Event('kingdom:keys-lock'))
 await waitFor(()=>expect((screen.getByLabelText('Pairing request') as HTMLTextAreaElement).value).toBe(''))
 expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(false)
})

it('starts enrollment from the actual bare server challenge response and binds expected Citizen',async()=>{
 const D='dddddddd-dddd-4ddd-dddd-dddddddddddd'
 const challenge={context:{citizenId:A,deviceId:D,keyId:'new-pin',challengeId:D,expectedRevision:0,expiresAt:new Date(Date.now()+60_000).toISOString()},priorKeyId:null,wrappedProof:'wrapped',priorWrappedProof:null}
 vi.stubGlobal('crypto',{randomUUID:()=>D,subtle:{exportKey:async()=>new Uint8Array([1]).buffer}})
 m.generate.mockResolvedValue({publicKey:{},privateKey:{extractable:false}});m.stage.mockResolvedValue('new-pin');m.answer.mockResolvedValue({proof:'one-time-proof'})
 m.fetch.mockResolvedValueOnce({ok:true,json:async()=>({citizenId:A,state:'unenrolled',revision:0})}).mockResolvedValueOnce({ok:true,json:async()=>challenge})
 render(<DevicePairingPanel citizenId={A}/>);fireEvent.click(screen.getByRole('button',{name:'Start enrollment on this device'}))
 await screen.findByText('New fingerprint: new-pin')
 expect(m.stage).toHaveBeenCalledWith(A,D,expect.any(Object))
 expect(m.fetch).toHaveBeenLastCalledWith('/api/messages/recipient-keys',expect.objectContaining({method:'POST',headers:{'Content-Type':'application/json','X-KC-Citizen':A}}))
 expect((screen.getByLabelText('Pairing request for your trusted device') as HTMLTextAreaElement).value).not.toContain('one-time-proof')
})

it.each(['expired','transport-failure'])('clears consent and pending approval input on %s without an auth event',async mode=>{
 render(<DevicePairingPanel citizenId={A}/>);fireEvent.change(screen.getByLabelText('Pairing request'),{target:{value:'sensitive-pairing-request'}});fireEvent.click(screen.getByRole('checkbox'))
 if(mode==='transport-failure')m.getUser.mockRejectedValue(new Error('network'))
 else m.getUser.mockResolvedValue({data:{user:null},error:new Error('expired')})
 fireEvent.click(screen.getByRole('button',{name:'Refresh devices'}));await screen.findByText(/Unable to complete/)
 expect((screen.getByLabelText('Pairing request') as HTMLTextAreaElement).value).toBe('')
 expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(false);expect(m.fetch).not.toHaveBeenCalled()
})
