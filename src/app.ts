import express, {
  type Application,
  type Request,
  type Response,
} from "express";

import { initDB, pool } from "./db";

const app: Application = express();


app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));




app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "DevPulse Server",
    Author: "Zisan Ul Haque",
  });
});

app.post("/api/users", async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    const result = await pool.query(
      `
    INSERT INTO users(name,email,password) VALUES($1,$2,$3) 
    RETURNING *
    `,
      [name, email, password],
    );

    res.status(201).json({
      success: true,
      message: "Created!!",
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: error,
    });
  }
});

app.get("/api/users", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `
      SELECT * FROM users
    `,
    );

    res.status(200).json({
      success: true,
      message: "Users retrived successfully!!",
      data: result.rows,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: error,
    });
  }
});

app.get("/api/users/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `
      SELECT * FROM users WHERE id=$1
    `,
      [id],
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "User Not found!",
        data: {},
      });
    }

    res.status(200).json({
      success: true,
      message: "User retrived successfully!!",
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: error,
    });
  }
});

app.put("/api/users/:id", async (req: Request, res: Response) => {
  const {id} = req.params;
  const { name, password} = req.body;
  try {
    const result = await pool.query(
      `
    UPDATE users 
    SET 
    name=COALESCE($1,name),
    password=COALESCE($2, password)


    WHERE id=$3 RETURNING *
    `,
      [name,password,id],
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "User Not found!",
        data: {},
      });
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully!!",
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: error,
    });
  }
});

app.delete("/api/users/:id", async (req: Request, res: Response) => {
  const {id} = req.params;
  try {
    const result = await pool.query(
      `
    DELETE FROM users 
    WHERE id=$1
    `,
      [id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "User Not found!",
      });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully!!",
      data: {},
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: error,
    });
  }
});



export default app
