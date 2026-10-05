import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { syncAccessTradeTransactions } from "@/lib/accesstrade-sync";
export const dynamic="force-dynamic";
export async function POST(){const session=await getAuthSession();if(session?.user?.role!=="admin")return NextResponse.json({error:"Forbidden"},{status:403});try{return NextResponse.json({ok:true,...await syncAccessTradeTransactions()});}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Sync failed"},{status:503});}}
