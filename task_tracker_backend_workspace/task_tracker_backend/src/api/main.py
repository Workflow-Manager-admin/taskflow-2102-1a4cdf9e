import os
from fastapi import FastAPI, HTTPException, Depends, status, Query
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from pydantic import BaseModel, EmailStr, Field, ValidationError
from typing import Optional, List, Literal
from datetime import datetime, timedelta
import jwt
import httpx
from dotenv import load_dotenv


# Load environment variables and Supabase configs
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
JWT_SECRET = os.getenv("JWT_SECRET", "supersecret")  # For demo only; replace in production
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_MINUTES = 60 * 24 * 7  # 7 days


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

# --------- SUPABASE API HELPERS ----------
SUPABASE_HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}


async def supabase_fetch(
    table: str,
    select: str = "*",
    filters: Optional[str] = None,
    single: bool = False
):
    url = f"{SUPABASE_URL}/rest/v1/{table}?select={select}"
    if filters:
        url += f"&{filters}"
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, headers=SUPABASE_HEADERS)
        resp.raise_for_status()
        data = resp.json()
        return data[0] if (single and data) else data


async def supabase_insert(table: str, payload: dict):
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, headers=SUPABASE_HEADERS, json=payload)
        resp.raise_for_status()
        return resp.json()


async def supabase_update(table: str, match_filter: str, payload: dict):
    # match_filter like 'id=eq.1'
    url = f"{SUPABASE_URL}/rest/v1/{table}?{match_filter}"
    async with httpx.AsyncClient() as client:
        resp = await client.patch(url, headers=SUPABASE_HEADERS, json=payload)
        resp.raise_for_status()
        return resp.json()


async def supabase_delete(table: str, match_filter: str):
    url = f"{SUPABASE_URL}/rest/v1/{table}?{match_filter}"
    async with httpx.AsyncClient() as client:
        resp = await client.delete(url, headers=SUPABASE_HEADERS)
        resp.raise_for_status()
        return resp.json()


# --------- DATA MODELS & UTILS ----------


class UserBase(BaseModel):
    email: EmailStr = Field(..., description="User's email address")


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="User's password")


class UserLogin(UserBase):
    password: str = Field(
        ...,
        min_length=6,
        description="The password for authentication"
    )


class UserInDB(UserBase):
    id: int
    hashed_password: str


class UserPublic(UserBase):
    id: int


class Token(BaseModel):
    access_token: str
    token_type: str


class TaskCreate(BaseModel):
    title: str = Field(..., description="Title of the task")
    description: Optional[str] = Field(None, description="Description of the task")
    status: Literal[
        "pending", "in_progress", "completed"
    ] = Field("pending", description="Current status of the task")


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, description="Title of the task")
    description: Optional[str] = Field(None, description="Description of the task")
    status: Optional[
        Literal["pending", "in_progress", "completed"]
    ] = Field(None, description="Current status of the task")


class Task(TaskCreate):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime]


# Authentication Utilities


def hash_password(pw: str) -> str:
    # Simple hashing (do NOT use in production, use bcrypt/argon2 instead!)
    import hashlib
    return hashlib.sha256(pw.encode()).hexdigest()


def verify_password(raw: str, hashed: str) -> bool:
    return hash_password(raw) == hashed


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=JWT_EXPIRATION_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserInDB:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise credentials_exception
    except (jwt.PyJWTError, ValidationError):
        raise credentials_exception
    user_list = await supabase_fetch(
        "users", filters=f"email=eq.{email}", single=True
    )
    if not user_list:
        raise credentials_exception
    return UserInDB(**user_list)


# --------- FASTAPI APP SETUP ----------


