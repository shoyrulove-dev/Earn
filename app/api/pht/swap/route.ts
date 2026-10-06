import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import { PHT_PER_USD } from "@/lib/pht";
import { rateLimit } from "@/lib/security";
import { writeAudit } from "@/lib/audit";
export async function POST(request:Request){const session=await getAuthSession();if(!session?.user?.id)return NextResponse.json({error:"Unauthorized"},{status:401});const limited=await rateLimit("pht-swap",session.user.id,20,3600000);if(!limited.allowed)return NextResponse.json({error:"Too many swap requests"},{status:429});const {phtAmount}=await request.json();const amount=Math.floor(Number(phtAmount));if(!Number.isFinite(amount)||amount<100)return NextResponse.json({error:"Minimum swap is 100 PHT"},{status:400});const usd=Math.floor((amount/PHT_PER_USD)*100)/100;if(usd<=0)return NextResponse.json({error:"Amount is too small"},{status:400});await connectDB();const user=await User.findOneAndUpdate({_id:session.user.id,phtBalance:{$gte:amount}},{$inc:{phtBalance:-amount,usdBalance:usd}},{new:true});if(!user)return NextResponse.json({error:"Insufficient PHT balance"},{status:400});const tx=await Transaction.create({userId:user._id,type:"swap",currency:"USD",amount:usd,status:"approved",source:"PHT_USD",reference:`swap:${user._id}:${Date.now()}`,metadata:{phtAmount:amount,rate:PHT_PER_USD}});await writeAudit({actorId:user._id,action:"wallet.swap.pht_usd",target:String(tx._id),metadata:{phtAmount:amount,usd}});return NextResponse.json({ok:true,phtBalance:user.phtBalance,usdBalance:user.usdBalance,usd});}
