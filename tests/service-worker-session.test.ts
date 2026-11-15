import {expect,it,vi} from 'vitest'
import {readFileSync} from 'node:fs'
import {runInNewContext} from 'node:vm'
function worker(){
 const handlers:Record<string,(event:unknown)=>void>={},fetch=vi.fn().mockRejectedValue(new Error('offline')),match=vi.fn().mockResolvedValue(new Response('stale-private-data'))
 runInNewContext(readFileSync('public/sw.js','utf8'),{URL,fetch,caches:{match},self:{addEventListener:(name:string,callback:(event:unknown)=>void)=>{handlers[name]=callback}}})
 return {handlers,fetch,match}
}
const probes:{path:string;mode?:string;headers?:Record<string,string>;cache?:string}[]=[
 {path:'/api/messages/recipient-keys'},
 {path:'/auth/callback'},
 {path:'/dashboard/devices',mode:'navigate'},
 {path:'/profile',headers:{RSC:'1'}},
 {path:'/private',headers:{Authorization:'Bearer synthetic'}},
 {path:'/private',cache:'no-store'},
]
it.each(probes)('never replays cached auth data for $path',async input=>{
 const w=worker();let response:Promise<Response>|undefined
 w.handlers.fetch({request:{method:'GET',url:`https://preview.invalid${input.path}`,mode:'mode' in input?input.mode:'cors',cache:'cache' in input?input.cache:'default',headers:new Headers('headers' in input?input.headers:undefined)},respondWith:(value:Promise<Response>)=>{response=value}})
 await expect(response).rejects.toThrow('offline');expect(w.match).not.toHaveBeenCalled()
})
it('preserves existing offline fallback for ordinary static assets',async()=>{
 const w=worker();let response:Promise<Response>|undefined
 w.handlers.fetch({request:{method:'GET',url:'https://preview.invalid/_next/static/chunk.js',cache:'default',mode:'cors',headers:new Headers()},respondWith:(value:Promise<Response>)=>{response=value}})
 expect(await (await response!).text()).toBe('stale-private-data');expect(w.match).toHaveBeenCalledTimes(1)
})
