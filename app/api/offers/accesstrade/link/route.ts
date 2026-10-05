import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getAuthSession } from "@/lib/auth";
import { createAccessTradeLink } from "@/lib/accesstrade";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import OfferClick from "@/models/OfferClick";
import DeviceBinding from "@/models/DeviceBinding";

export async function POST(request: Request) {
  const session=await getAuthSession(); if(!session?.user?.id)return NextResponse.json({error:"Unauthorized"},{status:401});
  await connectDB(); const user=await User.findById(session.user.id).select("country").lean() as {country?:string}|null; const detected=request.headers.get("x-vercel-ip-country");
  if(user?.country!=="VN"||(detected&&detected!=="VN"))return NextResponse.json({error:"This offer is available in Vietnam only"},{status:403});
  const body=await request.json(); if(!body.campaignId)return NextResponse.json({error:"campaignId is required"},{status:400});
  const deviceHash=crypto.createHash("sha256").update(String(body.deviceId||"")).digest("hex"),binding=await DeviceBinding.findOne({deviceHash,userId:session.user.id}); if(!binding)return NextResponse.json({error:"Verify this device before opening partner offers"},{status:403});
  const clickId=`pe_${crypto.randomBytes(12).toString("hex")}`;
  try { await OfferClick.create({userId:session.user.id,network:"accesstrade",clickId,subId:clickId,campaignId:String(body.campaignId),metadata:{url:body.url,userAgent:request.headers.get("user-agent")}}); const result=await createAccessTradeLink(String(body.campaignId),clickId,body.url); return NextResponse.json({...result,clickId}); }
  catch(error){await OfferClick.deleteOne({network:"accesstrade",clickId,status:"clicked"});return NextResponse.json({error:error instanceof Error?error.message:"AccessTrade unavailable"},{status:503});}
}
