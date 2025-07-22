from fastapi import FastAPI, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
import asyncio
import json
import random
import uuid
from enum import Enum
import sqlite3
import pandas as pd
import numpy as np
import os
from contextlib import asynccontextmanager

# Database setup
DATABASE_PATH = "stock_data.db"

def init_database():
    """Initialize SQLite database with sample data"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # Create tables
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS companies (
            symbol TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            sector TEXT,
            market_cap REAL,
            pe_ratio REAL,
            dividend_yield REAL,
            current_price REAL,
            change_amount REAL,
            change_percent REAL,
            volume INTEGER,
            avg_volume INTEGER,
            beta REAL,
            eps REAL,
            fifty_two_week_high REAL,
            fifty_two_week_low REAL
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS stock_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            symbol TEXT NOT NULL,
            date TEXT NOT NULL,
            open REAL NOT NULL,
            high REAL NOT NULL,
            low REAL NOT NULL,
            close REAL NOT NULL,
            volume INTEGER NOT NULL,
            FOREIGN KEY (symbol) REFERENCES companies (symbol)
        )
    ''')
    
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_stock_symbol_date 
        ON stock_data (symbol, date)
    ''')
    
    # Sample companies data
    companies_data = [
        ("AAPL", "Apple Inc.", "Technology", 2800000000000, 28.5, 0.5, 185.50, 2.30, 1.26, 45000000, 50000000, 1.2, 6.50, 198.23, 124.17),
        ("GOOGL", "Alphabet Inc.", "Technology", 1650000000000, 22.8, 0.0, 142.80, -1.20, -0.83, 25000000, 28000000, 1.1, 6.26, 151.55, 101.88),
        ("MSFT", "Microsoft Corporation", "Technology", 2500000000000, 32.1, 0.7, 338.11, 4.15, 1.24, 22000000, 25000000, 0.9, 10.55, 348.10, 245.18),
        ("AMZN", "Amazon.com Inc.", "Consumer Discretionary", 1400000000000, 45.2, 0.0, 135.30, -0.85, -0.62, 35000000, 40000000, 1.3, 2.99, 170.00, 118.35),
        ("TSLA", "Tesla Inc.", "Consumer Discretionary", 780000000000, 65.8, 0.0, 248.50, 8.20, 3.42, 85000000, 90000000, 2.0, 3.77, 299.29, 138.80),
        ("META", "Meta Platforms Inc.", "Communication Services", 820000000000, 24.7, 0.4, 325.20, 5.10, 1.59, 18000000, 20000000, 1.2, 13.18, 353.96, 199.34),
        ("NVDA", "NVIDIA Corporation", "Technology", 1800000000000, 68.2, 0.1, 735.00, 15.30, 2.13, 55000000, 60000000, 1.7, 10.78, 785.38, 180.96),
        ("JPM", "JPMorgan Chase & Co.", "Financial Services", 460000000000, 11.5, 2.4, 158.75, 1.25, 0.79, 12000000, 15000000, 1.1, 13.80, 172.81, 135.19),
        ("JNJ", "Johnson & Johnson", "Healthcare", 420000000000, 16.8, 2.8, 164.20, 0.80, 0.49, 8000000, 10000000, 0.7, 9.77, 179.05, 155.72),
        ("V", "Visa Inc.", "Financial Services", 480000000000, 29.3, 0.8, 235.60, 2.10, 0.90, 7500000, 8000000, 1.0, 8.04, 252.67, 197.22),
    ]
    
    # Insert companies if not exists
    cursor.execute("SELECT COUNT(*) FROM companies")
    if cursor.fetchone()[0] == 0:
        cursor.executemany('''
            INSERT INTO companies VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', companies_data)
    
    # Generate sample stock data for the last 2 years
    def generate_stock_data(symbol, start_price, volatility=0.02):
        data = []
        current_price = start_price
        start_date = datetime.now() - timedelta(days=730)
        
        for i in range(730):
            date = (start_date + timedelta(days=i)).strftime('%Y-%m-%d')
            
            # Skip weekends
            weekday = (start_date + timedelta(days=i)).weekday()
            if weekday >= 5:
                continue
                
            # Generate realistic price movement
            change = random.uniform(-volatility, volatility)
            current_price *= (1 + change)
            
            # Add some trend and noise
            trend = 0.0002  # Slight upward trend
            noise = random.uniform(-0.01, 0.01)
            current_price *= (1 + trend + noise)
            
            open_price = current_price * random.uniform(0.995, 1.005)
            high_price = max(open_price, current_price) * random.uniform(1.0, 1.02)
            low_price = min(open_price, current_price) * random.uniform(0.98, 1.0)
            close_price = current_price
            volume = random.randint(10000000, 100000000)
            
            data.append((symbol, date, round(open_price, 2), round(high_price, 2), 
                        round(low_price, 2), round(close_price, 2), volume))
        
        return data
    
    # Insert stock data if not exists
    cursor.execute("SELECT COUNT(*) FROM stock_data")
    if cursor.fetchone()[0] == 0:
        print("Generating sample stock data...")
        for symbol, _, _, _, _, _, start_price, _, _, _, _, _, _, _, _ in companies_data:
            stock_data = generate_stock_data(symbol, start_price)
            cursor.executemany('''
                INSERT INTO stock_data (symbol, date, open, high, low, close, volume)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', stock_data)
        print("Sample data generated successfully!")
    
    conn.commit()
    conn.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_database()
    yield
    # Shutdown
    pass

app = FastAPI(
    title="Stock Market Dashboard API",
    description="High-performance FastAPI backend for stock market data with SQLite database",
    version="2.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class TimeRange(str, Enum):
    ONE_DAY = "1d"
    ONE_WEEK = "1wk"
    ONE_MONTH = "1mo"
    THREE_MONTHS = "3mo"
    SIX_MONTHS = "6mo"
    ONE_YEAR = "1y"
    TWO_YEARS = "2y"

class StockData(BaseModel):
    symbol: str
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: int
    change: Optional[float] = None
    change_percent: Optional[float] = None

class Company(BaseModel):
    symbol: str
    name: str
    sector: Optional[str] = None
    market_cap: Optional[str] = None
    pe_ratio: Optional[float] = None
    dividend_yield: Optional[float] = None
    current_price: Optional[float] = None
    change: Optional[float] = None
    change_percent: Optional[float] = None
    volume: Optional[int] = None

class MarketStats(BaseModel):
    symbol: str
    current_price: float
    market_cap: str
    pe_ratio: Optional[float]
    dividend_yield: Optional[float]
    fifty_two_week_high: float
    fifty_two_week_low: float
    avg_volume: int
    beta: Optional[float]
    eps: Optional[float]

# Utility functions
def get_db_connection():
    """Get database connection"""
    return sqlite3.connect(DATABASE_PATH, check_same_thread=False)

def format_market_cap(value):
    """Format market cap in readable format"""
    if value >= 1e12:
        return f"${value/1e12:.2f}T"
    elif value >= 1e9:
        return f"${value/1e9:.2f}B"
    elif value >= 1e6:
        return f"${value/1e6:.2f}M"
    else:
        return f"${value:,.0f}"

def get_date_range(period: str) -> str:
    """Get date range based on period"""
    now = datetime.now()
    
    if period == "1d":
        start_date = now - timedelta(days=1)
    elif period == "1wk":
        start_date = now - timedelta(weeks=1)
    elif period == "1mo":
        start_date = now - timedelta(days=30)
    elif period == "3mo":
        start_date = now - timedelta(days=90)
    elif period == "6mo":
        start_date = now - timedelta(days=180)
    elif period == "1y":
        start_date = now - timedelta(days=365)
    elif period == "2y":
        start_date = now - timedelta(days=730)
    else:
        start_date = now - timedelta(days=30)
    
    return start_date.strftime('%Y-%m-%d')

async def get_stock_data_from_db(symbol: str, period: str = "1mo") -> List[Dict]:
    """Fetch stock data from database"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        start_date = get_date_range(period)
        
        cursor.execute('''
            SELECT symbol, date, open, high, low, close, volume
            FROM stock_data
            WHERE symbol = ? AND date >= ?
            ORDER BY date ASC
        ''', (symbol.upper(), start_date))
        
        rows = cursor.fetchall()
        conn.close()
        
        if not rows:
            return []
        
        stock_data = []
        prev_close = None
        
        for row in rows:
            symbol, date, open_price, high, low, close, volume = row
            
            change = None
            change_percent = None
            if prev_close is not None:
                change = close - prev_close
                change_percent = (change / prev_close) * 100
            
            stock_data.append({
                "symbol": symbol,
                "date": date,
                "open": float(open_price),
                "high": float(high),
                "low": float(low),
                "close": float(close),
                "volume": int(volume),
                "change": round(change, 2) if change else None,
                "change_percent": round(change_percent, 2) if change_percent else None
            })
            prev_close = close
        
        return stock_data
    except Exception as e:
        print(f"Error fetching data for {symbol}: {e}")
        return []

