-- Backfill full Vietnamese catalog names for installations where the original
-- credit-card-management migration has already run.
UPDATE "credit_cards"
SET "bank_code" = CASE "bank_name"
  WHEN 'Ngân hàng TMCP Ngoại thương Việt Nam' THEN 'vietcombank'
  WHEN 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam' THEN 'bidv'
  WHEN 'Ngân hàng TMCP Công thương Việt Nam' THEN 'vietinbank'
  WHEN 'Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam' THEN 'agribank'
  WHEN 'Ngân hàng TMCP Việt Nam Thịnh Vượng' THEN 'vpbank'
  WHEN 'Ngân hàng TMCP Kỹ thương Việt Nam' THEN 'techcombank'
  WHEN 'Ngân hàng TMCP Sài Gòn Thương Tín' THEN 'sacombank'
  WHEN 'Ngân hàng TMCP Quốc tế Việt Nam' THEN 'vib'
  WHEN 'Ngân hàng TMCP Quân đội' THEN 'mbbank'
  WHEN 'Ngân hàng TMCP Á Châu' THEN 'acb'
  WHEN 'Công ty Tài chính TNHH MTV Home Credit Việt Nam' THEN 'home-credit'
  ELSE NULL
END
WHERE "bank_code" IS NULL
  AND "bank_name" IN (
    'Ngân hàng TMCP Ngoại thương Việt Nam',
    'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam',
    'Ngân hàng TMCP Công thương Việt Nam',
    'Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam',
    'Ngân hàng TMCP Việt Nam Thịnh Vượng',
    'Ngân hàng TMCP Kỹ thương Việt Nam',
    'Ngân hàng TMCP Sài Gòn Thương Tín',
    'Ngân hàng TMCP Quốc tế Việt Nam',
    'Ngân hàng TMCP Quân đội',
    'Ngân hàng TMCP Á Châu',
    'Công ty Tài chính TNHH MTV Home Credit Việt Nam'
  );
