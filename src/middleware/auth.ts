import { verifyJwtJkn } from "../utils/jwt.utils";
import { Request, Response, NextFunction } from "express";

const JknVerify = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let accessToken:string = req.headers['x-token'] as string
        if(!accessToken){
            return res.status(401).send({
                metadata: {
                  message: "unauthorized",
                  code: 401
                }
              })
        }
        const { valid, decoded, expired } = verifyJwtJkn(accessToken);
        res.locals.user = decoded
        if (!valid) {
          let metadata
            if (expired) {
              metadata = {
                message: "Token Expired",
                code: 201
              }
            } else {
              metadata = {
                message: "Token invalid",
                code: 201
              }
            }
            return res.status(201).send({metadata})
        } else {
            return next()
        }
    } catch (e) {
        return res.status(500).send({
            response:{},
            metadata: {
              message: e,
              code: 500
            }
          })
    }
}

export default JknVerify;