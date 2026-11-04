import jwt from "jsonwebtoken";

function secret(){
    const s = process.env.JWT_SECRET;
    if (!s) throw new Error ("falta la variable de entorno JWT_SECRET");
    return s;
}

export const signToken = (userId) =>
    jwt.sign({ id: String(userId)}, secret(), {expiresIn: "7d"});

export const verifyToken = (token) => jwt.verify(token, secret());

export const {JsonWebTokenError, TokenExpiredError} = jwt;