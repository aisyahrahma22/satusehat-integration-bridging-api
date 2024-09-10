import { Request, Response, NextFunction } from "express";
import { get } from "lodash";
import { verifyJwt } from "../utils/jwt.utils";
import { reIssueAccessToken } from "../services/iam/session.service";

const deserializeAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const accessToken = get(req, "headers.authorization", "").replace(/^Bearer\s/, "");
    const refreshToken = get(req, "headers.x-refresh");

    if (!accessToken) {
      return next();
    }

    const { decoded, expired } = verifyJwt(accessToken);

    if (decoded) {
      res.locals.user = decoded;
      return next();
    }

    if (expired && refreshToken) {
      const newAccessToken = await reIssueAccessToken({ refreshToken });

      if (newAccessToken) {
        res.setHeader("x-access-token", newAccessToken);

        const result = verifyJwt(newAccessToken);
        res.locals.user = result.decoded;
      }
    }

    return next();
  } catch (error) {
    console.error("Error in deserializeAuth middleware:", error);
    return next();
  }
};

export default deserializeAuth;
