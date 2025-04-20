require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5001;
const SERPER_API_KEY = process.env.SERPER_API_KEY;

app.use(cors());

// ✅ Approved websites
const APPROVED_SITES = {
    amazon: 'Amazon',
    flipkart: 'Flipkart',
    meesho: 'Meesho',
    snapdeal: 'Snapdeal',
    walmart: 'Walmart',
    myntra: 'Myntra',
    apple: 'Apple Store',
    croma: 'Croma',
    reliancedigital: 'Reliance Digital',
    ajio: 'AJIO',
    tatacliq: 'Tata Cliq',
    shopclues: 'ShopClues',
    nykaa: 'Nykaa',
    firstcry: 'FirstCry',
    paytmmall: 'Paytm Mall',
    pepperfry: 'Pepperfry',
    bigbasket: 'BigBasket',
    jiomart: 'JioMart',
    blinkit: 'Blinkit',
    purplle: 'Purplle',
    lifestylestores: 'Lifestyle Stores',
    decathlon: 'Decathlon',
    indiamart: 'IndiaMART',
    ebay: 'eBay',
    aliexpress: 'AliExpress',
    bestbuy: 'BestBuy',
    homeshop18: 'HomeShop18',
    reliancetrends: 'Reliance Trends',
    fabindia: 'FabIndia',
    maxfashion: 'Max Fashion',
    healthkart: 'HealthKart',
    lenskart: 'Lenskart',
    bewakoof: 'Bewakoof',
    chumbak: 'Chumbak',
    tata1mg: 'Tata 1MG',
    pharmeasy: 'PharmEasy',
    
};

app.get('/search', async (req, res) => {
    const { q: query } = req.query;

    if (!query) {
        return res.status(400).json({
            error: "Please provide a search query",
            example: "/search?q=laptop"
        });
    }

    try {
        const serperResults = await fetchSerperResults(query);
        const formattedResults = formatAndPrioritizeProducts(serperResults);
        res.json({ results: formattedResults });
    } catch (error) {
        console.error("Search Error:", error.message);
        res.status(500).json({ error: "Failed to fetch products", details: error.message });
    }
});

// 🔍 Fetch results from Serper API
async function fetchSerperResults(query) {
    const response = await axios.post('https://google.serper.dev/search', {
        q: query,
        gl: 'in',
        hl: 'en',
        type: 'shopping'
    }, {
        headers: {
            'X-API-KEY': SERPER_API_KEY,
            'Content-Type': 'application/json'
        }
    });
    return response.data.shopping || [];
}

// 🎯 Format products and prioritize approved sites
function formatAndPrioritizeProducts(products) {
    const approvedProducts = [];
    const otherProducts = [];

    products
        .filter(product => product.title && product.source)
        .forEach(product => {
            const formattedProduct = {
                product_name: product.title,
                price: product.price || "Price not available",
                website_link: product.link,
                image: getImage(product),
                rating: product.rating || "No rating",
                description: product.description || "No description",
                source: product.source,
                is_approved: false // Default to false
            };

            // Check if product is from approved site
            const approvedSiteKey = Object.keys(APPROVED_SITES).find(key => 
                product.source.toLowerCase().includes(key)
            );

            if (approvedSiteKey) {
                formattedProduct.source = APPROVED_SITES[approvedSiteKey];
                formattedProduct.is_approved = true;
                approvedProducts.push(formattedProduct);
            } else {
                otherProducts.push(formattedProduct);
            }
        });

    // Return approved products first, then others
    return [...approvedProducts, ...otherProducts];
}

// 🔍 Helper function to get image
function getImage(product) {
    if (product.imageUrl) return product.imageUrl;
    if (product.thumbnailUrl) return product.thumbnailUrl;
    if (product.thumbnail) return product.thumbnail;
    return "https://via.placeholder.com/150";
}

// 🚀 Start server
app.listen(PORT, () => {
    console.log(`🔍 Product Search API running on http://localhost:${PORT}`);
});