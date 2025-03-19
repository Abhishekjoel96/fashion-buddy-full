import axios from "axios";

export interface ShoppingProduct {
  title: string;
  price: number;
  brand: string;
  link: string;
  image?: string;
  description?: string;
  source: string;  // e.g., "Myntra", "Flipkart", "Amazon"
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

export async function searchProducts(
  color: string,
  budget?: string
): Promise<ShoppingProduct[]> {
  try {
    console.log(`Searching for ${color} products in budget range ${budget}`);

    // Format query to include major Indian e-commerce sites
    const query = `${color} shirts site:(myntra.com OR flipkart.com OR amazon.in)`;

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
          hl: "en"
        }
      }
    );

    console.log(`Found ${response.data.shopping_results.length} products`);

    const products = response.data.shopping_results
      .map((item) => {
        // Extract price number from string (remove currency symbol and convert to number)
        const priceMatch = item.price.match(/[\d,]+/);
        const price = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : 0;

        // Extract brand from extensions or title
        const brand = item.extensions?.find(ext => ext.includes("Brand:"))?.replace("Brand: ", "") 
          || item.title.split(' ')[0];

        return {
          title: item.title,
          price,
          brand: brand || "Unknown",
          link: item.link,
          image: item.thumbnail,
          description: item.description,
          source: item.source || "Unknown"
        };
      })
      .filter((product: ShoppingProduct | undefined) => {
        if (!product) return false;
        if (!budget) return true;
        const [min, max] = budget.split("-").map(Number);
        return product.price >= min && (!max || product.price <= max);
      })
      // Sort by rating and number of reviews if available
      .sort((a, b) => {
        if (!a || !b) return 0;
        return (b.rating || 0) * (b.reviews || 0) - (a.rating || 0) * (a.reviews || 0);
      })
      .filter(product => product !== undefined);

    // Return top 5 results
    return products.slice(0, 5);
  } catch (error: unknown) {
    console.error("SerpApi search error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to search products: ${errorMessage}`);
  }
}