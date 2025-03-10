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

export async function searchProducts(
  query: string,
  budget?: string
): Promise<ShoppingProduct[]> {
  try {
    const response = await axios.get<SerpApiResponse>(
      `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(
        query
      )}&api_key=${process.env.SERP_API_KEY}`
    );

    const products = response.data.shopping_results
      .map((item) => ({
        title: item.title,
        price: parseFloat(item.price.replace(/[^0-9.-]+/g, "")),
        brand: item.brand || "Unknown",
        link: item.link,
        image: item.thumbnail
      }))
      .filter((product: ShoppingProduct) => {
        if (!budget) return true;
        const [, maxPrice] = budget.split("-").map(Number);
        return product.price <= maxPrice;
      });

    return products.slice(0, 5);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to search products: ${errorMessage}`);
  }
}