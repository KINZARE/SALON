import {it,expect} from 'vitest';
import {encodeSnapshot,decodeSnapshot,independentCopy,parseBackup,exportCsv} from '../src/lib/sharing';
import {sampleGroup,newGroup} from '../src/lib/domain';
it('shares a validated copy without receipts or history',()=>{const g=sampleGroup('Kwin');g.expenses[0].receipt='data:image/png;base64,aGVsbG8=';const copy=decodeSnapshot(encodeSnapshot(g));expect(copy.expenses[0].receipt).toBeNull();expect(copy.activities).toHaveLength(0);expect(copy.name).toBe(g.name);});
it('maps all references to new independent identifiers',()=>{const g=sampleGroup('Kwin'),copy=independentCopy(g,g.selfMemberId);expect(copy.id).not.toBe(g.id);expect(copy.members[0].id).not.toBe(g.members[0].id);expect(copy.expenses.every(e=>copy.members.some(m=>m.id===e.paidBy))).toBe(true);});
it('rejects malformed, too large and unsafe share payloads',()=>{expect(()=>decodeSnapshot('abc%')).toThrow();expect(()=>decodeSnapshot('a'.repeat(20001))).toThrow();expect(()=>parseBackup('{"version":1,"groups":[]}')).toThrow();});
it('preserves unicode in copies',()=>{const g=newGroup('Séoul & vrienden','trip','EUR','Zoë');expect(decodeSnapshot(encodeSnapshot(g)).members[0].name).toBe('Zoë');});
it('protects spreadsheet exports from formula injection',()=>{const g=sampleGroup('Kwin');g.expenses[0].title='=HYPERLINK("bad")';const csv=exportCsv(g);expect(csv).toContain("'=HYPERLINK");expect(csv).toContain('Bedrag');});
it('keeps a large allowed receipt backup importable',()=>{const g=sampleGroup('Kwin');for(const e of g.expenses)e.receipt='data:image/png;base64,'+'a'.repeat(2_666_660);const text=JSON.stringify({version:1,profileName:'Kwin',groups:[g,g].map((g,i)=>({...g,id:g.id+i}))});expect(parseBackup(text).groups).toHaveLength(2);});
