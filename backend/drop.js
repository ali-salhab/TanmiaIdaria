import mongoose from "mongoose";

await mongoose.connect("mongodb://localhost:27017/Emp");

await mongoose.connection.db.collection("employees").dropIndexes();

console.log("Indexes dropped");
process.exit();
