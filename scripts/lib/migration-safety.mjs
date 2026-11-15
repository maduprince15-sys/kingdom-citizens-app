// Strict subset of libpq service syntax; ambiguous configurations fail closed.
export function isolatedMigrationService(text,ref){
 if(typeof ref!=='string'||!/^[a-z0-9-]{1,63}$/.test(ref)||ref==='jngbhejfqbyjletfknkh')return false
 let active=false,found=false;const fields={}
 for(const raw of text.split(/\r?\n/)){
  const line=raw.trim();if(!line||line.startsWith('#'))continue
  if(line.startsWith('[')){
   if(!/^\[[A-Za-z0-9_-]+\]$/.test(line))return false
   active=line==='[kingdom_isolated]';if(active&&found)return false;if(active)found=true;continue
  }
  if(!active)continue
  const index=line.indexOf('=');if(index<1)return false
  const key=line.slice(0,index).trim(),value=line.slice(index+1).trim()
  if(!['host','port','dbname','user','password','sslmode','sslrootcert'].includes(key)||key in fields)return false
  fields[key]=value
 }
 return found&&fields.host===`db.${ref}.supabase.co`&&(!fields.port||fields.port==='5432')&&fields.dbname==='postgres'&&fields.user==='postgres'&&fields.sslmode==='verify-full'
}
