from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import random
import datetime
from datetime import timedelta
import uvicorn

app = FastAPI(title="Stock Dashboard API", version="1.0.0")

# Add CORS middleware to allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for data validation
class StockPrice(BaseModel):
    date: str
    price: float
    volume: int
    high: float
    low: float
    open: float

class Company(BaseModel):
    symbol: str
    name: str
    sector: str
    basePrice: float
    logo: str
    currentPrice: Optional[float] = None
    priceChange: Optional[float] = None
    priceChangePercent: Optional[float] = None

class StockDataResponse(BaseModel):
    company: Company
    prices: List[StockPrice]
    stats: dict

# Mock companies data
companies_data = [
    {"symbol": "RELIANCE", "name": "Reliance Industries Ltd", "sector": "Oil & Gas", "basePrice": 2450, "logo": "🛢️"},
    {"symbol": "TCS", "name": "Tata Consultancy Services", "sector": "IT Services", "basePrice": 3850, "logo": "💻"},
    {"symbol": "INFY", "name": "Infosys Limited", "sector": "IT Services", "basePrice": 1650, "logo": "🔧"},
    {"symbol": "HDFCBANK", "name": "HDFC Bank Limited", "sector": "Banking", "basePrice": 1580, "logo": "🏦"},
    {"symbol": "ICICIBANK", "name": "ICICI Bank Limited", "sector": "Banking", "basePrice": 950, "logo": "🏛️"},
    {"symbol": "HINDUNILVR", "name": "Hindustan Unilever Ltd", "sector": "FMCG", "basePrice": 2350, "logo": "🧴"},
    {"symbol": "BHARTIARTL", "name": "Bharti Airtel Limited", "sector": "Telecom", "basePrice": 850, "logo": "📱"},
    {"symbol": "ITC", "name": "ITC Limited", "sector": "FMCG", "basePrice": 420, "logo": "🚬"},
    {"symbol": "KOTAKBANK", "name": "Kotak Mahindra Bank", "sector": "Banking", "basePrice": 1750, "logo": "🏦"},
    {"symbol": "LT", "name": "Larsen & Toubro Ltd", "sector": "Construction", "basePrice": 3200, "logo": "🏗️"},
    {"symbol": "ASIANPAINT", "name": "Asian Paints Limited", "sector": "Paints", "basePrice": 3100, "logo": "🎨"},
    {"symbol": "MARUTI", "name": "Maruti Suzuki India Ltd", "sector": "Automobiles", "basePrice": 10500, "logo": "🚗"}
]

def generate_stock_data(symbol: str, base_price: float, days: int = 30, volatility: float = 0.02):
    """Generate realistic stock price data"""
    data = []
    start_date = datetime.datetime.now() - timedelta(days=days)
    current_price = base_price
    
    for i in range(days):
        date = start_date + timedelta(days=i)
        
        # Generate realistic price movement
        change = (random.random() - 0.5) * volatility * current_price
        current_price = max(current_price + change, base_price * 0.7)
        
        # Generate intraday high/low/open
        high = current_price * (1 + random.random() * 0.03)
        low = current_price * (1 - random.random() * 0.03)
        open_price = current_price * (0.98 + random.random() * 0.04)
        
        data.append({
            "date": date.strftime("%Y-%m-%d"),
            "price": round(current_price, 2),
            "volume": random.randint(500000, 2000000),
            "high": round(high, 2),
            "low": round(low, 2),
            "open": round(open_price, 2)
        })
    
    return data

def calculate_stats(prices: List[dict]):
    """Calculate various statistics from price data"""
    if not prices:
        return {}
    
    price_values = [p["price"] for p in prices]
    volumes = [p["volume"] for p in prices]
    highs = [p["high"] for p in prices]
    lows = [p["low"] for p in prices]
    
    current_price = price_values[-1]
    previous_price = price_values[-2] if len(price_values) > 1 else current_price
    price_change = current_price - previous_price
    price_change_percent = (price_change / previous_price) * 100 if previous_price != 0 else 0
    
    return {
        "current_price": current_price,
        "price_change": round(price_change, 2),
        "price_change_percent": round(price_change_percent, 2),
        "high_52w": round(max(highs), 2),
        "low_52w": round(min(lows), 2),
        "avg_volume": round(sum(volumes) / len(volumes)),
        "market_cap": round(current_price * random.randint(100, 1000) * 1000000, 2),  # Mock market cap
        "pe_ratio": round(random.uniform(10, 30), 2),
        "dividend_yield": round(random.uniform(0.5, 5), 2)
    }

