import mongoose,{Schema,models}from"mongoose";
const DeviceBindingSchema=new Schema({deviceHash:{type:String,required:true,unique:true,index:true},userId:{type:Schema.Types.ObjectId,ref:"User",required:true,index:true},lastSeenAt:Date,userAgent:String},{timestamps:true});
export default models.DeviceBinding||mongoose.model("DeviceBinding",DeviceBindingSchema);
