export type WaitlistOfferInput={
  waitlistEntryId:string;
  serviceId:string;
  staffId:string;
  startsAt:string;
  endsAt:string;
  expiresAt:string;
};

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateWaitlistOffer(input:WaitlistOfferInput,nowIso=new Date().toISOString()):WaitlistOfferInput{
  if(!UUID.test(input.waitlistEntryId)||!UUID.test(input.serviceId)||!UUID.test(input.staffId))throw new Error("INVALID_OFFER_REFERENCE");
  const now=new Date(nowIso);
  const startsAt=new Date(input.startsAt);
  const endsAt=new Date(input.endsAt);
  const expiresAt=new Date(input.expiresAt);
  if([now,startsAt,endsAt,expiresAt].some(value=>Number.isNaN(value.getTime())))throw new Error("INVALID_OFFER_TIME");
  if(endsAt<=startsAt||startsAt<=now)throw new Error("INVALID_OFFER_RANGE");
  if(expiresAt<=now||expiresAt>=startsAt)throw new Error("INVALID_OFFER_EXPIRY");
  return{
    waitlistEntryId:input.waitlistEntryId,
    serviceId:input.serviceId,
    staffId:input.staffId,
    startsAt:startsAt.toISOString(),
    endsAt:endsAt.toISOString(),
    expiresAt:expiresAt.toISOString(),
  };
}