app = FastAPI(
    title="Task Tracker API",
    description="API for managing tasks and user authentication.",
    version="1.0.0",
    openapi_tags=[
        {"name": "auth", "description": "Authentication and user registration"},
        {"name": "users", "description": "User profile operations"},
        {"name": "tasks", "description": "Task CRUD and management"},
    ],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------- ROUTES & ENDPOINTS ----------


@app.get("/", tags=["root"])
# PUBLIC_INTERFACE
def health_check():
    """Health check endpoint for Task Tracker backend."""
    return {"message": "Healthy"}


#
# ----- AUTH & USER ROUTES -----
#


@app.post("/auth/register", response_model=UserPublic, status_code=201, tags=["auth"])
# PUBLIC_INTERFACE
async def register_user(user: UserCreate):
    """
    Register a new user.
    - **email**: Email
    - **password**: Password (min 6 chars)
    """
    existing = await supabase_fetch(
        "users", filters=f"email=eq.{user.email}", single=True
    )
    if existing:
        raise HTTPException(409, "Email already registered")
    hashed_pw = hash_password(user.password)
    result = await supabase_insert(
        "users", {"email": user.email, "hashed_password": hashed_pw}
    )
    u = result[0] if isinstance(result, list) else result
    return UserPublic(id=u["id"], email=u["email"])


@app.post("/auth/token", response_model=Token, tags=["auth"])
# PUBLIC_INTERFACE
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """Obtain access token via user credentials."""
    user = await supabase_fetch(
        "users", filters=f"email=eq.{form_data.username}", single=True
    )
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    access_token = create_access_token(
        data={"sub": user["email"], "uid": user["id"]}
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/users/me", response_model=UserPublic, tags=["users"])
# PUBLIC_INTERFACE
async def read_users_me(current_user: UserInDB = Depends(get_current_user)):
    """Get own user profile."""
    return UserPublic(id=current_user.id, email=current_user.email)


#
# ----- TASK ROUTES -----
#


@app.post("/tasks/", response_model=Task, status_code=201, tags=["tasks"])
# PUBLIC_INTERFACE
async def create_task(task: TaskCreate, current_user: UserInDB = Depends(get_current_user)):
    """Create new task for authenticated user."""
    payload = {
        "title": task.title,
        "description": task.description,
        "status": task.status,
        "user_id": current_user.id,
        "created_at": datetime.utcnow().isoformat()
    }
    inserted = await supabase_insert("tasks", payload)
    t = inserted[0] if isinstance(inserted, list) else inserted
    return Task(**t)


@app.get("/tasks/", response_model=List[Task], tags=["tasks"])
# PUBLIC_INTERFACE
async def list_tasks(
    status: Optional[str] = Query(None, description="Filter by task status"),
    sort_by: Optional[Literal["created_at", "updated_at", "title"]] = Query("created_at"),
    order: Optional[Literal["asc", "desc"]] = Query("desc"),
    current_user: UserInDB = Depends(get_current_user),
):
    """List tasks for current user, with optional filtering and sorting."""
    filter_string = f"user_id=eq.{current_user.id}"
    if status:
        filter_string += f"&status=eq.{status}"
    sort_order = f"order={sort_by}.{order}"
    data = await supabase_fetch(
        "tasks",
        filters=f"{filter_string}&{sort_order}"
    )
    tasks = [Task(**item) for item in data]
    return tasks


@app.get("/tasks/{task_id}", response_model=Task, tags=["tasks"])
# PUBLIC_INTERFACE
async def get_task(task_id: int, current_user: UserInDB = Depends(get_current_user)):
    """Get specific task by id (only your own)."""
    data = await supabase_fetch("tasks", filters=f"id=eq.{task_id}", single=True)
    if not data or data["user_id"] != current_user.id:
        raise HTTPException(404, "Task not found")
    return Task(**data)


@app.patch("/tasks/{task_id}", response_model=Task, tags=["tasks"])
# PUBLIC_INTERFACE
async def update_task(
    task_id: int,
    task_update: TaskUpdate,
    current_user: UserInDB = Depends(get_current_user)
):
    """Update a specific task (title, description, status)."""
    task = await supabase_fetch("tasks", filters=f"id=eq.{task_id}", single=True)
    if not task or task["user_id"] != current_user.id:
        raise HTTPException(404, "Task not found")
    update_data = {k: v for k, v in task_update.dict(exclude_unset=True).items()}
    update_data["updated_at"] = datetime.utcnow().isoformat()
    updated = await supabase_update("tasks", f"id=eq.{task_id}", update_data)
    t = updated[0] if isinstance(updated, list) else updated
    return Task(**t)


@app.delete("/tasks/{task_id}", status_code=204, tags=["tasks"])
# PUBLIC_INTERFACE
async def delete_task(task_id: int, current_user: UserInDB = Depends(get_current_user)):
    """Delete a task by id (only your own task)."""
    task = await supabase_fetch("tasks", filters=f"id=eq.{task_id}", single=True)
    if not task or task["user_id"] != current_user.id:
        raise HTTPException(404, "Task not found")
    await supabase_delete("tasks", f"id=eq.{task_id}")
    return None


@app.get("/openapi.json", include_in_schema=False)
# PUBLIC_INTERFACE
async def openapi_endpoint():
    """Serve OpenAPI schema."""
    return get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes
    )


# ---------- APP USAGE NOTES (WebSocket & Auth) ----------


@app.get("/docs/websocket-usage", tags=["root"])
# PUBLIC_INTERFACE
def websocket_usage_doc():
    """
    For real-time notification features (if implemented in future), connect to ws(s)://{{API_BASE_URL}}/ws/...
    AUTH: Pass JWT token in headers or as a query param.
    """
    return {
        "websocket": "wss://<API_BASE_URL>/ws/...",
        "auth": "JWT token in query/header",
        "notes": "No WebSocket-based routes currently implemented. "
                 "All core APIs are REST.",
    }


# ---- END OF FILE ----
