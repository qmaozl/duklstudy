-- Enable leaked password protection for better security
UPDATE auth.config 
SET leaked_password_protection = true 
WHERE parameter = 'leaked_password_protection';

-- If the config doesn't exist, insert it
INSERT INTO auth.config (parameter, value) 
VALUES ('leaked_password_protection', 'true')
ON CONFLICT (parameter) DO UPDATE SET value = 'true';