@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Stock Dashboard API",
        "version": "1.0.0",
        "endpoints": {
            "companies": "/api/companies",
            "stock_data": "/api/stock/{symbol}",
            "market_summary": "/api/market/summary"
        }
    }

@app.get("/api/companies", response_model=List[Company], tags=["Companies"])
async def get_companies():
    """Get list of all available companies"""
    companies = []
    
    for company_data in companies_data:
        # Generate current price and change for preview
        prices = generate_stock_data(company_data["symbol"], company_data["basePrice"], 2)
        if len(prices) >= 2:
            current_price = prices[-1]["price"]
            previous_price = prices[-2]["price"]
            price_change = current_price - previous_price
            price_change_percent = (price_change / previous_price) * 100
            
            company_data["currentPrice"] = current_price
            company_data["priceChange"] = round(price_change, 2)
            company_data["priceChangePercent"] = round(price_change_percent, 2)
        
        companies.append(Company(**company_data))
    
    return companies

@app.get("/api/stock/{symbol}", response_model=StockDataResponse, tags=["Stock Data"])
async def get_stock_data(symbol: str, days: int = 30):
    """Get detailed stock data for a specific company"""
    # Find company by symbol
    company_data = None
    for company in companies_data:
        if company["symbol"].upper() == symbol.upper():
            company_data = company
            break
    
    if not company_data:
        raise HTTPException(status_code=404, detail=f"Company with symbol {symbol} not found")
    
    # Generate stock price data
    prices = generate_stock_data(symbol, company_data["basePrice"], days)
    
    # Calculate statistics
    stats = calculate_stats(prices)
    
    # Update company data with current stats
    company_data["currentPrice"] = stats["current_price"]
    company_data["priceChange"] = stats["price_change"]
    company_data["priceChangePercent"] = stats["price_change_percent"]
    
    return StockDataResponse(
        company=Company(**company_data),
        prices=[StockPrice(**price) for price in prices],
        stats=stats
    )

@app.get("/api/market/summary", tags=["Market"])
async def get_market_summary():
    """Get overall market summary"""
    total_companies = len(companies_data)
    gainers = 0
    losers = 0
    
    # Calculate market sentiment
    for company in companies_data:
        prices = generate_stock_data(company["symbol"], company["basePrice"], 2)
        if len(prices) >= 2:
            if prices[-1]["price"] > prices[-2]["price"]:
                gainers += 1
            else:
                losers += 1
    
    market_sentiment = "Bullish" if gainers > losers else "Bearish" if losers > gainers else "Neutral"
    
    return {
        "total_companies": total_companies,
        "gainers": gainers,
        "losers": losers,
        "unchanged": total_companies - gainers - losers,
        "market_sentiment": market_sentiment,
        "last_updated": datetime.datetime.now().isoformat(),
        "trading_status": "Open" if 9 <= datetime.datetime.now().hour <= 15 else "Closed"
    }

@app.get("/api/sectors", tags=["Market"])
async def get_sectors():
    """Get performance by sector"""
    sectors = {}
    
    for company in companies_data:
        sector = company["sector"]
        if sector not in sectors:
            sectors[sector] = []
        
        # Generate price data for sector analysis
        prices = generate_stock_data(company["symbol"], company["basePrice"], 2)
        if len(prices) >= 2:
            change_percent = ((prices[-1]["price"] - prices[-2]["price"]) / prices[-2]["price"]) * 100
            sectors[sector].append(change_percent)
    
    # Calculate average performance per sector
    sector_performance = {}
    for sector, changes in sectors.items():
        avg_change = sum(changes) / len(changes) if changes else 0
        sector_performance[sector] = {
            "average_change": round(avg_change, 2),
            "companies_count": len(changes),
            "performance": "Positive" if avg_change > 0 else "Negative" if avg_change < 0 else "Neutral"
        }
    
    return sector_performance

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)