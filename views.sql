CREATE OR REPLACE VIEW v_open_jobs AS
SELECT j.job_id, j.title, c.company_name, jc.category_name, j.location,
       j.pay_amount, j.pay_type, j.workers_needed, j.start_date, j.end_date,
       COUNT(a.application_id) AS applications_received
FROM job j
JOIN contractor c ON c.contractor_id = j.contractor_id
JOIN job_category jc ON jc.category_id = j.category_id
LEFT JOIN application a ON a.job_id = j.job_id
WHERE j.status = 'open'
GROUP BY j.job_id, j.title, c.company_name, jc.category_name, j.location,
         j.pay_amount, j.pay_type, j.workers_needed, j.start_date, j.end_date;

CREATE OR REPLACE VIEW v_worker_rating_summary AS
SELECT w.worker_id, w.full_name,
       COUNT(r.rating_id) AS total_ratings,
       ROUND(AVG(r.score), 2) AS avg_score,
       MIN(r.score) AS min_score,
       MAX(r.score) AS max_score
FROM worker w
LEFT JOIN application a ON a.worker_id = w.worker_id
LEFT JOIN rating r ON r.application_id = a.application_id
GROUP BY w.worker_id, w.full_name;

CREATE OR REPLACE VIEW v_contractor_activity AS
SELECT c.contractor_id, c.company_name,
       COUNT(DISTINCT j.job_id) AS jobs_posted,
       COUNT(DISTINCT j.job_id) FILTER (WHERE j.status = 'open') AS open_jobs,
       COUNT(DISTINCT j.job_id) FILTER (WHERE j.status = 'completed') AS completed_jobs,
       COUNT(DISTINCT a.application_id) AS applications_received,
       ROUND(COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'paid'), 0), 2) AS total_paid
FROM contractor c
LEFT JOIN job j ON j.contractor_id = c.contractor_id
LEFT JOIN application a ON a.job_id = j.job_id
LEFT JOIN payment p ON p.application_id = a.application_id
GROUP BY c.contractor_id, c.company_name;