async def get_companies_from_db() -> List[Dict]:
    """Fetch companies from database"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT symbol, name, sector, market_cap, pe_ratio, dividend_yield, 
                   current_price, change_amount, change_percent, volume
            FROM companies
            ORDER BY name
        ''')
        
        rows = cursor.fetchall()
        conn.close()
        
        companies = []
        for row in rows:
            symbol, name, sector, market_cap, pe_ratio, dividend_yield, current_price, change_amount, change_percent, volume = row
            
            companies.append({
                "symbol": symbol,
                "name": name,
                "sector": sector,
                "market_cap": format_market_cap(market_cap) if market_cap else None,
                "pe_ratio": pe_ratio,
                "dividend_yield": dividend_yield,
                "current_price": current_price,
                "change": change_amount,
                "change_percent": change_percent,
                "volume": volume
            })
        
        return companies
    except Exception as e:
        print(f"Error fetching companies: {e}")
        return []

async def get_market_stats_from_db(symbol: str) -> Dict:
    """Get market stats from database"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get company info
        cursor.execute('''
            SELECT * FROM companies WHERE symbol = ?
        ''', (symbol.upper(),))
        
        company_row = cursor.fetchone()
        if not company_row:
            return {}
        
        # Get 52-week high/low
        cursor.execute('''
            SELECT MAX(high) as high_52w, MIN(low) as low_52w
            FROM stock_data
            WHERE symbol = ? AND date >= date('now', '-365 days')
        ''', (symbol.upper(),))
        
        price_range = cursor.fetchone()
        conn.close()
        
        return {
            "symbol": company_row[0],
            "current_price": company_row[6],
            "market_cap": format_market_cap(company_row[3]) if company_row[3] else "N/A",
            "pe_ratio": company_row[4],
            "dividend_yield": company_row[5],
            "fifty_two_week_high": price_range[0] if price_range[0] else 0,
            "fifty_two_week_low": price_range[1] if price_range[1] else 0,
            "avg_volume": company_row[10],
            "beta": company_row[11],
            "eps": company_row[12]
        }
    except Exception as e:
        print(f"Error fetching market stats for {symbol}: {e}")
        return {}

