# Data Scraping with Playwright MCP

Comprehensive guide for web scraping including single-page extraction, pagination, infinite scroll, structured data parsing, and anti-scraping countermeasures.

## Table of Contents
- [Single Page Data Extraction](#single-page-data-extraction)
- [Paginated Data Scraping](#paginated-data-scraping)
- [Infinite Scroll Handling](#infinite-scroll-handling)
- [Table Data Extraction](#table-data-extraction)
- [Structured Data Parsing](#structured-data-parsing)
- [Rate Limiting and Politeness](#rate-limiting-and-politeness)
- [Anti-Scraping Measures](#anti-scraping-measures)
- [Saving Data to Files](#saving-data-to-files)

---

## Single Page Data Extraction

### Basic Text Extraction

```json
{
  "workflow": "simple-text-extraction",
  "steps": [
    {
      "step": 1,
      "description": "Navigate to target page",
      "tool": "mcp__playwright__playwright_navigate",
      "parameters": {
        "url": "https://example.com/products/product-123"
      }
    },
    {
      "step": 2,
      "description": "Extract product information",
      "tool": "mcp__playwright__playwright_evaluate",
      "parameters": {
        "script": `() => ({
          title: document.querySelector('h1.product-title')?.textContent.trim(),
          price: document.querySelector('.product-price')?.textContent.trim(),
          description: document.querySelector('.product-description')?.textContent.trim(),
          availability: document.querySelector('.stock-status')?.textContent.trim(),
          rating: document.querySelector('.rating-value')?.textContent.trim(),
          reviewCount: document.querySelector('.review-count')?.textContent.trim(),
          sku: document.querySelector('[data-sku]')?.dataset.sku
        })`
      }
    },
    {
      "step": 3,
      "description": "Extract product images",
      "tool": "mcp__playwright__playwright_evaluate",
      "parameters": {
        "script": `() => {
          return Array.from(document.querySelectorAll('.product-image img')).map(img => ({
            url: img.src,
            alt: img.alt
          }));
        }`
      }
    },
    {
      "step": 4,
      "description": "Take screenshot",
      "tool": "mcp__playwright__playwright_screenshot",
      "parameters": {
        "path": "/home/user/agentic-flow/data/screenshots/product-123.png"
      }
    }
  ]
}
```

### Agent Task Description

```
Task: Extract single product data
Agent: product-scraper
Priority: High

Instructions:
1. Navigate to product page
2. Wait for all content to load (wait for .product-info selector)
3. Extract structured product data:
   - Title
   - Price (handle currency formatting)
   - Description
   - Availability status
   - Rating and review count
   - SKU/product ID
   - Product images (all URLs)
4. Take product screenshot
5. Store extracted data in JSON format
6. Save to /home/user/agentic-flow/data/products/product-123.json

Error Handling:
- Handle missing elements gracefully (return null)
- Retry on network errors (max 3 attempts)
- Capture screenshot on errors

Memory Keys:
- swarm/scraping/product-123/data
- swarm/scraping/product-123/timestamp

Politeness:
- Respect robots.txt
- Add 1-2s delay between requests
- Use realistic user agent
```

### Expected Output

```json
{
  "productData": {
    "url": "https://example.com/products/product-123",
    "scrapedAt": "2025-11-27T12:00:00Z",
    "product": {
      "title": "Premium Wireless Headphones",
      "price": "$299.99",
      "description": "High-quality wireless headphones with noise cancellation...",
      "availability": "In Stock",
      "rating": "4.5",
      "reviewCount": "1,234",
      "sku": "WH-1000XM4",
      "images": [
        {
          "url": "https://example.com/images/product-123-main.jpg",
          "alt": "Premium Wireless Headphones - Main View"
        },
        {
          "url": "https://example.com/images/product-123-side.jpg",
          "alt": "Premium Wireless Headphones - Side View"
        }
      ]
    },
    "screenshot": "/home/user/agentic-flow/data/screenshots/product-123.png"
  }
}
```

---

## Paginated Data Scraping

### Click-Based Pagination

```json
{
  "workflow": "paginated-scraping",
  "description": "Scrape all products across multiple pages",
  "configuration": {
    "maxPages": 10,
    "delayBetweenPages": 2000,
    "dataFile": "/home/user/agentic-flow/data/scraped/all-products.json"
  },
  "steps": [
    {
      "step": 1,
      "description": "Navigate to first page",
      "tool": "mcp__playwright__playwright_navigate",
      "parameters": {
        "url": "https://example.com/products?page=1"
      }
    },
    {
      "step": 2,
      "description": "Extract products from current page",
      "tool": "mcp__playwright__playwright_evaluate",
      "parameters": {
        "script": `() => {
          return Array.from(document.querySelectorAll('.product-card')).map(card => ({
            id: card.dataset.productId,
            title: card.querySelector('.product-title')?.textContent.trim(),
            price: card.querySelector('.product-price')?.textContent.trim(),
            image: card.querySelector('img')?.src,
            url: card.querySelector('a')?.href,
            rating: card.querySelector('.rating')?.dataset.rating
          }));
        }`
      }
    },
    {
      "step": 3,
      "description": "Check for next page",
      "tool": "mcp__playwright__playwright_evaluate",
      "parameters": {
        "script": "() => !!document.querySelector('.pagination .next:not(.disabled)')"
      }
    },
    {
      "step": 4,
      "description": "Click next page button",
      "tool": "mcp__playwright__playwright_click",
      "parameters": {
        "selector": ".pagination .next"
      }
    },
    {
      "step": 5,
      "description": "Wait for page load",
      "tool": "mcp__playwright__playwright_wait_for_load_state",
      "parameters": {
        "state": "networkidle"
      }
    }
  ],
  "loop": {
    "repeatSteps": [2, 3, 4, 5],
    "until": "hasNextPage === false",
    "maxIterations": 10
  }
}
```

### URL Parameter Pagination

```json
{
  "workflow": "url-pagination",
  "configuration": {
    "baseUrl": "https://example.com/products",
    "pageParam": "page",
    "startPage": 1,
    "maxPages": 20,
    "itemsPerPage": 24
  },
  "implementation": {
    "pageLoop": {
      "for": "page = 1 to maxPages",
      "do": [
        {
          "tool": "mcp__playwright__playwright_navigate",
          "parameters": {
            "url": "https://example.com/products?page={{page}}"
          }
        },
        {
          "tool": "mcp__playwright__playwright_evaluate",
          "parameters": {
            "script": `() => {
              const products = Array.from(document.querySelectorAll('.product-card')).map(card => ({
                id: card.dataset.productId,
                title: card.querySelector('.product-title')?.textContent.trim(),
                price: parseFloat(card.querySelector('.product-price')?.textContent.replace(/[^0-9.]/g, '')),
                image: card.querySelector('img')?.src,
                url: card.querySelector('a')?.href
              }));

              return {
                page: {{page}},
                products: products,
                productCount: products.length,
                isEmpty: products.length === 0
              };
            }`
          }
        },
        {
          "condition": "if productCount === 0, break loop"
        },
        {
          "delay": 2000
        }
      ]
    }
  }
}
```

### Agent Task Description

```
Task: Scrape all paginated product data
Agent: pagination-scraper
Priority: High

Instructions:
1. Start at page 1: https://example.com/products?page=1
2. For each page (max 20 pages):
   a. Wait for products to load (.product-card selector)
   b. Extract all product data on page
   c. Store page data in memory with page number
   d. Check if next page exists
   e. If exists, navigate to next page
   f. Add 2-second delay between pages
   g. If no products found, stop pagination
3. Aggregate all page data into single JSON file
4. Save to /home/user/agentic-flow/data/scraped/all-products.json
5. Generate scraping report with statistics

Data Structure per Product:
- Product ID
- Title
- Price (as number)
- Image URL
- Product page URL
- Rating (if available)

Progress Tracking:
- Log each page completion
- Store page count in memory
- Report total products scraped

Memory Keys:
- swarm/scraping/pagination/page-{{page}}/data
- swarm/scraping/pagination/total-products
- swarm/scraping/pagination/status

Error Handling:
- Skip invalid products (log warning)
- Retry failed pages (max 2 retries)
- Continue to next page on non-critical errors
- Stop if 3 consecutive pages fail

Politeness:
- 2-second delay between pages
- Respect rate limits
- Use realistic user agent
```

### Expected Output

```json
{
  "scrapingJob": {
    "startTime": "2025-11-27T12:00:00Z",
    "endTime": "2025-11-27T12:05:30Z",
    "duration": "5m 30s",
    "baseUrl": "https://example.com/products",
    "pagination": {
      "totalPages": 15,
      "pagesScraped": 15,
      "pagesFailed": 0,
      "lastPage": 15
    },
    "products": {
      "total": 358,
      "perPage": {
        "min": 20,
        "max": 24,
        "average": 23.9
      }
    },
    "dataFile": "/home/user/agentic-flow/data/scraped/all-products.json",
    "errors": [],
    "performance": {
      "averagePageLoadTime": "1.8s",
      "averageExtractionTime": "0.3s",
      "totalDelayTime": "28s"
    }
  },
  "sampleProducts": [
    {
      "id": "prod-001",
      "title": "Product 1",
      "price": 29.99,
      "image": "https://example.com/images/prod-001.jpg",
      "url": "https://example.com/products/prod-001",
      "rating": "4.5"
    }
  ]
}
```

---

## Infinite Scroll Handling

### Scroll-Based Loading

```json
{
  "workflow": "infinite-scroll-scraping",
  "description": "Scrape data from infinite scroll pages",
  "configuration": {
    "maxScrolls": 50,
    "scrollDelay": 1500,
    "noNewContentThreshold": 3
  },
  "steps": [
    {
      "step": 1,
      "description": "Navigate to page",
      "tool": "mcp__playwright__playwright_navigate",
      "parameters": {
        "url": "https://example.com/infinite-feed"
      }
    },
    {
      "step": 2,
      "description": "Initialize tracking",
      "tool": "mcp__playwright__playwright_evaluate",
      "parameters": {
        "script": `() => {
          window.scrapedItems = new Set();
          window.scrollCount = 0;
          window.noNewContentCount = 0;
        }`
      }
    },
    {
      "step": 3,
      "description": "Scroll and extract loop",
      "loop": {
        "maxIterations": 50,
        "steps": [
          {
            "description": "Get current item count",
            "tool": "mcp__playwright__playwright_evaluate",
            "parameters": {
              "script": "() => document.querySelectorAll('.feed-item').length"
            }
          },
          {
            "description": "Extract new items",
            "tool": "mcp__playwright__playwright_evaluate",
            "parameters": {
              "script": `() => {
                const items = Array.from(document.querySelectorAll('.feed-item'));
                const newItems = [];

                items.forEach(item => {
                  const id = item.dataset.itemId;
                  if (!window.scrapedItems.has(id)) {
                    window.scrapedItems.add(id);
                    newItems.push({
                      id: id,
                      title: item.querySelector('.item-title')?.textContent.trim(),
                      content: item.querySelector('.item-content')?.textContent.trim(),
                      timestamp: item.querySelector('.item-timestamp')?.textContent.trim(),
                      author: item.querySelector('.item-author')?.textContent.trim(),
                      likes: item.querySelector('.like-count')?.textContent.trim()
                    });
                  }
                });

                if (newItems.length === 0) {
                  window.noNewContentCount++;
                } else {
                  window.noNewContentCount = 0;
                }

                return {
                  newItems: newItems,
                  totalScraped: window.scrapedItems.size,
                  noNewContentCount: window.noNewContentCount
                };
              }`
            }
          },
          {
            "description": "Check if should continue",
            "condition": "if noNewContentCount >= 3, break"
          },
          {
            "description": "Scroll to bottom",
            "tool": "mcp__playwright__playwright_evaluate",
            "parameters": {
              "script": `() => {
                window.scrollTo(0, document.body.scrollHeight);
                window.scrollCount++;
              }`
            }
          },
          {
            "description": "Wait for new content",
            "tool": "mcp__playwright__playwright_wait_for_timeout",
            "parameters": {
              "timeout": 1500
            }
          },
          {
            "description": "Check for loading indicator",
            "tool": "mcp__playwright__playwright_wait_for_selector",
            "parameters": {
              "selector": ".loading-indicator",
              "state": "hidden",
              "timeout": 5000
            }
          }
        ]
      }
    },
    {
      "step": 4,
      "description": "Get all scraped data",
      "tool": "mcp__playwright__playwright_evaluate",
      "parameters": {
        "script": `() => {
          return Array.from(document.querySelectorAll('.feed-item')).map(item => ({
            id: item.dataset.itemId,
            title: item.querySelector('.item-title')?.textContent.trim(),
            content: item.querySelector('.item-content')?.textContent.trim(),
            timestamp: item.querySelector('.item-timestamp')?.textContent.trim(),
            author: item.querySelector('.item-author')?.textContent.trim(),
            likes: item.querySelector('.like-count')?.textContent.trim()
          }));
        }`
      }
    }
  ]
}
```

### Agent Task Description

```
Task: Scrape infinite scroll feed
Agent: infinite-scroll-scraper
Priority: High

Instructions:
1. Navigate to infinite scroll page
2. Initialize item tracking (prevent duplicates)
3. Start scroll loop:
   a. Count current items on page
   b. Extract new items not yet scraped
   c. Add new items to scraped set
   d. Scroll to bottom of page
   e. Wait 1.5 seconds for new content to load
   f. Wait for loading indicator to disappear
   g. Check if new items loaded
   h. If no new items for 3 consecutive scrolls, stop
   i. Maximum 50 scrolls
4. After scrolling complete:
   a. Extract all final items
   b. Remove duplicates
   c. Save to JSON file
5. Generate scraping report

Data to Extract per Item:
- Item ID (unique identifier)
- Title
- Content/description
- Timestamp
- Author
- Engagement metrics (likes, comments)

Progress Tracking:
- Log scroll count
- Log items found per scroll
- Track total items scraped
- Report when no new content detected

Memory Keys:
- swarm/scraping/infinite-scroll/items
- swarm/scraping/infinite-scroll/scroll-count
- swarm/scraping/infinite-scroll/status

Error Handling:
- Handle stale elements (re-query DOM)
- Timeout if loading takes >5s
- Continue on individual item errors
- Stop if page becomes unresponsive

Optimization:
- Use Set for O(1) duplicate detection
- Batch data storage every 10 scrolls
- Take periodic screenshots for verification
```

### Expected Output

```json
{
  "infiniteScrollJob": {
    "url": "https://example.com/infinite-feed",
    "startTime": "2025-11-27T12:10:00Z",
    "endTime": "2025-11-27T12:15:45Z",
    "duration": "5m 45s",
    "scrolling": {
      "totalScrolls": 42,
      "maxScrollsReached": false,
      "stoppedReason": "No new content for 3 consecutive scrolls"
    },
    "items": {
      "total": 523,
      "duplicatesRemoved": 18,
      "unique": 505
    },
    "dataFile": "/home/user/agentic-flow/data/scraped/infinite-scroll-feed.json",
    "performance": {
      "averageItemsPerScroll": 12.5,
      "averageScrollTime": "1.8s",
      "totalWaitTime": "63s"
    }
  },
  "sampleItems": [
    {
      "id": "item-12345",
      "title": "Interesting Post Title",
      "content": "Lorem ipsum dolor sit amet...",
      "timestamp": "2 hours ago",
      "author": "user123",
      "likes": "45"
    }
  ]
}
```

---

## Table Data Extraction

### HTML Table Scraping

```json
{
  "workflow": "table-extraction",
  "steps": [
    {
      "step": 1,
      "description": "Navigate to page with table",
      "tool": "mcp__playwright__playwright_navigate",
      "parameters": {
        "url": "https://example.com/data-table"
      }
    },
    {
      "step": 2,
      "description": "Extract table data",
      "tool": "mcp__playwright__playwright_evaluate",
      "parameters": {
        "script": `() => {
          const table = document.querySelector('table.data-table');
          if (!table) return null;

          // Extract headers
          const headers = Array.from(table.querySelectorAll('thead th')).map(th =>
            th.textContent.trim()
          );

          // Extract rows
          const rows = Array.from(table.querySelectorAll('tbody tr')).map(tr => {
            const cells = Array.from(tr.querySelectorAll('td')).map(td =>
              td.textContent.trim()
            );

            // Create object with header keys
            const rowData = {};
            headers.forEach((header, index) => {
              rowData[header] = cells[index];
            });

            return rowData;
          });

          return {
            headers: headers,
            rows: rows,
            rowCount: rows.length
          };
        }`
      }
    },
    {
      "step": 3,
      "description": "Extract table with links",
      "tool": "mcp__playwright__playwright_evaluate",
      "parameters": {
        "script": `() => {
          const table = document.querySelector('table.data-table');
          const rows = Array.from(table.querySelectorAll('tbody tr')).map(tr => {
            return {
              name: tr.querySelector('td:nth-child(1)')?.textContent.trim(),
              value: tr.querySelector('td:nth-child(2)')?.textContent.trim(),
              link: tr.querySelector('td:nth-child(3) a')?.href,
              status: tr.querySelector('td:nth-child(4)')?.textContent.trim()
            };
          });
          return rows;
        }`
      }
    }
  ]
}
```

### Dynamic Table with Sorting/Filtering

```json
{
  "workflow": "dynamic-table-extraction",
  "steps": [
    {
      "description": "Sort table by column",
      "tool": "mcp__playwright__playwright_click",
      "parameters": {
        "selector": "th[data-column='price']"
      }
    },
    {
      "description": "Wait for sort animation",
      "tool": "mcp__playwright__playwright_wait_for_timeout",
      "parameters": {
        "timeout": 500
      }
    },
    {
      "description": "Extract sorted data",
      "tool": "mcp__playwright__playwright_evaluate",
      "parameters": {
        "script": `() => {
          return Array.from(document.querySelectorAll('tbody tr')).map(tr => ({
            product: tr.querySelector('td:nth-child(1)')?.textContent.trim(),
            price: parseFloat(tr.querySelector('td:nth-child(2)')?.textContent.replace(/[^0-9.]/g, '')),
            quantity: parseInt(tr.querySelector('td:nth-child(3)')?.textContent)
          }));
        }`
      }
    }
  ]
}
```

---

## Structured Data Parsing

### Product Listing Extraction

```json
{
  "workflow": "product-listing-extraction",
  "description": "Extract structured product data from search results",
  "steps": [
    {
      "step": 1,
      "description": "Navigate to product listing",
      "tool": "mcp__playwright__playwright_navigate",
      "parameters": {
        "url": "https://example.com/search?q=laptops"
      }
    },
    {
      "step": 2,
      "description": "Extract all products with detailed info",
      "tool": "mcp__playwright__playwright_evaluate",
      "parameters": {
        "script": `() => {
          return Array.from(document.querySelectorAll('.product-item')).map(item => {
            // Basic info
            const title = item.querySelector('.product-title')?.textContent.trim();
            const priceText = item.querySelector('.product-price')?.textContent.trim();
            const price = priceText ? parseFloat(priceText.replace(/[^0-9.]/g, '')) : null;

            // Rating info
            const ratingElement = item.querySelector('.rating');
            const rating = ratingElement?.dataset.rating || ratingElement?.textContent.trim();
            const reviewCount = item.querySelector('.review-count')?.textContent.match(/\\d+/)?.[0];

            // Availability
            const inStock = !item.querySelector('.out-of-stock');
            const stockText = item.querySelector('.stock-status')?.textContent.trim();

            // Links and images
            const productUrl = item.querySelector('a.product-link')?.href;
            const imageUrl = item.querySelector('img.product-image')?.src;

            // Additional specs
            const specs = {};
            item.querySelectorAll('.spec-item').forEach(spec => {
              const key = spec.querySelector('.spec-label')?.textContent.trim();
              const value = spec.querySelector('.spec-value')?.textContent.trim();
              if (key && value) specs[key] = value;
            });

            // Badges/tags
            const badges = Array.from(item.querySelectorAll('.badge')).map(b =>
              b.textContent.trim()
            );

            return {
              title,
              price,
              currency: priceText?.match(/[$€£¥]/)?.[0] || 'USD',
              rating: rating ? parseFloat(rating) : null,
              reviewCount: reviewCount ? parseInt(reviewCount) : 0,
              inStock,
              stockStatus: stockText,
              url: productUrl,
              image: imageUrl,
              specifications: specs,
              badges: badges,
              scrapedAt: new Date().toISOString()
            };
          });
        }`
      }
    },
    {
      "step": 3,
      "description": "Extract JSON-LD structured data if available",
      "tool": "mcp__playwright__playwright_evaluate",
      "parameters": {
        "script": `() => {
          const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
          const structuredData = [];

          jsonLdScripts.forEach(script => {
            try {
              const data = JSON.parse(script.textContent);
              structuredData.push(data);
            } catch (e) {
              console.error('Failed to parse JSON-LD', e);
            }
          });

          return structuredData;
        }`
      }
    }
  ]
}
```

### Agent Task Description

```
Task: Extract structured product data from listings
Agent: structured-data-scraper
Priority: High

Instructions:
1. Navigate to product search/listing page
2. Wait for all products to load
3. Extract comprehensive product data:
   - Basic info (title, price, currency)
   - Rating and reviews
   - Availability/stock status
   - Product URL and image URL
   - Detailed specifications
   - Badges/tags (New, Sale, etc.)
   - Timestamp of scraping
4. Extract JSON-LD structured data if present
5. Validate extracted data (check for null/missing fields)
6. Transform data into standardized format
7. Save to /home/user/agentic-flow/data/scraped/products-{{timestamp}}.json
8. Generate data quality report

Data Validation:
- Ensure price is valid number
- Verify URLs are absolute paths
- Check required fields are present
- Log warnings for missing data

Data Transformation:
- Normalize price to decimal
- Convert rating to float
- Parse review count to integer
- Standardize date formats

Memory Keys:
- swarm/scraping/products/raw-data
- swarm/scraping/products/validated-data
- swarm/scraping/products/quality-report

Output Format:
- JSON array of products
- Each product as structured object
- Include metadata (scrape time, URL, etc.)
```

### Expected Output

```json
{
  "scrapeJob": {
    "url": "https://example.com/search?q=laptops",
    "timestamp": "2025-11-27T12:20:00Z",
    "productsFound": 48,
    "productsExtracted": 48,
    "dataQuality": {
      "completeRecords": 45,
      "partialRecords": 3,
      "missingFields": {
        "rating": 5,
        "specifications": 2
      }
    }
  },
  "products": [
    {
      "title": "Dell XPS 15 Laptop",
      "price": 1299.99,
      "currency": "$",
      "rating": 4.7,
      "reviewCount": 523,
      "inStock": true,
      "stockStatus": "In Stock - Ships in 24 hours",
      "url": "https://example.com/products/dell-xps-15",
      "image": "https://example.com/images/dell-xps-15.jpg",
      "specifications": {
        "Processor": "Intel Core i7",
        "RAM": "16GB",
        "Storage": "512GB SSD",
        "Display": "15.6\" FHD"
      },
      "badges": ["Bestseller", "Free Shipping"],
      "scrapedAt": "2025-11-27T12:20:15Z"
    }
  ],
  "structuredData": [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": "Dell XPS 15 Laptop",
      "offers": {
        "@type": "Offer",
        "price": "1299.99",
        "priceCurrency": "USD"
      }
    }
  ]
}
```

---

## Rate Limiting and Politeness

### Implementing Delays

```json
{
  "workflow": "polite-scraping",
  "configuration": {
    "delayBetweenRequests": 2000,
    "randomDelayRange": [1000, 3000],
    "maxConcurrentRequests": 2,
    "respectRobotsTxt": true,
    "userAgent": "Mozilla/5.0 (compatible; MyBot/1.0; +https://example.com/bot)"
  },
  "implementation": [
    {
      "description": "Navigate with delay",
      "tool": "mcp__playwright__playwright_navigate",
      "parameters": {
        "url": "https://example.com/page1"
      }
    },
    {
      "description": "Fixed delay",
      "tool": "mcp__playwright__playwright_wait_for_timeout",
      "parameters": {
        "timeout": 2000
      }
    },
    {
      "description": "Random delay",
      "tool": "mcp__playwright__playwright_evaluate",
      "parameters": {
        "script": `() => {
          const min = 1000;
          const max = 3000;
          const delay = Math.floor(Math.random() * (max - min + 1)) + min;
          return new Promise(resolve => setTimeout(resolve, delay));
        }`
      }
    }
  ]
}
```

### Respecting robots.txt

```bash
# Check robots.txt before scraping
curl https://example.com/robots.txt

# Example robots.txt check in workflow
```

```json
{
  "workflow": "robots-txt-aware-scraping",
  "steps": [
    {
      "description": "Fetch and parse robots.txt",
      "tool": "mcp__playwright__playwright_evaluate",
      "parameters": {
        "script": `async () => {
          const response = await fetch('/robots.txt');
          const text = await response.text();

          // Simple parser (use proper parser in production)
          const disallowedPaths = [];
          const lines = text.split('\\n');

          lines.forEach(line => {
            if (line.startsWith('Disallow:')) {
              const path = line.split(':')[1].trim();
              if (path) disallowedPaths.push(path);
            }
          });

          return {
            disallowedPaths,
            crawlDelay: lines.find(l => l.startsWith('Crawl-delay:'))?.split(':')[1].trim()
          };
        }`
      }
    }
  ]
}
```

---

## Anti-Scraping Measures

### Handling CAPTCHAs and Bot Detection

```json
{
  "workflow": "anti-scraping-mitigation",
  "strategies": [
    {
      "strategy": "Realistic User Agent",
      "tool": "mcp__playwright__playwright_context_create",
      "parameters": {
        "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    },
    {
      "strategy": "Viewport and Device Emulation",
      "tool": "mcp__playwright__playwright_context_create",
      "parameters": {
        "viewport": {
          "width": 1920,
          "height": 1080
        },
        "deviceScaleFactor": 1,
        "isMobile": false
      }
    },
    {
      "strategy": "Randomize Request Timing",
      "implementation": "Random delays between 1-5 seconds"
    },
    {
      "strategy": "Rotate Headers",
      "implementation": "Vary Accept-Language, Accept-Encoding"
    },
    {
      "strategy": "Handle JavaScript Challenges",
      "tool": "mcp__playwright__playwright_wait_for_load_state",
      "parameters": {
        "state": "networkidle",
        "timeout": 30000
      }
    },
    {
      "strategy": "Screenshot on Detection",
      "description": "Capture screenshot if CAPTCHA detected for manual solving"
    }
  ]
}
```

### Detecting Bot Protection

```json
{
  "workflow": "detect-bot-protection",
  "steps": [
    {
      "description": "Check for common bot detection indicators",
      "tool": "mcp__playwright__playwright_evaluate",
      "parameters": {
        "script": `() => {
          const indicators = {
            captcha: !!document.querySelector('[class*="captcha"]') ||
                     !!document.querySelector('[id*="captcha"]'),
            cloudflare: !!document.querySelector('.cf-browser-verification') ||
                        document.title.includes('Just a moment'),
            accessDenied: document.body.textContent.includes('Access Denied') ||
                          document.body.textContent.includes('403 Forbidden'),
            rateLimited: document.body.textContent.includes('Too Many Requests') ||
                        document.body.textContent.includes('429'),
            antiBot: !!document.querySelector('[class*="antibot"]')
          };

          return {
            detected: Object.values(indicators).some(v => v),
            indicators
          };
        }`
      }
    },
    {
      "description": "Take screenshot if protection detected",
      "condition": "if detected === true",
      "tool": "mcp__playwright__playwright_screenshot",
      "parameters": {
        "path": "/home/user/agentic-flow/data/screenshots/bot-protection-detected.png",
        "fullPage": true
      }
    }
  ]
}
```

---

## Saving Data to Files

### Saving JSON Data

```bash
# After scraping, save data using Node.js script or direct file write

# Via bash in agent workflow:
npx claude-flow@alpha hooks post-edit --file "scraped-data.json" --memory-key "swarm/scraped/products"
```

```json
{
  "workflow": "save-scraped-data",
  "steps": [
    {
      "description": "Extract data",
      "tool": "mcp__playwright__playwright_evaluate",
      "parameters": {
        "script": "() => window.scrapedData"
      }
    },
    {
      "description": "Save to file",
      "implementation": "Use Write tool in Claude Code",
      "file": "/home/user/agentic-flow/data/scraped/products.json",
      "format": "JSON"
    }
  ]
}
```

### Data File Organization

```
/home/user/agentic-flow/data/
├── scraped/
│   ├── products/
│   │   ├── products-2025-11-27-120000.json
│   │   ├── products-2025-11-27-130000.json
│   │   └── products-latest.json (symlink)
│   ├── reviews/
│   │   └── reviews-2025-11-27.json
│   └── metadata/
│       └── scrape-jobs.json
├── screenshots/
│   ├── products/
│   └── errors/
└── logs/
    └── scraping-2025-11-27.log
```

### Agent Complete Scraping Workflow

```
Task: Complete e-commerce data scraping pipeline
Agent: comprehensive-scraper

Pre-Task Setup:
npx claude-flow@alpha hooks pre-task --description "E-commerce scraping pipeline"
npx claude-flow@alpha hooks session-restore --session-id "swarm-scraping"

Instructions:
Phase 1 - Setup:
1. Create directory structure
2. Check robots.txt compliance
3. Configure browser context with realistic settings
4. Initialize data collection arrays

Phase 2 - Product Listing:
1. Navigate to category page
2. Handle pagination (max 20 pages)
3. Extract all product URLs
4. Store product URLs in memory

Phase 3 - Product Details:
1. For each product URL:
   a. Navigate to product page
   b. Extract detailed product data
   c. Take product screenshot
   d. Add 2-second delay
   e. Store in products array
2. Handle errors gracefully (skip failed products)

Phase 4 - Data Processing:
1. Validate all extracted data
2. Remove duplicates
3. Normalize data formats
4. Generate data quality report

Phase 5 - Data Storage:
1. Save products.json with timestamp
2. Save metadata file
3. Generate summary report
4. Update latest symlink

Post-Task Cleanup:
npx claude-flow@alpha hooks post-task --task-id "scraping-pipeline"
npx claude-flow@alpha hooks session-end --export-metrics true

Memory Keys:
- swarm/scraping/product-urls
- swarm/scraping/products-data
- swarm/scraping/metadata
- swarm/scraping/quality-report

Deliverables:
1. /home/user/agentic-flow/data/scraped/products/products-{{timestamp}}.json
2. /home/user/agentic-flow/data/scraped/metadata/scrape-job-{{timestamp}}.json
3. Data quality report in memory
4. Screenshots for verification

Performance Targets:
- Scrape rate: ~30 products/minute
- Error rate: <5%
- Data completeness: >95%
- Politeness: 2s delay between requests
```

---

## Complete Example: Multi-Agent Scraping Swarm

See [Multi-Agent Swarm Examples](./multi-agent-swarm.md) for parallel scraping patterns that achieve 2.8-4.4x speed improvements!

---

## Best Practices Summary

1. **Respect Rate Limits**: 1-3 second delays between requests
2. **Use Realistic User Agents**: Rotate user agents periodically
3. **Handle Errors Gracefully**: Continue on non-critical errors
4. **Validate Data**: Check data completeness and correctness
5. **Monitor for Bot Detection**: Screenshot and alert on CAPTCHAs
6. **Organize Data**: Use clear directory structure and timestamps
7. **Log Everything**: Track scraping progress and errors
8. **Test Small First**: Validate on small dataset before full scrape
9. **Follow robots.txt**: Respect website scraping policies
10. **Consider API Alternatives**: Check if official API exists

---

## Next Steps

- Master [Multi-Agent Swarm](./multi-agent-swarm.md) for distributed scraping
- Review [Form Automation](./form-automation.md) for interactive scraping
- Learn [Basic Navigation](./basic-navigation.md) for prerequisites
