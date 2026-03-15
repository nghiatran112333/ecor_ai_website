import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the API with your API key
// Make sure GEMINI_API_KEY is in your .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "YOUR_API_KEY");

/**
 * Generates personalized product recommendations using Google Gemini.
 * @param {Array} userHistory - An array of product objects the user has interacted with (viewed, added to cart, etc).
 * @param {Array} catalogSubset - A sample of available products to choose from or analyze.
 * @returns {Array} An array of recommended product IDs and reasons.
 */
export const generateAIRecommendations = async (userHistory, catalogSubset) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
       console.warn("GEMINI_API_KEY is missing. AI recommendations won't work.");
       return [];
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Format the history for the prompt
    const historyText = userHistory.map((item, index) => {
        return `${index + 1}. Product: ${item.name}, Category: ${item.category}, Price: ${item.price}`;
    }).join('\n');

    // Format the catalog for the prompt
    const catalogText = catalogSubset.map(item => {
        return `ID: ${item._id}, Product: ${item.name}, Category: ${item.category}, Price: ${item.price}, Brand: ${item.brand}, Colors: ${item.colors.map(c => c.colorName).join(', ')}`;
    }).join('\n');

    const prompt = `
      You are an expert e-commerce recommendation system. 
      Analyze the user's recent browsing and interaction history.

      User's Recent Interaction History:
      ${historyText || "User has no history yet. Suggest popular or attractive products."}

      Available Catalog to choose from:
      ${catalogText}

      Based on the history, select the 5 most relevant products from the 'Available Catalog' for this user. 
      Return the response STRICTLY in JSON format as an array of objects. 
      Each object must have the following keys:
      - "productId": The exact ID string of the recommended product from the catalog.
      - "reason": A short, 1-sentence reason why this product is recommended based on their history (e.g., "Because you viewed similar gaming laptops").
      - "score": A relevance score between 0.1 and 1.0 (1.0 being highly relevant).

      Do not include any formatting like \`\`\`json or \`\`\`. Just raw JSON array.
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Clean up potential markdown formatting from Gemini's response
    let jsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Parse the JSON
    const recommendations = JSON.parse(jsonString);
    return recommendations;

  } catch (error) {
    console.error("Error generating AI recommendations:", error);
    return []; // Return empty array on failure so app doesn't crash
  }
};
