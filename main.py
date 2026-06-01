import os
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
import psycopg2
from psycopg2.extras import RealDictCursor
import bcrypt

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === CONNEXION SUPABASE ===
DATABASE_URL = "postgresql://postgres:R%40glisse2912@db.okfudbtuuaedqwnufsez.supabase.co:5432/postgres"

def get_db_connection():
    return psycopg2.connect(DATABASE_URL)

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        master_password_hash TEXT NOT NULL
    )
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS vault (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        acc_name TEXT NOT NULL,
        email TEXT,
        stored_password TEXT NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )
    """)
    conn.commit()
    cursor.close()
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

@app.get("/", response_class=HTMLResponse)
async def read_index():
    with open("auth.html", "r", encoding="utf-8") as f:
        return f.read()

@app.get("/dashboard", response_class=HTMLResponse)
async def read_dashboard():
    with open("dashboard.html", "r", encoding="utf-8") as f:
        return f.read()

app.mount("/static", StaticFiles(directory="."), name="static")

@app.post("/register")
def register_user(account: AuthModel):
    pwd_bytes = account.master_password.encode('utf-8')
    pwd_hash = bcrypt.hashpw(pwd_bytes, bcrypt.gensalt()).decode('utf-8')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (username, master_password_hash) VALUES (%s, %s)",
            (account.username, pwd_hash)
        )
        conn.commit()
        return {"status": "Account created successfully!"}
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=400, detail="Username already exists.")
    finally:
        cursor.close()
        conn.close()

@app.post("/login")
def login_user(account: AuthModel):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, master_password_hash FROM users WHERE username = %s", (account.username,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if not user or not bcrypt.checkpw(account.master_password.encode('utf-8'), user[1].encode('utf-8')):
        raise HTTPException(status_code=400, detail="Invalid username or password.")
    return {"status": "Login successful!", "user_id": user[0]}

@app.post("/save")
def save_password(data: PasswordModel):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE username = %s", (data.username,))
    user = cursor.fetchone()
    
    if not user:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="User not found.")
    
    cursor.execute(
        "INSERT INTO vault (user_id, acc_name, email, stored_password) VALUES (%s, %s, %s, %s)",
        (user[0], data.acc_name, data.email, data.password)
    )
    conn.commit()
    cursor.close()
    conn.close()
    return {"status": "Password saved successfully!"}

@app.get("/passwords/{username}")
def get_passwords(username: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
    user = cursor.fetchone()
    
    if not user:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="User not found.")
    
    cursor.execute("SELECT acc_name, email, stored_password FROM vault WHERE user_id = %s", (user[0],))
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return [{"acc_name": r[0], "email": r[1] or "", "password": r[2]} for r in rows]
