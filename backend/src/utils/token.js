import jwt from "jsonwebtoken";

export const signToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, identifier: user.identifier },
    process.env.JWT_SECRET || "development_secret_change_me",
    { expiresIn: "7d" }
  );
