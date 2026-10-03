import "./helpers/server-imports.mjs";
import test from "node:test";
import assert from "node:assert/strict";
const { sendTransactionalEmail, isEmailDeliveryConfigured } = await import("../src/services/email-provider.ts");

const input={to:"qa@example.com",subject:"Test",text:"Test message",idempotencyKey:"salon/booking_confirmation/job-1"};
test("email adapter preserves configuration success failures and idempotency",async t=>{
  const key=process.env.RESEND_API_KEY,from=process.env.RESEND_FROM_EMAIL;
  try {
    delete process.env.RESEND_API_KEY;delete process.env.RESEND_FROM_EMAIL;
    assert.equal(isEmailDeliveryConfigured(),false);
    await assert.rejects(sendTransactionalEmail(input),/EMAIL_PROVIDER_NOT_CONFIGURED/);
    process.env.RESEND_API_KEY="re_test_mock_only";process.env.RESEND_FROM_EMAIL="ORSIRA <qa@example.com>";
    assert.equal(isEmailDeliveryConfigured(),true);
    let result={status:200,body:{id:"provider-1"} as Record<string,unknown>};
    let request:Request|null=null;
    t.mock.method(globalThis,"fetch",async(url:string|URL|Request,init?:RequestInit)=>{
      request=new Request(url,init);
      return new Response(JSON.stringify(result.body),{status:result.status,headers:{"content-type":"application/json"}});
    });
    assert.deepEqual(await sendTransactionalEmail(input),{provider:"resend",id:"provider-1"});
    assert.equal((request as unknown as Request).headers.get("idempotency-key"),input.idempotencyKey);
    assert.deepEqual(await (request as unknown as Request).json(),{from:process.env.RESEND_FROM_EMAIL,to:[input.to],subject:input.subject,text:input.text});
    result={status:422,body:{name:"validation_error",message:"Invalid sender"}};
    await assert.rejects(sendTransactionalEmail(input),/EMAIL_SEND_FAILED:Invalid sender/);
    result={status:200,body:{}};
    await assert.rejects(sendTransactionalEmail(input),/EMAIL_SEND_FAILED:MISSING_PROVIDER_ID/);
    result={status:200,body:{id:"provider-2"}};
    await sendTransactionalEmail({...input,idempotencyKey:"x".repeat(300)});
    assert.equal((request as unknown as Request).headers.get("idempotency-key")?.length,256);
  } finally {
    if(key===undefined)delete process.env.RESEND_API_KEY;else process.env.RESEND_API_KEY=key;
    if(from===undefined)delete process.env.RESEND_FROM_EMAIL;else process.env.RESEND_FROM_EMAIL=from;
  }
});
