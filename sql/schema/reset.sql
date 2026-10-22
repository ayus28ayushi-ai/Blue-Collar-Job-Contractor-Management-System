-- running this will delete all the tables and data

DROP VIEW IF EXISTS
v_open_jobs, v_worker_rating_summary, v_contractor_activity;
DROP TABLE IF EXISTS
payment, rating, application, job_skill, job, worker_skill, worker, contractor, job_category, skill CASCADE;