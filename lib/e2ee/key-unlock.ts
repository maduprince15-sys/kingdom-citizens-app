// Application access latch only: not encryption-at-rest or hardware protection.
// Grant only after server-verified fresh MFA/session authorization; never persist.
export function createKeyUnlock(clock=()=>Date.now()){
 let deadline=0
 return {
  get expiresAt(){return deadline},
  grant(){deadline=clock()+300_000},
  lock(){deadline=0},
  isUnlocked(){return deadline>clock()},
  assertUnlocked(){if(deadline<=clock())throw new Error('Unlock keys with recent authenticator verification.')},
 }
}