# WebSocket manager
class WebSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections[:]:  # Create a copy to iterate
            try:
                await connection.send_text(message)
            except:
                self.active_connections.remove(connection)

manager = WebSocketManager()

# API Routes

@app.get("/")
async def root():
    return {"message": "Stock Market Dashboard API v2.0", "status": "running"}

@app.get("/companies", response_model=List[Company])
async def get_companies():
    """Get list of all companies with current market data"""
    companies_data = await get_companies_from_db()
    return [Company(**company) for company in companies_data]

@app.get("/companies/{symbol}", response_model=Company)
async def get_company(symbol: str):
    """Get detailed information for a specific company"""
    companies_data = await get_companies_from_db()
    company_data = next((c for c in companies_data if c["symbol"] == symbol.upper()), None)
    
    if not company_data:
        raise HTTPException(status_code=404, detail="Company not found")
    
    return Company(**company_data)

@app.get("/stock/{symbol}")
async def get_stock_data(symbol: str, period: str = "1mo"):
    """Get historical stock data for a symbol"""
    if period not in [e.value for e in TimeRange]:
        raise HTTPException(status_code=400, detail="Invalid period")
    
    data = await get_stock_data_from_db(symbol.upper(), period)
    if not data:
        raise HTTPException(status_code=404, detail="Stock data not found")
    
    return data

@app.get("/stock/{symbol}/stats", response_model=MarketStats)
async def get_market_stats(symbol: str):
    """Get detailed market statistics for a symbol"""
    stats = await get_market_stats_from_db(symbol.upper())
    if not stats:
        raise HTTPException(status_code=404, detail="Stock stats not found")
    
    return MarketStats(**stats)

@app.get("/market/overview")
async def get_market_overview():
    """Get overall market overview"""
    try:
        # For demo, return some major indices data
        indices_data = {
            "^GSPC": {"name": "S&P 500", "current": 4567.89, "change": 12.34, "change_percent": 0.27},
            "^DJI": {"name": "Dow Jones", "current": 35123.45, "change": -45.67, "change_percent": -0.13},
            "^IXIC": {"name": "NASDAQ", "current": 14234.56, "change": 89.12, "change_percent": 0.63},
            "^RUT": {"name": "Russell 2000", "current": 1987.65, "change": 5.43, "change_percent": 0.27}
        }
        
        return {"indices": indices_data, "timestamp": datetime.now().isoformat()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching market overview: {str(e)}")

@app.get("/search/{query}")
async def search_stocks(query: str):
    """Search for stocks by symbol or name"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT symbol, name, sector FROM companies
            WHERE LOWER(symbol) LIKE LOWER(?) OR LOWER(name) LIKE LOWER(?)
            ORDER BY name
        ''', (f'%{query}%', f'%{query}%'))
        
        rows = cursor.fetchall()
        conn.close()
        
        results = [{"symbol": row[0], "name": row[1], "sector": row[2]} for row in rows]
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search error: {str(e)}")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates"""
    await manager.connect(websocket)
    try:
        while True:
            await asyncio.sleep(30)  # Update every 30 seconds
            
            # Send market overview update
            market_data = await get_market_overview()
            await manager.broadcast(json.dumps({
                "type": "market_update",
                "data": market_data
            }))
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat(), "database": "connected"}

# Database maintenance endpoints
@app.post("/admin/refresh-data")
async def refresh_database():
    """Refresh database with new sample data (admin only)"""
    try:
        if os.path.exists(DATABASE_PATH):
            os.remove(DATABASE_PATH)
        init_database()
        return {"message": "Database refreshed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error refreshing database: {str(e)}")

@app.get("/admin/stats")
async def get_database_stats():
    """Get database statistics"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM companies")
        companies_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM stock_data")
        stock_data_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT MIN(date), MAX(date) FROM stock_data")
        date_range = cursor.fetchone()
        
        conn.close()
        
        return {
            "companies_count": companies_count,
            "stock_data_count": stock_data_count,
            "date_range": {"start": date_range[0], "end": date_range[1]}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting stats: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")