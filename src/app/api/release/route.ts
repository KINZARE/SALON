import {NextResponse} from 'next/server';
export const dynamic='force-dynamic';
// Render supplies this value for the deployed immutable source commit.
export function GET(){
 const sha=process.env.RENDER_GIT_COMMIT;
 return NextResponse.json({sha:sha&&/^[a-f0-9]{40}$/.test(sha)?sha:null},{headers:{'Cache-Control':'no-store'}});
}
