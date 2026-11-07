import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {parse} from '@vue/compiler-sfc'
import ts from 'typescript'
const root=fileURLToPath(new URL('../apps/docs/src/examples/',import.meta.url)),printer=ts.createPrinter({newLine:ts.NewLineKind.LineFeed})
const identifiers=text=>new Set(text.match(/\b[A-Za-z_$][\w$]*\b/g)||[])
for(const folder of fs.readdirSync(root))for(const name of fs.readdirSync(path.join(root,folder)).filter(x=>x.endsWith('.vue'))){
 const file=path.join(root,folder,name),raw=fs.readFileSync(file,'utf8'),d=parse(raw).descriptor,source=ts.createSourceFile(name+'.ts',d.scriptSetup.content,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS)
 const needed=identifiers(d.template.content),candidates=[]
 for(const statement of source.statements){
  if(ts.isVariableStatement(statement)){for(const declaration of statement.declarationList.declarations)candidates.push({node:ts.factory.updateVariableStatement(statement,statement.modifiers,ts.factory.createVariableDeclarationList([declaration],statement.declarationList.flags)),name:ts.isIdentifier(declaration.name)?declaration.name.text:undefined,source:declaration.getText(source)})}
  else if(ts.isFunctionDeclaration(statement)||ts.isInterfaceDeclaration(statement)||ts.isTypeAliasDeclaration(statement))candidates.push({node:statement,name:statement.name?.text,source:statement.getText(source)})
  else if(!ts.isImportDeclaration(statement))candidates.push({node:statement,source:statement.getText(source)})
 }
 let changed=true;while(changed){changed=false;for(const item of candidates)if(!item.name||needed.has(item.name)){for(const id of identifiers(item.source))if(!needed.has(id)){needed.add(id);changed=true}}}
 const kept=[];for(const statement of source.statements)if(ts.isImportDeclaration(statement)){
  const clause=statement.importClause;if(!clause){kept.push(statement);continue}const defaultName=clause.name&&needed.has(clause.name.text)?clause.name:undefined,bindings=clause.namedBindings
  const selected=bindings&&ts.isNamedImports(bindings)?bindings.elements.filter(x=>needed.has(x.name.text)):[]
  if(defaultName||selected.length||bindings&&ts.isNamespaceImport(bindings)&&needed.has(bindings.name.text))kept.push(ts.factory.updateImportDeclaration(statement,statement.modifiers,ts.factory.updateImportClause(clause,clause.isTypeOnly,defaultName,selected.length?ts.factory.updateNamedImports(bindings,selected):bindings&&ts.isNamespaceImport(bindings)?bindings:undefined),statement.moduleSpecifier,statement.attributes))
 }
 kept.push(...candidates.filter(x=>!x.name||needed.has(x.name)).map(x=>x.node))
 const script=kept.map(node=>printer.printNode(ts.EmitHint.Unspecified,node,source)).join('\n')
 const html=d.template.content.replace(/class="ent-panel"/g,'class="demo-panel"')
 fs.writeFileSync(file,`<script setup lang="ts">\n${script}\n</script>\n<template>${html}</template>\n${d.styles.map(s=>'<style scoped>'+s.content.replace(/var\(--muted\)/g,'var(--hys-ui-muted,#7b879e)')+'</style>').join('\n')}`.trimEnd()+'\n')
}
console.log('Pruned unused example imports and state while preserving dependency closures')
