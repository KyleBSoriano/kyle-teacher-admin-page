-- Fix corrupted schedule block times (convert incorrect 12:XX AM times to 12:XX PM)
UPDATE schedule_blocks 
SET start_time = REPLACE(start_time, ' AM', ' PM'),
    end_time = REPLACE(end_time, ' AM', ' PM')
WHERE (start_time LIKE '12:%AM' OR end_time LIKE '12:%AM')
  AND schedule_date >= CURRENT_DATE - INTERVAL '30 days';