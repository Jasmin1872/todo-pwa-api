import mongoose from "mongoose";

let cached = global._mongooseConn;
if (!cached) cached = global._mongooseConn = { conn: null, promise: null };

export async function connectToDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const { MONGODB_URI } = process.env;
    if (!MONGODB_URI) throw new Error("Falta MONGODB_URI");
        
       cached.promise = mongoose
      .connect(MONGODB_URI, {
        dbName : "BackPWA",
        autoIndex: !process.env.VERCEL,
      })
      .then((m) => m.connection)
      .catch((err) => {
        cached.promise = null;
        throw err;
      });
  }
  
cached.conn = await cached.promise;
return cached.conn;
}