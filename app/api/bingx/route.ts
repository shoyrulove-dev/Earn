import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import AppSetting from "@/models/AppSetting";
import BingXSubmission from "@/models/BingXSubmission";
import { rateLimit, requestIp, verifyTurnstile } from "@/lib/security";

export async function GET() {
  const session=await getAuthSession();
  if(!session?.user?.id)return NextResponse.json({error:"Unauthorized"},{status:401});
  await connectDB();
  const [setting,submission]=await Promise.all([AppSetting.findOne({key:"bingx"}).lean(),BingXSubmission.findOne({userId:session.user.id,tier:1}).lean()]);
  const value=(setting as {value?:Record<string,unknown>}|null)?.value||{};
  const active=Boolean(value.active&&value.affiliateUrl);
  return NextResponse.json({config:{active,affiliateUrl:active?value.affiliateUrl:"",rewardPht:Number(value.rewardPht||100),holdDays:Number(value.holdDays||7),mysteryBox:String(value.mysteryBox||"Mystery Box worth at least 5 USDT for eligible new users")},submission});
}

export async function POST(request:Request) {
  const session=await getAuthSession();
  if(!session?.user?.id)return NextResponse.json({error:"Unauthorized"},{status:401});
  const {bingxUid,proofImageUrl,turnstileToken}=await request.json();
  const limited=await rateLimit("bingx-proof",session.user.id,5,3600000);if(!limited.allowed)return NextResponse.json({error:"Too many submissions"},{status:429});
  if(!(await verifyTurnstile(turnstileToken,requestIp(request))))return NextResponse.json({error:"Security check failed"},{status:400});
  if(!/^\d{5,30}$/.test(String(bingxUid||"")))return NextResponse.json({error:"Enter a valid numeric BingX UID"},{status:400});
  try{new URL(String(proofImageUrl||""));}catch{return NextResponse.json({error:"Enter a valid KYC proof image URL"},{status:400});}
  await connectDB();
  const setting=await AppSetting.findOne({key:"bingx"}).lean() as {value?:Record<string,unknown>}|null;
  if(!setting?.value?.active||!setting.value.affiliateUrl)return NextResponse.json({error:"BingX task is not active"},{status:409});
  try{const submission=await BingXSubmission.create({userId:session.user.id,tier:1,bingxUid:String(bingxUid),proofImageUrl:String(proofImageUrl),rewardPht:Number(setting.value.rewardPht||100),holdDays:Number(setting.value.holdDays||7)});return NextResponse.json({submission},{status:201});}
  catch(error){if((error as {code?:number}).code===11000)return NextResponse.json({error:"This user or BingX UID has already submitted Tier 1"},{status:409});throw error;}
}
