import { Request, Response, NextFunction } from "express";

const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  const user = res.locals.user;

  if (!user) {
    return res.sendStatus(401);
  }

  if (user && user.source !== 'cms') {
    return res.sendStatus(403);
  }

  return next();
};

export default isAuthenticated;
