import mongoose,{Schema,models}from"mongoose";
const OfferProofSchema=new Schema({userId:{type:Schema.Types.ObjectId,ref:"User",required:true},clickId:{type:String,required:true,index:true},campaignId:{type:String,required:true},campaignName:String,proofUrl:{type:String,required:true},registeredContact:String,note:String,status:{type:String,enum:["pending","approved","rejected"],default:"pending"},reviewedBy:Schema.Types.ObjectId,reviewedAt:Date,reviewNote:String},{timestamps:true});
OfferProofSchema.index({userId:1,clickId:1},{unique:true});
export default models.OfferProof||mongoose.model("OfferProof",OfferProofSchema);
