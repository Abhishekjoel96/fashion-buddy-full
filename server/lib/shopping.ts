import axios from "axios";

export interface ShoppingProduct {
  title: string;
  price: number;
  brand: string;
  link: string;
  image?: string;
  description?: string;
  source: string;  // e.g., "Myntra", "Flipkart", "Amazon"
  rating?: number;
  reviews?: number;
}

interface SerpApiResponse {
  shopping_results: Array<{
    title: string;
    price: string;
    link: string;
    source: string;
    thumbnail?: string;
    description?: string;
    rating?: number;
    reviews?: number;
    extensions?: string[];
  }>;
}

if (!process.env.SERP_API_KEY) {
  throw new Error("SERP_API_KEY environment variable must be set");
}

export async function searchProducts(
  color: string,
  budget?: string
): Promise<ShoppingProduct[]> {
  try {
    console.log(`Searching for ${color} products in budget range ${budget}`);

    // Format query to include major Indian e-commerce sites and color
    const query = `${color} shirts site:(myntra.com OR flipkart.com OR amazon.in)`;
    console.log("Search query:", query);

    const response = await axios.get<SerpApiResponse>(
      `https://serpapi.com/search.json`,
      {
        params: {
          engine: "google_shopping",
          q: query,
          api_key: process.env.SERP_API_KEY,
          location: "India",
          google_domain: "google.co.in",
          gl: "in",
          hl: "en",
          num: 10 // Request more results to ensure we have enough after filtering
        }
      }
    );

    if (!response.data.shopping_results) {
      console.log("No shopping results found");
      return [];
    }

    console.log(`Found ${response.data.shopping_results.length} initial products`);

    const products = response.data.shopping_results
      .map((item) => {
        try {
          // Extract price number from string (remove currency symbol and convert to number)
          const priceMatch = item.price?.match(/[\d,]+/);
          const price = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : 0;

          // Extract brand from extensions or title
          const brand = item.extensions?.find(ext => ext.includes("Brand:"))?.replace("Brand: ", "") 
            || item.title?.split(' ')[0] || "Unknown";

          return {
            title: item.title || "Unknown Product",
            price,
            brand,
            link: item.link,
            image: item.thumbnail,
            description: item.description,
            source: item.source || "Unknown",
            rating: item.rating,
            reviews: item.reviews
          };
        } catch (error) {
          console.error("Error processing product item:", error);
          return null;
        }
      })
      .filter((product): product is ShoppingProduct => {
        if (!product) return false;

        // Apply budget filter if specified
        if (budget) {
          const [min, max] = budget.split("-").map(Number);
          return product.price >= min && (!max || product.price <= max);
        }
        return true;
      })
      .sort((a, b) => {
        // Sort by rating * number of reviews, defaulting to 0 if not available
        const aScore = (a.rating || 0) * (a.reviews || 0);
        const bScore = (b.rating || 0) * (b.reviews || 0);
        return bScore - aScore;
      });

    console.log(`Returning ${products.length} filtered products`);
    return products.slice(0, 5); // Return top 5 results

  } catch (error) {
    console.error("SerpApi search error:", error);
    const errorMessage = error instanceof Error 
      ? `SERP API Error: ${error.message}`
      : 'Unknown error occurred while searching products';
    throw new Error(errorMessage);
  }
}