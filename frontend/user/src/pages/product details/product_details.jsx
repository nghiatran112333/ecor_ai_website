import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import { products } from "../../data/products";
import Header from "../../components/Header";
import Footer from "../../components/footer";
import ProductSection from "../../components/ProductSection";
import RecommendationCarousel from "../../components/RecommendationCarousel";
import "./product_details.css";

export default function ProductDetail() {
  const { id } = useParams();
  const product = products.find((p) => p.id === id);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    // Chỉ track behavior nếu user đã login (có token)
    const token = localStorage.getItem("token"); // Hoặc lấy từ context auth của app
    if (product && id && token) {
      axios.post(
        "http://localhost:8000/api/v1/behaviors",
        {
          behaviorType: "view",
          productId: id, // Assuming user frontend uses mapped IDs or backend handles string matching
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      ).catch(err => console.error("Error tracking view behavior:", err));
    }
  }, [id, product]);

  if (!product) return <h2>Không tìm thấy sản phẩm</h2>;

  const increase = () => setQty(qty + 1);
  const decrease = () => qty > 1 && setQty(qty - 1);

  const handleAddToCart = () => {
    // 1. Track behavior
    const token = localStorage.getItem("token");
    if (product && id && token) {
      axios.post(
        "http://localhost:8000/api/v1/behaviors",
        {
          behaviorType: "add_to_cart",
          productId: id,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      ).catch(err => console.error("Error tracking cart behavior:", err));
    }

    // 2. Logic thêm vào giỏ hàng thực tế ở đây (dispatch action redux/context)
    console.log("Đã thêm vào giỏ hàng:", product.name, "Số lượng:", qty);
    alert(`Đã thêm ${product.name} vào giỏ hàng!`);
  };

  // 👉 LẤY SẢN PHẨM TƯƠNG TỰ (cùng category, khác id)
  const relatedProducts = products.filter(
    (item) => item.category === product.category && item.id !== product.id
  );

  return (
    <>
      <Header />

      {/* PRODUCT DETAIL */}
      <div className="product-detail container">
        {/* LEFT */}
        <div className="detail-left">
          <div className="thumbnail-list">
            {product.images.map((img, i) => (
              <img key={i} src={img.url} alt="" />
            ))}
          </div>

          <div className="main-image">
            <img src={product.images[0].url} alt={product.name} />
          </div>
        </div>

        {/* RIGHT */}
        <div className="detail-right">
          <h1>{product.name}</h1>

          <div className="rating">
            ⭐⭐⭐⭐⭐ <span>({product.reviewCount} đánh giá)</span>
            <span className="status"> | Còn hàng</span>
          </div>

          <div className="price">
            {product.price.toLocaleString()}đ
            <span>{product.originalPrice.toLocaleString()}đ</span>
          </div>

          <p className="desc">{product.description}</p>

          {/* COLORS */}
          <div className="colors">
            <p>Màu sắc:</p>
            <div className="color-list">
              {product.colors.map((c, i) => (
                <span key={i} style={{ background: c.code }} />
              ))}
            </div>
          </div>

          {/* PURCHASE ROW */}
          <div className="purchase-row">
            <div className="quantity">
              <button onClick={decrease}>−</button>
              <span>{qty}</span>
              <button onClick={increase}>+</button>
            </div>

            <div className="actions">
              <button className="buy">Mua ngay</button>
            </div>
          </div>

          {/* ADD PRODUCT BUTTON */}
          <button className="add-more" onClick={handleAddToCart}>Thêm vào giỏ</button>

          {/* SERVICES */}
          <div className="services">
            <div className="service-item">
              🚚 <strong>Giao hàng miễn phí</strong>
              <p>Cho đơn hàng trên 500.000đ</p>
            </div>
            <div className="service-item">
              🔄 <strong>Đảm bảo hoàn tiền</strong>
              <p>Trong vòng 30 ngày</p>
            </div>
          </div>
        </div>
      </div>

      {/* SẢN PHẨM TƯƠNG TỰ (TÁI SỬ DỤNG COMPONENT HOME) */}
      <div className="container" style={{ marginTop: '2rem' }}>
        <RecommendationCarousel />
        <ProductSection title="Sản phẩm cùng danh mục" products={relatedProducts} />
      </div>

      <Footer />
    </>
  );
}
