-- Q1: workers with a specific skill
SELECT w.worker_id, w.full_name, w.city, ws.years_experience, ws.proficiency
FROM worker w
JOIN worker_skill ws ON ws.worker_id = w.worker_id
JOIN skill s ON s.skill_id = ws.skill_id
WHERE s.skill_name = 'Plumbing'
ORDER BY ws.years_experience DESC;

-- Q2: jobs requiring a particular skill
SELECT j.job_id, j.title, j.location, j.pay_amount, j.pay_type, j.status, js.min_years_required
FROM job j
JOIN job_skill js ON js.job_id = j.job_id
JOIN skill s ON s.skill_id = js.skill_id
WHERE s.skill_name = 'Welding'
ORDER BY j.job_id;

-- Q3: applications per job
SELECT j.job_id, j.title, j.status, COUNT(a.application_id) AS total_applications
FROM job j
LEFT JOIN application a ON a.job_id = j.job_id
GROUP BY j.job_id, j.title, j.status
ORDER BY total_applications DESC, j.job_id;

-- Q4: contractors with the most jobs
SELECT c.contractor_id, c.company_name, COUNT(j.job_id) AS jobs_posted
FROM contractor c
JOIN job j ON j.contractor_id = c.contractor_id
GROUP BY c.contractor_id, c.company_name
ORDER BY jobs_posted DESC, c.company_name
LIMIT 3;

-- Q5: workers who applied to more than 2 jobs
SELECT w.worker_id, w.full_name, COUNT(*) AS jobs_applied_to
FROM worker w
JOIN application a ON a.worker_id = w.worker_id
GROUP BY w.worker_id, w.full_name
HAVING COUNT(*) > 2
ORDER BY jobs_applied_to DESC;

-- Q6: average pay by job category
SELECT jc.category_name, j.pay_type, COUNT(*) AS jobs, ROUND(AVG(j.pay_amount), 2) AS avg_pay
FROM job j
JOIN job_category jc ON jc.category_id = j.category_id
GROUP BY jc.category_name, j.pay_type
ORDER BY jc.category_name, j.pay_type;

-- Q7: workers having all skills required by job 1
SELECT w.worker_id, w.full_name, w.city
FROM worker w
JOIN worker_skill ws ON ws.worker_id = w.worker_id
WHERE ws.skill_id IN (SELECT skill_id FROM job_skill WHERE job_id = 1)
GROUP BY w.worker_id, w.full_name, w.city
HAVING COUNT(DISTINCT ws.skill_id) = (SELECT COUNT(*) FROM job_skill WHERE job_id = 1)
ORDER BY w.worker_id;

-- Q8: jobs with no applications
SELECT j.job_id, j.title, j.status
FROM job j
LEFT JOIN application a ON a.job_id = j.job_id
WHERE a.application_id IS NULL
ORDER BY j.job_id;

-- Q9: workers earning above the average expected wage
SELECT worker_id, full_name, city, expected_daily_wage
FROM worker
WHERE expected_daily_wage > (SELECT AVG(expected_daily_wage) FROM worker)
ORDER BY expected_daily_wage DESC;

-- Q10: most requested skills
SELECT s.skill_id, s.skill_name, COUNT(js.job_id) AS jobs_requiring
FROM skill s
LEFT JOIN job_skill js ON js.skill_id = s.skill_id
GROUP BY s.skill_id, s.skill_name
ORDER BY jobs_requiring DESC, s.skill_name;

-- Q11: application and completion history of worker 1
SELECT w.full_name, j.title, c.company_name, jc.category_name,
       a.applied_at::date AS applied_on, a.status AS application_status,
       r.score AS rating_score,
       ROUND(COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'paid'), 0), 2) AS amount_paid
FROM application a
JOIN worker w ON w.worker_id = a.worker_id
JOIN job j ON j.job_id = a.job_id
JOIN contractor c ON c.contractor_id = j.contractor_id
JOIN job_category jc ON jc.category_id = j.category_id
LEFT JOIN rating r ON r.application_id = a.application_id
LEFT JOIN payment p ON p.application_id = a.application_id
WHERE w.worker_id = 1
GROUP BY w.full_name, j.title, c.company_name, jc.category_name, a.applied_at, a.status, r.score
ORDER BY a.applied_at;

-- Q12: worker rating summary
SELECT w.worker_id, w.full_name,
       COUNT(r.rating_id) AS total_ratings,
       ROUND(AVG(r.score), 2) AS avg_score,
       MIN(r.score) AS min_score,
       MAX(r.score) AS max_score
FROM worker w
JOIN application a ON a.worker_id = w.worker_id
JOIN rating r ON r.application_id = a.application_id
GROUP BY w.worker_id, w.full_name
ORDER BY avg_score DESC, total_ratings DESC;

-- Q13: highest and lowest paying open jobs
SELECT pay_type, MIN(pay_amount) AS lowest_pay, MAX(pay_amount) AS highest_pay, COUNT(*) AS open_jobs
FROM job
WHERE status = 'open'
GROUP BY pay_type
ORDER BY pay_type;

-- Q14a: total payments per contractor (paid only)
SELECT c.contractor_id, c.company_name, ROUND(COALESCE(SUM(p.amount), 0), 2) AS total_paid
FROM contractor c
LEFT JOIN job j ON j.contractor_id = c.contractor_id
LEFT JOIN application a ON a.job_id = j.job_id
LEFT JOIN payment p ON p.application_id = a.application_id AND p.status = 'paid'
GROUP BY c.contractor_id, c.company_name
ORDER BY total_paid DESC, c.company_name;

-- Q14b: total payments per contractor (all payments)
SELECT c.contractor_id, c.company_name,
       ROUND(COALESCE(SUM(p.amount), 0), 2) AS total_all_payments,
       ROUND(COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'paid'), 0), 2) AS paid,
       ROUND(COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'pending'), 0), 2) AS pending
FROM contractor c
LEFT JOIN job j ON j.contractor_id = c.contractor_id
LEFT JOIN application a ON a.job_id = j.job_id
LEFT JOIN payment p ON p.application_id = a.application_id
GROUP BY c.contractor_id, c.company_name
ORDER BY total_all_payments DESC, c.company_name;
