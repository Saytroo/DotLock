import os
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
import sqlite3
import bcrypt

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


DB_DIR = "/data" if os.path.exists("/data") else "."
DB_NAME = os.path.join(DB_DIR, "dotlock.db")




@app.get("/", response_class=HTMLResponse)
async def read_index():
    with open("auth.html", "r", encoding="utf-8") as f:
        return f.read()


@app.get("/dashboard", response_class=HTMLResponse)
async def read_dashboard():
    with open("dashboard.html", "r", encoding="utf-8") as f:
        return f.read()


app.mount("/static", StaticFiles(directory="."), name="static")




def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        master_password_hash TEXT NOT NULL
    )
    """)
    
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS vault (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        acc_name TEXT NOT NULL,
        email TEXT,
        stored_password TEXT NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )
    """)
    conn.commit()
    conn.close()

init_db()

class AuthModel(BaseModel):
    username: str
    master_password: str


class PasswordModel(BaseModel):
    username: str  
    acc_name: str
    email: str = ""
    password: str

# --- ROUTES ---

@app.post("/register")
def register_user(account: AuthModel):
    pwd_bytes = account.master_password.encode('utf-8')
    pwd_hash = bcrypt.hashpw(pwd_bytes, bcrypt.gensalt()).decode('utf-8')
    
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (username, master_password_hash) VALUES (?, ?)",
            (account.username, pwd_hash)
        )
        conn.commit()
        return {"status": "Account created successfully!"}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Username already exists.")
    finally:
        conn.close()

@app.post("/login")
def login_user(account: AuthModel):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT id, master_password_hash FROM users WHERE username = ?", (account.username,))
    user = cursor.fetchone()
    conn.close()
    
    if not user:
        raise HTTPException(status_code=400, detail="Invalid username or password.")
    
    user_id, pwd_hash_db = user
    
    if bcrypt.checkpw(account.master_password.encode('utf-8'), pwd_hash_db.encode('utf-8')):
        return {"status": "Login successful!", "user_id": user_id}
    else:
        raise HTTPException(status_code=400, detail="Invalid username or password.")

@app.post("/save")
def save_password(data: PasswordModel):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    cursor.execute("SELECT id FROM users WHERE username = ?", (data.username,))
    user = cursor.fetchone()
    
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found.")
    
    user_id = user[0]
    

    cursor.execute(
        "INSERT INTO vault (user_id, acc_name, email, stored_password) VALUES (?, ?, ?, ?)",
        (user_id, data.acc_name, data.email, data.password)
    )
    conn.commit()
    conn.close()
    
    return {"status": f"Password for {data.acc_name} saved successfully!"}

@app.get("/passwords/{username}")
def get_passwords(username: str):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found.")
    
    user_id = user[0]
    

    cursor.execute("SELECT acc_name, email, stored_password FROM vault WHERE user_id = ?", (user_id,))
    rows = cursor.fetchall()
    conn.close()
    
    return [{"acc_name": row[0], "email": row[1] if row[1] else "", "password": row[2]} for row in rows]
