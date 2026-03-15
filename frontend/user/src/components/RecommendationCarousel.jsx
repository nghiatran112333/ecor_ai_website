import { useState, useEffect } from "react";
import axios from "axios";
import ProductSection from "./ProductSection";

export default function RecommendationCarousel() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setLoading(false);
          return; // Don't fetch if not logged in
        }

        const res = await axios.get("http://localhost:8000/api/v1/recommendations", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Extract the actual product objects from the response format
        const products = res.data.map(item => item.product);
        setRecommendations(products);
      } catch (err) {
        console.error("Failed to fetch recommendations", err);
        setError("Không thể tải gợi ý");
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  if (loading) return <div>Đang tải gợi ý từ AI...</div>;
  if (!loading && recommendations.length === 0) return null;

  return (
    <div className="recommendations-wrapper">
      <ProductSection title="✨ CÓ THỂ BẠN SẼ THÍCH (Gợi ý bởi AI)" products={recommendations} />
    </div>
  );
}
