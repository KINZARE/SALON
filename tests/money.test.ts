import { describe, it, expect } from 'vitest';
import { allocate, parseMinor, splitAmount } from '../src/lib/money';
describe('money', () => {
  it('assigns the remaining cent deterministically', () => expect(allocate(1000,[1,1,1])).toEqual([334,333,333]));
  it('keeps the total exact for unequal shares', () => expect(allocate(1001,[1,2,3])).toEqual([167,334,500]));
  it('parses amounts without floating point rounding', () => {expect(parseMinor('84,90')).toBe(8490);expect(parseMinor('0.01')).toBe(1);});
  it.each(['1.234','1,23.45','-1','1e3','Infinity','','0','9999999999999'])('rejects invalid amount %s', (s) => expect(()=>parseMinor(s)).toThrow());
  it('validates exact totals', () => {expect(splitAmount(1000,'exact',[300,700])).toEqual([300,700]);expect(()=>splitAmount(1000,'exact',[300,600])).toThrow();});
  it('validates percentage totals in basis points', () => {expect(splitAmount(1000,'percentage',[3333,3333,3334])).toEqual([333,333,334]);expect(()=>splitAmount(1000,'percentage',[50,50])).toThrow();});
  it('excludes zero-weight members', ()=>expect(allocate(1000,[1,0,1])).toEqual([500,0,500]));
  it('rejects zero/negative/unsafe weights', ()=> {expect(()=>allocate(1000,[0,0])).toThrow();expect(()=>allocate(1000,[-1,2])).toThrow();expect(()=>allocate(Number.MAX_SAFE_INTEGER,[1,1])).toThrow();});
  it('preserves all cents over many totals and weights', ()=> {for(let n=1;n<2000;n+=7){const values=allocate(n,[1,7,3,0,2]);expect(values.reduce((a,b)=>a+b,0)).toBe(n);expect(values[3]).toBe(0);}});
});
