import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import config from "../../config";
import { pool } from "../../db";

const registerUserIntoDB = async (payload: {
  name: string;
  email: string;
  password: string;
  role?: string;
}) => {
  const { name, email, password, role } = payload;

  // 1. Check if user already exists
  const existingUser = await pool.query(
    `SELECT id FROM users WHERE email = $1`,
    [email]
  );

  if (existingUser.rows.length > 0) {
    throw new Error("An account with this email already exists.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const userRole = role === "maintainer" ? "maintainer" : "contributor";

  const result = await pool.query(
    `
    INSERT INTO users (name, email, password, role)
    VALUES ($1, $2, $3, $4)
    RETURNING id, name, email, role, created_at, updated_at
    `,
    [name, email, hashedPassword, userRole]
  );

  return result.rows[0];
};

const loginUserIntoDB = async (payload: {
  email: string;
  password: string;
}) => {
  const { email, password } = payload;


  const userData = await pool.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );

  if (userData.rows.length === 0) {
    throw new Error("Invalid email or password.");
  }

  const user = userData.rows[0];

  const isPasswordMatch = await bcrypt.compare(password, user.password);

  if (!isPasswordMatch) {
    throw new Error("Invalid email or password.");
  }

  const jwtPayload = {
    id: user.id,
    name: user.name,
    role: user.role,
  };

  const token = jwt.sign(jwtPayload, config.secret as string, {
    expiresIn: "7d",
  });


  const { password: _pass, ...userWithoutPassword } = user;

  return {
    token,
    user: userWithoutPassword,
  };
};

export const authService = {
  registerUserIntoDB,
  loginUserIntoDB,
};