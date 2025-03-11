
import axios from "axios";

export interface ShoppingProduct {
  title: string;
  price: number;
  brand: string;
  link: string;
  image?: string;
}

interface SerpApiResponse {
  shopping_results: Array<{
    title: string;
    price: string;
    brand?: string;
    link: string;
    thumbnail?: string;
  }>;
}

/**
 * Search for fashion products based on recommended colors and budget
 * @param colors Array of recommended colors
 * @param budget Budget range (e.g. "500-1500")
 * @param category Optional clothing category (e.g. "shirts", "dresses")
 * @returns Array of matching products
 */
export async function searchProducts(
  colors: string[],
  budget?: string,
  category: string = "clothing"
): Promise<ShoppingProduct[]> {
  try {
    // Construct a more targeted query with multiple colors
    const colorQuery = colors.slice(0, 3).join(" OR ");
    const query = `${category} ${colorQuery} indian fashion`;
    
    console.log(`Searching products with query: ${query}, budget: ${budget}`);
    
    const response = await axios.get<SerpApiResponse>(
      `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(
        query
      )}&country=in&api_key=${process.env.SERP_API_KEY}`
    );

    const products = response.data.shopping_results
      .map((item) => ({
        title: item.title,
        // Remove currency symbols and convert to number
        price: parseFloat(item.price.replace(/[^0-9.-]+/g, "")),
        brand: item.brand || "Unknown",
        link: item.link,
        image: item.thumbnail
      }))
      .filter((product: ShoppingProduct) => {
        if (!budget) return true;
        
        // Parse budget range
        const [minPrice, maxPrice] = budget.split("-").map(Number);
        return product.price >= minPrice && product.price <= maxPrice;
      });

    return products.slice(0, 5);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Product search error: ${errorMessage}`);
    throw new Error(`Failed to search products: ${errorMessage}`);
  }
}

/**
 * Search for products by specific color
 * @param color Single color to search for
 * @param category Clothing category
 * @param budget Budget range
 * @returns Array of matching products
 */
export async function searchByColor(
  color: string,
  category: string = "clothing",
  budget?: string
): Promise<ShoppingProduct[]> {
  return searchProducts([color], budget, category);
}
