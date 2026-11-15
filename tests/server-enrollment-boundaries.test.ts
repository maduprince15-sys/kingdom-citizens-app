import { expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
it.each(['lib/e2ee/crypto.ts','lib/e2ee/recipient-envelope.ts','lib/e2ee/enrollment.ts'])('keeps server enrollment dependency %s outside client-only boundaries',path=>{
  const source=ts.createSourceFile(path,readFileSync(path,'utf8'),ts.ScriptTarget.Latest,true)
  const directives=[]
  for(const statement of source.statements){
    if(!ts.isExpressionStatement(statement)||!ts.isStringLiteral(statement.expression))break
    directives.push(statement.expression.text)
  }
  expect(directives).not.toContain('use client')
})
