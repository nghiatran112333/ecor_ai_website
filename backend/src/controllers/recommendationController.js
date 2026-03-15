import Behavior from "../models/behaviorModel.js";
import Product from "../models/productModel.js";
import Recommendation from "../models/recommendationModel.js";
import { generateAIRecommendations } from "../services/aiService.js";

// @desc    Get AI recommendations for a user
// @route   GET /api/recommendations
// @access  Private
export const getRecommendations = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Check if we have recent recommendations cached (e.g., generated within the last 12 hours)
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const existingRecs = await Recommendation.findOne({
      user: userId,
      generatedAt: { $gte: twelveHoursAgo },
    }).populate("recommendedProducts.product");

    if (existingRecs && existingRecs.recommendedProducts.length > 0) {
      return res.status(200).json(existingRecs.recommendedProducts);
    }

    // 2. Fetch user's recent behaviors
    const behaviors = await Behavior.find({ user: userId })
      .sort({ timestamp: -1 })
      .limit(20)
      .populate("product");

    // Extract unique products from behavior
    const interactedProducts = [];
    const seenIds = new Set();
    
    behaviors.forEach((b) => {
      if (b.product && !seenIds.has(String(b.product._id))) {
        interactedProducts.push(b.product);
        seenIds.add(String(b.product._id));
      }
    });

    // 3. Get catalog subset (in a real HUGE app, we might use embeddings or search engines. 
    // Here we just fetch a bunch of active products to let AI choose from)
    const catalogSubset = await Product.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(50); // Get 50 recent/popular products to choose from

    // 4. If no history or no catalog, return some default featured products
    if (interactedProducts.length === 0 || catalogSubset.length === 0) {
       const defaultProducts = await Product.find({ isFeatured: true, isActive: true }).limit(5);
       const defaultResponse = defaultProducts.map(p => ({
           product: p,
           score: 0.5,
           reason: "Popular product"
       }));
       return res.status(200).json(defaultResponse);
    }

    // 5. Generate AI Recommendations
    const aiResults = await generateAIRecommendations(interactedProducts, catalogSubset);

    if (!aiResults || aiResults.length === 0) {
      // Fallback
      const fallbackProducts = await Product.find({ isActive: true }).limit(5);
      return res.status(200).json(fallbackProducts.map(p => ({ product: p, score: 0.1, reason: "Fallback suggestion" })));
    }

    // 6. Map the string IDs back to Mongoose ObjectIds and save to DB
    const formattedRecs = [];
    for (const rec of aiResults) {
        // verify product actually exists
        const prod = await Product.findById(rec.productId);
        if (prod) {
            formattedRecs.push({
                product: prod._id,
                score: rec.score || 0.5,
                reason: rec.reason || "Recommended for you"
            });
        }
    }

    const newRecommendation = new Recommendation({
      user: userId,
      recommendedProducts: formattedRecs,
      modelVersion: "gemini-1.5-flash"
    });

    await newRecommendation.save();

    // 7. Return populated data to frontend
    const populatedRecs = await Recommendation.findById(newRecommendation._id).populate("recommendedProducts.product");
    res.status(200).json(populatedRecs.recommendedProducts);

  } catch (error) {
    console.error(`Error generating recommendations: ${error.message}`);
    res.status(500).json({ message: "Server error generating recommendations" });
  }
};
