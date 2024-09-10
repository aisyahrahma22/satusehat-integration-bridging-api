import { Request, Response, NextFunction } from "express";
import { Authority } from "../../utils/enum";

const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = res.locals.user;

  if (user && user.authority !== Authority.ADMIN) {
    return res.sendStatus(403);
  }

  return next();
};

export default isAdmin;
