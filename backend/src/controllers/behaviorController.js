import Behavior from "../models/behaviorModel.js";
import Product from "../models/productModel.js";

// @desc    Track user behavior (view, add_to_cart, search, purchase)
// @route   POST /api/behaviors
// @access  Private
export const trackBehavior = async (req, res) => {
  try {
    const { behaviorType, productId, metadata } = req.body;

    // Validate behavior type
    const validTypes = [
      "view",
      "search",
      "add_to_cart",
      "purchase",
      "wishlist",
      "abandon_cart",
    ];
    if (!validTypes.includes(behaviorType)) {
      return res.status(400).json({ message: "Invalid behavior type" });
    }

    if (productId) {
      const productExists = await Product.findById(productId);
      if (!productExists) {
        return res.status(404).json({ message: "Product not found" });
      }
    }

    const behavior = new Behavior({
      user: req.user._id,
      behaviorType,
      product: productId || null,
      metadata: metadata || {},
    });

    await behavior.save();

    res.status(201).json({ message: "Behavior tracked successfully" });
  } catch (error) {
    console.error(`Error tracking behavior: ${error.message}`);
    res.status(500).json({ message: "Server error tracking behavior" });
  }
};
