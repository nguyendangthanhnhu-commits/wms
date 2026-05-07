-- Chạy trong Supabase SQL Editor

-- Bật extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 1. Nhắc kiểm kê đầu/cuối ca (6h, 12h, 18h, 0h)
SELECT cron.schedule(
  'shift-check-reminder',
  '0 0,6,12,18 * * *',
  $$
    INSERT INTO "SystemNotification"
      (id, "targetUserId", title, body, type, "isRead", "createdAt")
    SELECT
      gen_random_uuid(),
      wsa."userId",
      'Nhắc kiểm kê ca',
      'Vui lòng kiểm kê kho trước khi bắt đầu ca',
      'check_due',
      false,
      NOW()
    FROM "WarehouseStaffAssignment" wsa
    JOIN "Warehouse" w ON wsa."warehouseId" = w.id
    WHERE w."groupType" = 'production' AND w."isActive" = true;
  $$
);

-- 2. Cảnh báo tồn kho thấp (7h sáng mỗi ngày)
SELECT cron.schedule(
  'low-stock-alert',
  '0 7 * * *',
  $$
    INSERT INTO "SystemNotification"
      (id, "targetUserId", title, body, type, "refType", "isRead", "createdAt")
    SELECT
      gen_random_uuid(),
      u.id,
      'Cảnh báo tồn kho thấp',
      'Có ' || COUNT(*) || ' mặt hàng sắp hết tồn kho',
      'low_stock',
      'inventory',
      false,
      NOW()
    FROM "Inventory" i
    JOIN "Product" p ON i."productId" = p.id
    CROSS JOIN "User" u
    WHERE u.role IN ('admin', 'warehouse_manager')
      AND i.quantity <= p."minStockLevel"
      AND p."minStockLevel" > 0
    GROUP BY u.id
    HAVING COUNT(*) > 0;
  $$
);

-- 3. Cảnh báo linh kiện QC chờ quá 24h
SELECT cron.schedule(
  'qc-overdue-alert',
  '0 8 * * *',
  $$
    INSERT INTO "SystemNotification"
      (id, "targetUserId", title, body, type, "isRead", "createdAt")
    SELECT
      gen_random_uuid(),
      u.id,
      'Linh kiện QC chờ quá 24h',
      COUNT(*) || ' linh kiện trong Kho Chất lượng chưa được đánh giá',
      'qc_overdue',
      false,
      NOW()
    FROM "DefectReport" dr
    CROSS JOIN "User" u
    WHERE dr.status = 'pending_qc'
      AND dr."reportedAt" < NOW() - INTERVAL '24 hours'
      AND u.role IN ('admin', 'qc_officer')
    GROUP BY u.id
    HAVING COUNT(*) > 0;
  $$
);

