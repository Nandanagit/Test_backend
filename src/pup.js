const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
require('dotenv').config();

// Helper function for delays
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function scrapeWebsiteContent(url) {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    console.log(`Loading ${url}...`);
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      //timeout: 120000 // Increased timeout for headless mode
    });

    await delay(3000);

    // Scroll to load all products
    console.log('Scrolling to load all content...');
    await loadAllContent(page);

    // Extract textual content
    console.log('Extracting textual content...');
    const textData = await page.evaluate(() => {
      const data = [];
      const headings = Array.from(document.querySelectorAll('h1, h2, h3')).map(el => el.innerText.trim());
      const paragraphs = Array.from(document.querySelectorAll('p')).map(el => el.innerText.trim());
      data.push('--- Headings ---', ...headings, '', '--- Paragraphs ---', ...paragraphs);
      
      const products = Array.from(document.querySelectorAll('.product, .product-card, .product-item')).map(el => {
        const title = el.querySelector('h2, h3, .product-title')?.innerText?.trim() || 'No title';
        const price = el.querySelector('.price, .product-price')?.innerText?.trim() || 'No price';
        const desc = el.querySelector('p, .description')?.innerText?.trim() || '';
        return `Product: ${title}\nPrice: ${price}\nDescription: ${desc}`;
      });
      
      if (products.length > 0) {
        data.push('', '--- Products ---', ...products);
      }
      
      return data.join('\n');
    });

    // Extract product image URLs
    console.log('Extracting product images...');
    const imageUrls = await page.evaluate(() => {
      const imageUrls = new Set();
      // Find all images on the page
      const allImages = document.querySelectorAll('img');
      allImages.forEach(img => {
        if (
          (img.src.startsWith('http') || img.src.startsWith('//')) &&
          img.naturalWidth > 200 &&
          img.naturalHeight > 200 &&
          !img.src.includes('logo') &&
          !img.src.includes('icon') &&
          !img.src.includes('sprite') &&
          !img.src.includes('pixel') &&
          !img.src.includes('ad') &&
          !img.src.includes('banner') &&
          !img.src.includes('placeholder') &&
          !img.src.includes('loading') &&
          !img.src.includes('spinner') &&
          !img.src.includes('facebook') &&
          !img.src.includes('twitter') &&
          !img.src.includes('instagram') &&
          !img.src.endsWith('.gif')&&
          !img.src.includes('google-play-store')&&
          !img.src.includes('appstore')
        ) {
          imageUrls.add(img.src);
        }
      });
      return Array.from(imageUrls);
    });

    console.log(`Found ${imageUrls.length} product images`);

    // Create output directory
    const outputDir = './scraped-content';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save textual content
    const textFilePath = path.join(outputDir, 'page_content.txt');
    fs.writeFileSync(textFilePath, textData, 'utf8');
    console.log(`✅ Text content saved to ${textFilePath}`);

    const imageFilePath = path.join(outputDir, 'product-images.json');
    fs.writeFileSync(
      imageFilePath, 
      JSON.stringify(imageUrls, null, 2)
    );

    console.log(`✅ Image URLs saved to ${imageFilePath}`);
    
    // Show first few URLs as sample
    if (imageUrls.length > 0) {
      console.log('\nSample image URLs:');
      imageUrls.slice(0, 3).forEach((url, index) => {
        console.log(`${index + 1}. ${url}`);
      });
    }

    return {
      textData,
      imageUrls,
      stats: {
        totalImages: imageUrls.length,
        textLength: textData.length
      }
    };

  } catch (error) {
    console.error('❌ Scraping failed:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

async function loadAllContent(page) {
  let previousCount = 0;
  let currentCount = 0;
  let attempts = 0;
  const maxAttempts = 5;

  do {
    previousCount = currentCount;
    
    // Scroll to bottom
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    await delay(2000);

    // Try to click load more button if it exists
    try {
      const loadMoreButton = await page.$('.load-more, [data-testid="load-more"], .show-more, .btn-load-more');
      if (loadMoreButton) {
        await loadMoreButton.click();
        await delay(3000);
      }
    } catch (e) {
      // No load more button found
    }

    // Count current images and content elements
    currentCount = await page.evaluate(() => {
      const images = document.querySelectorAll('img').length;
      const products = document.querySelectorAll('.product, .product-card, .product-item').length;
      return images + products;
    });

    attempts++;
    console.log(`Scroll attempt ${attempts}: Found ${currentCount} total elements`);

  } while (currentCount > previousCount && attempts < maxAttempts);
}

// Run the scraper
if (require.main === module) {
  (async () => {
    try {
      const url = process.argv[2];
      if (!url) {
        console.error('❌ No URL provided. Usage: node pup.js <url>');
        process.exit(1);
      }
      console.log(`🚀 Starting website content scraping for: ${url}\n`);
      const results = await scrapeWebsiteContent(url);
      // Output JSON result for backend consumption
      console.log(JSON.stringify(results));
    } catch (error) {
      console.error('💥 Error:', error.message);
      process.exit(1);
    }
  })();
}