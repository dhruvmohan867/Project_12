import express from "express";
import {
  addProducts,
  getProductById,
  getproducts,
} from "../controllers/Products.js";
import Products from "../models/Products.js";
const router = express.Router();

router.post("/add", addProducts);
router.get("/", getproducts);
router.get("/:id", getProductById);
router.delete("/deleteAll", async (req, res) => {
  try {
    await Products.deleteMany({});
    res.status(200).json({ message: "All products deleted successfully" });
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ error: "Failed to delete products" });
  }
});
export default router;
