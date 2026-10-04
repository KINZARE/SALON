import test from "node:test";
import assert from "node:assert/strict";
import { isMissingSchemaFeatureError } from "../src/lib/supabase/schema-compat.ts";

test("schema compatibility only treats missing table or column errors for the requested feature as fallback-safe",()=>{
  assert.equal(isMissingSchemaFeatureError({code:"42703",message:'column services.rebook_after_days does not exist'},["rebook_after_days"]),true);
  assert.equal(isMissingSchemaFeatureError({code:"42P01",message:'relation "waitlist_offers" does not exist'},["waitlist_offers"]),true);
  assert.equal(isMissingSchemaFeatureError({code:"PGRST204",message:"Could not find the 'condition' column"},["condition"]),true);
  assert.equal(isMissingSchemaFeatureError({code:"PGRST205",message:"Could not find the table 'public.waitlist_offers'"},["waitlist_offers"]),true);
  assert.equal(isMissingSchemaFeatureError({code:"42501",message:"permission denied for waitlist_offers"},["waitlist_offers"]),false);
  assert.equal(isMissingSchemaFeatureError({code:"42P01",message:'relation "other_table" does not exist'},["waitlist_offers"]),false);
});
