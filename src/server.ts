import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import { Pool } from "pg";
import config from "./config";

const app: Application = express();
const port = config.port;

app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));

const pool = new Pool({
  connectionString: config.connection_string
});

const initDB = async () => {
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

initDB();

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



app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
