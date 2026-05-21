import { Pool } from "pg";
import config from "../config";

export const pool = new Pool({
  connectionString: config.connection_string
});

export const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users(
      id SERIAL PRIMARY KEY,
      name VARCHAR(20),
      email VARCHAR(20) UNIQUE NOT NULL,
      password VARCHAR(20) NOT NULL,
      
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
      )`);
    console.log("Database connected Successfully");
  } catch (error) {
    console.log(error);
  }
};
