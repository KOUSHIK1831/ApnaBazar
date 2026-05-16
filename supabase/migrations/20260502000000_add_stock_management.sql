-- Add stock and low_stock_threshold columns to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock integer DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold integer DEFAULT 5;

-- Decrement stock when order is confirmed
CREATE OR REPLACE FUNCTION decrement_stock_on_confirm()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status = 'pending' THEN
    UPDATE products SET stock = stock - NEW.quantity
    WHERE id = NEW.product_id AND stock >= NEW.quantity;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS order_confirm_decrement_stock ON orders;
CREATE TRIGGER order_confirm_decrement_stock
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed' AND OLD.status = 'pending')
  EXECUTE FUNCTION decrement_stock_on_confirm();
